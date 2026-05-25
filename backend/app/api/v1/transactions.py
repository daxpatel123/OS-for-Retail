"""
Transaction and shift endpoints.
"""
from datetime import datetime
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser
from app.models.transaction import Shift, Transaction, TransactionType
from app.schemas.transaction import (
    ShiftResponse,
    TransactionDetailResponse,
    TransactionResponse,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    transaction_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
):
    """List transactions for a store with optional filters."""
    stmt = select(Transaction).where(Transaction.store_id == store_id)

    if date_from:
        stmt = stmt.where(Transaction.occurred_at >= date_from)
    if date_to:
        stmt = stmt.where(Transaction.occurred_at <= date_to)
    if transaction_type:
        try:
            txn_type_enum = TransactionType(transaction_type.upper())
            stmt = stmt.where(Transaction.transaction_type == txn_type_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid transaction_type: {transaction_type}",
            )

    stmt = stmt.order_by(Transaction.occurred_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{transaction_id}", response_model=TransactionDetailResponse)
async def get_transaction(
    transaction_id: UUID,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single transaction with its line items."""
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.line_items))
        .where(Transaction.id == transaction_id)
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return txn


@router.get("/shifts/", response_model=list[ShiftResponse])
async def list_shifts(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
):
    """List shifts for a store."""
    stmt = select(Shift).where(Shift.store_id == store_id)
    if status_filter:
        stmt = stmt.where(Shift.status == status_filter.upper())
    stmt = stmt.order_by(Shift.opened_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/shifts/{shift_id}", response_model=ShiftResponse)
async def get_shift(
    shift_id: UUID,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single shift by ID."""
    result = await db.execute(select(Shift).where(Shift.id == shift_id))
    shift = result.scalar_one_or_none()
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    return shift
