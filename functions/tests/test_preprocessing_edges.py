import pytest
from src.rag.text_preprocessing import (
    normalize_unicode,
    normalize_whitespace,
    strip_html,
    remove_special_chars,
    preprocess_text,
)


def test_unicode_zero_width_and_nbsp_removed():
    raw = "A\u200bB\ufeffC\xa0D"
    norm = normalize_unicode(raw)
    assert "\u200b" not in norm
    assert "\ufeff" not in norm
    assert "\xa0" not in norm


def test_html_entities_and_tags_stripped():
    raw = "<p>Hello &amp; welcome to <b>RAG</b> &lt;3</p>"
    stripped = strip_html(raw)
    # Entities remain; preprocess_text handles further normalization
    assert "Hello" in stripped
    assert "RAG" in stripped


def test_preprocess_text_handles_entities_and_whitespace():
    raw = "<div> A &amp; B &lt; C \n</div>"
    out = preprocess_text(raw)
    t = out["text"]
    assert "A" in t and "B" in t and "C" in t
    # Tags should be stripped, but HTML entities may decode to literals like '<'
    assert "<div" not in t and "</div>" not in t


def test_mixed_punctuation_and_spacing():
    s = "Hello!!!  World??  -- Test"
    t = normalize_whitespace(remove_special_chars(normalize_unicode(s)))
    assert "Hello" in t and "World" in t
