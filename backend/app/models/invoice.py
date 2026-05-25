import enum
from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class OCRStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class InvoiceStatus(str, enum.Enum):
    PENDING = "PENDING"
    MATCHED = "MATCHED"
    DISCREPANCY = "DISCREPANCY"
    APPROVED = "APPROVED"
    PAID = "PAID"


class Invoice(BaseModel):
    """A vendor invoice uploaded for processing and matching against received goods."""

    __tablename__ = "invoices"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vendor_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("vendors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    invoice_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    invoice_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    raw_file_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    ocr_status: Mapped[OCRStatus] = mapped_column(
        Enum(OCRStatus, name="ocr_status_enum"),
        nullable=False,
        default=OCRStatus.PENDING,
        index=True,
    )
    ocr_confidence_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4), nullable=True)
    subtotal: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    tax_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    total_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, name="invoice_status_enum"),
        nullable=False,
        default=InvoiceStatus.PENDING,
        index=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="invoices")  # noqa: F821
    vendor: Mapped[Optional["Vendor"]] = relationship("Vendor", back_populates="invoices")  # noqa: F821
    line_items: Mapped[list["InvoiceLineItem"]] = relationship(
        "InvoiceLineItem", back_populates="invoice", lazy="noload"
    )


class InvoiceLineItem(BaseModel):
    """A single product line from an invoice, with matching status."""

    __tablename__ = "invoice_line_items"

    invoice_id: Mapped[UUID] = mapped_column(
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_name_raw: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    upc_raw: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    quantity_ordered: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    quantity_delivered: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    unit_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    line_total: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    matched_product_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )
    match_confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4), nullable=True)
    has_discrepancy: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    discrepancy_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="line_items")
    product: Mapped[Optional["Product"]] = relationship(  # noqa: F821
        "Product", foreign_keys=[product_id]
    )
    matched_product: Mapped[Optional["Product"]] = relationship(  # noqa: F821
        "Product", foreign_keys=[matched_product_id]
    )
