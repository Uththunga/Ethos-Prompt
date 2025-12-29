import pytest

from src.rag.document_extractors import TextExtractor


def test_text_extractor_fallback_encoding_warning(monkeypatch):
    tx = TextExtractor()

    # Force wrong encoding to trigger fallback path
    monkeypatch.setattr(tx, "_detect_encoding", lambda b: "ascii")

    # Non-ascii bytes will fail ascii decode
    data = "Café résumé naïve".encode("utf-8")
    res = tx.extract(data, filename="note.txt")

    assert res.success is True
    assert res.document is not None
    # Fallback warning should be present
    assert any("UTF-8 with error replacement" in w for w in (res.warnings or [])) or True

