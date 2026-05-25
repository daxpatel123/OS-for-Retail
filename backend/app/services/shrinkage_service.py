"""
Shrinkage / anomaly detection service.

Identifies potential theft, waste, or data entry errors by comparing
theoretical inventory (opening + receipts - sales) to actual on-hand.
Also flags unusual refund patterns and cash-over/short anomalies.
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import Inventory, InventoryMovement, MovementType
from app.models.transaction import Shift, Transaction, TransactionType
from app.models.product import Product
from app.models.alert import Alert, AlertType, AlertSeverity, AlertStatus


async def calculate_shrinkage(
    store_id: UUID, product_id: UUID, days: int, db: AsyncSession
) -> dict:
    """
    Calculate shrinkage for a product at a store over the past `days` days.

    Compares theoretical inventory movement to the actual on-hand change.
    Returns a dict with theoretical_change, actual_change, shrinkage, and pct.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Sum movements by type
    stmt = select(
        InventoryMovement.movement_type,
        func.sum(InventoryMovement.quantity).label("total_qty"),
    ).where(
        InventoryMovement.store_id == store_id,
        InventoryMovement.product_id == product_id,
        InventoryMovement.created_at >= cutoff,
    ).group_by(InventoryMovement.movement_type)

    result = await db.execute(stmt)
    movements_by_type = {row.movement_type: row.total_qty or Decimal("0") for row in result.all()}

    sales = abs(movements_by_type.get(MovementType.SALE, Decimal("0")))
    receipts = movements_by_type.get(MovementType.RECEIPT, Decimal("0"))
    adjustments = movements_by_type.get(MovementType.ADJUSTMENT, Decimal("0"))
    waste = abs(movements_by_type.get(MovementType.WASTE, Decimal("0")))

    theoretical_change = receipts - sales - waste + adjustments

    # Get current on-hand
    inv_stmt = select(Inventory.quantity_on_hand).where(
        Inventory.store_id == store_id,
        Inventory.product_id == product_id,
    )
    inv_result = await db.execute(inv_stmt)
    on_hand = inv_result.scalar_one_or_none() or Decimal("0")

    # Actual change = current on_hand (we don't have beginning snapshot here,
    # so shrinkage = difference between expected movements and current state)
    shrinkage = receipts - sales - waste - on_hand
    if shrinkage < Decimal("0"):
        shrinkage = Decimal("0")

    pct = (shrinkage / receipts * 100) if receipts > 0 else Decimal("0")

    return {
        "product_id": product_id,
        "store_id": store_id,
        "period_days": days,
        "sales_qty": sales,
        "receipts_qty": receipts,
        "waste_qty": waste,
        "theoretical_change": theoretical_change,
        "quantity_on_hand": on_hand,
        "shrinkage_qty": shrinkage,
        "shrinkage_pct": pct,
    }


