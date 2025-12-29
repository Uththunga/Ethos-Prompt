import pytest

from src.rag.text_preprocessing import preprocess_text, strip_html, normalize_whitespace, normalize_unicode, detect_language


def test_strip_html_removes_tags():
    html = "<div>Hello <b>world</b> &nbsp;!</div>"
    text = strip_html(html)
    assert "<" not in text and ">" not in text
    assert "world" in text


def test_normalize_whitespace_and_unicode():
    raw = "Hello\u200b   world\n\t!"
    norm = normalize_unicode(raw)
    collapsed = normalize_whitespace(norm)
    assert collapsed == "Hello world !"


def test_preprocess_text_pipeline_basic():
    raw = "<p>  Hello\u200b   world!  </p>"
    result = preprocess_text(raw)
    assert isinstance(result, dict)
    assert result["text"] == "Hello world!"
    assert result["cleaned_length"] == len(result["text"]) 


def test_detect_language_returns_optional():
    # Very short text likely returns None
    assert detect_language("Hi") in (None, "en")
    # Longer text may return a valid code or None if detector not available
    lang = detect_language("This is a longer sentence that should be in English.")
    assert lang in (None, "en")

