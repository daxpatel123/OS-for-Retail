from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class InvoiceLineItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    product_name_raw: Optional[str] = None
    upc_raw: Optional[str] = None
    quantity_ordered: Optional[Decimal] = None
    quantity_delivered: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    line_total: Optional[Decimal] = None
    matched_product_id: Optional[UUID] = None
    match_confidence: Optional[Decimal] = None
    has_discrepancy: bool
    discrepancy_notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    vendor_id: Optional[UUID] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    raw_file_url: Optional[str] = None
    ocr_status: str
    ocr_confidence_score: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    status: str
    notes: Optional[str] = None


class InvoiceDetailResponse(InvoiceResponse):
    line_items: list[InvoiceLineItemResponse] = []


class InvoiceDisputeRequest(BaseModel):
    notes: str


class InvoiceApproveRequest(BaseModel):
    notes: Optional[str] = None
