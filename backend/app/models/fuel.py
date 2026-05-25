from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class FuelGrade(BaseModel):
    """A fuel product grade offered at a store (e.g. Regular, Premium)."""

    __tablename__ = "fuel_grades"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    tank_capacity_gallons: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    low_level_threshold_gallons: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="fuel_grades")  # noqa: F821
    fuel_sales: Mapped[list["FuelSale"]] = relationship(
        "FuelSale", back_populates="fuel_grade", lazy="noload"
    )
    fuel_deliveries: Mapped[list["FuelDelivery"]] = relationship(
        "FuelDelivery", back_populates="fuel_grade", lazy="noload"
    )
    fuel_prices: Mapped[list["FuelPrice"]] = relationship(
        "FuelPrice", back_populates="fuel_grade", lazy="noload"
    )


class FuelSale(BaseModel):
    """A single fuel dispensing event tied to a transaction."""

    __tablename__ = "fuel_sales"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fuel_grade_id: Mapped[UUID] = mapped_column(
        ForeignKey("fuel_grades.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pump_number: Mapped[int] = mapped_column(Integer, nullable=False)
    transaction_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    gallons: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    price_per_gallon: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    store: Mapped["Store"] = relationship("Store")  # noqa: F821
    fuel_grade: Mapped["FuelGrade"] = relationship("FuelGrade", back_populates="fuel_sales")
    transaction: Mapped[Optional["Transaction"]] = relationship("Transaction", back_populates="fuel_sales")  # noqa: F821


class FuelDelivery(BaseModel):
    """A bulk fuel delivery from a vendor."""

    __tablename__ = "fuel_deliveries"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fuel_grade_id: Mapped[UUID] = mapped_column(
        ForeignKey("fuel_grades.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vendor_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("vendors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    invoice_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("invoices.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    delivery_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    gallons_delivered: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cost_per_gallon: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    store: Mapped["Store"] = relationship("Store")  # noqa: F821
    fuel_grade: Mapped["FuelGrade"] = relationship("FuelGrade", back_populates="fuel_deliveries")
    vendor: Mapped[Optional["Vendor"]] = relationship("Vendor", back_populates="fuel_deliveries")  # noqa: F821
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice")  # noqa: F821


class FuelPrice(BaseModel):
    """Historical fuel price records per grade."""

    __tablename__ = "fuel_prices"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fuel_grade_id: Mapped[UUID] = mapped_column(
        ForeignKey("fuel_grades.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    retail_price: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)
    cost_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 4), nullable=True)
    effective_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    set_by: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    store: Mapped["Store"] = relationship("Store")  # noqa: F821
    fuel_grade: Mapped["FuelGrade"] = relationship("FuelGrade", back_populates="fuel_prices")
    setter: Mapped[Optional["User"]] = relationship("User")  # noqa: F821
