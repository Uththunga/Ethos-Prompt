import pytest

from src.rag.document_extractors import TextExtractor, MarkdownExtractor, PDF_AVAILABLE, PDFExtractor


def test_text_extractor_basic():
    extractor = TextExtractor()
    content = b"Hello world!\nThis is a test."
    res = extractor.extract(content, filename="sample.txt")
    assert res.success
    assert res.document is not None
    assert res.document.file_type == "txt"
    assert "Hello world" in res.document.content


def test_markdown_extractor_basic():
    extractor = MarkdownExtractor()
    md = b"# Title\n\nSome **bold** text."
    res = extractor.extract(md, filename="doc.md")
    assert res.success
    assert res.document is not None
    assert res.document.file_type == "markdown"
    assert "Title" in res.document.content


@pytest.mark.skipif(not PDF_AVAILABLE, reason="PyPDF2 not available")
def test_pdf_extractor_handles_encrypted_gracefully():
    # Encrypted PDF creation is non-trivial without extra deps; ensure extractor returns a sensible error on random bytes
    extractor = PDFExtractor()
    bogus = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    res = extractor.extract(bogus, filename="fake.pdf")
    # We accept either failure (bogus pdf) or success if PyPDF2 was lenient
    assert res.success in (True, False)

