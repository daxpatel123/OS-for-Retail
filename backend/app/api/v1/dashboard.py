"""
Dashboard and analytics endpoints.
"""
from datetime import date
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser
from app.models.alert import Alert, AlertStatus
from app.schemas.dashboard import (
    AlertSummary,
    CategoryBreakdown,
    DailySummary,
    MarginAnalysis,
    SalesTrendPoint,
    TopProduct,
)
from app.services.analytics_service import (
    get_category_breakdown,
    get_daily_summary,
    get_margin_analysis,
    get_sales_trend,
    get_top_products,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DailySummary)
async def daily_summary(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    report_date: date = Query(default_factory=date.today),
):
    """Get daily summary for a store. Defaults to today."""
    return await get_daily_summary(store_id, report_date, db)


@router.get("/sales-trend", response_model=list[SalesTrendPoint])
async def sales_trend(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    days: int = Query(30, ge=7, le=365),
):
    """Get daily sales trend for the past N days."""
    return await get_sales_trend(store_id, days, db)


@router.get("/top-products", response_model=list[TopProduct])
async def top_products(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(10, ge=1, le=50),
):
    """Get top-selling products by revenue."""
    return await get_top_products(store_id, days, limit, db)


@router.get("/category-breakdown", response_model=list[CategoryBreakdown])
async def category_breakdown(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    date_from: date = Query(...),
    date_to: date = Query(...),
):
    """Get sales breakdown by category for a date range."""
    return await get_category_breakdown(store_id, date_from, date_to, db)


@router.get("/margin-analysis", response_model=list[MarginAnalysis])
async def margin_analysis(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    date_from: date = Query(...),
    date_to: date = Query(...),
):
    """Get gross margin analysis by category."""
    return await get_margin_analysis(store_id, date_from, date_to, db)


@router.get("/alerts", response_model=list[AlertSummary])
async def get_alerts(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    alert_status: Optional[str] = Query("open", alias="status"),
    limit: int = Query(50, le=200),
):
    """List alerts for a store. Default: open alerts only."""
    stmt = select(Alert).where(Alert.store_id == store_id)

    if alert_status and alert_status.lower() != "all":
        try:
            stmt = stmt.where(Alert.status == AlertStatus(alert_status.upper()))
        except ValueError:
            pass  # invalid status filter, ignore

    stmt = stmt.order_by(Alert.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
