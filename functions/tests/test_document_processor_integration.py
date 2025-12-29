import io
import pytest

from src.rag.document_extractors import PDF_AVAILABLE
from src.rag.document_extractors import DocumentProcessor


def test_processor_text_and_markdown_success():
    dp = DocumentProcessor()

    txt = b"Hello integration test with text file.\nMore lines."
    r1 = dp.process_document(txt, filename="note.txt", mime_type="text/plain")
    assert r1.success and r1.document is not None
    assert r1.document.file_type in ("txt", "text")

    md = b"# Header\n\nSome content in **markdown**."
    r2 = dp.process_document(md, filename="doc.md", mime_type="text/markdown")
    assert r2.success and r2.document is not None
    assert r2.document.file_type == "markdown"
    assert r2.document.metadata.get("header_count", 0) >= 1


@pytest.mark.skipif(not PDF_AVAILABLE, reason="PyPDF2 not available")
def test_processor_pdf_blank_expected_failure():
    from PyPDF2 import PdfWriter

    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    dp = DocumentProcessor()
    res = dp.process_document(buf.getvalue(), filename="blank.pdf", mime_type="application/pdf")
    assert res.success is False
    assert "No text content" in (res.error or "")


@pytest.mark.skipif(not PDF_AVAILABLE, reason="PyPDF2 not available")
def test_processor_pdf_encrypted_expected_failure():
    from PyPDF2 import PdfWriter

    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.encrypt("secret")
    writer.write(buf)
    dp = DocumentProcessor()
    res = dp.process_document(buf.getvalue(), filename="enc.pdf", mime_type="application/pdf")
    assert res.success is False
    assert "Encrypted PDF" in (res.error or "")

