import pytest

from src.rag.document_extractors import DocumentProcessor, PDFExtractor


def test_pdf_helpers_handle_bad_bytes_gracefully():
    px = PDFExtractor()
    # Bad bytes should return empty string via exception path
    assert px._ocr_page_with_plumber(b"not a pdf", 0) == ""
    assert px._extract_tables_with_plumber(b"not a pdf", 0) == ""


def test_document_processor_type_detection_by_mime():
    dp = DocumentProcessor()
    assert dp.get_file_type(None, mime_type="application/pdf") == "pdf"
    assert dp.get_file_type(None, mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document") == "docx"
    assert dp.get_file_type(None, mime_type="text/plain") == "txt"


def test_document_processor_validate_file_flags():
    dp = DocumentProcessor()
    empty = dp.validate_file(b"", filename="note.txt")
    assert empty["valid"] is False
    assert "File is empty" in empty["errors"][0]

    big = dp.validate_file(b"0" * (50 * 1024 * 1024 + 1), filename="note.txt")
    assert big["valid"] is False
    assert any("File too large" in e for e in big["errors"])  

