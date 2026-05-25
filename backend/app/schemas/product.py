from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class VendorCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    account_number: Optional[str] = None
    payment_terms: Optional[str] = None


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    account_number: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: Optional[bool] = None


class VendorResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    org_id: UUID
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    account_number: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: bool


class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[UUID] = None
    margin_target_pct: Optional[Decimal] = None


class CategoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    org_id: UUID
    name: str
    parent_id: Optional[UUID] = None
    margin_target_pct: Optional[Decimal] = None


class ProductCreate(BaseModel):
    upc: Optional[str] = None
    plu: Optional[str] = None
    name: str
    category_id: Optional[UUID] = None
    vendor_id: Optional[UUID] = None
    cost: Optional[Decimal] = None
    retail_price: Optional[Decimal] = None
    unit_of_measure: str = "EACH"
    is_taxable: bool = True
    is_age_restricted: bool = False
    reorder_point: Optional[Decimal] = None
    reorder_quantity: Optional[Decimal] = None
    min_stock: Optional[Decimal] = None
    max_stock: Optional[Decimal] = None


class ProductUpdate(BaseModel):
    upc: Optional[str] = None
    plu: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[UUID] = None
    vendor_id: Optional[UUID] = None
    cost: Optional[Decimal] = None
    retail_price: Optional[Decimal] = None
    unit_of_measure: Optional[str] = None
    is_taxable: Optional[bool] = None
    is_age_restricted: Optional[bool] = None
    is_active: Optional[bool] = None
    reorder_point: Optional[Decimal] = None
    reorder_quantity: Optional[Decimal] = None
    min_stock: Optional[Decimal] = None
    max_stock: Optional[Decimal] = None


class ProductResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    org_id: UUID
    upc: Optional[str] = None
    plu: Optional[str] = None
    name: str
    category_id: Optional[UUID] = None
    vendor_id: Optional[UUID] = None
    cost: Optional[Decimal] = None
    retail_price: Optional[Decimal] = None
    unit_of_measure: str
    is_taxable: bool
    is_age_restricted: bool
    is_active: bool
    reorder_point: Optional[Decimal] = None
    reorder_quantity: Optional[Decimal] = None
    min_stock: Optional[Decimal] = None
    max_stock: Optional[Decimal] = None
