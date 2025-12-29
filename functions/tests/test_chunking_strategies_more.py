from src.rag.chunking_strategies import FixedSizeChunking, SlidingWindowChunking


def test_fixed_size_overlap_behavior():
    text = "abcdefghijklmnopqrstuvwxyz" * 5
    fs = FixedSizeChunking(chunk_size=20, overlap=5)
    res = fs.chunk(text, {"document_id": "docA"})
    assert res.total_chunks >= 2
    for a, b in zip(res.chunks, res.chunks[1:]):
        # Overlap in characters between a and b should equal char_overlap = overlap*tokens_to_chars
        overlap = a.end_index - b.start_index
        assert overlap == 20


def test_sliding_window_step_size():
    text = "abcdefghijklmnopqrstuvwxyz" * 5
    sw = SlidingWindowChunking(chunk_size=20, step_size=10)
    res = sw.chunk(text, {"document_id": "docB"})
    assert res.total_chunks >= 3
    starts = [c.start_index for c in res.chunks]
    steps = [j - i for i, j in zip(starts, starts[1:])]
    assert all(s == 40 for s in steps)
