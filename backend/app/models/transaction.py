import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ShiftStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class TransactionType(str, enum.Enum):
    SALE = "SALE"
    REFUND = "REFUND"
    VOID = "VOID"
    NO_SALE = "NO_SALE"


class TenderType(str, enum.Enum):
    CASH = "CASH"
    CARD = "CARD"
    MIXED = "MIXED"
    LOTTERY = "LOTTERY"


class Shift(BaseModel):
    """A cashier's work shift at a register."""

    __tablename__ = "shifts"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    register_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("registers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    employee_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    shift_number: Mapped[str] = mapped_column(String(50), nullable=False)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    opening_cash: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    closing_cash: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    expected_cash: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    cash_over_short: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    total_sales: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    total_transactions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[ShiftStatus] = mapped_column(
        Enum(ShiftStatus, name="shift_status_enum"),
        nullable=False,
        default=ShiftStatus.OPEN,
        index=True,
    )

    # Relationships
    store: Mapped["Store"] = relationship("Store")  # noqa: F821
    register: Mapped[Optional["Register"]] = relationship("Register", back_populates="shifts")  # noqa: F821
    employee: Mapped[Optional["User"]] = relationship("User")  # noqa: F821
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="shift", lazy="noload"
    )


class Transaction(BaseModel):
    """A POS transaction event (sale, refund, void, no-sale)."""

    __tablename__ = "transactions"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    register_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("registers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    shift_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("shifts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    transaction_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type_enum"),
        nullable=False,
        index=True,
    )
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    tender_type: Mapped[Optional[TenderType]] = mapped_column(
        Enum(TenderType, name="tender_type_enum"),
        nullable=True,
    )
    employee_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="transactions")  # noqa: F821
    register: Mapped[Optional["Register"]] = relationship("Register")  # noqa: F821
    shift: Mapped[Optional["Shift"]] = relationship("Shift", back_populates="transactions")
    employee: Mapped[Optional["User"]] = relationship("User")  # noqa: F821
    line_items: Mapped[list["TransactionLineItem"]] = relationship(
        "TransactionLineItem", back_populates="transaction", lazy="noload"
    )
    fuel_sales: Mapped[list["FuelSale"]] = relationship(  # noqa: F821
        "FuelSale", back_populates="transaction", lazy="noload"
    )


class TransactionLineItem(BaseModel):
    """A single product line within a transaction."""

    __tablename__ = "transaction_line_items"

    transaction_id: Mapped[UUID] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    upc: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="line_items")
    product: Mapped[Optional["Product"]] = relationship("Product", back_populates="transaction_line_items")  # noqa: F821
