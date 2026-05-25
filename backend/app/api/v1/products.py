"""
Product and category management endpoints.
"""
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser, RequireManager
from app.models.product import Product, ProductCategory, Vendor
from app.schemas.product import (
    CategoryCreate,
    CategoryResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    VendorCreate,
    VendorResponse,
    VendorUpdate,
)

router = APIRouter(prefix="/products", tags=["products"])


# ---------- Vendors ----------

@router.get("/vendors", response_model=list[VendorResponse])
async def list_vendors(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    active_only: bool = True,
):
    """List vendors for the authenticated org."""
    stmt = select(Vendor).where(Vendor.org_id == current_user.org_id)
    if active_only:
        stmt = stmt.where(Vendor.is_active == True)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/vendors", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    payload: VendorCreate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new vendor."""
    vendor = Vendor(org_id=current_user.org_id, **payload.model_dump())
    db.add(vendor)
    await db.flush()
    return vendor


@router.patch("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: UUID,
    payload: VendorUpdate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a vendor."""
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.org_id == current_user.org_id)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    await db.flush()
    return vendor


# ---------- Categories ----------

@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all product categories for the org."""
    result = await db.execute(
        select(ProductCategory).where(ProductCategory.org_id == current_user.org_id)
        .order_by(ProductCategory.name)
    )
    return result.scalars().all()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a product category."""
    category = ProductCategory(org_id=current_user.org_id, **payload.model_dump())
    db.add(category)
    await db.flush()
    return category


# ---------- Products ----------

@router.get("/", response_model=list[ProductResponse])
async def list_products(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    category_id: Optional[UUID] = Query(None),
    vendor_id: Optional[UUID] = Query(None),
    active_only: bool = True,
    search: Optional[str] = Query(None, max_length=200),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
):
    """List products with optional filtering."""
    stmt = select(Product).where(Product.org_id == current_user.org_id)

    if active_only:
        stmt = stmt.where(Product.is_active == True)
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if vendor_id:
        stmt = stmt.where(Product.vendor_id == vendor_id)
    if search:
        stmt = stmt.where(
            Product.name.ilike(f"%{search}%")
            | Product.upc.ilike(f"%{search}%")
            | Product.plu.ilike(f"%{search}%")
        )

    stmt = stmt.order_by(Product.name).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new product in the catalog."""
    product = Product(org_id=current_user.org_id, **payload.model_dump())
    db.add(product)
    await db.flush()
    return product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single product by ID."""
    result = await db.execute(
        select(Product).where(
            Product.id == product_id, Product.org_id == current_user.org_id
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a product."""
    result = await db.execute(
        select(Product).where(
            Product.id == product_id, Product.org_id == current_user.org_id
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.flush()
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_product(
    product_id: UUID,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Deactivate (soft-delete) a product."""
    result = await db.execute(
        select(Product).where(
            Product.id == product_id, Product.org_id == current_user.org_id
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_active = False
    await db.flush()
