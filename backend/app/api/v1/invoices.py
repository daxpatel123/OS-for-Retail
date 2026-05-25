"""
Invoice upload and management endpoints.
"""
import os
import shutil
import tempfile
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser, RequireAccountant, RequireManager
from app.models.invoice import Invoice, InvoiceStatus, OCRStatus
from app.schemas.invoice import (
    InvoiceApproveRequest,
    InvoiceDetailResponse,
    InvoiceDisputeRequest,
    InvoiceResponse,
)
from app.workers.tasks import parse_invoice_task

router = APIRouter(prefix="/invoices", tags=["invoices"])

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".txt", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_MB = 20


@router.post("/upload", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def upload_invoice(
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    vendor_id: Optional[UUID] = Query(None),
    file: UploadFile = File(...),
):
    """
    Upload an invoice file. Triggers async OCR + extraction via Celery.
    Returns the invoice record immediately with PENDING status.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # Save file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    # Create invoice record
    invoice = Invoice(
        store_id=store_id,
        vendor_id=vendor_id,
        raw_file_url=tmp_path,  # In production, upload to S3 first
        ocr_status=OCRStatus.PENDING,
        status=InvoiceStatus.PENDING,
    )
    db.add(invoice)
    await db.flush()
    invoice_id = str(invoice.id)

    # Kick off async parse
    parse_invoice_task.delay(invoice_id, tmp_path)

    return invoice


@router.get("/", response_model=list[InvoiceResponse])
async def list_invoices(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    invoice_status: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
):
    """List invoices for a store with optional status filter."""
    stmt = select(Invoice).where(Invoice.store_id == store_id)
    if invoice_status:
        try:
            stmt = stmt.where(Invoice.status == InvoiceStatus(invoice_status.upper()))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status: {invoice_status}",
            )
    stmt = stmt.order_by(Invoice.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
async def get_invoice(
    invoice_id: UUID,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single invoice with line items."""
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.line_items))
        .where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice


@router.post("/{invoice_id}/approve", response_model=InvoiceResponse)
async def approve_invoice(
    invoice_id: UUID,
    payload: InvoiceApproveRequest,
    current_user: Annotated[CurrentUser, RequireAccountant],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Approve an invoice (accountant or higher)."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    if invoice.status not in (InvoiceStatus.PENDING, InvoiceStatus.MATCHED, InvoiceStatus.DISCREPANCY):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot approve invoice with status: {invoice.status.value}",
        )

    invoice.status = InvoiceStatus.APPROVED
    if payload.notes:
        invoice.notes = payload.notes
    await db.flush()
    return invoice


@router.post("/{invoice_id}/dispute", response_model=InvoiceResponse)
async def dispute_invoice(
    invoice_id: UUID,
    payload: InvoiceDisputeRequest,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Flag an invoice as having a discrepancy."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    invoice.status = InvoiceStatus.DISCREPANCY
    invoice.notes = payload.notes
    await db.flush()
    return invoice


@router.post("/{invoice_id}/reparse", response_model=InvoiceResponse)
async def reparse_invoice(
    invoice_id: UUID,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Re-trigger OCR parsing for an invoice."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    if not invoice.raw_file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file associated with this invoice",
        )

    invoice.ocr_status = OCRStatus.PENDING
    await db.flush()

    parse_invoice_task.delay(str(invoice.id), invoice.raw_file_url)
    return invoice
