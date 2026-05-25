from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class FlashReportCategoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    category_name: str
    sales_amount: Optional[Decimal] = None
    transaction_count: Optional[int] = None
    cost_amount: Optional[Decimal] = None
    margin_amount: Optional[Decimal] = None


class FlashReportResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    report_date: date
    raw_file_url: Optional[str] = None
    parse_status: str
    parse_confidence: Optional[Decimal] = None
    total_sales: Optional[Decimal] = None
    fuel_sales_amount: Optional[Decimal] = None
    fuel_gallons: Optional[Decimal] = None
    inside_sales: Optional[Decimal] = None
    lottery_sales: Optional[Decimal] = None
    tobacco_sales: Optional[Decimal] = None
    tax_collected: Optional[Decimal] = None
    cash_sales: Optional[Decimal] = None
    card_sales: Optional[Decimal] = None
    refunds: Optional[Decimal] = None
    voids: Optional[Decimal] = None
    transaction_count: Optional[int] = None
    notes: Optional[str] = None


class FlashReportDetailResponse(FlashReportResponse):
    categories: list[FlashReportCategoryResponse] = []
