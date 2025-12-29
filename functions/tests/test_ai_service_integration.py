"""
Comprehensive AI Service Integration Tests
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone
import json

from src.llm.llm_manager import LLMManager, ProviderType, LLMResponse
from src.rag.rag_pipeline import RAGPipeline
from src.rag.conversation_memory import ConversationMemoryManager
from src.rag.query_expansion import QueryExpansionEngine
from src.rag.response_synthesis import ResponseSynthesisEngine
from src.rag.response_validator import ResponseValidator
from src.performance.optimization import PerformanceOptimizer
from src.security.security_config import SecurityManager

class TestLLMManagerIntegration:
    """Test LLM Manager with all providers"""
    
    @pytest.fixture
    def llm_manager(self):
        return LLMManager()
    
    @pytest.mark.asyncio
    async def test_openai_integration(self, llm_manager):
        """Test OpenAI provider integration"""
        with patch('openai.AsyncOpenAI') as mock_openai:
            mock_client = Mock()
            mock_openai.return_value = mock_client
            
            mock_response = Mock()
            mock_response.choices = [Mock(message=Mock(content="Test response"))]
            mock_response.usage = Mock(prompt_tokens=10, completion_tokens=20, total_tokens=30)
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
            
            response = await llm_manager.generate_response(
                "Test prompt",
                provider="openai",
                model="gpt-4o-mini"
            )
            
            assert response.content == "Test response"
            assert response.provider == "openai"
            assert response.tokens_used == 30
            assert response.cost > 0
    
    @pytest.mark.asyncio
    async def test_anthropic_integration(self, llm_manager):
        """Test Anthropic provider integration"""
        with patch('anthropic.Anthropic') as mock_anthropic:
            mock_client = Mock()
            mock_anthropic.return_value = mock_client
            
            mock_response = Mock()
            mock_response.content = [Mock(text="Anthropic response")]
            mock_response.usage = Mock(input_tokens=15, output_tokens=25)
            mock_response.stop_reason = "end_turn"
            mock_client.messages.create = AsyncMock(return_value=mock_response)
            
            response = await llm_manager.generate_response(
                "Test prompt",
                provider="anthropic",
                model="claude-3-5-sonnet-20241022"
            )
            
            assert response.content == "Anthropic response"
            assert response.provider == "anthropic"
            assert response.tokens_used == 40
    
    @pytest.mark.asyncio
    async def test_provider_failover(self, llm_manager):
        """Test provider failover functionality"""
        with patch.object(llm_manager, '_generate_openai') as mock_openai, \
             patch.object(llm_manager, '_generate_anthropic') as mock_anthropic:
            
            # First provider fails
            mock_openai.side_effect = Exception("OpenAI unavailable")
            
            # Second provider succeeds
            mock_anthropic.return_value = LLMResponse(
                content="Fallback response",
                provider="anthropic",
                model="claude-3-5-sonnet-20241022",
                tokens_used=30,
                cost=0.003,
                response_time=1.2
            )
            
            response = await llm_manager.generate_response_with_fallback(
                "Test prompt",
                providers=["openai", "anthropic"]
            )
            
            assert response.content == "Fallback response"
            assert response.provider == "anthropic"

class TestRAGPipelineIntegration:
    """Test RAG Pipeline end-to-end functionality"""
    
    @pytest.fixture
    def rag_pipeline(self):
        return RAGPipeline()
    
    @pytest.mark.asyncio
    async def test_document_processing_pipeline(self, rag_pipeline):
        """Test complete document processing pipeline"""
        with patch.object(rag_pipeline.document_processor, 'process_document') as mock_process, \
             patch.object(rag_pipeline.vector_store, 'add_documents') as mock_add:
            
            mock_process.return_value = [
                {
                    'content': 'Test chunk 1',
                    'metadata': {'chunk_index': 0, 'filename': 'test.txt'}
                },
                {
                    'content': 'Test chunk 2',
                    'metadata': {'chunk_index': 1, 'filename': 'test.txt'}
                }
            ]
            
            mock_add.return_value = ['doc1_chunk1', 'doc1_chunk2']
            
            result = await rag_pipeline.process_document(
                file_content=b"Test document content",
                filename="test.txt",
                file_type="text/plain"
            )
            
            assert result['success'] is True
            assert result['chunks_created'] == 2
            assert 'document_id' in result
    
    @pytest.mark.asyncio
    async def test_rag_query_pipeline(self, rag_pipeline):
        """Test complete RAG query pipeline"""
        with patch.object(rag_pipeline.vector_store, 'similarity_search') as mock_search, \
             patch.object(rag_pipeline.llm_manager, 'generate_response') as mock_llm:
            
            # Mock search results
            mock_search.return_value = [
                {
                    'content': 'Relevant chunk 1',
                    'score': 0.9,
                    'metadata': {'filename': 'doc1.txt'}
                },
                {
                    'content': 'Relevant chunk 2',
                    'score': 0.8,
                    'metadata': {'filename': 'doc2.txt'}
                }
            ]
            
            # Mock LLM response
            mock_llm.return_value = LLMResponse(
                content="Based on the documents, here's the answer...",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=150,
                cost=0.0002,
                response_time=1.5
            )
            
            result = await rag_pipeline.query(
                query="What is the main topic?",
                conversation_id="test_conv"
            )
            
            assert result['success'] is True
            assert 'response' in result
            assert 'sources' in result
            assert len(result['sources']) == 2

class TestConversationMemoryIntegration:
    """Test conversation memory management"""
    
    @pytest.fixture
    def memory_manager(self):
        return ConversationMemoryManager()
    
    @pytest.mark.asyncio
    async def test_conversation_lifecycle(self, memory_manager):
        """Test complete conversation lifecycle"""
        conversation_id = "test_conv_123"
        
        # Add messages
        await memory_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content="Hello, how are you?",
            user_id="user123"
        )
        
        await memory_manager.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content="I'm doing well, thank you for asking!",
            user_id="user123"
        )
        
        # Get conversation
        conversation = await memory_manager.get_conversation(conversation_id)
        
        assert conversation is not None
        assert len(conversation.messages) == 2
        assert conversation.messages[0].role.value == "user"
        assert conversation.messages[1].role.value == "assistant"
    
    @pytest.mark.asyncio
    async def test_conversation_summarization(self, memory_manager):
        """Test conversation summarization"""
        conversation_id = "test_conv_summary"
        
        # Add multiple messages to trigger summarization
        for i in range(20):
            await memory_manager.add_message(
                conversation_id=conversation_id,
                role="user" if i % 2 == 0 else "assistant",
                content=f"Message {i}",
                user_id="user123"
            )
        
        with patch.object(memory_manager.llm_manager, 'generate_response') as mock_llm:
            mock_llm.return_value = LLMResponse(
                content="Summary of the conversation...",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=100,
                cost=0.0001,
                response_time=1.0
            )
            
            summary = await memory_manager.create_summary(conversation_id)
            
            assert summary is not None
            assert summary.summary == "Summary of the conversation..."
            assert summary.message_count == 20

class TestQueryExpansionIntegration:
    """Test query expansion and rewriting"""
    
    @pytest.fixture
    def query_engine(self):
        return QueryExpansionEngine()
    
    @pytest.mark.asyncio
    async def test_query_expansion_pipeline(self, query_engine):
        """Test complete query expansion pipeline"""
        original_query = "How to create API?"
        
        expanded = await query_engine.expand_query(original_query)
        
        assert expanded.original_query == original_query
        assert len(expanded.expansion_terms) > 0
        assert expanded.expanded_query != original_query
        assert expanded.confidence_score > 0
    
    @pytest.mark.asyncio
    async def test_llm_based_expansion(self, query_engine):
        """Test LLM-based query expansion"""
        with patch.object(query_engine, 'llm_manager') as mock_llm_manager:
            mock_llm_manager.generate_response.return_value = LLMResponse(
                content="API development, REST endpoints, web services",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=50,
                cost=0.00005,
                response_time=0.8
            )
            
            expanded = await query_engine.expand_with_llm("How to create API?")
            
            assert expanded.expansion_method == "llm_generated"
            assert "API development" in expanded.expansion_terms

class TestResponseSynthesisIntegration:
    """Test response synthesis and validation"""
    
    @pytest.fixture
    def synthesis_engine(self):
        return ResponseSynthesisEngine()
    
    @pytest.fixture
    def response_validator(self):
        return ResponseValidator()
    
    @pytest.mark.asyncio
    async def test_response_synthesis_pipeline(self, synthesis_engine):
        """Test complete response synthesis pipeline"""
        from src.rag.response_synthesis import SynthesisContext
        
        context = SynthesisContext(
            query="What is machine learning?",
            retrieved_chunks=[
                {
                    'content': 'Machine learning is a subset of AI...',
                    'score': 0.9,
                    'metadata': {'filename': 'ml_guide.pdf'}
                }
            ],
            response_style="informative",
            include_citations=True
        )
        
        with patch.object(synthesis_engine.llm_manager, 'generate_response') as mock_llm:
            mock_llm.return_value = LLMResponse(
                content="Machine learning is a subset of artificial intelligence...",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=200,
                cost=0.0003,
                response_time=1.2
            )
            
            result = await synthesis_engine.synthesize_response(context)
            
            assert result.content is not None
            assert len(result.citations) > 0
            assert result.confidence_score > 0
            assert result.quality_metrics['relevance'] > 0
    
    @pytest.mark.asyncio
    async def test_response_validation_pipeline(self, response_validator):
        """Test response validation pipeline"""
        response = "Machine learning is a subset of artificial intelligence that focuses on algorithms."
        query = "What is machine learning?"
        sources = [
            {
                'content': 'Machine learning is a subset of AI that uses algorithms...',
                'metadata': {'filename': 'ml_basics.pdf'}
            }
        ]
        
        validation_result = await response_validator.validate_response(
            response=response,
            query=query,
            sources=sources
        )
        
        assert validation_result.is_valid is True
        assert validation_result.confidence_score > 0.5
        assert 'relevance' in validation_result.quality_metrics
        assert len(validation_result.suggestions) >= 0

class TestPerformanceOptimization:
    """Test performance optimization features"""
    
    @pytest.fixture
    def performance_optimizer(self):
        return PerformanceOptimizer()
    
    def test_performance_monitoring(self, performance_optimizer):
        """Test performance monitoring"""
        # Record some metrics
        performance_optimizer.monitor.record_metric("test_operation", 1.5, True)
        performance_optimizer.monitor.record_metric("test_operation", 2.0, True)
        performance_optimizer.monitor.record_metric("test_operation", 0.8, False)
        
        stats = performance_optimizer.monitor.get_stats("test_operation")
        
        assert stats['count'] == 3
        assert stats['success_rate'] == 2/3
        assert stats['avg_duration'] > 0
    
    def test_performance_recommendations(self, performance_optimizer):
        """Test performance recommendations"""
        # Simulate poor performance
        for _ in range(10):
            performance_optimizer.monitor.record_metric("slow_operation", 5.0, True)
        
        report = performance_optimizer.get_performance_report()
        
        assert 'recommendations' in report
        assert len(report['recommendations']) > 0

class TestSecurityIntegration:
    """Test security features"""
    
    @pytest.fixture
    def security_manager(self):
        return SecurityManager()
    
    def test_input_validation(self, security_manager):
        """Test input validation"""
        # Test valid input
        valid_request = {
            'query': 'What is machine learning?',
            'max_tokens': 1000
        }
        
        result = security_manager.validate_request(valid_request)
        assert result['valid'] is True
        assert len(result['errors']) == 0
        
        # Test malicious input
        malicious_request = {
            'query': '<script>alert("xss")</script>',
            'max_tokens': 1000
        }
        
        result = security_manager.validate_request(malicious_request)
        assert result['valid'] is False
        assert len(result['threats']) > 0
    
    def test_api_key_encryption(self, security_manager):
        """Test API key encryption"""
        original_key = "sk-test-api-key-12345"
        
        # Encrypt
        encrypted = security_manager.secure_api_key(original_key)
        assert encrypted != original_key
        
        # Decrypt
        decrypted = security_manager.get_api_key(encrypted)
        assert decrypted == original_key

class TestEndToEndIntegration:
    """End-to-end integration tests"""
    
    @pytest.mark.asyncio
    async def test_complete_rag_workflow(self):
        """Test complete RAG workflow from document upload to query response"""
        # This would test the entire pipeline in a real scenario
        # For now, we'll mock the major components
        
        with patch('src.rag.rag_pipeline.RAGPipeline') as mock_rag:
            mock_pipeline = Mock()
            mock_rag.return_value = mock_pipeline
            
            # Mock document processing
            mock_pipeline.process_document.return_value = {
                'success': True,
                'document_id': 'doc123',
                'chunks_created': 5
            }
            
            # Mock query processing
            mock_pipeline.query.return_value = {
                'success': True,
                'response': 'Based on the uploaded document...',
                'sources': [{'document': 'test.pdf', 'relevance_score': 0.9}],
                'conversation_id': 'conv123'
            }
            
            # Test document upload
            doc_result = await mock_pipeline.process_document(
                file_content=b"Test document",
                filename="test.pdf",
                file_type="application/pdf"
            )
            
            assert doc_result['success'] is True
            
            # Test query
            query_result = await mock_pipeline.query(
                query="What does the document say?",
                conversation_id="conv123"
            )
            
            assert query_result['success'] is True
            assert 'response' in query_result
            assert 'sources' in query_result

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
