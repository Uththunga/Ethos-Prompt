"""
Functional Requirements Validation Tests
"""
import pytest
import asyncio
import json
import time
from unittest.mock import Mock, patch, AsyncMock
try:
    from fastapi.testclient import TestClient
except Exception:
    pytest.skip("FastAPI not installed; skipping functional validation tests", allow_module_level=True)
from io import BytesIO

from src.api.main import app
from src.rag.rag_pipeline import RAGPipeline
from src.llm.llm_manager import LLMManager, LLMResponse

class TestFunctionalRequirements:
    """Test all functional requirements end-to-end"""

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

    def test_all_backend_endpoints_accessible(self, client, mock_auth_token, mock_user):
        """Validate that frontend can call all backend endpoints"""

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            # Test health endpoints (no auth required)
            health_response = client.get("/health")
            assert health_response.status_code == 200

            detailed_health_response = client.get("/health/detailed")
            assert detailed_health_response.status_code in [200, 503]  # May fail if services unavailable

            ready_response = client.get("/health/ready")
            assert ready_response.status_code in [200, 503]

            # Test authenticated endpoints
            endpoints_to_test = [
                ("GET", "/api/ai/system-status"),
                ("GET", "/api/ai/usage-stats"),
                ("GET", "/api/ai/conversations"),
            ]

            for method, endpoint in endpoints_to_test:
                if method == "GET":
                    response = client.get(endpoint, headers={"Authorization": mock_auth_token})
                else:
                    response = client.post(endpoint, headers={"Authorization": mock_auth_token})

                # Should not return 404 (endpoint exists)
                assert response.status_code != 404, f"Endpoint {method} {endpoint} not found"
                # Should not return 405 (method allowed)
                assert response.status_code != 405, f"Method {method} not allowed for {endpoint}"

    def test_document_upload_processing_end_to_end(self, client, mock_auth_token, mock_user):
        """Validate document upload and processing works end-to-end"""

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.process_document') as mock_process:
                # Mock successful document processing
                mock_job = Mock()
                mock_job.job_id = "test_job_123"
                mock_job.status = Mock(value="pending")
                mock_job.filename = "test_document.txt"
                mock_process.return_value = mock_job

                # Test document upload
                test_content = b"This is a test document for RAG processing."

                upload_response = client.post(
                    "/api/ai/upload-document",
                    files={"file": ("test_document.txt", BytesIO(test_content), "text/plain")},
                    headers={"Authorization": mock_auth_token}
                )

                assert upload_response.status_code == 200
                upload_data = upload_response.json()
                assert upload_data["success"] is True
                assert "job_id" in upload_data

                job_id = upload_data["job_id"]

                # Test document status endpoint
                with patch('src.rag.rag_pipeline.rag_pipeline.get_document_status') as mock_status:
                    mock_status_obj = Mock()
                    mock_status_obj.job_id = job_id
                    mock_status_obj.status = Mock(value="completed")
                    mock_status_obj.filename = "test_document.txt"
                    mock_status_obj.created_at = Mock()
                    mock_status_obj.created_at.isoformat.return_value = "2024-01-01T00:00:00Z"
                    mock_status_obj.updated_at = Mock()
                    mock_status_obj.updated_at.isoformat.return_value = "2024-01-01T00:01:00Z"
                    mock_status_obj.total_chunks = 5
                    mock_status_obj.steps = []
                    mock_status.return_value = mock_status_obj

                    status_response = client.get(
                        f"/api/ai/document-status/{job_id}",
                        headers={"Authorization": mock_auth_token}
                    )

                    assert status_response.status_code == 200
                    status_data = status_response.json()
                    assert status_data["success"] is True
                    assert status_data["data"]["job_id"] == job_id

    def test_chat_functionality_without_rag(self, client, mock_auth_token, mock_user):
        """Validate chat functionality works without RAG"""

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.llm.llm_manager.LLMManager.generate_response') as mock_llm:
                mock_llm.return_value = LLMResponse(
                    content="Hello! I'm an AI assistant. How can I help you today?",
                    provider="openai",
                    model="gpt-4o-mini",
                    tokens_used=25,
                    cost=0.00003,
                    response_time=0.8,
                    metadata={}
                )

                chat_response = client.post(
                    "/api/ai/chat",
                    json={
                        "query": "Hello, how are you?",
                        "provider": "openai",
                        "temperature": 0.7,
                        "max_tokens": 1000
                    },
                    headers={"Authorization": mock_auth_token}
                )

                assert chat_response.status_code == 200
                chat_data = chat_response.json()
                assert chat_data["success"] is True
                assert len(chat_data["response"]) > 0
                assert chat_data["provider"] == "openai"
                assert chat_data["tokens_used"] > 0
                assert chat_data["processing_time"] > 0

    def test_chat_functionality_with_rag(self, client, mock_auth_token, mock_user):
        """Validate chat functionality works with RAG"""

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.query') as mock_rag:
                mock_rag_response = Mock()
                mock_rag_response.response = "Based on the uploaded documents, here's what I found..."
                mock_rag_response.sources = [
                    {"chunk_id": "chunk_1", "content": "Sample content", "score": 0.95}
                ]
                mock_rag_response.conversation_id = "conv_123"
                mock_rag_response.query_id = "query_123"
                mock_rag_response.provider = "openai"
                mock_rag_response.model = "gpt-4o-mini"
                mock_rag_response.tokens_used = 150
                mock_rag_response.processing_time = 2.5
                mock_rag_response.confidence_score = 0.85
                mock_rag_response.metadata = {"context_chunks": 3}
                mock_rag.return_value = mock_rag_response

                rag_chat_response = client.post(
                    "/api/ai/rag-chat",
                    json={
                        "query": "What information do you have about the uploaded documents?",
                        "conversation_id": "conv_123",
                        "max_context_tokens": 4000,
                        "include_sources": True,
                        "rerank_results": True
                    },
                    headers={"Authorization": mock_auth_token}
                )

                assert rag_chat_response.status_code == 200
                rag_data = rag_chat_response.json()
                assert rag_data["success"] is True
                assert len(rag_data["response"]) > 0
                assert len(rag_data["sources"]) > 0
                assert rag_data["confidence_score"] > 0
                assert rag_data["processing_time"] > 0

    def test_search_returns_relevant_results(self, client, mock_auth_token, mock_user):
        """Validate search returns relevant results"""

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            with patch('src.rag.rag_pipeline.rag_pipeline.search_documents') as mock_search:
                mock_results = [
                    Mock(
                        chunk_id="chunk_1",
                        content="This is relevant content about machine learning",
                        score=0.95,
                        metadata={"document": "ml_guide.pdf", "page": 1}
                    ),
                    Mock(
                        chunk_id="chunk_2",
                        content="Another relevant piece about neural networks",
                        score=0.87,
                        metadata={"document": "nn_tutorial.txt", "page": 1}
                    )
                ]
                mock_search.return_value = mock_results

                search_response = client.post(
                    "/api/ai/search-documents",
                    json={
                        "query": "machine learning neural networks",
                        "limit": 10
                    },
                    headers={"Authorization": mock_auth_token}
                )

                assert search_response.status_code == 200
                search_data = search_response.json()
                assert search_data["success"] is True
                assert len(search_data["results"]) > 0
                assert search_data["total_results"] > 0
                assert search_data["processing_time"] >= 0

                # Validate result structure
                for result in search_data["results"]:
                    assert "chunk_id" in result
                    assert "content" in result
                    assert "score" in result
                    assert "metadata" in result
                    assert result["score"] > 0

    def test_authentication_works_consistently(self, client):
        """Validate authentication works consistently across endpoints"""

        # Test without authentication - should fail
        unauth_endpoints = [
            ("POST", "/api/ai/chat", {"query": "test"}),
            ("POST", "/api/ai/rag-chat", {"query": "test"}),
            ("GET", "/api/ai/system-status", None),
            ("GET", "/api/ai/usage-stats", None),
            ("GET", "/api/ai/conversations", None),
        ]

        for method, endpoint, data in unauth_endpoints:
            if method == "GET":
                response = client.get(endpoint)
            else:
                response = client.post(endpoint, json=data)

            assert response.status_code == 401, f"Endpoint {method} {endpoint} should require authentication"

        # Test with invalid token
        invalid_token = "Bearer invalid_token"

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.side_effect = Exception("Invalid token")

            for method, endpoint, data in unauth_endpoints:
                headers = {"Authorization": invalid_token}
                if method == "GET":
                    response = client.get(endpoint, headers=headers)
                else:
                    response = client.post(endpoint, json=data, headers=headers)

                assert response.status_code == 401, f"Endpoint {method} {endpoint} should reject invalid tokens"

        # Test with valid token
        valid_token = "Bearer valid_token"
        mock_user = {'uid': 'test_user', 'email': 'test@example.com', 'claims': {}}

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            # Mock other dependencies to avoid actual service calls
            with patch('src.rag.rag_pipeline.rag_pipeline.get_system_status') as mock_status:
                mock_status.return_value = {"status": "idle"}

                with patch('src.rag.rag_pipeline.rag_pipeline.get_usage_stats') as mock_stats:
                    mock_stats.return_value = {"total_queries": 0}

                    for method, endpoint, data in unauth_endpoints:
                        headers = {"Authorization": valid_token}
                        if method == "GET":
                            response = client.get(endpoint, headers=headers)
                        else:
                            response = client.post(endpoint, json=data, headers=headers)

                        # Should not be authentication error
                        assert response.status_code != 401, f"Valid token should work for {method} {endpoint}"
                        assert response.status_code != 403, f"Valid token should have access to {method} {endpoint}"

    def test_performance_requirements(self, client, mock_auth_token, mock_user):
        """Validate performance requirements are met"""

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            # Test chat response time < 2 seconds
            with patch('src.llm.llm_manager.LLMManager.generate_response') as mock_llm:
                mock_llm.return_value = LLMResponse(
                    content="Quick response",
                    provider="openai",
                    model="gpt-4o-mini",
                    tokens_used=10,
                    cost=0.00001,
                    response_time=0.5,
                    metadata={}
                )

                start_time = time.time()
                chat_response = client.post(
                    "/api/ai/chat",
                    json={"query": "Quick test"},
                    headers={"Authorization": mock_auth_token}
                )
                end_time = time.time()

                assert chat_response.status_code == 200
                response_time = end_time - start_time
                assert response_time < 2.0, f"Chat response took {response_time:.2f}s, should be < 2s"

            # Test document search < 500ms
            with patch('src.rag.rag_pipeline.rag_pipeline.search_documents') as mock_search:
                mock_search.return_value = [
                    Mock(chunk_id="1", content="test", score=0.9, metadata={})
                ]

                start_time = time.time()
                search_response = client.post(
                    "/api/ai/search-documents",
                    json={"query": "test search", "limit": 5},
                    headers={"Authorization": mock_auth_token}
                )
                end_time = time.time()

                assert search_response.status_code == 200
                search_time = end_time - start_time
                assert search_time < 0.5, f"Search took {search_time:.3f}s, should be < 0.5s"
