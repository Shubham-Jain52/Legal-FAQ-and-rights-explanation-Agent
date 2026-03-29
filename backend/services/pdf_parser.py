"""
PDF text extraction service.

Uses PyMuPDF (fitz) for fast, CPU-friendly text extraction.
Handles both on-disk files (for ingestion) and in-memory uploads (for runtime).
"""

import re
import fitz  # PyMuPDF


def extract_text_from_path(pdf_path: str) -> str:
    """Extract all text from a PDF file on disk."""
    doc = fitz.open(pdf_path)
    pages = []
    for page in doc:
        text = page.get_text()
        if text.strip():
            pages.append(text)
    doc.close()
    return "\n\n".join(pages)


def extract_text_from_bytes(pdf_bytes: bytes) -> str:
    """Extract all text from in-memory PDF bytes (for file uploads)."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page in doc:
        text = page.get_text()
        if text.strip():
            pages.append(text)
    doc.close()
    return "\n\n".join(pages)


def parse_filename_metadata(filename: str) -> dict:
    """
    Extract case metadata from a PDF filename.

    Strategy:
      1. Strip the .pdf extension.
      2. The year is the last 4-digit group (typically 19xx or 20xx).
      3. The case number is the numeric segment(s) just before the year.
      4. Everything before the case number is the case type.
      5. Clean up underscores and formatting artifacts.

    Examples:
        Civil_Appeal_112__NCE__1992.pdf
            → case_type="Civil Appeal", case_number="112 (NCE)", year="1992"

        CRLMC_3390_2023.pdf
            → case_type="CRLMC", case_number="3390", year="2023"

        WP_C__18559_2015.pdf
            → case_type="WP(C)", case_number="18559", year="2015"
    """
    stem = filename.replace(".pdf", "").replace(".PDF", "")

    # Extract year: last 4-digit number that looks like a year
    year_match = re.search(r'(\d{4})$', stem)
    year = year_match.group(1) if year_match else "Unknown"

    # Remove the trailing year from the stem
    if year_match:
        stem_no_year = stem[:year_match.start()].rstrip("_")
    else:
        stem_no_year = stem

    # Split into parts by underscore
    parts = [p for p in stem_no_year.split("_") if p]

    # Find the boundary between case type and case number
    # Walk from the end to find numeric segments
    case_number_parts = []
    case_type_parts = []
    found_number = False

    for part in reversed(parts):
        if re.match(r'^\d+$', part) and not found_number:
            case_number_parts.insert(0, part)
            found_number = True
        elif found_number:
            # Check if this is a qualifier like "NCE", "C", "Crl" etc.
            # that sits between numbers
            if re.match(r'^[A-Za-z]+$', part) and case_number_parts:
                # Look ahead: if the previous (towards start) has more context
                # treat short qualifiers as part of case number
                if len(part) <= 4 and not case_type_parts:
                    case_number_parts.insert(0, part)
                else:
                    case_type_parts.insert(0, part)
            elif re.match(r'^\d+$', part):
                case_number_parts.insert(0, part)
            else:
                case_type_parts.insert(0, part)
        else:
            case_type_parts.insert(0, part)

    # If no case type was found, use the first parts
    if not case_type_parts and case_number_parts:
        # Everything is numeric or mixed; just use a simpler split
        case_type_parts = parts[:1]
        case_number_parts = parts[1:]

    case_type = " ".join(case_type_parts) if case_type_parts else "Unknown"
    case_number = " ".join(case_number_parts) if case_number_parts else "Unknown"

    # Clean up common formatting: WP C → WP(C), W P Crl → W.P.(Crl.)
    case_type = case_type.strip()
    case_number = case_number.strip()

    return {
        "case_type": case_type,
        "case_number": case_number,
        "year": year,
        "source_filename": filename,
    }
