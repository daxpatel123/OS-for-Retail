from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Vendor(BaseModel):
    """A product supplier / distributor for an organization."""

    __tablename__ = "vendors"

    org_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    account_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_terms: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="vendor", lazy="noload"
    )
    invoices: Mapped[list["Invoice"]] = relationship(  # noqa: F821
        "Invoice", back_populates="vendor", lazy="noload"
    )
    fuel_deliveries: Mapped[list["FuelDelivery"]] = relationship(  # noqa: F821
        "FuelDelivery", back_populates="vendor", lazy="noload"
    )


class ProductCategory(BaseModel):
    """Hierarchical product categories scoped to an organization."""

    __tablename__ = "product_categories"

    org_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    parent_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("product_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    margin_target_pct: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2), nullable=True
    )

    # Self-referential relationships
    parent: Mapped[Optional["ProductCategory"]] = relationship(
        "ProductCategory",
        remote_side="ProductCategory.id",
        back_populates="children",
        lazy="noload",
    )
    children: Mapped[list["ProductCategory"]] = relationship(
        "ProductCategory",
        back_populates="parent",
        lazy="noload",
    )
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="category", lazy="noload"
    )


class Product(BaseModel):
    """A sellable item in the convenience store catalog."""

    __tablename__ = "products"

    org_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    upc: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    plu: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("product_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    vendor_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("vendors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    retail_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    unit_of_measure: Mapped[str] = mapped_column(String(20), default="EACH", nullable=False)
    is_taxable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_age_restricted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reorder_point: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    reorder_quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    min_stock: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    max_stock: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    # Relationships
    category: Mapped[Optional["ProductCategory"]] = relationship(
        "ProductCategory", back_populates="products"
    )
    vendor: Mapped[Optional["Vendor"]] = relationship(
        "Vendor", back_populates="products"
    )
    inventory_records: Mapped[list["Inventory"]] = relationship(  # noqa: F821
        "Inventory", back_populates="product", lazy="noload"
    )
    transaction_line_items: Mapped[list["TransactionLineItem"]] = relationship(  # noqa: F821
        "TransactionLineItem", back_populates="product", lazy="noload"
    )
