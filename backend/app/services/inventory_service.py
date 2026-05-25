"""
Inventory service: reorder logic, dead stock detection, stockout risk,
and automated alert creation.
"""
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import (
    Inventory,
    InventoryMovement,
    MovementType,
    StockAlert,
    StockAlertType,
    AlertStatus,
)
from app.models.product import Product, Vendor
from app.schemas.inventory import (
    ReorderRecommendation,
    DeadStockItem,
    StockoutRiskItem,
)


async def get_reorder_recommendations(
    store_id: UUID, db: AsyncSession
) -> list[ReorderRecommendation]:
    """
    Return products whose current on-hand quantity is at or below the
    configured reorder_point.
    """
    stmt = (
        select(Inventory, Product, Vendor)
        .join(Product, Inventory.product_id == Product.id)
        .outerjoin(Vendor, Product.vendor_id == Vendor.id)
        .where(
            Inventory.store_id == store_id,
            Product.is_active == True,
            Product.reorder_point.is_not(None),
            Inventory.quantity_on_hand <= Product.reorder_point,
        )
        .order_by(Inventory.quantity_on_hand.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    recommendations = []
    for inv, product, vendor in rows:
        recommendations.append(
            ReorderRecommendation(
                product_id=product.id,
                product_name=product.name,
                upc=product.upc,
                current_quantity=inv.quantity_on_hand,
                reorder_point=product.reorder_point,
                reorder_quantity=product.reorder_quantity or Decimal("1"),
                vendor_id=vendor.id if vendor else None,
                vendor_name=vendor.name if vendor else None,
            )
        )
    return recommendations


async def detect_dead_stock(
    store_id: UUID, days: int = 30, db: AsyncSession = None
) -> list[DeadStockItem]:
    """
    Detect products with inventory on hand but no sales movement in the
    past `days` days.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Subquery: latest sale movement date per product at this store
    last_sale_subq = (
        select(
            InventoryMovement.product_id,
            func.max(InventoryMovement.created_at).label("last_sale_date"),
        )
        .where(
            InventoryMovement.store_id == store_id,
            InventoryMovement.movement_type == MovementType.SALE,
        )
        .group_by(InventoryMovement.product_id)
        .subquery()
    )

    stmt = (
        select(Inventory, Product, last_sale_subq.c.last_sale_date)
        .join(Product, Inventory.product_id == Product.id)
        .outerjoin(last_sale_subq, Inventory.product_id == last_sale_subq.c.product_id)
        .where(
            Inventory.store_id == store_id,
            Product.is_active == True,
            Inventory.quantity_on_hand > Decimal("0"),
            # No sales at all, or last sale was before cutoff
            (
                (last_sale_subq.c.last_sale_date == None)
                | (last_sale_subq.c.last_sale_date < cutoff)
            ),
        )
        .order_by(last_sale_subq.c.last_sale_date.asc().nullsfirst())
    )

    result = await db.execute(stmt)
    rows = result.all()

    dead_items = []
    now = datetime.now(timezone.utc)
    for inv, product, last_sale_date in rows:
        if last_sale_date is not None:
            if last_sale_date.tzinfo is None:
                last_sale_date = last_sale_date.replace(tzinfo=timezone.utc)
            days_since = (now - last_sale_date).days
        else:
            days_since = days + 1  # No recorded sale

        dead_items.append(
            DeadStockItem(
                product_id=product.id,
                product_name=product.name,
                upc=product.upc,
                quantity_on_hand=inv.quantity_on_hand,
                last_sale_date=last_sale_date,
                days_since_last_sale=days_since,
            )
        )
    return dead_items


async def calculate_stockout_risk(
    store_id: UUID, db: AsyncSession
) -> list[StockoutRiskItem]:
    """
    Calculate days-of-supply for each product based on average daily sales
    over the past 30 days.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    # Average daily sales per product
    avg_sales_subq = (
        select(
            InventoryMovement.product_id,
            (func.sum(func.abs(InventoryMovement.quantity)) / 30.0).label("avg_daily_sales"),
        )
        .where(
            InventoryMovement.store_id == store_id,
            InventoryMovement.movement_type == MovementType.SALE,
            InventoryMovement.created_at >= cutoff,
        )
        .group_by(InventoryMovement.product_id)
        .subquery()
    )

    stmt = (
        select(Inventory, Product, avg_sales_subq.c.avg_daily_sales)
        .join(Product, Inventory.product_id == Product.id)
        .outerjoin(avg_sales_subq, Inventory.product_id == avg_sales_subq.c.product_id)
        .where(
            Inventory.store_id == store_id,
            Product.is_active == True,
        )
        .order_by(avg_sales_subq.c.avg_daily_sales.desc().nullslast())
    )

    result = await db.execute(stmt)
    rows = result.all()

    risk_items = []
    for inv, product, avg_daily in rows:
        avg_daily_decimal = Decimal(str(avg_daily)) if avg_daily else Decimal("0")
        if avg_daily_decimal > Decimal("0"):
            days_of_supply = inv.quantity_on_hand / avg_daily_decimal
        else:
            days_of_supply = None

        if days_of_supply is None:
            risk_level = "UNKNOWN"
        elif days_of_supply <= Decimal("1"):
            risk_level = "CRITICAL"
        elif days_of_supply <= Decimal("3"):
            risk_level = "HIGH"
        elif days_of_supply <= Decimal("7"):
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        risk_items.append(
            StockoutRiskItem(
                product_id=product.id,
                product_name=product.name,
                upc=product.upc,
                quantity_on_hand=inv.quantity_on_hand,
                avg_daily_sales=avg_daily_decimal,
                days_of_supply=days_of_supply,
                risk_level=risk_level,
            )
        )
    return risk_items


async def check_and_create_stock_alerts(
    store_id: UUID, db: AsyncSession
) -> list[StockAlert]:
    """
    Scan inventory levels and create StockAlert records for any products
    that breach LOW_STOCK, OUT_OF_STOCK, or OVERSTOCK thresholds.
    Returns newly created alerts.
    """
    stmt = (
        select(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .where(
            Inventory.store_id == store_id,
            Product.is_active == True,
        )
    )
    result = await db.execute(stmt)
    rows = result.all()

    created_alerts: list[StockAlert] = []
    now = datetime.now(timezone.utc)

    for inv, product in rows:
        qty = inv.quantity_on_hand

        # Determine which alert type applies, if any
        alert_type: Optional[StockAlertType] = None
        if qty <= Decimal("0"):
            alert_type = StockAlertType.OUT_OF_STOCK
        elif product.min_stock and qty <= product.min_stock:
            alert_type = StockAlertType.LOW_STOCK
        elif product.reorder_point and qty <= product.reorder_point:
            alert_type = StockAlertType.LOW_STOCK
        elif product.max_stock and qty >= product.max_stock:
            alert_type = StockAlertType.OVERSTOCK

        if alert_type is None:
            continue

        # Check if an open alert already exists for this combination
        existing_stmt = select(StockAlert).where(
            StockAlert.store_id == store_id,
            StockAlert.product_id == product.id,
            StockAlert.alert_type == alert_type,
            StockAlert.status == AlertStatus.OPEN,
        )
        existing = await db.execute(existing_stmt)
        if existing.scalar_one_or_none() is not None:
            continue  # Don't duplicate open alerts

        alert = StockAlert(
            store_id=store_id,
            product_id=product.id,
            alert_type=alert_type,
            status=AlertStatus.OPEN,
            triggered_at=now,
        )
        db.add(alert)
        created_alerts.append(alert)

    if created_alerts:
        await db.flush()

    return created_alerts
