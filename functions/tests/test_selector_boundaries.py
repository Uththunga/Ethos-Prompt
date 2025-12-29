from src.rag.chunking_strategies import ChunkingManager


def test_has_structure_markdown_headers_threshold():
    mgr = ChunkingManager()
    text = "# H1\n\n## H2\n\n### H3\n\n#### H4\n\nBody\n"
    assert mgr._has_structure(text) is True


def test_has_structure_numbered_sections_threshold():
    mgr = ChunkingManager()
    text = "1. One\n2. Two\n3. Three\n4. Four\nBody\n"
    assert mgr._has_structure(text) is True


def test_has_structure_negative_case():
    mgr = ChunkingManager()
    text = "Just a simple paragraph with no obvious structure.\nAnd another one.\n"
    assert mgr._has_structure(text) is False
