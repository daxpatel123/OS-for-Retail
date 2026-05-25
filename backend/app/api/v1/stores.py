"""
Store management endpoints: CRUD for stores and registers.
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser, RequireManager, RequireOwner
from app.core.security import UserRole
from app.models.store import Store, Register
from app.schemas.store import (
    RegisterCreate,
    RegisterResponse,
    StoreCreate,
    StoreResponse,
    StoreUpdate,
)

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("/", response_model=list[StoreResponse])
async def list_stores(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all stores accessible to the authenticated user within their org."""
    if current_user.role == UserRole.OWNER:
        # Owners see all org stores
        result = await db.execute(
            select(Store).where(Store.org_id == current_user.org_id, Store.is_active == True)
        )
    else:
        # Others only see stores they have access to
        user_store_ids = [s.id for s in current_user.user.accessible_stores]
        result = await db.execute(
            select(Store).where(
                Store.id.in_(user_store_ids), Store.is_active == True
            )
        )
    return result.scalars().all()


@router.post("/", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    payload: StoreCreate,
    current_user: Annotated[CurrentUser, RequireOwner],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new store (owner only)."""
    store = Store(
        org_id=current_user.org_id,
        name=payload.name,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        zip=payload.zip,
        phone=payload.phone,
        timezone=payload.timezone,
        pos_type=payload.pos_type,
        is_active=True,
    )
    db.add(store)
    await db.flush()
    return store


@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(
    store_id: UUID,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single store by ID."""
    result = await db.execute(
        select(Store).where(Store.id == store_id, Store.org_id == current_user.org_id)
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    return store


@router.patch("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: UUID,
    payload: StoreUpdate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update store details (manager or higher)."""
    result = await db.execute(
        select(Store).where(Store.id == store_id, Store.org_id == current_user.org_id)
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(store, field, value)

    await db.flush()
    return store


@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_store(
    store_id: UUID,
    current_user: Annotated[CurrentUser, RequireOwner],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Deactivate a store (soft-delete, owner only)."""
    result = await db.execute(
        select(Store).where(Store.id == store_id, Store.org_id == current_user.org_id)
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    store.is_active = False
    await db.flush()


# ---------- Registers ----------

@router.get("/{store_id}/registers", response_model=list[RegisterResponse])
async def list_registers(
    store_id: UUID,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all registers in a store."""
    result = await db.execute(
        select(Register).where(Register.store_id == store_id, Register.is_active == True)
    )
    return result.scalars().all()


@router.post("/{store_id}/registers", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def create_register(
    store_id: UUID,
    payload: RegisterCreate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Add a register to a store."""
    # Verify store belongs to org
    store_result = await db.execute(
        select(Store).where(Store.id == store_id, Store.org_id == current_user.org_id)
    )
    if not store_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

    register = Register(
        store_id=store_id,
        name=payload.name,
        terminal_id=payload.terminal_id,
        is_active=True,
    )
    db.add(register)
    await db.flush()
    return register
