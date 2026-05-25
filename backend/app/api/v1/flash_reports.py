"""
Flash report upload and management endpoints.
"""
import os
import shutil
import tempfile
from datetime import date
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser, RequireManager
from app.models.flash_report import FlashReport, ParseStatus
from app.schemas.flash_report import FlashReportDetailResponse, FlashReportResponse
from app.workers.tasks import parse_flash_report_task

router = APIRouter(prefix="/flash-reports", tags=["flash-reports"])

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".txt", ".tsv"}


@router.post("/upload", response_model=FlashReportResponse, status_code=status.HTTP_201_CREATED)
async def upload_flash_report(
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    report_date: date = Query(..., description="Business date for this flash report (YYYY-MM-DD)"),
    file: UploadFile = File(...),
):
    """
    Upload a flash report file (PDF or CSV). Triggers async parsing via Celery.
    Returns the flash report record immediately with PENDING status.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    # Check for existing report on same date
    existing = await db.execute(
        select(FlashReport).where(
            FlashReport.store_id == store_id,
            FlashReport.report_date == report_date,
        )
    )
    flash = existing.scalar_one_or_none()

    if flash:
        # Re-upload: reset status and update file path
        flash.raw_file_url = tmp_path
        flash.parse_status = ParseStatus.PENDING
    else:
        flash = FlashReport(
            store_id=store_id,
            report_date=report_date,
            raw_file_url=tmp_path,
            parse_status=ParseStatus.PENDING,
        )
        db.add(flash)

    await db.flush()
    report_id = str(flash.id)

    # Enqueue async parse
    parse_flash_report_task.delay(report_id, tmp_path)

    return flash


@router.get("/", response_model=list[FlashReportResponse])
async def list_flash_reports(
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
    store_id: UUID = Query(...),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(30, le=365),
    offset: int = Query(0, ge=0),
):
    """List flash reports for a store, optionally filtered by date range."""
    stmt = select(FlashReport).where(FlashReport.store_id == store_id)
    if date_from:
        stmt = stmt.where(FlashReport.report_date >= date_from)
    if date_to:
        stmt = stmt.where(FlashReport.report_date <= date_to)
    stmt = stmt.order_by(FlashReport.report_date.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{report_id}", response_model=FlashReportDetailResponse)
async def get_flash_report(
    report_id: UUID,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a flash report with category breakdown."""
    result = await db.execute(
        select(FlashReport)
        .options(selectinload(FlashReport.categories))
        .where(FlashReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flash report not found")
    return report


@router.post("/{report_id}/reparse", response_model=FlashReportResponse)
async def reparse_flash_report(
    report_id: UUID,
    current_user: Annotated[CurrentUser, RequireManager],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Re-trigger parsing for a flash report."""
    result = await db.execute(select(FlashReport).where(FlashReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flash report not found")

    if not report.raw_file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file associated with this flash report",
        )

    report.parse_status = ParseStatus.PENDING
    await db.flush()

    parse_flash_report_task.delay(str(report.id), report.raw_file_url)
    return report
