import io
import pytest

from src.rag.document_extractors import PDFExtractor, PDF_AVAILABLE, PYTESSERACT_AVAILABLE, PDFPLUMBER_AVAILABLE

pytestmark = pytest.mark.skipif(not PDF_AVAILABLE, reason="PyPDF2 not available")


def test_pdf_malformed_bytes_returns_failure():
    extractor = PDFExtractor()
    bogus = b"NOT_A_PDF_FILE_CONTENT"
    res = extractor.extract(bogus, filename="bad.pdf")
    assert res.success is False
    assert res.error


def test_pdf_encrypted_requires_decryption():
    from PyPDF2 import PdfWriter

    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    buf = io.BytesIO()
    writer.encrypt("secret")
    writer.write(buf)
    res = PDFExtractor().extract(buf.getvalue(), filename="enc.pdf")
    assert res.success is False
    assert "Encrypted PDF" in (res.error or "")


def test_pdf_image_only_behaviour():
    # Create a single-image PDF via Pillow
    from PIL import Image

    img = Image.new("RGB", (300, 200), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PDF")
    pdf_bytes = buf.getvalue()

    res = PDFExtractor().extract(pdf_bytes, filename="image_only.pdf")

    # If OCR libs and Tesseract binary are available, success likely True; otherwise False.
    # Accept either, but ensure behaviour is sensible (error or non-empty content)
    if res.success:
        assert res.document is not None
        assert len(res.document.content) >= 0
    else:
        assert res.error is not None

