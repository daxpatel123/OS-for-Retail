"""
Inventory management endpoints.
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser, RequireEmployee, RequireManager
from app.models.inventory import Inventory, InventoryMovement, MovementType
from app.models.product import Product
from app.schemas.inventory import (
    DeadStockItem,
    InventoryAdjustmentRequest,
    InventoryMovementResponse,
    InventoryResponse,
    ReorderRecommendation,
    StockAlertResponse,
    StockoutRiskItem,
)
from app.services.inventory_service import (
    calculate_stockout_risk,
    check_and_create_stock_alerts,
    detect_dead_stock,
    get_reorder_recommendations,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/", response_model=list[InventoryResponse])
async def get_inventory(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(..., description="Store ID to query inventory for"),
):
    """List current inventory levels for a store."""
    result = await db.execute(
        select(Inventory).where(Inventory.store_id == store_id)
        .order_by(Inventory.product_id)
    )
    return result.scalars().all()


@router.get("/reorder-recommendations", response_model=list[ReorderRecommendation])
async def reorder_recommendations(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
):
    """Get products that need to be reordered based on current levels."""
    return await get_reorder_recommendations(store_id, db)


@router.get("/dead-stock", response_model=list[DeadStockItem])
async def dead_stock(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    days: int = Query(30, ge=7, le=365),
):
    """Identify products with no sales movement in the past N days."""
    return await detect_dead_stock(store_id, days, db)


@router.get("/stockout-risk", response_model=list[StockoutRiskItem])
async def stockout_risk(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
):
    """Calculate days-of-supply and stockout risk per product."""
    return await calculate_stockout_risk(store_id, db)


@router.post("/adjustment", status_code=status.HTTP_201_CREATED)
async def create_adjustment(
    payload: InventoryAdjustmentRequest,
    current_user: Annotated[CurrentUser, RequireEmployee],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Record a manual inventory adjustment.
    Positive quantity = adding stock; negative = removing.
    """
    # Verify product exists
    prod_result = await db.execute(
        select(Product).where(
            Product.id == payload.product_id,
            Product.org_id == current_user.org_id,
        )
    )
    if not prod_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Upsert inventory record
    inv_result = await db.execute(
        select(Inventory).where(
            Inventory.store_id == payload.store_id,
            Inventory.product_id == payload.product_id,
        )
    )
    inv = inv_result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if inv:
        inv.quantity_on_hand = inv.quantity_on_hand + payload.quantity
        inv.last_updated_at = now
    else:
        inv = Inventory(
            store_id=payload.store_id,
            product_id=payload.product_id,
            quantity_on_hand=payload.quantity,
            last_updated_at=now,
        )
        db.add(inv)

    # Record movement
    movement = InventoryMovement(
        store_id=payload.store_id,
        product_id=payload.product_id,
        movement_type=MovementType.ADJUSTMENT,
        quantity=payload.quantity,
        notes=payload.notes,
        created_by=current_user.user_id,
    )
    db.add(movement)
    await db.flush()

    return {"message": "Adjustment recorded", "new_quantity": str(inv.quantity_on_hand)}


@router.get("/movements", response_model=list[InventoryMovementResponse])
async def get_movements(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    product_id: Optional[UUID] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
):
    """List inventory movements with optional product filter."""
    stmt = select(InventoryMovement).where(InventoryMovement.store_id == store_id)
    if product_id:
        stmt = stmt.where(InventoryMovement.product_id == product_id)
    stmt = stmt.order_by(InventoryMovement.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/scan-alerts", status_code=status.HTTP_200_OK)
async def trigger_alert_scan(
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
):
    """Manually trigger an inventory alert scan for a store."""
    created = await check_and_create_stock_alerts(store_id, db)
    return {"alerts_created": len(created)}
