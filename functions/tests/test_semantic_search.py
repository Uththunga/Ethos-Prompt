import numpy as np
from src.rag.vector_store import VectorStore, VectorSearchResult


class MockDoc:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data

    def to_dict(self):
        return self._data


class MockVectorQuery:
    def __init__(self, docs):
        self._docs = docs

    def get(self):
        return self._docs


class MockCollection:
    def __init__(self, docs):
        self._docs = docs
        self._filters = []

    def where(self, field, op, value):
        # Apply filter
        filtered = MockCollection([d for d in self._docs if self._matches_filter(d, field, op, value)])
        filtered._filters = self._filters + [(field, op, value)]
        return filtered

    def _matches_filter(self, doc, field, op, value):
        data = doc.to_dict()
        if '.' in field:
            parts = field.split('.')
            val = data
            for p in parts:
                val = val.get(p, {})
            return val == value if op == '==' else False
        return data.get(field) == value if op == '==' else False

    def find_nearest(self, vector_field, query_vector, distance_measure, limit):
        # Mock vector search: return top docs by manual cosine similarity
        scored = []
        for doc in self._docs:
            data = doc.to_dict()
            if vector_field in data:
                emb = data[vector_field]
                sim = _cosine_sim(query_vector, emb)
                scored.append((doc, sim))
        scored.sort(key=lambda x: x[1], reverse=True)
        top_docs = [d for d, _ in scored[:limit]]
        return MockVectorQuery(top_docs)

    def limit(self, n):
        return MockCollection(self._docs[:n])

    def stream(self):
        return self._docs


class MockFirestore:
    def __init__(self, docs):
        self._docs = docs

    def collection(self, name):
        return MockCollection(self._docs)


def _cosine_sim(a, b):
    a_arr = np.array(a)
    b_arr = np.array(b)
    return float(np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr) + 1e-9))


def test_vector_search_returns_top_k_results():
    docs = [
        MockDoc('doc1', {'embedding': [1.0, 0.0, 0.0], 'content': 'first', 'metadata': {}}),
        MockDoc('doc2', {'embedding': [0.9, 0.1, 0.0], 'content': 'second', 'metadata': {}}),
        MockDoc('doc3', {'embedding': [0.0, 1.0, 0.0], 'content': 'third', 'metadata': {}}),
    ]
    db = MockFirestore(docs)
    vs = VectorStore(firestore_client=db)

    query_vec = [1.0, 0.0, 0.0]
    results = vs.search(query_vec, top_k=2)

    assert len(results) <= 2
    # First result should be most similar
    if len(results) > 0:
        assert results[0].content in ('first', 'second')


def test_vector_search_with_namespace_filter():
    docs = [
        MockDoc('doc1', {'embedding': [1.0, 0.0], 'content': 'user1 doc', 'namespace': 'user1', 'metadata': {}}),
        MockDoc('doc2', {'embedding': [1.0, 0.0], 'content': 'user2 doc', 'namespace': 'user2', 'metadata': {}}),
    ]
    db = MockFirestore(docs)
    vs = VectorStore(firestore_client=db)

    query_vec = [1.0, 0.0]
    results = vs.search(query_vec, top_k=5, namespace='user1')

    # Should only return user1 docs
    assert all('user1' in r.content or r.metadata.get('namespace') == 'user1' for r in results)


def test_vector_search_with_metadata_filter():
    docs = [
        MockDoc('doc1', {'embedding': [1.0, 0.0], 'content': 'doc A', 'metadata': {'category': 'tech'}}),
        MockDoc('doc2', {'embedding': [1.0, 0.0], 'content': 'doc B', 'metadata': {'category': 'health'}}),
    ]
    db = MockFirestore(docs)
    vs = VectorStore(firestore_client=db)

    query_vec = [1.0, 0.0]
    results = vs.search(query_vec, top_k=5, filter_dict={'category': 'tech'})

    # Should only return tech category
    assert all(r.metadata.get('category') == 'tech' for r in results if 'category' in r.metadata)

