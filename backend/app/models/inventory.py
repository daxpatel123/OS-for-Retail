import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MovementType(str, enum.Enum):
    SALE = "SALE"
    RECEIPT = "RECEIPT"
    ADJUSTMENT = "ADJUSTMENT"
    TRANSFER = "TRANSFER"
    WASTE = "WASTE"


class StockAlertType(str, enum.Enum):
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    OVERSTOCK = "OVERSTOCK"
    DEAD_STOCK = "DEAD_STOCK"


class AlertStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class Inventory(BaseModel):
    """Current on-hand quantity for a product at a store."""

    __tablename__ = "inventory"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quantity_on_hand: Mapped[Decimal] = mapped_column(
        Numeric(12, 4), nullable=False, default=Decimal("0")
    )
    last_counted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="inventory")  # noqa: F821
    product: Mapped["Product"] = relationship("Product", back_populates="inventory_records")  # noqa: F821


class InventoryMovement(BaseModel):
    """Records every change in inventory quantity for audit trail."""

    __tablename__ = "inventory_movements"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    movement_type: Mapped[MovementType] = mapped_column(
        Enum(MovementType, name="movement_type_enum"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    reference_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reference_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    store: Mapped["Store"] = relationship("Store")  # noqa: F821
    product: Mapped["Product"] = relationship("Product")  # noqa: F821
    creator: Mapped[Optional["User"]] = relationship("User")  # noqa: F821


class StockAlert(BaseModel):
    """Auto-generated alert when inventory crosses a threshold."""

    __tablename__ = "stock_alerts"

    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    alert_type: Mapped[StockAlertType] = mapped_column(
        Enum(StockAlertType, name="stock_alert_type_enum"),
        nullable=False,
        index=True,
    )
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="stock_alert_status_enum"),
        nullable=False,
        default=AlertStatus.OPEN,
        index=True,
    )
    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # Relationships
    store: Mapped["Store"] = relationship("Store")  # noqa: F821
    product: Mapped["Product"] = relationship("Product")  # noqa: F821
