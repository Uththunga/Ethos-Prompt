from src.rag.chunking_strategies import Chunk, ChunkingResult, deduplicate_chunks


def _mk(content: str, idx: int) -> Chunk:
    return Chunk(
        content=content,
        metadata={"chunk_index": idx},
        chunk_id=f"doc_chunk_{idx:04d}",
        start_index=idx * 10,
        end_index=idx * 10 + len(content),
        token_count=len(content)//4,
    )


def test_deduplicate_exact_duplicates_removed():
    chunks = [_mk("Hello world.", 0), _mk("Hello world.", 1), _mk("Different text.", 2)]
    out = deduplicate_chunks(chunks)
    assert len(out) == 2
    assert out[0].content == "Hello world."
    assert out[1].content == "Different text."


def test_deduplicate_near_duplicates_by_jaccard():
    base = "This is a simple sentence for testing purposes."
    near = "This is a simple sentence for test purposes!"
    far = "Completely unrelated content."
    chunks = [_mk(base, 0), _mk(near, 1), _mk(far, 2)]
    out = deduplicate_chunks(chunks, similarity_threshold=0.75)
    # base and near are similar; one should be removed
    contents = [c.content for c in out]
    assert len(out) == 2
    assert (base in contents) ^ (near in contents)
