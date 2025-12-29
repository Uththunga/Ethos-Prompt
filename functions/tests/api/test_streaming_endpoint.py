"""
Integration tests for Marketing Agent streaming endpoints
Tests both POST and GET SSE endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from src.api.cloud_run_main import app

client = TestClient(app)

@pytest.fixture
def mock_marketing_agent():
    """Mock MarketingAgent for endpoint testing"""
    with patch("src.api.cloud_run_main.MarketingAgent") as mock:
        instance = mock.return_value

        # Mock chat method
        instance.chat = AsyncMock(return_value={
            "response": "Hello! How can I help you today?",
            "history": [],
            "metadata": {"tokens": 50, "model": "gpt-4"}
        })

        # Mock streaming method
        async def mock_stream(*args, **kwargs):
            yield "Hello"
            yield " from"
            yield " EthosPrompt!"

        instance.generate_stream = mock_stream
        yield instance

def test_marketing_chat_post_endpoint(mock_marketing_agent):
    """Test POST /api/ai/marketing-chat endpoint"""
    response = client.post(
        "/api/ai/marketing-chat",
        json={
            "message": "What services do you offer?",
            "userId": "test-user-123",
            "conversationId": "conv-123"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "conversationId" in data
    assert data["response"] == "Hello! How can I help you today?"

def test_marketing_chat_post_validation_error():
    """Test POST endpoint with invalid request"""
    response = client.post(
        "/api/ai/marketing-chat",
        json={
            "message": "",  # Empty message should fail validation
            "userId": "test-user-123"
        }
    )

    assert response.status_code == 422  # Validation error

@pytest.mark.asyncio
async def test_marketing_chat_stream_post_endpoint(mock_marketing_agent):
    """Test POST /api/ai/marketing-chat/stream endpoint"""
    with client.stream(
        "POST",
        "/api/ai/marketing-chat/stream",
        json={
            "message": "Tell me about your services",
            "userId": "test-user-123",
            "conversationId": "conv-456"
        }
    ) as response:
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

        # Collect streamed chunks
        chunks = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                chunks.append(line[6:])  # Remove "data: " prefix

        # Verify we received chunks
        assert len(chunks) > 0

@pytest.mark.asyncio
async def test_marketing_chat_stream_get_endpoint(mock_marketing_agent):
    """Test GET /api/ai/marketing-chat/stream endpoint"""
    with client.stream(
        "GET",
        "/api/ai/marketing-chat/stream",
        params={
            "message": "What is your pricing?",
            "userId": "test-user-123",
            "conversationId": "conv-789"
        }
    ) as response:
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

        # Collect streamed chunks
        chunks = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                chunks.append(line[6:])

        assert len(chunks) > 0

def test_marketing_chat_stream_get_validation_error():
    """Test GET streaming endpoint with missing parameters"""
    response = client.get("/api/ai/marketing-chat/stream")

    assert response.status_code == 422  # Missing required query params

def test_marketing_chat_rate_limiting():
    """Test rate limiting on marketing chat endpoint"""
    # Make multiple rapid requests to trigger rate limit
    responses = []
    for _ in range(15):  # Limit is 10/minute
        response = client.post(
            "/api/ai/marketing-chat",
            json={
                "message": "Test message",
                "userId": "test-user-rate-limit"
            }
        )
        responses.append(response.status_code)

    # At least one should be rate limited (429)
    assert 429 in responses

def test_health_check_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

@pytest.mark.asyncio
async def test_streaming_content_filtering(mock_marketing_agent):
    """Test that streaming responses filter out internal content"""
    # Mock stream with internal content that should be filtered
    async def mock_stream_with_internal(*args, **kwargs):
        yield "Here is information about our services."
        yield "ToolInvocation(tool='search_kb')"  # Should be filtered
        yield "ValidationError: pydantic"  # Should be filtered
        yield "We offer AI automation."

    with patch.object(mock_marketing_agent, "generate_stream", mock_stream_with_internal):
        with client.stream(
            "POST",
            "/api/ai/marketing-chat/stream",
            json={
                "message": "Tell me about services",
                "userId": "test-user-filter"
            }
        ) as response:
            chunks = []
            for line in response.iter_lines():
                if line.startswith("data: "):
                    chunk_data = line[6:]
                    chunks.append(chunk_data)

            # Verify internal content is filtered
            full_response = "".join(chunks)
            assert "ToolInvocation" not in full_response
            assert "ValidationError" not in full_response
            assert "AI automation" in full_response
