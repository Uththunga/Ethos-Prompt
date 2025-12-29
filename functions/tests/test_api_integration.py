"""
FastAPI Integration Tests - Test API endpoints with TestClient
"""
import pytest
import asyncio
import json
import tempfile
import os
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone
try:
    from fastapi.testclient import TestClient
except Exception:
    pytest.skip("FastAPI not installed; skipping API integration tests", allow_module_level=True)
from io import BytesIO

from src.api.main import app
from src.rag.rag_pipeline import RAGPipeline, RAGQuery, DocumentProcessingRequest
from src.llm.llm_manager import LLMManager, LLMResponse
from src.auth.auth_middleware import AuthError

class TestFastAPIIntegration:
    """Test FastAPI endpoints integration"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    @pytest.fixture
    def mock_auth_token(self):
        """Mock authentication token"""
        return "Bearer mock_valid_token"

    @pytest.fixture
    def mock_user(self):
        """Mock user data"""
        return {
            'uid': 'test_user_123',
            'email': 'test@example.com',
            'claims': {'admin': False}
        }

    def test_health_endpoint(self, client):
        """Test basic health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "service" in data

    def test_detailed_health_endpoint(self, client):
        """Test detailed health check endpoint"""
        with patch('src.rag.rag_pipeline.rag_pipeline.get_system_status') as mock_status:
            mock_status.return_value = {
                'status': 'idle',
                'metrics': {'queries_handled': 0},
                'components': {'llm_manager': 'active'}
            }

            response = client.get("/health/detailed")
            assert response.status_code == 200

            data = response.json()
            assert data["status"] == "healthy"
            assert "system" in data

    def test_readiness_endpoint(self, client):
        """Test readiness probe endpoint"""
        with patch('src.rag.rag_pipeline.rag_pipeline.get_system_status') as mock_status:
            mock_status.return_value = {'status': 'idle'}

            response = client.get("/health/ready")
            assert response.status_code == 200

            data = response.json()
            assert data["status"] == "ready"

    def test_chat_endpoint_success(self, client, mock_auth_token, mock_user):
        """Test successful chat endpoint"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.llm.llm_manager.LLMManager.generate_response') as mock_llm:
                mock_llm.return_value = LLMResponse(
                    content="Hello! How can I help you?",
                    provider="openai",
                    model="gpt-4o-mini",
                    tokens_used=25,
                    cost=0.00003,
                    response_time=0.8,
                    metadata={}
                )

                response = client.post(
                    "/api/ai/chat",
                    json={
                        "query": "Hello",
                        "provider": "openai",
                        "temperature": 0.7,
                        "max_tokens": 1000
                    },
                    headers={"Authorization": mock_auth_token}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "response" in data
                assert data["provider"] == "openai"
                assert data["tokens_used"] == 25

    def test_chat_endpoint_unauthorized(self, client):
        """Test chat endpoint without authentication"""
        response = client.post(
            "/api/ai/chat",
            json={"query": "Hello"}
        )
        assert response.status_code == 401

    def test_rag_chat_endpoint_success(self, client, mock_auth_token, mock_user):
        """Test successful RAG chat endpoint"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.query') as mock_rag:
                mock_rag.return_value = Mock(
                    response="Based on the documents, here's the answer...",
                    sources=[{"chunk_id": "123", "content": "Sample content"}],
                    conversation_id="conv_123",
                    query_id="query_123",
                    provider="openai",
                    model="gpt-4o-mini",
                    tokens_used=150,
                    processing_time=2.5,
                    confidence_score=0.85,
                    metadata={"context_chunks": 3}
                )

                response = client.post(
                    "/api/ai/rag-chat",
                    json={
                        "query": "What is the main topic?",
                        "conversation_id": "conv_123",
                        "max_context_tokens": 4000,
                        "include_sources": True
                    },
                    headers={"Authorization": mock_auth_token}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "response" in data
                assert "sources" in data
                assert data["confidence_score"] == 0.85

    def test_upload_document_endpoint_success(self, client, mock_auth_token, mock_user):
        """Test successful document upload"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.process_document') as mock_process:
                mock_process.return_value = Mock(
                    job_id="job_123",
                    status="pending",
                    filename="test.txt"
                )

                # Create a test file
                test_content = b"This is a test document content."

                response = client.post(
                    "/api/ai/upload-document",
                    files={"file": ("test.txt", BytesIO(test_content), "text/plain")},
                    headers={"Authorization": mock_auth_token}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "job_id" in data
                assert "test.txt" in data["message"]

    def test_upload_document_file_too_large(self, client, mock_auth_token, mock_user):
        """Test document upload with file too large"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            # Create a large file (>10MB)
            large_content = b"x" * (11 * 1024 * 1024)

            response = client.post(
                "/api/ai/upload-document",
                files={"file": ("large.txt", BytesIO(large_content), "text/plain")},
                headers={"Authorization": mock_auth_token}
            )

            assert response.status_code == 413

    def test_search_documents_endpoint_success(self, client, mock_auth_token, mock_user):
        """Test successful document search"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.search_documents') as mock_search:
                mock_search.return_value = [
                    Mock(
                        chunk_id="chunk_1",
                        content="Sample content 1",
                        score=0.95,
                        metadata={"document": "doc1.txt"}
                    ),
                    Mock(
                        chunk_id="chunk_2",
                        content="Sample content 2",
                        score=0.87,
                        metadata={"document": "doc2.txt"}
                    )
                ]

                response = client.post(
                    "/api/ai/search-documents",
                    json={
                        "query": "test search",
                        "limit": 10
                    },
                    headers={"Authorization": mock_auth_token}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert len(data["results"]) == 2
                assert data["total_results"] == 2

    def test_system_status_endpoint(self, client, mock_auth_token, mock_user):
        """Test system status endpoint"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.get_system_status') as mock_status:
                mock_status.return_value = {
                    'status': 'idle',
                    'metrics': {'queries_handled': 42},
                    'components': {'llm_manager': 'active'}
                }

                response = client.get(
                    "/api/ai/system-status",
                    headers={"Authorization": mock_auth_token}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "data" in data

    def test_usage_stats_endpoint(self, client, mock_auth_token, mock_user):
        """Test usage statistics endpoint"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.get_usage_stats') as mock_stats:
                mock_stats.return_value = {
                    'user_id': 'test_user_123',
                    'total_queries': 15,
                    'total_documents': 5
                }

                response = client.get(
                    "/api/ai/usage-stats",
                    headers={"Authorization": mock_auth_token}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["data"]["user_id"] == "test_user_123"

    def test_conversations_endpoint(self, client, mock_auth_token, mock_user):
        """Test get conversations endpoint"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            response = client.get(
                "/api/ai/conversations",
                headers={"Authorization": mock_auth_token}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "data" in data
            assert "conversations" in data["data"]

    def test_delete_conversation_endpoint(self, client, mock_auth_token, mock_user):
        """Test delete conversation endpoint"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.delete_conversation') as mock_delete:
                mock_delete.return_value = True

                response = client.delete(
                    "/api/ai/conversations/conv_123",
                    headers={"Authorization": mock_auth_token}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True

    def test_document_status_endpoint(self, client, mock_auth_token, mock_user):
        """Test document processing status endpoint"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.get_document_status') as mock_status:
                mock_status.return_value = Mock(
                    job_id="job_123",
                    status=Mock(value="completed"),
                    filename="test.txt",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                    total_chunks=5,
                    steps=[]
                )

                response = client.get(
                    "/api/ai/document-status/job_123",
                    headers={"Authorization": mock_auth_token}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["data"]["job_id"] == "job_123"

    def test_global_exception_handler(self, client, mock_auth_token, mock_user):
        """Test global exception handler"""
        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.get_system_status') as mock_status:
                mock_status.side_effect = Exception("Test error")

                response = client.get(
                    "/api/ai/system-status",
                    headers={"Authorization": mock_auth_token}
                )

                assert response.status_code == 500
                data = response.json()
                assert data["success"] is False
                assert "error" in data
