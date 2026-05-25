from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Organization(BaseModel):
    """Top-level tenant. Each organization may own multiple stores."""

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    subscription_plan: Mapped[str] = mapped_column(String(50), default="starter", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    settings: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=dict)

    # Relationships
    stores: Mapped[list["Store"]] = relationship(  # noqa: F821
        "Store", back_populates="organization", lazy="noload"
    )
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        "User", back_populates="organization", lazy="noload"
    )
    alerts: Mapped[list["Alert"]] = relationship(  # noqa: F821
        "Alert", back_populates="organization", lazy="noload"
    )
