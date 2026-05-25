"""
Invoice parser service.

Extracts structured invoice data from PDF files using pdfplumber for text
extraction and Claude claude-haiku-4-5-20251001 for intelligent field parsing.
"""
import json
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Optional

import anthropic

from app.core.config import settings


# ---------------------------------------------------------------------------
# Claude extraction prompt
# ---------------------------------------------------------------------------

EXTRACTION_PROMPT = """You are an expert at extracting structured data from vendor invoices for convenience stores and gas stations.

Given the following raw invoice text, extract the invoice information and return a valid JSON object.

The JSON must match this exact schema:
{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "vendor_name": "string or null",
  "subtotal": number or null,
  "tax_amount": number or null,
  "total_amount": number or null,
  "line_items": [
    {
      "product_name_raw": "string",
      "upc_raw": "string or null",
      "quantity_ordered": number or null,
      "quantity_delivered": number or null,
      "unit_cost": number or null,
      "line_total": number or null
    }
  ],
  "confidence_score": 0.0 to 1.0
}

Rules:
- confidence_score should reflect how complete and clear the extracted data is (0.0 = very uncertain, 1.0 = fully confident)
- All monetary values should be plain numbers without currency symbols
- Return ONLY valid JSON, no explanation or markdown
- If a field cannot be determined, use null
- Extract ALL line items visible in the invoice

Invoice text:
{invoice_text}"""


def _extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF using pdfplumber."""
    try:
        import pdfplumber
    except ImportError as exc:
        raise RuntimeError("pdfplumber is required for PDF invoice parsing") from exc

    full_text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            full_text += text + "\n"
            # Also try table extraction for structured invoices
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if row:
                        full_text += "\t".join(str(cell or "") for cell in row) + "\n"

    return full_text.strip()


def _extract_text_from_csv(file_path: str) -> str:
    """Convert a CSV invoice to text for LLM processing."""
    import pandas as pd

    df = pd.read_csv(file_path)
    return df.to_string(index=False)


def _call_claude_extraction(invoice_text: str) -> dict:
    """
    Use Claude claude-haiku-4-5-20251001 to extract structured invoice data.
    Returns parsed JSON dict from Claude's response.
    """
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    # Truncate very long invoices to avoid token limits
    max_chars = 12000
    if len(invoice_text) > max_chars:
        invoice_text = invoice_text[:max_chars] + "\n[... truncated ...]"

    prompt = EXTRACTION_PROMPT.format(invoice_text=invoice_text)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_response = message.content[0].text.strip()

    # Strip markdown code fences if present
    if raw_response.startswith("```"):
        raw_response = re.sub(r"^```(?:json)?\n?", "", raw_response)
        raw_response = re.sub(r"\n?```$", "", raw_response)

    return json.loads(raw_response)


def _safe_decimal(value) -> Optional[Decimal]:
    """Convert a value to Decimal safely."""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError):
        return None


def _build_line_items(raw_items: list) -> list[dict]:
    """Convert raw LLM line item dicts to typed dicts."""
    result = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        line: dict = {
            "product_name_raw": item.get("product_name_raw"),
            "upc_raw": item.get("upc_raw"),
            "quantity_ordered": _safe_decimal(item.get("quantity_ordered")),
            "quantity_delivered": _safe_decimal(item.get("quantity_delivered")),
            "unit_cost": _safe_decimal(item.get("unit_cost")),
            "line_total": _safe_decimal(item.get("line_total")),
            "matched_product_id": None,
            "match_confidence": None,
            "has_discrepancy": False,
            "discrepancy_notes": None,
        }
        result.append(line)
    return result


def parse_invoice_file(file_path: str, vendor_hint: Optional[str] = None) -> dict:
    """
    Parse an invoice file (PDF or CSV) using pdfplumber + Claude.

    Args:
        file_path: Path to the invoice file.
        vendor_hint: Optional vendor name to help guide extraction.

    Returns:
        dict containing:
            - invoice_number, invoice_date, due_date, vendor_name
            - subtotal, tax_amount, total_amount
            - ocr_confidence_score (0.0–1.0)
            - line_items: list of dicts matching InvoiceLineItem fields
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Invoice file not found: {file_path}")

    suffix = path.suffix.lower()
    if suffix == ".pdf":
        text = _extract_text_from_pdf(file_path)
    elif suffix in (".csv", ".txt", ".tsv"):
        text = _extract_text_from_csv(file_path)
    else:
        raise ValueError(f"Unsupported invoice file type: {suffix}")

    if vendor_hint:
        text = f"Vendor hint: {vendor_hint}\n\n{text}"

    extracted = _call_claude_extraction(text)

    # Parse dates
    def _parse_date(val):
        if not val:
            return None
        from datetime import datetime
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%m-%d-%Y"):
            try:
                return datetime.strptime(str(val), fmt).date()
            except ValueError:
                continue
        return None

    return {
        "invoice_number": extracted.get("invoice_number"),
        "invoice_date": _parse_date(extracted.get("invoice_date")),
        "due_date": _parse_date(extracted.get("due_date")),
        "vendor_name": extracted.get("vendor_name"),
        "subtotal": _safe_decimal(extracted.get("subtotal")),
        "tax_amount": _safe_decimal(extracted.get("tax_amount")),
        "total_amount": _safe_decimal(extracted.get("total_amount")),
        "ocr_confidence_score": _safe_decimal(extracted.get("confidence_score")) or Decimal("0"),
        "line_items": _build_line_items(extracted.get("line_items", [])),
    }
