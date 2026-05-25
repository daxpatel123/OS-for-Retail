"""
Analytics service: dashboard aggregations, sales trends, top products,
category breakdowns, and margin analysis.
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select, and_, cast
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import Numeric

from app.models.flash_report import FlashReport, FlashReportCategory
from app.models.transaction import Transaction, TransactionLineItem, TransactionType
from app.models.product import Product, ProductCategory
from app.schemas.dashboard import (
    DailySummary,
    SalesTrendPoint,
    TopProduct,
    CategoryBreakdown,
    MarginAnalysis,
)


def _zero() -> Decimal:
    return Decimal("0")


async def get_daily_summary(
    store_id: UUID, report_date: date, db: AsyncSession
) -> DailySummary:
    """
    Build a daily summary for a store from flash reports and transactions.
    Flash report data takes precedence where available.
    """
    # Try flash report first
    fr_stmt = select(FlashReport).where(
        FlashReport.store_id == store_id,
        FlashReport.report_date == report_date,
    )
    fr_result = await db.execute(fr_stmt)
    flash = fr_result.scalar_one_or_none()

    if flash and flash.total_sales is not None:
        return DailySummary(
            store_id=store_id,
            report_date=report_date,
            total_sales=flash.total_sales or _zero(),
            fuel_sales_amount=flash.fuel_sales_amount or _zero(),
            fuel_gallons=flash.fuel_gallons or _zero(),
            inside_sales=flash.inside_sales or _zero(),
            transaction_count=flash.transaction_count or 0,
            cash_sales=flash.cash_sales or _zero(),
            card_sales=flash.card_sales or _zero(),
            refunds=flash.refunds or _zero(),
            tax_collected=flash.tax_collected or _zero(),
            lottery_sales=flash.lottery_sales or _zero(),
            tobacco_sales=flash.tobacco_sales or _zero(),
        )

    # Fallback: aggregate from transactions
    start_dt = datetime.combine(report_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_dt = start_dt + timedelta(days=1)

    txn_stmt = select(
        func.coalesce(func.sum(Transaction.total_amount), Decimal("0")).label("total_sales"),
        func.coalesce(func.sum(Transaction.tax_amount), Decimal("0")).label("tax_collected"),
        func.count(Transaction.id).label("transaction_count"),
    ).where(
        Transaction.store_id == store_id,
        Transaction.transaction_type == TransactionType.SALE,
        Transaction.occurred_at >= start_dt,
        Transaction.occurred_at < end_dt,
    )

    txn_result = await db.execute(txn_stmt)
    row = txn_result.one()

    return DailySummary(
        store_id=store_id,
        report_date=report_date,
        total_sales=row.total_sales or _zero(),
        fuel_sales_amount=_zero(),
        fuel_gallons=_zero(),
        inside_sales=row.total_sales or _zero(),
        transaction_count=row.transaction_count or 0,
        cash_sales=_zero(),
        card_sales=_zero(),
        refunds=_zero(),
        tax_collected=row.tax_collected or _zero(),
        lottery_sales=_zero(),
        tobacco_sales=_zero(),
    )


async def get_sales_trend(
    store_id: UUID, days: int, db: AsyncSession
) -> list[SalesTrendPoint]:
    """
    Return daily sales aggregates for the last `days` days.
    Prefers flash report data and falls back to transaction-level aggregates.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    # Fetch all flash reports in range
    fr_stmt = select(FlashReport).where(
        FlashReport.store_id == store_id,
        FlashReport.report_date >= start_date,
        FlashReport.report_date <= end_date,
    ).order_by(FlashReport.report_date)
    fr_result = await db.execute(fr_stmt)
    flash_reports = {fr.report_date: fr for fr in fr_result.scalars().all()}

    # Fetch transaction aggregates per day
    start_dt = datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date, datetime.min.time()).replace(tzinfo=timezone.utc) + timedelta(days=1)

    txn_stmt = select(
        func.date(Transaction.occurred_at).label("txn_date"),
        func.coalesce(func.sum(Transaction.total_amount), Decimal("0")).label("total_sales"),
        func.count(Transaction.id).label("transaction_count"),
    ).where(
        Transaction.store_id == store_id,
        Transaction.transaction_type == TransactionType.SALE,
        Transaction.occurred_at >= start_dt,
        Transaction.occurred_at < end_dt,
    ).group_by(func.date(Transaction.occurred_at)).order_by("txn_date")

    txn_result = await db.execute(txn_stmt)
    txn_by_date = {row.txn_date: row for row in txn_result.all()}

    trend_points = []
    current = start_date
    while current <= end_date:
        flash = flash_reports.get(current)
        if flash and flash.total_sales is not None:
            trend_points.append(
                SalesTrendPoint(
                    report_date=current,
                    total_sales=flash.total_sales,
                    transaction_count=flash.transaction_count or 0,
                    fuel_sales_amount=flash.fuel_sales_amount,
                    inside_sales=flash.inside_sales,
                )
            )
        elif current in txn_by_date:
            row = txn_by_date[current]
            trend_points.append(
                SalesTrendPoint(
                    report_date=current,
                    total_sales=row.total_sales,
                    transaction_count=row.transaction_count,
                )
            )
        else:
            trend_points.append(
                SalesTrendPoint(
                    report_date=current,
                    total_sales=_zero(),
                    transaction_count=0,
                )
            )
        current += timedelta(days=1)

    return trend_points


