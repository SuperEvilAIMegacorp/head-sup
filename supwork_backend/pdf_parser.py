from __future__ import annotations

from io import BytesIO
from typing import Any
from uuid import uuid4


class PdfParseError(ValueError):
    pass


def parse_cv_pdf(filename: str, data: bytes) -> dict[str, Any]:
    if not data:
        raise PdfParseError("Uploaded CV is empty")
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise PdfParseError("pypdf is required for CV PDF parsing") from exc

    try:
        reader = PdfReader(BytesIO(data))
        pages = []
        for index, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            pages.append(
                {
                    "page": index,
                    "text": text,
                    "charCount": len(text),
                }
            )
    except Exception as exc:  # pypdf raises several parser-specific exceptions.
        raise PdfParseError("Could not parse uploaded PDF") from exc

    full_text = "\n\n".join(f"Page {page['page']}\n{page['text']}" for page in pages if page["text"]).strip()
    if not full_text:
        raise PdfParseError("No extractable text found in uploaded PDF")

    return {
        "id": f"art_cv_{uuid4().hex[:10]}",
        "filename": filename,
        "contentType": "application/pdf",
        "pageCount": len(pages),
        "pages": pages,
        "text": full_text,
        "parser": "pypdf",
    }

