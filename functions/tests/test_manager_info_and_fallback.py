from types import SimpleNamespace
from src.rag.chunking_strategies import ChunkingManager


def test_get_strategy_info_specific_and_all():
    mgr = ChunkingManager()
    info = mgr.get_strategy_info('semantic')
    assert info['name'] == 'semantic'
    assert 'class' in info and 'default_chunk_size' in info and 'default_overlap' in info

    all_info = mgr.get_strategy_info()
    for key in ['fixed_size','semantic','hierarchical','sliding_window']:
        assert key in all_info


def test_chunk_document_fallback_on_exception(monkeypatch):
    mgr = ChunkingManager()

    class Boom:
        def __init__(self):
            self.chunk_size = 1000
            self.overlap = 200
        def chunk(self, *args, **kwargs):
            raise RuntimeError('boom')

    # Force semantic strategy and replace with failing chunker
    mgr.strategies['semantic'] = Boom()

    text = 'Some content that will cause the mock to raise.'
    result = mgr.chunk_document(text, strategy='semantic', metadata={'requested_strategy': 'semantic'})

    assert result.strategy_used.startswith('fixed_size_fallback_from_semantic')
    assert 'fallback_reason' in result.metadata

