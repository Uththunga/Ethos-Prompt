from src.rag.chunking_strategies import validate_chunk_quality


def test_quality_flags_tiny_chunk():
    q = validate_chunk_quality("tiny")
    assert q["too_short"] is True
    assert q["is_readable"] is False


def test_quality_flags_readable_chunk():
    text = "This is a readable sentence. Another one follows!"
    q = validate_chunk_quality(text, min_chars=10, min_tokens=3)
    assert q["too_short"] is False
    assert q["ends_with_punctuation"] is True
    assert q["is_readable"] is True

