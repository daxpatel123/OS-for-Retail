from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DailySummary(BaseModel):
    store_id: UUID
    report_date: date
    total_sales: Decimal
    fuel_sales_amount: Decimal
    fuel_gallons: Decimal
    inside_sales: Decimal
    transaction_count: int
    cash_sales: Decimal
    card_sales: Decimal
    refunds: Decimal
    tax_collected: Decimal
    lottery_sales: Decimal
    tobacco_sales: Decimal
    gross_margin: Optional[Decimal] = None
    margin_pct: Optional[Decimal] = None


class SalesTrendPoint(BaseModel):
    report_date: date
    total_sales: Decimal
    transaction_count: int
    fuel_sales_amount: Optional[Decimal] = None
    inside_sales: Optional[Decimal] = None


class TopProduct(BaseModel):
    product_id: UUID
    product_name: str
    upc: Optional[str] = None
    total_revenue: Decimal
    total_quantity: Decimal
    transaction_count: int


class CategoryBreakdown(BaseModel):
    category_name: str
    sales_amount: Decimal
    transaction_count: int
    cost_amount: Optional[Decimal] = None
    margin_amount: Optional[Decimal] = None
    margin_pct: Optional[Decimal] = None


class MarginAnalysis(BaseModel):
    category_name: str
    revenue: Decimal
    cost: Decimal
    gross_margin: Decimal
    margin_pct: Decimal


class AlertSummary(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    alert_type: str
    severity: str
    title: str
    message: str
    status: str
    store_id: Optional[UUID] = None
