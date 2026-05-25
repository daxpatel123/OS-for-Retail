from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class InventoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    product_id: UUID
    quantity_on_hand: Decimal
    last_counted_at: Optional[datetime] = None
    last_updated_at: Optional[datetime] = None


class InventoryAdjustmentRequest(BaseModel):
    store_id: UUID
    product_id: UUID
    quantity: Decimal
    notes: Optional[str] = None


class InventoryMovementResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    product_id: UUID
    movement_type: str
    quantity: Decimal
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class ReorderRecommendation(BaseModel):
    product_id: UUID
    product_name: str
    upc: Optional[str] = None
    current_quantity: Decimal
    reorder_point: Decimal
    reorder_quantity: Decimal
    vendor_id: Optional[UUID] = None
    vendor_name: Optional[str] = None


class DeadStockItem(BaseModel):
    product_id: UUID
    product_name: str
    upc: Optional[str] = None
    quantity_on_hand: Decimal
    last_sale_date: Optional[datetime] = None
    days_since_last_sale: int


class StockoutRiskItem(BaseModel):
    product_id: UUID
    product_name: str
    upc: Optional[str] = None
    quantity_on_hand: Decimal
    avg_daily_sales: Decimal
    days_of_supply: Optional[Decimal] = None
    risk_level: str


class StockAlertResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    product_id: UUID
    alert_type: str
    status: str
    triggered_at: datetime
