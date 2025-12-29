from src.rag.chunking_strategies import ChunkingManager


def test_auto_select_strategy_heuristics():
    mgr = ChunkingManager()
    txt = "# Title\n\n## Section\n\nContent paragraph" * 10
    assert mgr.auto_select_strategy(txt, {}) in {"hierarchical", "fixed_size", "semantic"}


def test_suggest_defaults_varies_by_length_and_type():
    mgr = ChunkingManager()
    short = "word " * 200  # ~200 tokens
    mid = "word " * 1500   # ~1500 tokens
    long = "word " * 8000  # ~8000 tokens

    sd_short = mgr.suggest_defaults(short)
    sd_mid = mgr.suggest_defaults(mid)
    sd_long = mgr.suggest_defaults(long)

    assert sd_short["chunk_size"] < sd_mid["chunk_size"] <= sd_long["chunk_size"]

    code_like = mgr.suggest_defaults(mid, {"file_type": "code"})
    assert code_like["overlap"] >= 200


def test_auto_select_detects_code_like_text():
    mgr = ChunkingManager()
    code = """
```python
class Foo:
    def bar(self):
        return 42
```
    """
    assert mgr.auto_select_strategy(code) == "sliding_window"
