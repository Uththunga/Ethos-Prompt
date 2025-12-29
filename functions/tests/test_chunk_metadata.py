from src.rag.chunking_strategies import semantic_chunker


def test_chunk_metadata_preserves_source_fields():
    text = "Para one. Para two."
    meta = {"document_id": "doc123", "page_number": 3, "section_title": "Intro"}
    res = semantic_chunker(text, chunk_size=10, overlap=2, min_chunk_size=1, respect_paragraphs=False,
                           metadata=meta)
    assert res.total_chunks >= 1
    for ch in res.chunks:
        assert ch.metadata.get("document_id") == "doc123"
        assert ch.metadata.get("page_number") == 3
        assert ch.metadata.get("section_title") == "Intro"

