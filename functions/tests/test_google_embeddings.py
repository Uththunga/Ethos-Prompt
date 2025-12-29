"""
Test Google Embeddings Integration
Tests the Google embedding service integration with RAG functionality
"""
import pytest
import asyncio
import os
import json
from unittest.mock import Mock, patch, AsyncMock
from typing import List, Dict, Any

# Import the modules to test
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from rag.embedding_service import EmbeddingService, EmbeddingResult, BatchEmbeddingResult
from rag.document_processor import DocumentProcessingPipeline


class TestGoogleEmbeddingService:
    """Test Google embedding service functionality"""
    
    @pytest.fixture
    def google_embedding_service(self):
        """Create a Google embedding service instance for testing"""
        return EmbeddingService(provider='google', api_key='test-api-key')
    
    @pytest.fixture
    def openai_embedding_service(self):
        """Create an OpenAI embedding service instance for testing"""
        return EmbeddingService(provider='openai', api_key='test-api-key')
    
    def test_google_service_initialization(self, google_embedding_service):
        """Test Google embedding service initialization"""
        assert google_embedding_service.provider == 'google'
        assert google_embedding_service.default_model == 'text-embedding-004'
        assert google_embedding_service.google_api_key == 'test-api-key'
    
    def test_openai_service_initialization(self, openai_embedding_service):
        """Test OpenAI embedding service initialization"""
        assert openai_embedding_service.provider == 'openai'
        assert openai_embedding_service.default_model == 'text-embedding-3-small'
        assert openai_embedding_service.api_key == 'test-api-key'
    
    def test_model_configurations(self, google_embedding_service):
        """Test that Google models are properly configured"""
        configs = google_embedding_service.model_configs
        
        # Check Google models
        assert 'text-embedding-004' in configs
        assert configs['text-embedding-004']['provider'] == 'google'
        assert configs['text-embedding-004']['dimensions'] == 768
        
        # Check OpenAI models still exist
        assert 'text-embedding-3-small' in configs
        assert configs['text-embedding-3-small']['provider'] == 'openai'
    
    @patch('requests.post')
    @pytest.mark.asyncio
    async def test_google_embedding_generation(self, mock_post, google_embedding_service):
        """Test Google embedding generation"""
        # Mock the API response
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            'embedding': {
                'values': [0.1, 0.2, 0.3] * 256  # 768 dimensions
            }
        }
        mock_post.return_value = mock_response
        
        # Test embedding generation
        result = await google_embedding_service.generate_embedding(
            "Test text for embedding",
            model="text-embedding-004"
        )
        
        assert result is not None
        assert isinstance(result, EmbeddingResult)
        assert result.model == "text-embedding-004"
        assert len(result.embedding) == 768
        assert result.dimensions == 768
        assert not result.cached
        
        # Verify API call
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert 'generativelanguage.googleapis.com' in call_args[1]['url']
    
    @patch('openai.OpenAI')
    @pytest.mark.asyncio
    async def test_openai_embedding_generation(self, mock_openai, openai_embedding_service):
        """Test OpenAI embedding generation"""
        # Mock the OpenAI client
        mock_client = Mock()
        mock_response = Mock()
        mock_response.data = [Mock(embedding=[0.1, 0.2, 0.3] * 512)]  # 1536 dimensions
        mock_response.usage.total_tokens = 10
        mock_client.embeddings.create.return_value = mock_response
        openai_embedding_service.openai_client = mock_client
        
        # Test embedding generation
        result = await openai_embedding_service.generate_embedding(
            "Test text for embedding",
            model="text-embedding-3-small"
        )
        
        assert result is not None
        assert isinstance(result, EmbeddingResult)
        assert result.model == "text-embedding-3-small"
        assert len(result.embedding) == 1536
        assert result.dimensions == 1536
        assert result.tokens_used == 10
        assert not result.cached
    
    @patch('requests.post')
    @pytest.mark.asyncio
    async def test_google_batch_embeddings(self, mock_post, google_embedding_service):
        """Test Google batch embedding generation"""
        # Mock the API response
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            'embedding': {
                'values': [0.1, 0.2, 0.3] * 256  # 768 dimensions
            }
        }
        mock_post.return_value = mock_response
        
        # Test batch embedding generation
        texts = ["Text 1", "Text 2", "Text 3"]
        result = await google_embedding_service.generate_batch_embeddings(
            texts,
            model="text-embedding-004"
        )
        
        assert isinstance(result, BatchEmbeddingResult)
        assert result.success_count == 3
        assert result.error_count == 0
        assert len(result.results) == 3
        
        # Verify each result
        for i, embedding_result in enumerate(result.results):
            assert embedding_result.text == texts[i]
            assert len(embedding_result.embedding) == 768
            assert embedding_result.model == "text-embedding-004"
    
    def test_cache_functionality(self, google_embedding_service):
        """Test embedding caching functionality"""
        text = "Test text for caching"
        model = "text-embedding-004"
        embedding = [0.1, 0.2, 0.3] * 256
        
        # Test cache key generation
        cache_key = google_embedding_service._get_cache_key(text, model)
        assert cache_key.startswith("embedding:text-embedding-004:")
        
        # Test cache operations (without Redis)
        cached = google_embedding_service._get_cached_embedding(text, model)
        assert cached is None  # No Redis client
        
        # Cache embedding (should not fail without Redis)
        google_embedding_service._cache_embedding(text, model, embedding)
    
    def test_text_validation(self, google_embedding_service):
        """Test text validation for embeddings"""
        # Valid text
        is_valid, error = google_embedding_service._validate_text("Valid text", "text-embedding-004")
        assert is_valid
        assert error == ""
        
        # Empty text
        is_valid, error = google_embedding_service._validate_text("", "text-embedding-004")
        assert not is_valid
        assert "empty" in error.lower()
        
        # Very long text (exceeding token limit)
        long_text = "word " * 3000  # Approximately 3000 tokens
        is_valid, error = google_embedding_service._validate_text(long_text, "text-embedding-004")
        assert not is_valid
        assert "too long" in error.lower()
    
    def test_service_availability(self, google_embedding_service):
        """Test service availability checks"""
        # Without proper setup, should not be available
        assert not google_embedding_service.is_available()
        
        # Mock Google API key
        google_embedding_service.google_api_key = "test-key"
        # Still not available without GOOGLE_AVAILABLE flag
        # This would be True in a real environment with google-cloud-aiplatform installed


