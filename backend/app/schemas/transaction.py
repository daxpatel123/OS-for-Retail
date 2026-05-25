from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ShiftResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    register_id: Optional[UUID] = None
    employee_id: Optional[UUID] = None
    shift_number: str
    opened_at: datetime
    closed_at: Optional[datetime] = None
    opening_cash: Decimal
    closing_cash: Optional[Decimal] = None
    expected_cash: Optional[Decimal] = None
    cash_over_short: Optional[Decimal] = None
    total_sales: Decimal
    total_transactions: int
    status: str


class TransactionLineItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    product_id: Optional[UUID] = None
    product_name: str
    upc: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    line_total: Decimal


class TransactionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    register_id: Optional[UUID] = None
    shift_id: Optional[UUID] = None
    transaction_number: str
    transaction_type: str
    occurred_at: datetime
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    tender_type: Optional[str] = None
    employee_id: Optional[UUID] = None


class TransactionDetailResponse(TransactionResponse):
    line_items: list[TransactionLineItemResponse] = []
