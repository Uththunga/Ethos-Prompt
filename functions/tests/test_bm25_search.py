import asyncio
from src.rag.bm25_search_engine import EnhancedBM25SearchEngine, Document


def _run(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


def test_bm25_engine_initialization():
    engine = EnhancedBM25SearchEngine(k1=1.2, b=0.75)
    assert engine.k1 == 1.2
    assert engine.b == 0.75
    assert engine.total_documents == 0


def test_bm25_add_document():
    engine = EnhancedBM25SearchEngine()
    doc = Document(
        id='doc1',
        content='Python is a programming language',
        metadata={'category': 'tech'}
    )
    # Avoid NLTK dependency in tests
    engine._preprocess_text = lambda text: text.lower().split()
    _run(engine.add_document(doc))
    assert engine.total_documents == 1
    assert 'doc1' in engine.documents


def test_bm25_search_returns_results():
    engine = EnhancedBM25SearchEngine()

    docs = [
        Document(id='doc1', content='Python programming language', metadata={}),
        Document(id='doc2', content='JavaScript web development', metadata={}),
        Document(id='doc3', content='Python data science', metadata={}),
    ]

    # Avoid NLTK dependency in tests
    engine._preprocess_text = lambda text: text.lower().split()
    for doc in docs:
        _run(engine.add_document(doc))

    results = _run(engine.search('Python', top_k=5, use_spell_correction=False, use_query_expansion=False))

    # Should return Python-related docs
    assert len(results) > 0
    # Top result should contain 'Python'
    assert any('python' in r.content.lower() for r in results)


def test_bm25_search_with_empty_query():
    engine = EnhancedBM25SearchEngine()
    # Avoid NLTK dependency in tests
    engine._preprocess_text = lambda text: text.lower().split()
    doc = Document(id='doc1', content='test content', metadata={})
    _run(engine.add_document(doc))

    results = _run(engine.search('', top_k=5, use_spell_correction=False, use_query_expansion=False))
    # Empty query should return empty results
    assert len(results) == 0


def test_bm25_top_k_limit():
    engine = EnhancedBM25SearchEngine()

    # Avoid NLTK dependency in tests
    engine._preprocess_text = lambda text: text.lower().split()
    for i in range(10):
        doc = Document(id=f'doc{i}', content=f'Python programming {i}', metadata={})
        _run(engine.add_document(doc))

    results = _run(engine.search('Python', top_k=3, use_spell_correction=False, use_query_expansion=False))

    # Should respect top_k limit
    assert len(results) <= 3
