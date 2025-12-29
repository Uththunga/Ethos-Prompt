import pytest

from src.rag.text_preprocessing import TextPreprocessor


def test_textpreprocessor_basic_clean_and_tokenize(monkeypatch):
    # Patch NLTK tokenizers to avoid heavy downloads in CI
    import src.rag.text_preprocessing as tpmod
    monkeypatch.setattr(tpmod, "word_tokenize", lambda text: text.split())
    monkeypatch.setattr(tpmod, "sent_tokenize", lambda text: text.split(". "))

    tp = TextPreprocessor()
    cleaned = tp.basic_clean("Hello,   world!! This... is (a) test??")
    assert "  " not in cleaned
    tokens = tp.tokenize(cleaned, method="word")
    assert isinstance(tokens, list) and len(tokens) > 0


def test_textpreprocessor_preprocess_for_search_strategies(monkeypatch):
    import src.rag.text_preprocessing as tpmod
    monkeypatch.setattr(tpmod, "word_tokenize", lambda text: text.split())

    tp = TextPreprocessor()
    text = "Using APIs in Python for HTTP JSON parsing and data processing."

    minimal = tp.preprocess_for_search(text, strategy="minimal")
    balanced = tp.preprocess_for_search(text, strategy="balanced")
    aggressive = tp.preprocess_for_search(text, strategy="aggressive")

    assert isinstance(minimal, list) and isinstance(balanced, list) and isinstance(aggressive, list)
    assert len(minimal) >= 1 and len(balanced) >= 1 and len(aggressive) >= 1


def test_textpreprocessor_preprocess_query_and_keywords(monkeypatch):
    import src.rag.text_preprocessing as tpmod
    monkeypatch.setattr(tpmod, "word_tokenize", lambda text: text.split())

    tp = TextPreprocessor()
    q_tokens = tp.preprocess_query("Best GPU for AI workloads and NLP tasks")
    assert isinstance(q_tokens, list) and len(q_tokens) >= 1

    keywords = tp.extract_keywords("AI GPU GPU CPU NLP AI AI model model model", top_k=5)
    assert isinstance(keywords, list) and len(keywords) >= 1
    assert all("term" in k and "score" in k for k in keywords)


def test_textpreprocessor_invalid_strategy_raises(monkeypatch):
    import src.rag.text_preprocessing as tpmod
    monkeypatch.setattr(tpmod, "word_tokenize", lambda text: text.split())

    tp = TextPreprocessor()
    with pytest.raises(ValueError):
        tp.preprocess_for_search("text", strategy="unknown")
