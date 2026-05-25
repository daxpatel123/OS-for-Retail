"""
Flash report parser for PDF and CSV daily sales reports.

Supports common c-store POS formats including Verifone, Gilbarco Commander,
and generic CSV exports.
"""
import re
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Optional

import pandas as pd


# ---------------------------------------------------------------------------
# Regex patterns for common flash report text formats
# ---------------------------------------------------------------------------

PATTERNS = {
    "total_sales": re.compile(
        r"(?:total\s+sales?|net\s+sales?|gross\s+sales?)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "fuel_sales_amount": re.compile(
        r"(?:fuel\s+sales?|gasoline\s+sales?|petroleum\s+sales?)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "fuel_gallons": re.compile(
        r"(?:total\s+gallons?|fuel\s+gallons?|gallons?\s+sold)\s*[:\-]?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "inside_sales": re.compile(
        r"(?:inside\s+sales?|c-?store\s+sales?|merchandise\s+sales?)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "lottery_sales": re.compile(
        r"(?:lottery\s+sales?|lotto\s+sales?)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "tobacco_sales": re.compile(
        r"(?:tobacco\s+sales?|cigarette\s+sales?|otc\s+tobacco)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "tax_collected": re.compile(
        r"(?:tax\s+collected?|sales\s+tax|total\s+tax)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "cash_sales": re.compile(
        r"(?:cash\s+sales?|total\s+cash)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "card_sales": re.compile(
        r"(?:card\s+sales?|credit\s+(?:card\s+)?sales?|debit\s+(?:card\s+)?sales?|electronic\s+sales?)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "refunds": re.compile(
        r"(?:refunds?|returns?|total\s+refunds?)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "voids": re.compile(
        r"(?:voids?|voided?\s+transactions?|total\s+voids?)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    ),
    "transaction_count": re.compile(
        r"(?:transaction\s+count|total\s+transactions?|num(?:ber)?\s+of\s+transactions?)\s*[:\-]?\s*([\d,]+)",
        re.IGNORECASE,
    ),
    "report_date": re.compile(
        r"(?:report\s+date|business\s+date|date)\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
        re.IGNORECASE,
    ),
}

# CSV column name mappings (normalized → field name)
CSV_COLUMN_MAP = {
    "total sales": "total_sales",
    "net sales": "total_sales",
    "gross sales": "total_sales",
    "fuel sales": "fuel_sales_amount",
    "gasoline sales": "fuel_sales_amount",
    "total gallons": "fuel_gallons",
    "gallons sold": "fuel_gallons",
    "inside sales": "inside_sales",
    "cstore sales": "inside_sales",
    "merchandise sales": "inside_sales",
    "lottery sales": "lottery_sales",
    "tobacco sales": "tobacco_sales",
    "cigarette sales": "tobacco_sales",
    "tax collected": "tax_collected",
    "sales tax": "tax_collected",
    "cash sales": "cash_sales",
    "card sales": "card_sales",
    "credit card sales": "card_sales",
    "refunds": "refunds",
    "voids": "voids",
    "transaction count": "transaction_count",
    "num transactions": "transaction_count",
    "report date": "report_date",
    "business date": "report_date",
    "date": "report_date",
}


def _parse_decimal(value: str) -> Optional[Decimal]:
    """Safely parse a string value to Decimal, stripping formatting."""
    if not value:
        return None
    cleaned = re.sub(r"[,$\s]", "", str(value))
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _parse_int(value: str) -> Optional[int]:
    """Safely parse a string value to int."""
    if not value:
        return None
    cleaned = re.sub(r"[,\s]", "", str(value))
    try:
        return int(cleaned)
    except ValueError:
        return None


def _extract_from_text(text: str) -> dict:
    """Run all regex patterns against raw text and return matched values."""
    result: dict = {}
    for field, pattern in PATTERNS.items():
        match = pattern.search(text)
        if match:
            raw = match.group(1).strip()
            if field == "transaction_count":
                result[field] = _parse_int(raw)
            elif field == "report_date":
                result[field] = raw  # caller handles date parsing
            else:
                result[field] = _parse_decimal(raw)
    return result


def _parse_pdf(file_path: str) -> dict:
    """Extract structured data from a PDF flash report using pdfplumber."""
    try:
        import pdfplumber
    except ImportError as exc:
        raise RuntimeError("pdfplumber is required for PDF parsing") from exc

    full_text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            full_text += page_text + "\n"

    extracted = _extract_from_text(full_text)

    # Calculate a simple confidence score based on how many fields were found
    total_numeric_fields = len(PATTERNS) - 1  # exclude report_date
    found_fields = sum(
        1 for k, v in extracted.items() if k != "report_date" and v is not None
    )
    extracted["parse_confidence"] = Decimal(str(round(found_fields / total_numeric_fields, 4)))

    return extracted


def _normalize_csv_column(col: str) -> str:
    """Normalize a CSV column name for lookup."""
    return re.sub(r"[^a-z0-9 ]", "", col.lower().strip())


def _parse_csv(file_path: str) -> dict:
    """Parse a CSV flash report into structured data."""
    df = pd.read_csv(file_path)

    # Try wide format (one row, columns = metrics)
    if len(df) <= 5:
        result: dict = {}
        for col in df.columns:
            normalized = _normalize_csv_column(col)
            field = CSV_COLUMN_MAP.get(normalized)
            if field and not df[col].empty:
                raw_val = str(df[col].iloc[0])
                if field == "transaction_count":
                    result[field] = _parse_int(raw_val)
                elif field == "report_date":
                    result[field] = raw_val
                else:
                    result[field] = _parse_decimal(raw_val)

        found = sum(1 for k, v in result.items() if k not in ("report_date",) and v is not None)
        result["parse_confidence"] = Decimal(str(round(found / max(len(CSV_COLUMN_MAP), 1), 4)))
        return result

    # Try long format (column: metric_name, column: value)
    possible_name_cols = [c for c in df.columns if "name" in c.lower() or "metric" in c.lower() or "description" in c.lower()]
    possible_val_cols = [c for c in df.columns if "value" in c.lower() or "amount" in c.lower() or "total" in c.lower()]

    if possible_name_cols and possible_val_cols:
        name_col = possible_name_cols[0]
        val_col = possible_val_cols[0]
        result = {}
        for _, row in df.iterrows():
            normalized = _normalize_csv_column(str(row[name_col]))
            field = CSV_COLUMN_MAP.get(normalized)
            if field:
                raw_val = str(row[val_col])
                if field == "transaction_count":
                    result[field] = _parse_int(raw_val)
                elif field == "report_date":
                    result[field] = raw_val
                else:
                    result[field] = _parse_decimal(raw_val)
        found = sum(1 for k, v in result.items() if k != "report_date" and v is not None)
        result["parse_confidence"] = Decimal(str(round(found / max(len(CSV_COLUMN_MAP), 1), 4)))
        return result

    # Fallback: concatenate all text and use regex
    all_text = df.to_string()
    extracted = _extract_from_text(all_text)
    total_fields = len(PATTERNS) - 1
    found_fields = sum(1 for k, v in extracted.items() if k != "report_date" and v is not None)
    extracted["parse_confidence"] = Decimal(str(round(found_fields / total_fields, 4)))
    return extracted


def parse_flash_report_file(file_path: str) -> dict:
    """
    Main entry point. Parse a flash report file (PDF or CSV) and return
    a structured dict matching FlashReport model fields.

    Args:
        file_path: Absolute or relative path to the report file.

    Returns:
        dict with keys: total_sales, fuel_sales_amount, fuel_gallons,
        inside_sales, lottery_sales, tobacco_sales, tax_collected,
        cash_sales, card_sales, refunds, voids, transaction_count,
        report_date, parse_confidence, notes.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Flash report file not found: {file_path}")

    suffix = path.suffix.lower()
    if suffix == ".pdf":
        raw = _parse_pdf(file_path)
    elif suffix in (".csv", ".txt", ".tsv"):
        raw = _parse_csv(file_path)
    else:
        raise ValueError(f"Unsupported file type for flash report: {suffix}")

    # Normalise report_date to a Python date if found
    raw_date = raw.pop("report_date", None)
    parsed_date: Optional[date] = None
    if raw_date:
        for fmt in ("%m/%d/%Y", "%m/%d/%y", "%m-%d-%Y", "%m-%d-%y", "%Y-%m-%d"):
            try:
                from datetime import datetime as dt
                parsed_date = dt.strptime(str(raw_date), fmt).date()
                break
            except ValueError:
                continue

    result = {
        "total_sales": raw.get("total_sales"),
        "fuel_sales_amount": raw.get("fuel_sales_amount"),
        "fuel_gallons": raw.get("fuel_gallons"),
        "inside_sales": raw.get("inside_sales"),
        "lottery_sales": raw.get("lottery_sales"),
        "tobacco_sales": raw.get("tobacco_sales"),
        "tax_collected": raw.get("tax_collected"),
        "cash_sales": raw.get("cash_sales"),
        "card_sales": raw.get("card_sales"),
        "refunds": raw.get("refunds"),
        "voids": raw.get("voids"),
        "transaction_count": raw.get("transaction_count"),
        "report_date": parsed_date,
        "parse_confidence": raw.get("parse_confidence", Decimal("0")),
        "notes": None,
    }

    return result