async def get_top_products(
    store_id: UUID, days: int, limit: int, db: AsyncSession
) -> list[TopProduct]:
    """
    Return top products by revenue for the given store over the last `days` days.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    stmt = (
        select(
            TransactionLineItem.product_id,
            TransactionLineItem.product_name,
            TransactionLineItem.upc,
            func.sum(TransactionLineItem.line_total).label("total_revenue"),
            func.sum(TransactionLineItem.quantity).label("total_quantity"),
            func.count(TransactionLineItem.id).label("transaction_count"),
        )
        .join(Transaction, TransactionLineItem.transaction_id == Transaction.id)
        .where(
            Transaction.store_id == store_id,
            Transaction.transaction_type == TransactionType.SALE,
            Transaction.occurred_at >= cutoff,
        )
        .group_by(
            TransactionLineItem.product_id,
            TransactionLineItem.product_name,
            TransactionLineItem.upc,
        )
        .order_by(func.sum(TransactionLineItem.line_total).desc())
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        TopProduct(
            product_id=row.product_id,
            product_name=row.product_name,
            upc=row.upc,
            total_revenue=row.total_revenue or _zero(),
            total_quantity=row.total_quantity or _zero(),
            transaction_count=row.transaction_count or 0,
        )
        for row in rows
        if row.product_id is not None
    ]


async def get_category_breakdown(
    store_id: UUID, date_from: date, date_to: date, db: AsyncSession
) -> list[CategoryBreakdown]:
    """
    Summarise sales by product category for the given date range.
    Uses FlashReportCategory data where available, falls back to transaction lines.
    """
    # Prefer flash report category data
    fr_stmt = select(FlashReport).where(
        FlashReport.store_id == store_id,
        FlashReport.report_date >= date_from,
        FlashReport.report_date <= date_to,
    )
    fr_result = await db.execute(fr_stmt)
    flash_ids = [fr.id for fr in fr_result.scalars().all()]

    if flash_ids:
        cat_stmt = select(
            FlashReportCategory.category_name,
            func.sum(FlashReportCategory.sales_amount).label("sales_amount"),
            func.sum(FlashReportCategory.transaction_count).label("transaction_count"),
            func.sum(FlashReportCategory.cost_amount).label("cost_amount"),
            func.sum(FlashReportCategory.margin_amount).label("margin_amount"),
        ).where(
            FlashReportCategory.flash_report_id.in_(flash_ids)
        ).group_by(FlashReportCategory.category_name).order_by(
            func.sum(FlashReportCategory.sales_amount).desc()
        )
        cat_result = await db.execute(cat_stmt)
        rows = cat_result.all()
        if rows:
            breakdown = []
            for row in rows:
                sales = row.sales_amount or _zero()
                margin = row.margin_amount
                breakdown.append(
                    CategoryBreakdown(
                        category_name=row.category_name,
                        sales_amount=sales,
                        transaction_count=row.transaction_count or 0,
                        cost_amount=row.cost_amount,
                        margin_amount=margin,
                        margin_pct=(margin / sales * 100) if margin and sales > 0 else None,
                    )
                )
            return breakdown

    # Fallback: aggregate from transaction line items + product categories
    start_dt = datetime.combine(date_from, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_dt = datetime.combine(date_to, datetime.min.time()).replace(tzinfo=timezone.utc) + timedelta(days=1)

    stmt = (
        select(
            ProductCategory.name.label("category_name"),
            func.sum(TransactionLineItem.line_total).label("sales_amount"),
            func.count(TransactionLineItem.id).label("transaction_count"),
        )
        .join(Transaction, TransactionLineItem.transaction_id == Transaction.id)
        .join(Product, TransactionLineItem.product_id == Product.id)
        .outerjoin(ProductCategory, Product.category_id == ProductCategory.id)
        .where(
            Transaction.store_id == store_id,
            Transaction.transaction_type == TransactionType.SALE,
            Transaction.occurred_at >= start_dt,
            Transaction.occurred_at < end_dt,
        )
        .group_by(ProductCategory.name)
        .order_by(func.sum(TransactionLineItem.line_total).desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        CategoryBreakdown(
            category_name=row.category_name or "Uncategorized",
            sales_amount=row.sales_amount or _zero(),
            transaction_count=row.transaction_count or 0,
        )
        for row in rows
    ]


async def get_margin_analysis(
    store_id: UUID, date_from: date, date_to: date, db: AsyncSession
) -> list[MarginAnalysis]:
    """
    Calculate gross margin by category for the date range, using product
    cost from the catalog and revenue from transaction line items.
    """
    start_dt = datetime.combine(date_from, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_dt = datetime.combine(date_to, datetime.min.time()).replace(tzinfo=timezone.utc) + timedelta(days=1)

    stmt = (
        select(
            ProductCategory.name.label("category_name"),
            func.sum(TransactionLineItem.line_total).label("revenue"),
            func.sum(
                TransactionLineItem.quantity * func.coalesce(Product.cost, Decimal("0"))
            ).label("cost"),
        )
        .join(Transaction, TransactionLineItem.transaction_id == Transaction.id)
        .join(Product, TransactionLineItem.product_id == Product.id)
        .outerjoin(ProductCategory, Product.category_id == ProductCategory.id)
        .where(
            Transaction.store_id == store_id,
            Transaction.transaction_type == TransactionType.SALE,
            Transaction.occurred_at >= start_dt,
            Transaction.occurred_at < end_dt,
        )
        .group_by(ProductCategory.name)
        .order_by(func.sum(TransactionLineItem.line_total).desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    analyses = []
    for row in rows:
        revenue = row.revenue or _zero()
        cost = row.cost or _zero()
        gross_margin = revenue - cost
        margin_pct = (gross_margin / revenue * 100) if revenue > 0 else _zero()
        analyses.append(
            MarginAnalysis(
                category_name=row.category_name or "Uncategorized",
                revenue=revenue,
                cost=cost,
                gross_margin=gross_margin,
                margin_pct=margin_pct,
            )
        )
    return analyses
