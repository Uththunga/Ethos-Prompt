from src.rag.vector_store import VectorStore, VectorSearchResult


class FakeFirestoreDoc:
    def __init__(self, data):
        self._data = data
        self.id = data.get('chunk_id', 'test_id')

    def to_dict(self):
        return self._data

    def get(self):
        return self


class FakeFirestoreCollection:
    def __init__(self, docs=None):
        self._docs = docs or []

    def document(self, doc_id):
        return FakeFirestoreDoc({'chunk_id': doc_id})

    def stream(self):
        return [FakeFirestoreDoc(d) for d in self._docs]


class FakeFirestoreClient:
    def __init__(self, collections=None):
        self._collections = collections or {}

    def collection(self, name):
        return self._collections.get(name, FakeFirestoreCollection())


def test_vector_store_init_with_fake_client():
    fake_db = FakeFirestoreClient()
    vs = VectorStore(firestore_client=fake_db, project_id='test-project', region='us-central1')
    assert vs.db is not None
    assert vs.project_id == 'test-project'
    assert vs.region == 'us-central1'
    assert vs.default_dimensions == 768


def test_vector_search_result_dataclass():
    result = VectorSearchResult(
        chunk_id='chunk_123',
        content='test content',
        score=0.95,
        metadata={'doc_id': 'doc_1'}
    )
    assert result.chunk_id == 'chunk_123'
    assert result.score == 0.95
    assert result.metadata['doc_id'] == 'doc_1'

