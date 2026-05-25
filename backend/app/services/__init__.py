from app.services.flash_report_parser import parse_flash_report_file
from app.services.invoice_parser import parse_invoice_file
from app.services.inventory_service import (
    get_reorder_recommendations,
    detect_dead_stock,
    calculate_stockout_risk,
    check_and_create_stock_alerts,
)
from app.services.analytics_service import (
    get_daily_summary,
    get_sales_trend,
    get_top_products,
    get_category_breakdown,
    get_margin_analysis,
)
from app.services.ai_assistant import answer_question

__all__ = [
    "parse_flash_report_file",
    "parse_invoice_file",
    "get_reorder_recommendations",
    "detect_dead_stock",
    "calculate_stockout_risk",
    "check_and_create_stock_alerts",
    "get_daily_summary",
    "get_sales_trend",
    "get_top_products",
    "get_category_breakdown",
    "get_margin_analysis",
    "answer_question",
]
