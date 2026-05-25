"""
AI Assistant service powered by Claude claude-haiku-4-5-20251001.

Answers natural-language questions about store operations by building
rich context from live database data and passing it to Claude.
"""
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

import anthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.alert import Alert, AlertStatus
from app.models.flash_report import FlashReport
from app.models.inventory import StockAlert, AlertStatus as StockAlertStatus
from app.services.analytics_service import (
    get_daily_summary,
    get_sales_trend,
    get_top_products,
)
from app.services.inventory_service import get_reorder_recommendations


SYSTEM_PROMPT = """You are RetailOS AI, an expert assistant for gas station and convenience store operations.

You help store owners, managers, and employees with:
- Understanding daily sales performance and trends
- Inventory management and ordering decisions
- Identifying shrinkage, unusual activity, and operational anomalies
- Fuel pricing, delivery, and inventory
- Invoice processing and vendor management
- Staff performance and shift management
- Compliance with age-restricted product regulations

You have access to real-time store data provided in the context below.
Always provide actionable recommendations based on the data.
Be concise but thorough. Use specific numbers from the context when available.
If you cannot determine something from the provided data, say so clearly.

When suggesting actions, rank them by priority and business impact."""


def _format_currency(value: Optional[Decimal]) -> str:
    if value is None:
        return "N/A"
    return f"${float(value):,.2f}"


def _build_context(context_data: dict) -> str:
    """Format context data into a readable string for the AI prompt."""
    sections = []

    # Today's summary
    summary = context_data.get("daily_summary")
    if summary:
        sections.append(
            f"""TODAY'S PERFORMANCE ({summary.get('report_date', 'today')}):
- Total Sales: {_format_currency(summary.get('total_sales'))}
- Fuel Sales: {_format_currency(summary.get('fuel_sales_amount'))} ({summary.get('fuel_gallons', 'N/A')} gallons)
- Inside Sales: {_format_currency(summary.get('inside_sales'))}
- Transaction Count: {summary.get('transaction_count', 'N/A')}
- Cash: {_format_currency(summary.get('cash_sales'))} | Card: {_format_currency(summary.get('card_sales'))}
- Tax Collected: {_format_currency(summary.get('tax_collected'))}
- Lottery: {_format_currency(summary.get('lottery_sales'))}
- Tobacco: {_format_currency(summary.get('tobacco_sales'))}"""
        )

    # Sales trend (last 7 days)
    trend = context_data.get("sales_trend", [])
    if trend:
        trend_lines = []
        for point in trend[-7:]:
            trend_lines.append(
                f"  {point.get('report_date')}: {_format_currency(point.get('total_sales'))} "
                f"({point.get('transaction_count', 0)} txns)"
            )
        sections.append("SALES TREND (LAST 7 DAYS):\n" + "\n".join(trend_lines))

    # Top products
    top_products = context_data.get("top_products", [])
    if top_products:
        prod_lines = []
        for i, p in enumerate(top_products[:5], 1):
            prod_lines.append(
                f"  {i}. {p.get('product_name')} - {_format_currency(p.get('total_revenue'))} "
                f"({p.get('total_quantity', 0)} units)"
            )
        sections.append("TOP PRODUCTS (LAST 7 DAYS):\n" + "\n".join(prod_lines))

    # Reorder recommendations
    reorders = context_data.get("reorder_recommendations", [])
    if reorders:
        reorder_lines = [
            f"  - {r.get('product_name')}: {r.get('current_quantity')} on hand "
            f"(reorder at {r.get('reorder_point')})"
            for r in reorders[:10]
        ]
        sections.append(
            f"PRODUCTS NEEDING REORDER ({len(reorders)} total):\n" + "\n".join(reorder_lines)
        )

    # Active alerts
    alerts = context_data.get("active_alerts", [])
    if alerts:
        alert_lines = [
            f"  [{a.get('severity', 'MEDIUM')}] {a.get('title')}"
            for a in alerts[:10]
        ]
        sections.append(
            f"ACTIVE ALERTS ({len(alerts)} open):\n" + "\n".join(alert_lines)
        )

    return "\n\n".join(sections) if sections else "No store data available."


