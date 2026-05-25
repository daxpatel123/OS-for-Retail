import enum
from typing import Optional
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class AlertType(str, enum.Enum):
    LOW_STOCK = "LOW_STOCK"
    SHRINKAGE = "SHRINKAGE"
    INVOICE_DISCREPANCY = "INVOICE_DISCREPANCY"
    UNUSUAL_REFUND = "UNUSUAL_REFUND"
    CASH_SHORT = "CASH_SHORT"
    FUEL_LOW = "FUEL_LOW"
    PRICE_MARGIN_EROSION = "PRICE_MARGIN_EROSION"


class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class Alert(BaseModel):
    """A system-generated alert requiring attention from store staff or management."""

    __tablename__ = "alerts"

    org_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    store_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    alert_type: Mapped[AlertType] = mapped_column(
        Enum(AlertType, name="alert_type_enum"),
        nullable=False,
        index=True,
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, name="alert_severity_enum"),
        nullable=False,
        default=AlertSeverity.MEDIUM,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="alert_status_enum"),
        nullable=False,
        default=AlertStatus.OPEN,
        index=True,
    )
    acknowledged_by: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolved_by: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="alerts")  # noqa: F821
    store: Mapped[Optional["Store"]] = relationship("Store", back_populates="alerts")  # noqa: F821
    acknowledger: Mapped[Optional["User"]] = relationship(  # noqa: F821
        "User", foreign_keys=[acknowledged_by]
    )
    resolver: Mapped[Optional["User"]] = relationship(  # noqa: F821
        "User", foreign_keys=[resolved_by]
    )