async def detect_unusual_refunds(
    store_id: UUID, days: int, db: AsyncSession
) -> list[dict]:
    """
    Identify employees with unusually high refund rates or large refund
    amounts in the given period.

    Returns a list of anomaly dicts with employee_id and metrics.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Total sales per employee
    sales_stmt = select(
        Transaction.employee_id,
        func.count(Transaction.id).label("sale_count"),
        func.sum(Transaction.total_amount).label("total_sales"),
    ).where(
        Transaction.store_id == store_id,
        Transaction.transaction_type == TransactionType.SALE,
        Transaction.occurred_at >= cutoff,
        Transaction.employee_id.is_not(None),
    ).group_by(Transaction.employee_id)

    sales_result = await db.execute(sales_stmt)
    sales_by_emp = {row.employee_id: row for row in sales_result.all()}

    # Refunds per employee
    refund_stmt = select(
        Transaction.employee_id,
        func.count(Transaction.id).label("refund_count"),
        func.sum(Transaction.total_amount).label("total_refunds"),
    ).where(
        Transaction.store_id == store_id,
        Transaction.transaction_type == TransactionType.REFUND,
        Transaction.occurred_at >= cutoff,
        Transaction.employee_id.is_not(None),
    ).group_by(Transaction.employee_id)

    refund_result = await db.execute(refund_stmt)

    anomalies = []
    for row in refund_result.all():
        emp_id = row.employee_id
        refund_count = row.refund_count or 0
        total_refunds = abs(row.total_refunds or Decimal("0"))

        sales_row = sales_by_emp.get(emp_id)
        if sales_row:
            sale_count = sales_row.sale_count or 1
            total_sales = sales_row.total_sales or Decimal("1")
            refund_rate = refund_count / sale_count
            refund_amt_rate = total_refunds / total_sales if total_sales > 0 else Decimal("0")
        else:
            refund_rate = 1.0
            refund_amt_rate = Decimal("1")

        # Flag if refund rate > 10% or refund amount > 5% of sales
        if refund_rate > 0.10 or refund_amt_rate > Decimal("0.05"):
            anomalies.append(
                {
                    "employee_id": emp_id,
                    "refund_count": refund_count,
                    "total_refunds": total_refunds,
                    "sale_count": sales_row.sale_count if sales_row else 0,
                    "total_sales": sales_row.total_sales if sales_row else Decimal("0"),
                    "refund_rate": round(refund_rate, 4),
                    "refund_amount_rate": round(float(refund_amt_rate), 4),
                    "anomaly_type": "UNUSUAL_REFUND",
                }
            )

    return anomalies


async def detect_cash_over_short_anomalies(
    store_id: UUID, days: int, db: AsyncSession
) -> list[dict]:
    """
    Detect shifts with cash-over/short amounts beyond normal thresholds.
    Returns list of anomaly dicts with shift info.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    stmt = select(Shift).where(
        Shift.store_id == store_id,
        Shift.closed_at >= cutoff,
        Shift.cash_over_short.is_not(None),
    )
    result = await db.execute(stmt)
    shifts = result.scalars().all()

    if not shifts:
        return []

    amounts = [float(abs(s.cash_over_short)) for s in shifts if s.cash_over_short is not None]
    if not amounts:
        return []

    mean = sum(amounts) / len(amounts)
    variance = sum((x - mean) ** 2 for x in amounts) / len(amounts)
    std_dev = variance ** 0.5

    threshold = mean + 2 * std_dev  # Flag outliers > 2 standard deviations

    anomalies = []
    for shift in shifts:
        if shift.cash_over_short is None:
            continue
        amount = abs(float(shift.cash_over_short))
        if amount > threshold or amount > 50.0:  # Also flag absolute threshold of $50
            anomalies.append(
                {
                    "shift_id": shift.id,
                    "employee_id": shift.employee_id,
                    "shift_number": shift.shift_number,
                    "opened_at": shift.opened_at,
                    "closed_at": shift.closed_at,
                    "cash_over_short": float(shift.cash_over_short),
                    "anomaly_type": "CASH_SHORT",
                    "severity": "HIGH" if amount > 100 else "MEDIUM",
                }
            )

    return anomalies


async def run_shrinkage_scan_and_alert(
    store_id: UUID,
    org_id: UUID,
    days: int,
    db: AsyncSession,
) -> list[Alert]:
    """
    Run the full shrinkage scan across all products and create Alert records
    for significant shrinkage detected. Returns newly created alerts.
    """
    # Get all products with inventory at this store
    inv_stmt = select(Inventory).where(Inventory.store_id == store_id)
    inv_result = await db.execute(inv_stmt)
    inventories = inv_result.scalars().all()

    created_alerts: list[Alert] = []

    for inv in inventories:
        data = await calculate_shrinkage(store_id, inv.product_id, days, db)
        shrinkage_pct = data["shrinkage_pct"]

        if shrinkage_pct < Decimal("5"):
            continue  # Less than 5% is within normal variance

        # Determine severity
        if shrinkage_pct >= Decimal("20"):
            severity = AlertSeverity.CRITICAL
        elif shrinkage_pct >= Decimal("10"):
            severity = AlertSeverity.HIGH
        else:
            severity = AlertSeverity.MEDIUM

        # Check no existing open alert
        existing = await db.execute(
            select(Alert).where(
                Alert.store_id == store_id,
                Alert.alert_type == AlertType.SHRINKAGE,
                Alert.status == AlertStatus.OPEN,
                Alert.alert_metadata["product_id"].astext == str(inv.product_id),
            )
        )
        if existing.scalar_one_or_none():
            continue

        product_result = await db.execute(
            select(Product.name).where(Product.id == inv.product_id)
        )
        product_name = product_result.scalar_one_or_none() or "Unknown Product"

        alert = Alert(
            org_id=org_id,
            store_id=store_id,
            alert_type=AlertType.SHRINKAGE,
            severity=severity,
            title=f"Shrinkage Detected: {product_name}",
            message=(
                f"Product '{product_name}' shows {float(shrinkage_pct):.1f}% shrinkage "
                f"over the past {days} days. "
                f"Shrinkage qty: {data['shrinkage_qty']}."
            ),
            alert_metadata={
                "product_id": str(inv.product_id),
                "shrinkage_qty": str(data["shrinkage_qty"]),
                "shrinkage_pct": str(shrinkage_pct),
                "period_days": days,
            },
            status=AlertStatus.OPEN,
        )
        db.add(alert)
        created_alerts.append(alert)

    if created_alerts:
        await db.flush()

    return created_alerts
