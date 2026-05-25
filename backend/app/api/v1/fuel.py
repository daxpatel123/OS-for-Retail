"""
Fuel grade, sales, delivery, and pricing endpoints.
"""
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser, RequireManager
from app.models.fuel import FuelDelivery, FuelGrade, FuelPrice, FuelSale
from app.schemas.fuel import (
    FuelDeliveryCreate,
    FuelDeliveryResponse,
    FuelGradeCreate,
    FuelGradeResponse,
    FuelPriceCreate,
    FuelPriceResponse,
    FuelSaleResponse,
)

router = APIRouter(prefix="/fuel", tags=["fuel"])


@router.get("/grades", response_model=list[FuelGradeResponse])
async def list_fuel_grades(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
):
    """List all fuel grades for a store."""
    result = await db.execute(
        select(FuelGrade).where(FuelGrade.store_id == store_id)
    )
    return result.scalars().all()


@router.post("/grades", response_model=FuelGradeResponse, status_code=status.HTTP_201_CREATED)
async def create_fuel_grade(
    payload: FuelGradeCreate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Add a fuel grade to a store."""
    grade = FuelGrade(**payload.model_dump())
    db.add(grade)
    await db.flush()
    return grade


@router.get("/sales", response_model=list[FuelSaleResponse])
async def list_fuel_sales(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    fuel_grade_id: Optional[UUID] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
):
    """List fuel sales for a store."""
    stmt = select(FuelSale).where(FuelSale.store_id == store_id)
    if fuel_grade_id:
        stmt = stmt.where(FuelSale.fuel_grade_id == fuel_grade_id)
    stmt = stmt.order_by(FuelSale.occurred_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/deliveries", response_model=list[FuelDeliveryResponse])
async def list_fuel_deliveries(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
):
    """List fuel deliveries for a store."""
    result = await db.execute(
        select(FuelDelivery)
        .where(FuelDelivery.store_id == store_id)
        .order_by(FuelDelivery.delivery_date.desc())
    )
    return result.scalars().all()


@router.post("/deliveries", response_model=FuelDeliveryResponse, status_code=status.HTTP_201_CREATED)
async def record_fuel_delivery(
    payload: FuelDeliveryCreate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Record a fuel delivery."""
    delivery = FuelDelivery(**payload.model_dump())
    db.add(delivery)
    await db.flush()
    return delivery


@router.get("/prices", response_model=list[FuelPriceResponse])
async def list_fuel_prices(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    fuel_grade_id: Optional[UUID] = Query(None),
):
    """List fuel prices for a store."""
    stmt = select(FuelPrice).where(FuelPrice.store_id == store_id)
    if fuel_grade_id:
        stmt = stmt.where(FuelPrice.fuel_grade_id == fuel_grade_id)
    stmt = stmt.order_by(FuelPrice.effective_date.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/prices", response_model=FuelPriceResponse, status_code=status.HTTP_201_CREATED)
async def set_fuel_price(
    payload: FuelPriceCreate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Set a fuel price (creates new price record; effective from the given date)."""
    price = FuelPrice(
        store_id=payload.store_id,
        fuel_grade_id=payload.fuel_grade_id,
        retail_price=payload.retail_price,
        cost_price=payload.cost_price,
        effective_date=payload.effective_date,
        set_by=current_user.user_id,
    )
    db.add(price)
    await db.flush()
    return price
