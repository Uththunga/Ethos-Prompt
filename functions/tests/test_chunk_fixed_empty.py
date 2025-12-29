from src.rag.chunking_strategies import FixedSizeChunking


def test_fixed_size_empty_text_returns_zero_chunks():
    chunker = FixedSizeChunking(chunk_size=100, overlap=20)
    res = chunker.chunk("")
    assert res.total_chunks == 0
    assert res.total_tokens == 0

