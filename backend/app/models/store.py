import enum
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class POSType(str, enum.Enum):
    VERIFONE = "VERIFONE"
    GILBARCO = "GILBARCO"
    RUBY = "RUBY"
    OTHER = "OTHER"


class Store(BaseModel):
    """A physical retail location belonging to an organization."""

    __tablename__ = "stores"

    org_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zip: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="America/Chicago", nullable=False)
    pos_type: Mapped[POSType] = mapped_column(
        Enum(POSType, name="pos_type_enum"),
        default=POSType.OTHER,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    organization: Mapped["Organization"] = relationship(  # noqa: F821
        "Organization", back_populates="stores"
    )
    registers: Mapped[list["Register"]] = relationship(
        "Register", back_populates="store", lazy="noload"
    )
    inventory: Mapped[list["Inventory"]] = relationship(  # noqa: F821
        "Inventory", back_populates="store", lazy="noload"
    )
    transactions: Mapped[list["Transaction"]] = relationship(  # noqa: F821
        "Transaction", back_populates="store", lazy="noload"
    )
    fuel_grades: Mapped[list["FuelGrade"]] = relationship(  # noqa: F821
        "FuelGrade", back_populates="store", lazy="noload"
    )
    invoices: Mapped[list["Invoice"]] = relationship(  # noqa: F821
        "Invoice", back_populates="store", lazy="noload"
    )
    flash_reports: Mapped[list["FlashReport"]] = relationship(  # noqa: F821
        "FlashReport", back_populates="store", lazy="noload"
    )
    alerts: Mapped[list["Alert"]] = relationship(  # noqa: F821
        "Alert", back_populates="store", lazy="noload"
    )


class Register(BaseModel):
    """A POS terminal / register within a store."""

    __tablename__ = "registers"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    terminal_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="registers")
    shifts: Mapped[list["Shift"]] = relationship(  # noqa: F821
        "Shift", back_populates="register", lazy="noload"
    )
