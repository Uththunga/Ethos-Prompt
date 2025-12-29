from src.rag.chunking_strategies import HierarchicalChunking


def test_hierarchical_detects_markdown_headers_and_levels():
    text = """# Title\n\n## Section One\n\nContent paragraph.\n\n### Subsection\n\nMore content.\n"""
    hc = HierarchicalChunking(chunk_size=1000, overlap=100)
    res = hc.chunk(text, {"document_id": "docH"})
    # Expect at least Title, Section, Subsection, Content paragraphs counted as sections
    assert res.total_chunks >= 4
    levels = [c.metadata.get("section_level") for c in res.chunks]
    assert 1 in levels and 2 in levels and 3 in levels


def test_hierarchical_sub_chunking_for_large_section():
    # Create a large section by repeating a paragraph to exceed small chunk_size
    big_para = ("Sentence one. Sentence two. " * 60).strip()
    text = f"## Big Section\n\n{big_para}"
    hc = HierarchicalChunking(chunk_size=150, overlap=20)
    res = hc.chunk(text, {"document_id": "docH2"})
    # Should be sub-chunked into multiple hierarchical_sub chunks
    assert res.total_chunks > 1
    assert all(c.metadata.get("chunk_type") in {"hierarchical", "hierarchical_sub"} for c in res.chunks)
    assert any(c.metadata.get("chunk_type") == "hierarchical_sub" for c in res.chunks)
    subs = [c for c in res.chunks if c.metadata.get("chunk_type") == "hierarchical_sub"]
    for c in subs:
        # Sub-chunked section here is the big paragraph (not a header), so level 0 and no title
        assert c.metadata.get("parent_section_level") == 0
        assert c.metadata.get("parent_section_title") is None


def test_hierarchical_malformed_structure_handles_empty_paragraphs():
    text = """# HEADER\n\n\n\nShort\n\n\nPARA\n\n\n"""
    hc = HierarchicalChunking()
    res = hc.chunk(text, {"document_id": "docH3"})
    # Should not crash; should create sections for non-empty paragraphs
    assert res.total_chunks >= 2
