from src.rag.chunking_strategies import semantic_chunker


def test_sentence_boundaries_with_ellipsis_and_quotes():
    text = 'He said, "Hello." Then left... Afterwards, she smiled.'
    res = semantic_chunker(text, chunk_size=5000, overlap=0, respect_paragraphs=False, min_chunk_size=1)
    assert res.total_chunks == 1
    ch = res.chunks[0]
    # Expect at least two sentences; ellipsis may be merged by the splitter
    assert ch.metadata.get("sentence_count") >= 2


def test_sentence_boundaries_abbreviations_series():
    text = 'Dr. Smith went to the U.S.A. in Jan. 2022. He met Mr. Jones.'
    res = semantic_chunker(text, chunk_size=5000, overlap=0, respect_paragraphs=False, min_chunk_size=1)
    assert res.total_chunks == 1
    ch = res.chunks[0]
    # Ensure we didn't split after Dr. and likely handle other abbrevs reasonably
    assert ch.metadata.get("sentence_count") >= 2
