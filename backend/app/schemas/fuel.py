from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class FuelGradeCreate(BaseModel):
    store_id: UUID
    name: str
    tank_capacity_gallons: Optional[Decimal] = None
    low_level_threshold_gallons: Optional[Decimal] = None


class FuelGradeResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    name: str
    tank_capacity_gallons: Optional[Decimal] = None
    low_level_threshold_gallons: Optional[Decimal] = None


class FuelSaleResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    fuel_grade_id: UUID
    pump_number: int
    transaction_id: Optional[UUID] = None
    gallons: Decimal
    price_per_gallon: Decimal
    total_amount: Decimal
    occurred_at: datetime


class FuelDeliveryCreate(BaseModel):
    store_id: UUID
    fuel_grade_id: UUID
    vendor_id: Optional[UUID] = None
    delivery_date: date
    gallons_delivered: Decimal
    cost_per_gallon: Decimal
    total_cost: Decimal


class FuelDeliveryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    fuel_grade_id: UUID
    vendor_id: Optional[UUID] = None
    delivery_date: date
    gallons_delivered: Decimal
    cost_per_gallon: Decimal
    total_cost: Decimal


class FuelPriceCreate(BaseModel):
    store_id: UUID
    fuel_grade_id: UUID
    retail_price: Decimal
    cost_price: Optional[Decimal] = None
    effective_date: datetime


class FuelPriceResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    fuel_grade_id: UUID
    retail_price: Decimal
    cost_price: Optional[Decimal] = None
    effective_date: datetime
