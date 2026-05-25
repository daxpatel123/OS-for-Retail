"""
Demand forecasting service.

Uses a simple linear regression approach (scikit-learn) to forecast
daily sales quantities for individual products, and provides store-level
revenue forecasts based on historical flash report data.
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

import numpy as np
from sklearn.linear_model import LinearRegression
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.flash_report import FlashReport
from app.models.transaction import Transaction, TransactionLineItem, TransactionType


async def forecast_product_demand(
    store_id: UUID,
    product_id: UUID,
    forecast_days: int,
    history_days: int,
    db: AsyncSession,
) -> list[dict]:
    """
    Forecast daily demand for a product using linear regression on
    historical sales quantities.

    Returns a list of dicts: [{"forecast_date": date, "predicted_quantity": Decimal}]
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=history_days)

    # Gather historical daily quantities
    stmt = (
        select(
            func.date(Transaction.occurred_at).label("sale_date"),
            func.sum(TransactionLineItem.quantity).label("total_qty"),
        )
        .join(Transaction, TransactionLineItem.transaction_id == Transaction.id)
        .where(
            Transaction.store_id == store_id,
            Transaction.transaction_type == TransactionType.SALE,
            TransactionLineItem.product_id == product_id,
            Transaction.occurred_at >= cutoff,
        )
        .group_by(func.date(Transaction.occurred_at))
        .order_by("sale_date")
    )
    result = await db.execute(stmt)
    rows = result.all()

    if len(rows) < 3:
        # Not enough data — return flat average forecast
        if rows:
            avg_qty = float(sum(r.total_qty for r in rows)) / len(rows)
        else:
            avg_qty = 0.0
        today = date.today()
        return [
            {
                "forecast_date": today + timedelta(days=i + 1),
                "predicted_quantity": Decimal(str(round(avg_qty, 4))),
                "model": "average",
            }
            for i in range(forecast_days)
        ]

    # Build feature matrix (x = day index, y = quantity)
    base_date = rows[0].sale_date
    if isinstance(base_date, str):
        from datetime import datetime as dt_cls
        base_date = dt_cls.strptime(base_date, "%Y-%m-%d").date()

    X = np.array(
        [
            [(row.sale_date - base_date).days if not isinstance(row.sale_date, str)
             else (datetime.strptime(row.sale_date, "%Y-%m-%d").date() - base_date).days]
            for row in rows
        ],
        dtype=float,
    )
    y = np.array([float(row.total_qty) for row in rows])

    model = LinearRegression()
    model.fit(X, y)

    # Forecast
    last_known_date = rows[-1].sale_date
    if isinstance(last_known_date, str):
        from datetime import datetime as dt_cls
        last_known_date = dt_cls.strptime(last_known_date, "%Y-%m-%d").date()

    forecasts = []
    for i in range(1, forecast_days + 1):
        future_date = last_known_date + timedelta(days=i)
        day_index = (future_date - base_date).days
        predicted = float(model.predict([[day_index]])[0])
        predicted = max(0.0, predicted)  # Clamp to non-negative
        forecasts.append(
            {
                "forecast_date": future_date,
                "predicted_quantity": Decimal(str(round(predicted, 4))),
                "model": "linear_regression",
            }
        )

    return forecasts


async def forecast_store_revenue(
    store_id: UUID,
    forecast_days: int,
    history_days: int,
    db: AsyncSession,
) -> list[dict]:
    """
    Forecast daily store revenue using flash report historical data and
    linear regression.

    Returns list of dicts: [{"forecast_date": date, "predicted_revenue": Decimal}]
    """
    cutoff = date.today() - timedelta(days=history_days)

    stmt = select(FlashReport).where(
        FlashReport.store_id == store_id,
        FlashReport.report_date >= cutoff,
        FlashReport.total_sales.is_not(None),
    ).order_by(FlashReport.report_date)

    result = await db.execute(stmt)
    reports = result.scalars().all()

    if not reports:
        return []

    if len(reports) < 3:
        avg = float(sum(r.total_sales for r in reports if r.total_sales)) / len(reports)
        today = date.today()
        return [
            {
                "forecast_date": today + timedelta(days=i + 1),
                "predicted_revenue": Decimal(str(round(avg, 2))),
                "model": "average",
            }
            for i in range(forecast_days)
        ]

    base_date = reports[0].report_date
    X = np.array([[(r.report_date - base_date).days] for r in reports], dtype=float)
    y = np.array([float(r.total_sales) for r in reports])

    model = LinearRegression()
    model.fit(X, y)

    last_date = reports[-1].report_date
    forecasts = []
    for i in range(1, forecast_days + 1):
        future_date = last_date + timedelta(days=i)
        day_index = (future_date - base_date).days
        predicted = float(model.predict([[day_index]])[0])
        predicted = max(0.0, predicted)
        forecasts.append(
            {
                "forecast_date": future_date,
                "predicted_revenue": Decimal(str(round(predicted, 2))),
                "model": "linear_regression",
            }
        )

    return forecasts
