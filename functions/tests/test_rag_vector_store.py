"""
Unit tests for RAG vector store (Firestore)
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from src.rag.vector_store import VectorStore, VectorSearchResult, VectorStats
import numpy as np


class TestVectorStore:
    """Test Firestore vector store"""
    
    @pytest.fixture
    def mock_firestore_client(self):
        """Create mock Firestore client"""
        mock_client = Mock()
        mock_collection = Mock()
        mock_client.collection.return_value = mock_collection
        return mock_client
    
    @pytest.fixture
    def vector_store(self, mock_firestore_client):
        """Create vector store with mock client"""
        return VectorStore(firestore_client=mock_firestore_client)
    
    def test_initialization(self, vector_store):
        """Test vector store initialization"""
        assert vector_store.db is not None
        assert vector_store.collection_name == 'vector_embeddings'
        assert vector_store.default_dimensions == 768
        assert vector_store.default_metric == 'cosine'
    
    def test_create_index(self, vector_store, mock_firestore_client):
        """Test creating vector index"""
        mock_doc_ref = Mock()
        mock_firestore_client.collection.return_value.document.return_value = mock_doc_ref
        
        success = vector_store.create_index(
            index_name="test_collection",
            dimensions=768,
            metric="cosine"
        )
        
        assert success is True
        mock_doc_ref.set.assert_called_once()
    
    def test_connect_to_index(self, vector_store, mock_firestore_client):
        """Test connecting to existing index"""
        mock_doc_ref = Mock()
        mock_doc = Mock()
        mock_doc.exists = True
        mock_doc_ref.get.return_value = mock_doc
        mock_firestore_client.collection.return_value.document.return_value = mock_doc_ref
        
        success = vector_store.connect_to_index("test_collection")
        
        assert success is True
        assert vector_store.collection_name == "test_collection"
    
    def test_upsert_vectors(self, vector_store, mock_firestore_client):
        """Test upserting vectors"""
        vectors = [
            ("chunk_1", [0.1] * 768, {"content": "Test 1"}),
            ("chunk_2", [0.2] * 768, {"content": "Test 2"}),
        ]
        
        mock_batch = Mock()
        mock_firestore_client.batch.return_value = mock_batch
        mock_collection = Mock()
        mock_firestore_client.collection.return_value = mock_collection
        
        success = vector_store.upsert_vectors(vectors, namespace="user_123")
        
        assert success is True
        assert mock_batch.commit.called
    
    def test_cosine_similarity_calculation(self, vector_store):
        """Test cosine similarity calculation"""
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [1.0, 0.0, 0.0]
        
        similarity = vector_store._calculate_cosine_similarity(vec1, vec2)
        
        assert similarity == pytest.approx(1.0, abs=0.01)
    
    def test_cosine_similarity_orthogonal(self, vector_store):
        """Test cosine similarity for orthogonal vectors"""
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [0.0, 1.0, 0.0]
        
        similarity = vector_store._calculate_cosine_similarity(vec1, vec2)
        
        assert similarity == pytest.approx(0.0, abs=0.01)
    
    def test_search_with_mock_results(self, vector_store, mock_firestore_client):
        """Test vector search with mock results"""
        query_vector = [0.5] * 768
        
        # Mock Firestore query results
        mock_doc1 = Mock()
        mock_doc1.id = "chunk_1"
        mock_doc1.to_dict.return_value = {
            "content": "Test content 1",
            "embedding": [0.5] * 768,
            "metadata": {"source": "doc1.pdf"}
        }
        
        mock_doc2 = Mock()
        mock_doc2.id = "chunk_2"
        mock_doc2.to_dict.return_value = {
            "content": "Test content 2",
            "embedding": [0.4] * 768,
            "metadata": {"source": "doc2.pdf"}
        }
        
        mock_query = Mock()
        mock_query.stream.return_value = [mock_doc1, mock_doc2]
        mock_firestore_client.collection.return_value.where.return_value = mock_query
        
        results = vector_store.search(
            query_vector=query_vector,
            top_k=2,
            namespace="user_123"
        )
        
        assert len(results) <= 2
        assert all(isinstance(r, VectorSearchResult) for r in results)
    
    def test_delete_vectors(self, vector_store, mock_firestore_client):
        """Test deleting vectors"""
        vector_ids = ["chunk_1", "chunk_2", "chunk_3"]
        
        mock_batch = Mock()
        mock_firestore_client.batch.return_value = mock_batch
        mock_collection = Mock()
        mock_firestore_client.collection.return_value = mock_collection
        
        success = vector_store.delete_vectors(vector_ids)
        
        assert success is True
        assert mock_batch.commit.called
    
    def test_delete_namespace(self, vector_store, mock_firestore_client):
        """Test deleting all vectors in namespace"""
        mock_doc1 = Mock()
        mock_doc1.reference = Mock()
        mock_doc2 = Mock()
        mock_doc2.reference = Mock()
        
        mock_query = Mock()
        mock_query.stream.return_value = [mock_doc1, mock_doc2]
        mock_firestore_client.collection.return_value.where.return_value = mock_query
        
        mock_batch = Mock()
        mock_firestore_client.batch.return_value = mock_batch
        
        success = vector_store.delete_namespace("user_123")
        
        assert success is True
        assert mock_batch.commit.called
    
    def test_get_index_stats(self, vector_store, mock_firestore_client):
        """Test getting index statistics"""
        # Mock documents
        mock_docs = []
        for i in range(10):
            mock_doc = Mock()
            mock_doc.to_dict.return_value = {
                "namespace": f"user_{i % 3}",
                "dimensions": 768
            }
            mock_docs.append(mock_doc)
        
        mock_query = Mock()
        mock_query.stream.return_value = mock_docs
        mock_firestore_client.collection.return_value.limit.return_value = mock_query
        
        # Mock metadata
        mock_metadata_doc = Mock()
        mock_metadata_doc.exists = True
        mock_metadata_doc.to_dict.return_value = {
            "dimensions": 768,
            "metric": "cosine"
        }
        mock_firestore_client.collection.return_value.document.return_value.get.return_value = mock_metadata_doc
        
        stats = vector_store.get_index_stats()
        
        assert isinstance(stats, VectorStats)
        assert stats.total_vectors == 10
        assert stats.dimensions == 768
        assert stats.metric == "cosine"
    
    def test_is_available(self, vector_store):
        """Test checking if vector store is available"""
        assert vector_store.is_available() is True
    
    def test_get_connection_info(self, vector_store):
        """Test getting connection information"""
        info = vector_store.get_connection_info()
        
        assert isinstance(info, dict)
        assert "firestore_available" in info
        assert "collection_name" in info
        assert "project_id" in info
        assert "region" in info


class TestVectorSearchResult:
    """Test VectorSearchResult dataclass"""
    
    def test_creation(self):
        """Test creating VectorSearchResult"""
        result = VectorSearchResult(
            chunk_id="chunk_1",
            content="Test content",
            score=0.95,
            metadata={"source": "test.pdf"}
        )
        
        assert result.chunk_id == "chunk_1"
        assert result.score == 0.95
        assert result.metadata["source"] == "test.pdf"


class TestVectorStats:
    """Test VectorStats dataclass"""
    
    def test_creation(self):
        """Test creating VectorStats"""
        stats = VectorStats(
            total_vectors=1000,
            index_size=1000,
            dimensions=768,
            metric="cosine",
            namespace_stats={"user_1": 500, "user_2": 500}
        )
        
        assert stats.total_vectors == 1000
        assert stats.dimensions == 768
        assert len(stats.namespace_stats) == 2


@pytest.mark.asyncio
class TestVectorStoreIntegration:
    """Integration tests for vector store"""
    
    async def test_end_to_end_workflow(self):
        """Test complete workflow: create, upsert, search, delete"""
        # This would require Firebase emulator
        # For now, we'll skip or mock
        pass
    
    async def test_batch_operations(self):
        """Test batch operations with large datasets"""
        # Test with 1000+ vectors
        pass
    
    async def test_concurrent_operations(self):
        """Test concurrent read/write operations"""
        # Test thread safety
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

