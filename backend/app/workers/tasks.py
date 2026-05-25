"""
Celery task definitions for RetailOS async processing.

Tasks handle:
- Flash report parsing (PDF/CSV upload → structured data)
- Invoice OCR (PDF upload → line-item extraction via Claude)
- Inventory alert scanning
- Shrinkage detection
"""
import asyncio
import logging
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, update

from app.core.database import AsyncSessionLocal
from app.models.flash_report import FlashReport, ParseStatus
from app.models.invoice import Invoice, OCRStatus, InvoiceLineItem
from app.services.flash_report_parser import parse_flash_report_file
from app.services.invoice_parser import parse_invoice_file
from app.services.inventory_service import check_and_create_stock_alerts
from app.services.shrinkage_service import run_shrinkage_scan_and_alert
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async coroutine from a synchronous Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(
    bind=True,
    name="app.workers.tasks.parse_flash_report_task",
    max_retries=3,
    default_retry_delay=60,
)
def parse_flash_report_task(self, flash_report_id: str, file_path: str):
    """
    Async task: parse a flash report file and persist results to the database.

    Args:
        flash_report_id: UUID string of the FlashReport record.
        file_path: Local or mounted file path of the uploaded file.
    """

    async def _execute():
        report_uuid = UUID(flash_report_id)
        async with AsyncSessionLocal() as db:
            # Mark as processing
            await db.execute(
                update(FlashReport)
                .where(FlashReport.id == report_uuid)
                .values(parse_status=ParseStatus.PROCESSING)
            )
            await db.commit()

            try:
                parsed = parse_flash_report_file(file_path)

                update_vals = {
                    "parse_status": ParseStatus.COMPLETED,
                    "parse_confidence": parsed.get("parse_confidence"),
                    "total_sales": parsed.get("total_sales"),
                    "fuel_sales_amount": parsed.get("fuel_sales_amount"),
                    "fuel_gallons": parsed.get("fuel_gallons"),
                    "inside_sales": parsed.get("inside_sales"),
                    "lottery_sales": parsed.get("lottery_sales"),
                    "tobacco_sales": parsed.get("tobacco_sales"),
                    "tax_collected": parsed.get("tax_collected"),
                    "cash_sales": parsed.get("cash_sales"),
                    "card_sales": parsed.get("card_sales"),
                    "refunds": parsed.get("refunds"),
                    "voids": parsed.get("voids"),
                    "transaction_count": parsed.get("transaction_count"),
                    "notes": parsed.get("notes"),
                }

                # Update report_date only if parsed successfully
                if parsed.get("report_date"):
                    update_vals["report_date"] = parsed["report_date"]

                await db.execute(
                    update(FlashReport)
                    .where(FlashReport.id == report_uuid)
                    .values(**update_vals)
                )
                await db.commit()
                logger.info("FlashReport %s parsed successfully.", flash_report_id)

            except Exception as exc:
                logger.error("FlashReport %s parse failed: %s", flash_report_id, exc)
                await db.execute(
                    update(FlashReport)
                    .where(FlashReport.id == report_uuid)
                    .values(parse_status=ParseStatus.FAILED, notes=str(exc))
                )
                await db.commit()
                raise

    try:
        _run_async(_execute())
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    name="app.workers.tasks.parse_invoice_task",
    max_retries=3,
    default_retry_delay=60,
)
def parse_invoice_task(self, invoice_id: str, file_path: str, vendor_hint: str = None):
    """
    Async task: OCR and parse an invoice file, persist line items.

    Args:
        invoice_id: UUID string of the Invoice record.
        file_path: Local or mounted file path of the uploaded invoice.
        vendor_hint: Optional vendor name hint for Claude extraction.
    """

    async def _execute():
        inv_uuid = UUID(invoice_id)
        async with AsyncSessionLocal() as db:
            # Mark as processing
            await db.execute(
                update(Invoice)
                .where(Invoice.id == inv_uuid)
                .values(ocr_status=OCRStatus.PROCESSING)
            )
            await db.commit()

            try:
                result = parse_invoice_file(file_path, vendor_hint=vendor_hint)

                await db.execute(
                    update(Invoice)
                    .where(Invoice.id == inv_uuid)
                    .values(
                        ocr_status=OCRStatus.COMPLETED,
                        ocr_confidence_score=result.get("ocr_confidence_score"),
                        invoice_number=result.get("invoice_number"),
                        invoice_date=result.get("invoice_date"),
                        due_date=result.get("due_date"),
                        subtotal=result.get("subtotal"),
                        tax_amount=result.get("tax_amount"),
                        total_amount=result.get("total_amount"),
                    )
                )

                # Persist line items
                for item_data in result.get("line_items", []):
                    line_item = InvoiceLineItem(
                        invoice_id=inv_uuid,
                        product_name_raw=item_data.get("product_name_raw"),
                        upc_raw=item_data.get("upc_raw"),
                        quantity_ordered=item_data.get("quantity_ordered"),
                        quantity_delivered=item_data.get("quantity_delivered"),
                        unit_cost=item_data.get("unit_cost"),
                        line_total=item_data.get("line_total"),
                        has_discrepancy=False,
                    )
                    db.add(line_item)

                await db.commit()
                logger.info("Invoice %s parsed successfully.", invoice_id)

            except Exception as exc:
                logger.error("Invoice %s OCR failed: %s", invoice_id, exc)
                await db.execute(
                    update(Invoice)
                    .where(Invoice.id == inv_uuid)
                    .values(ocr_status=OCRStatus.FAILED, notes=str(exc))
                )
                await db.commit()
                raise

    try:
        _run_async(_execute())
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(
    name="app.workers.tasks.run_inventory_alerts_task",
    max_retries=2,
    default_retry_delay=30,
)
def run_inventory_alerts_task(store_id: str):
    """
    Periodic task: scan inventory and create low-stock/out-of-stock alerts.
    """

    async def _execute():
        store_uuid = UUID(store_id)
        async with AsyncSessionLocal() as db:
            created = await check_and_create_stock_alerts(store_uuid, db)
            await db.commit()
            logger.info(
                "Inventory alert scan for store %s: %d new alerts created.",
                store_id,
                len(created),
            )

    _run_async(_execute())


@celery_app.task(
    name="app.workers.tasks.run_shrinkage_scan_task",
    max_retries=2,
    default_retry_delay=30,
)
def run_shrinkage_scan_task(store_id: str, org_id: str, days: int = 30):
    """
    Periodic task: run shrinkage detection and create alerts.
    """

    async def _execute():
        store_uuid = UUID(store_id)
        org_uuid = UUID(org_id)
        async with AsyncSessionLocal() as db:
            created = await run_shrinkage_scan_and_alert(store_uuid, org_uuid, days, db)
            await db.commit()
            logger.info(
                "Shrinkage scan for store %s: %d new alerts created.",
                store_id,
                len(created),
            )

    _run_async(_execute())
