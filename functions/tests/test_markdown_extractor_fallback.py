import pytest

from src.rag.document_extractors import MarkdownExtractor


def test_markdown_extractor_parsing_failure_falls_back(monkeypatch):
    md = MarkdownExtractor()

    # Monkeypatch markdown.markdown to raise, exercising fallback path
    import markdown as mdlib

    def boom(_):
        raise RuntimeError("parse error")

    monkeypatch.setattr(mdlib, "markdown", boom)

    content = b"# Title\n\nSome **bold** text."
    res = md.extract(content, filename="a.md")
    assert res.success is True
    assert res.document is not None
    # Should have a warning mentioning parsing failed
    assert any("Markdown parsing failed" in w for w in (res.warnings or []))