class TestDocumentProcessingIntegration:
    """Test Google embeddings integration with document processing"""
    
    @pytest.fixture
    def doc_processor(self):
        """Create a document processing pipeline for testing"""
        return DocumentProcessingPipeline()
    
    def test_default_embedding_model(self, doc_processor):
        """Test that document processor uses Google embedding model by default"""
        assert doc_processor.config['embedding_model'] == 'text-embedding-004'
    
    @patch('src.rag.embedding_service.embedding_service')
    @pytest.mark.asyncio
    async def test_document_processing_with_google_embeddings(self, mock_embedding_service, doc_processor):
        """Test document processing pipeline with Google embeddings"""
        # Mock the embedding service
        mock_result = BatchEmbeddingResult(
            results=[
                EmbeddingResult(
                    text="chunk 1",
                    embedding=[0.1] * 768,
                    model="text-embedding-004",
                    dimensions=768,
                    tokens_used=10,
                    processing_time=0.1
                )
            ],
            total_tokens=10,
            total_time=0.1,
            success_count=1,
            error_count=0,
            errors=[]
        )
        mock_embedding_service.generate_batch_embeddings = AsyncMock(return_value=mock_result)
        
        # This would test the full pipeline in a real scenario
        # For now, just verify the configuration
        assert doc_processor.config['embedding_model'] == 'text-embedding-004'


class TestBackwardCompatibility:
    """Test backward compatibility with existing systems"""
    
    def test_openai_fallback(self):
        """Test that OpenAI embeddings still work as fallback"""
        openai_service = EmbeddingService(provider='openai')
        assert openai_service.provider == 'openai'
        assert openai_service.default_model == 'text-embedding-3-small'
    
    def test_model_config_compatibility(self):
        """Test that all model configurations are preserved"""
        service = EmbeddingService(provider='google')
        configs = service.model_configs
        
        # OpenAI models should still be available
        openai_models = ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']
        for model in openai_models:
            assert model in configs
            assert configs[model]['provider'] == 'openai'
        
        # Google models should be available
        google_models = ['text-embedding-004', 'textembedding-gecko@003']
        for model in google_models:
            assert model in configs
            assert configs[model]['provider'] == 'google'


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
