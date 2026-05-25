import enum
from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ParseStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class FlashReport(BaseModel):
    """
    A daily flash report for a store, capturing all key performance metrics
    for the business day. May be uploaded as PDF or CSV.
    """

    __tablename__ = "flash_reports"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    report_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    raw_file_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    parse_status: Mapped[ParseStatus] = mapped_column(
        Enum(ParseStatus, name="parse_status_enum"),
        nullable=False,
        default=ParseStatus.PENDING,
        index=True,
    )
    parse_confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4), nullable=True)

    # Financial totals
    total_sales: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    fuel_sales_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    fuel_gallons: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 3), nullable=True)
    inside_sales: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    lottery_sales: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    tobacco_sales: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    tax_collected: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    cash_sales: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    card_sales: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    refunds: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    voids: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    transaction_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="flash_reports")  # noqa: F821
    categories: Mapped[list["FlashReportCategory"]] = relationship(
        "FlashReportCategory", back_populates="flash_report", lazy="noload"
    )


class FlashReportCategory(BaseModel):
    """Category-level breakdown within a flash report."""

    __tablename__ = "flash_report_categories"

    flash_report_id: Mapped[UUID] = mapped_column(
        ForeignKey("flash_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_name: Mapped[str] = mapped_column(String(200), nullable=False)
    sales_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    transaction_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    margin_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)

    # Relationships
    flash_report: Mapped["FlashReport"] = relationship("FlashReport", back_populates="categories")
