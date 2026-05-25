import enum
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, Enum, ForeignKey, String, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"
    ACCOUNTANT = "ACCOUNTANT"


# Association table: many-to-many User <-> Store access
user_store_access = Table(
    "user_store_access",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("store_id", ForeignKey("stores.id", ondelete="CASCADE"), primary_key=True),
)


class User(BaseModel):
    """Application user belonging to an organization."""

    __tablename__ = "users"

    org_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(1024), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum"),
        default=UserRole.EMPLOYEE,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    organization: Mapped["Organization"] = relationship(  # noqa: F821
        "Organization", back_populates="users"
    )
    accessible_stores: Mapped[list["Store"]] = relationship(  # noqa: F821
        "Store",
        secondary=user_store_access,
        lazy="noload",
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
