"""
Alert management endpoints.
"""
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser
from app.models.alert import Alert, AlertStatus
from app.schemas.dashboard import AlertSummary

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertSummary])
async def list_alerts(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: Optional[UUID] = Query(None),
    alert_status: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
):
    """List all alerts for the org, optionally filtered by store, status, severity."""
    stmt = select(Alert).where(Alert.org_id == current_user.org_id)

    if store_id:
        stmt = stmt.where(Alert.store_id == store_id)
    if alert_status:
        try:
            stmt = stmt.where(Alert.status == AlertStatus(alert_status.upper()))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status: {alert_status}",
            )
    if severity:
        stmt = stmt.where(Alert.severity == severity.upper())

    stmt = stmt.order_by(Alert.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{alert_id}/acknowledge", response_model=AlertSummary)
async def acknowledge_alert(
    alert_id: UUID,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Acknowledge an open alert."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.org_id == current_user.org_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    if alert.status != AlertStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Alert is already {alert.status.value}",
        )

    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_by = current_user.user_id
    await db.flush()
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertSummary)
async def resolve_alert(
    alert_id: UUID,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Resolve an alert."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.org_id == current_user.org_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    if alert.status == AlertStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Alert is already resolved",
        )

    alert.status = AlertStatus.RESOLVED
    alert.resolved_by = current_user.user_id
    await db.flush()
    return alert