async def _gather_context(store_id: UUID, db: AsyncSession) -> dict:
    """Gather relevant store context data for the AI prompt."""
    today = date.today()
    context: dict = {}

    # Daily summary
    try:
        summary = await get_daily_summary(store_id, today, db)
        context["daily_summary"] = {
            "report_date": str(summary.report_date),
            "total_sales": summary.total_sales,
            "fuel_sales_amount": summary.fuel_sales_amount,
            "fuel_gallons": summary.fuel_gallons,
            "inside_sales": summary.inside_sales,
            "transaction_count": summary.transaction_count,
            "cash_sales": summary.cash_sales,
            "card_sales": summary.card_sales,
            "tax_collected": summary.tax_collected,
            "lottery_sales": summary.lottery_sales,
            "tobacco_sales": summary.tobacco_sales,
            "refunds": summary.refunds,
        }
    except Exception:
        pass

    # Sales trend
    try:
        trend = await get_sales_trend(store_id, 14, db)
        context["sales_trend"] = [
            {
                "report_date": str(t.report_date),
                "total_sales": t.total_sales,
                "transaction_count": t.transaction_count,
            }
            for t in trend
        ]
    except Exception:
        pass

    # Top products
    try:
        top = await get_top_products(store_id, 7, 10, db)
        context["top_products"] = [
            {
                "product_name": p.product_name,
                "total_revenue": p.total_revenue,
                "total_quantity": p.total_quantity,
                "transaction_count": p.transaction_count,
            }
            for p in top
        ]
    except Exception:
        pass

    # Reorder recommendations
    try:
        reorders = await get_reorder_recommendations(store_id, db)
        context["reorder_recommendations"] = [
            {
                "product_name": r.product_name,
                "current_quantity": r.current_quantity,
                "reorder_point": r.reorder_point,
                "vendor_name": r.vendor_name,
            }
            for r in reorders
        ]
    except Exception:
        pass

    # Active alerts
    try:
        alert_stmt = (
            select(Alert)
            .where(
                Alert.store_id == store_id,
                Alert.status == AlertStatus.OPEN,
            )
            .order_by(Alert.created_at.desc())
            .limit(20)
        )
        alert_result = await db.execute(alert_stmt)
        alerts_list = alert_result.scalars().all()
        context["active_alerts"] = [
            {
                "alert_type": a.alert_type.value,
                "severity": a.severity.value,
                "title": a.title,
                "message": a.message,
            }
            for a in alerts_list
        ]
    except Exception:
        pass

    return context


async def answer_question(
    question: str,
    store_id: UUID,
    context_data: Optional[dict],
    db: AsyncSession,
) -> dict:
    """
    Answer a natural-language question about the store using Claude.

    Args:
        question: The user's question.
        store_id: The store being queried.
        context_data: Optional pre-built context dict; if None, will be
                      gathered automatically from the database.
        db: Async database session.

    Returns:
        dict with keys: answer, confidence, data_sources, suggested_actions
    """
    if context_data is None:
        context_data = await _gather_context(store_id, db)

    context_str = _build_context(context_data)
    data_sources = [k for k, v in context_data.items() if v]

    user_message = f"""Store Context:
{context_str}

Question: {question}

Please provide:
1. A direct answer to the question
2. Key data points that support your answer
3. 2-3 specific suggested actions (if relevant)

Format your response as:
ANSWER: [your answer]
SUGGESTED_ACTIONS:
- [action 1]
- [action 2]
- [action 3]"""

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw_response = message.content[0].text.strip()

    # Parse the structured response
    answer_text = raw_response
    suggested_actions: list[str] = []

    if "ANSWER:" in raw_response:
        parts = raw_response.split("SUGGESTED_ACTIONS:", 1)
        answer_text = parts[0].replace("ANSWER:", "").strip()
        if len(parts) > 1:
            action_lines = parts[1].strip().split("\n")
            suggested_actions = [
                line.lstrip("- •*").strip()
                for line in action_lines
                if line.strip() and line.strip() not in ("", "-")
            ]

    # Compute a simple confidence based on how much context data is available
    context_richness = len([v for v in context_data.values() if v]) / max(len(context_data), 1)
    confidence = round(0.5 + context_richness * 0.5, 2)

    return {
        "answer": answer_text,
        "confidence": confidence,
        "data_sources": data_sources,
        "suggested_actions": suggested_actions[:5],  # Cap at 5 actions
    }
