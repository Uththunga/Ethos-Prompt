"""
Integration Tests - Test complete workflows and component interactions
"""
import pytest
import asyncio
import json
import tempfile
import os
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone

try:
    import fastapi  # type: ignore
except Exception:
    pytest.skip("FastAPI not installed; skipping integration tests", allow_module_level=True)

from src.api.main import app
from src.rag.rag_pipeline import RAGPipeline
from src.llm.llm_manager import LLMManager
from src.rag.conversation_memory import ConversationMemoryManager
from src.performance.optimization import PerformanceOptimizer
from src.security.security_config import SecurityManager

class TestAPIIntegration:
    """Test API endpoints integration"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        from fastapi.testclient import TestClient
        return TestClient(app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert "status" in data
        assert "timestamp" in data

    def test_chat_endpoint_integration(self, client):
        """Test chat endpoint with mocked LLM"""
        with patch('src.llm.llm_manager.LLMManager.generate_response') as mock_llm:
            mock_llm.return_value = Mock(
                content="Hello! How can I help you?",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=25,
                cost=0.00003,
                response_time=0.8,
                metadata={}
            )

            response = client.post("/api/ai/chat", json={
                "query": "Hello",
                "provider": "openai",
                "model": "gpt-4o-mini"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "response" in data
            assert "metadata" in data

    def test_rag_chat_endpoint_integration(self, client):
        """Test RAG chat endpoint"""
        with patch('src.rag.rag_pipeline.RAGPipeline.query') as mock_rag:
            mock_rag.return_value = {
                'success': True,
                'response': 'Based on the documents...',
                'sources': [
                    {
                        'document': 'test.pdf',
                        'relevance_score': 0.9,
                        'content_preview': 'Sample content...'
                    }
                ],
                'conversation_id': 'conv_123',
                'metadata': {
                    'provider': 'openai',
                    'model': 'gpt-4o-mini',
                    'tokens_used': 150,
                    'cost': 0.0002,
                    'response_time': 1.2,
                    'context_chunks': 3,
                    'retrieval_time': 0.3
                }
            }

            response = client.post("/api/ai/rag-chat", json={
                "query": "What does the document say?",
                "conversation_id": "conv_123"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "sources" in data

    def test_document_upload_integration(self, client):
        """Test document upload endpoint"""
        with patch('src.rag.rag_pipeline.RAGPipeline.process_document') as mock_process:
            mock_process.return_value = {
                'success': True,
                'job_id': 'job_123',
                'document_id': 'doc_456',
                'status': 'processing'
            }

            # Create a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write("Test document content")
                temp_file_path = f.name

            try:
                with open(temp_file_path, 'rb') as f:
                    response = client.post(
                        "/api/ai/upload-document",
                        files={"file": ("test.txt", f, "text/plain")}
                    )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "job_id" in data
                assert "document_id" in data
            finally:
                os.unlink(temp_file_path)

    def test_search_documents_integration(self, client):
        """Test document search endpoint"""
        with patch('src.rag.rag_pipeline.RAGPipeline.search_documents') as mock_search:
            mock_search.return_value = {
                'success': True,
                'results': [
                    {
                        'chunk_id': 'chunk_1',
                        'content': 'Relevant content...',
                        'score': 0.95,
                        'metadata': {
                            'filename': 'test.pdf',
                            'chunk_index': 0
                        },
                        'rank': 1
                    }
                ],
                'total_results': 1,
                'search_time': 0.2,
                'cached': False,
                'metadata': {
                    'search_type': 'hybrid',
                    'embedding_time': 0.05,
                    'vector_search_time': 0.1
                }
            }

            response = client.post("/api/ai/search-documents", json={
                "query": "machine learning",
                "search_type": "hybrid",
                "top_k": 10
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "results" in data
            assert len(data["results"]) > 0

class TestRAGPipelineIntegration:
    """Test RAG pipeline component integration"""

    @pytest.fixture
    def rag_pipeline(self):
        return RAGPipeline()

    @pytest.mark.asyncio
    async def test_document_to_query_workflow(self, rag_pipeline):
        """Test complete workflow from document processing to query"""
        # Mock all external dependencies
        with patch.object(rag_pipeline.document_processor, 'process_document') as mock_process, \
             patch.object(rag_pipeline.vector_store, 'add_documents') as mock_add, \
             patch.object(rag_pipeline.vector_store, 'similarity_search') as mock_search, \
             patch.object(rag_pipeline.llm_manager, 'generate_response') as mock_llm:

            # Step 1: Process document
            mock_process.return_value = [
                {
                    'content': 'Machine learning is a subset of AI.',
                    'metadata': {'chunk_index': 0, 'filename': 'ml_guide.pdf'}
                }
            ]
            mock_add.return_value = ['doc1_chunk1']

            doc_result = await rag_pipeline.process_document(
                file_content=b"Machine learning content",
                filename="ml_guide.pdf",
                file_type="application/pdf"
            )

            assert doc_result['success'] is True

            # Step 2: Query the processed document
            mock_search.return_value = [
                {
                    'content': 'Machine learning is a subset of AI.',
                    'score': 0.9,
                    'metadata': {'filename': 'ml_guide.pdf'}
                }
            ]

            mock_llm.return_value = Mock(
                content="Machine learning is indeed a subset of artificial intelligence...",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=100,
                cost=0.0001,
                response_time=1.0,
                metadata={}
            )

            query_result = await rag_pipeline.query(
                query="What is machine learning?",
                conversation_id="test_conv"
            )

            assert query_result['success'] is True
            assert 'response' in query_result
            assert 'sources' in query_result

    @pytest.mark.asyncio
    async def test_conversation_context_integration(self, rag_pipeline):
        """Test conversation context integration with RAG"""
        with patch.object(rag_pipeline.conversation_memory, 'get_conversation_context') as mock_context, \
             patch.object(rag_pipeline.vector_store, 'similarity_search') as mock_search, \
             patch.object(rag_pipeline.llm_manager, 'generate_response') as mock_llm:

            # Mock conversation context
            mock_context.return_value = [
                "User: What is AI?",
                "Assistant: AI is artificial intelligence...",
                "User: Tell me more about machine learning"
            ]

            # Mock search results
            mock_search.return_value = [
                {
                    'content': 'Machine learning algorithms...',
                    'score': 0.85,
                    'metadata': {'filename': 'ml_advanced.pdf'}
                }
            ]

            # Mock LLM response
            mock_llm.return_value = Mock(
                content="Building on our previous discussion about AI, machine learning...",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=150,
                cost=0.0002,
                response_time=1.2,
                metadata={}
            )

            result = await rag_pipeline.query(
                query="Tell me more about machine learning",
                conversation_id="conv_with_context"
            )

            assert result['success'] is True
            assert "previous discussion" in result['response']

class TestPerformanceIntegration:
    """Test performance optimization integration"""

    @pytest.fixture
    def performance_optimizer(self):
        return PerformanceOptimizer()

    @pytest.mark.asyncio
    async def test_performance_monitoring_integration(self, performance_optimizer):
        """Test performance monitoring across components"""
        # Simulate operations with performance monitoring
        with performance_optimizer.monitor.measure_time("test_operation"):
            await asyncio.sleep(0.1)  # Simulate work

        with performance_optimizer.monitor.measure_time("test_operation"):
            await asyncio.sleep(0.2)  # Simulate work

        stats = performance_optimizer.monitor.get_stats("test_operation")

        assert stats['count'] == 2
        assert stats['avg_duration'] > 0.1
        assert stats['success_rate'] == 1.0

    def test_cache_integration(self, performance_optimizer):
        """Test cache integration"""
        cache_key = "test_key"
        cache_value = {"data": "test_value"}

        # Set cache
        performance_optimizer.cache.set(cache_key, cache_value, ttl=60)

        # Get cache
        retrieved = performance_optimizer.cache.get(cache_key)
        assert retrieved == cache_value

        # Test cache miss
        missing = performance_optimizer.cache.get("nonexistent_key")
        assert missing is None

class TestSecurityIntegration:
    """Test security integration across components"""

    @pytest.fixture
    def security_manager(self):
        return SecurityManager()

    def test_request_validation_integration(self, security_manager):
        """Test request validation integration"""
        # Test normal request
        normal_request = {
            'query': 'What is machine learning?',
            'max_tokens': 1000,
            'temperature': 0.7
        }

        result = security_manager.validate_request(normal_request, "192.168.1.1")
        assert result['valid'] is True
        assert len(result['errors']) == 0
        assert len(result['threats']) == 0

    def test_threat_detection_integration(self, security_manager):
        """Test threat detection integration"""
        # Test malicious request
        malicious_request = {
            'query': '<script>alert("xss")</script> OR 1=1',
            'max_tokens': 1000
        }

        result = security_manager.validate_request(malicious_request, "192.168.1.1")
        assert result['valid'] is False
        assert len(result['threats']) > 0

    def test_rate_limiting_integration(self, security_manager):
        """Test rate limiting integration"""
        # This would test rate limiting in a real scenario
        # For now, we'll test the configuration
        assert security_manager.config.max_requests_per_minute > 0
        assert security_manager.config.max_requests_per_hour > 0

class TestErrorHandlingIntegration:
    """Test error handling across components"""

    @pytest.mark.asyncio
    async def test_llm_error_handling(self):
        """Test LLM error handling integration"""
        llm_manager = LLMManager()

        with patch.object(llm_manager, '_generate_openai') as mock_openai:
            mock_openai.side_effect = Exception("API rate limit exceeded")

            with pytest.raises(Exception) as exc_info:
                await llm_manager.generate_response(
                    "Test prompt",
                    provider="openai"
                )

            assert "rate limit" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_rag_error_handling(self):
        """Test RAG pipeline error handling"""
        rag_pipeline = RAGPipeline()

        with patch.object(rag_pipeline.vector_store, 'similarity_search') as mock_search:
            mock_search.side_effect = Exception("Vector store unavailable")

            result = await rag_pipeline.query(
                query="Test query",
                conversation_id="test_conv"
            )

            assert result['success'] is False
            assert 'error' in result

class TestDataFlowIntegration:
    """Test data flow between components"""

    @pytest.mark.asyncio
    async def test_conversation_memory_flow(self):
        """Test conversation memory data flow"""
        memory_manager = ConversationMemoryManager()
        conversation_id = "flow_test_conv"

        # Add user message
        await memory_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content="What is AI?",
            user_id="user123"
        )

        # Add assistant message
        await memory_manager.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content="AI stands for Artificial Intelligence...",
            user_id="user123"
        )

        # Get conversation context
        context = await memory_manager.get_conversation_context(
            conversation_id=conversation_id,
            max_messages=10
        )

        assert len(context) == 2
        assert "What is AI?" in context[0]
        assert "Artificial Intelligence" in context[1]

    @pytest.mark.asyncio
    async def test_query_expansion_flow(self):
        """Test query expansion data flow"""
        from src.rag.query_expansion import QueryExpansionEngine

        query_engine = QueryExpansionEngine()

        original_query = "ML algorithms"
        expanded = await query_engine.expand_query(original_query)

        assert expanded.original_query == original_query
        assert len(expanded.expansion_terms) > 0
        assert "machine learning" in expanded.expanded_query.lower()

class TestConcurrencyIntegration:
    """Test concurrent operations"""

    @pytest.mark.asyncio
    async def test_concurrent_queries(self):
        """Test concurrent query processing"""
        rag_pipeline = RAGPipeline()

        with patch.object(rag_pipeline.llm_manager, 'generate_response') as mock_llm:
            mock_llm.return_value = Mock(
                content="Response",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=50,
                cost=0.00005,
                response_time=0.5,
                metadata={}
            )

            # Run multiple queries concurrently
            tasks = []
            for i in range(5):
                task = rag_pipeline.query(
                    query=f"Query {i}",
                    conversation_id=f"conv_{i}"
                )
                tasks.append(task)

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Check that all queries completed successfully
            for result in results:
                if isinstance(result, Exception):
                    pytest.fail(f"Query failed with exception: {result}")
                assert result['success'] is True

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
