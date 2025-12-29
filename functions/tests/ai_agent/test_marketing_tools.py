"""
Unit tests for Marketing Agent tools
Tests individual tool functionality in isolation
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.ai_agent.marketing.marketing_agent import MarketingAgent
import os

@pytest.fixture(autouse=True)
def mock_env_vars():
    """Set up required environment variables for tests"""
    with patch.dict(os.environ, {
        "USE_GRANITE_LLM": "true",
        "OPENROUTER_USE_MOCK": "true",
        "WATSONX_API_KEY": "mock_key",
        "WATSONX_PROJECT_ID": "mock_project",
        "WATSONX_URL": "https://mock.url",
        "ENVIRONMENT": "test"
    }):
        yield

@pytest.fixture
def agent_with_mocked_deps(mock_firestore_client):
    """Marketing agent with mocked dependencies"""
    # Patch the marketing_retriever instance, not the class
    with patch("src.ai_agent.marketing.marketing_agent.marketing_retriever"):
        agent = MarketingAgent(db=mock_firestore_client)
        return agent

def test_search_kb_tool_exists(agent_with_mocked_deps):
    """Test that search_kb tool is registered"""
    agent = agent_with_mocked_deps
    tool_names = [t.name for t in agent.tools]
    assert "search_kb" in tool_names

def test_request_consultation_tool_exists(agent_with_mocked_deps):
    """Test that request_consultation tool is registered"""
    agent = agent_with_mocked_deps
    tool_names = [t.name for t in agent.tools]
    assert "request_consultation" in tool_names

@pytest.mark.asyncio
async def test_search_kb_tool_execution(mock_firestore_client):
    """Test search_kb tool execution with mocked retriever"""
    # Patch the marketing_retriever instance
    with patch("src.ai_agent.marketing.marketing_agent.marketing_retriever") as mock_retriever:
        # Mock retriever search results
        mock_retriever.retrieve = AsyncMock(return_value=[
            {"content": "EthosPrompt offers AI automation services.", "score": 0.95, "title": "Services", "source": "marketing_kb"},
            {"content": "We specialize in custom software development.", "score": 0.88, "title": "Services", "source": "marketing_kb"}
        ])
        mock_retriever.format_context.return_value = "EthosPrompt offers AI automation services.\nWe specialize in custom software development."
        mock_retriever.get_sources.return_value = [{"index": 1, "title": "Services", "score": 0.95}]

        agent = MarketingAgent(db=mock_firestore_client)

        # Find and execute the search_kb tool
        search_kb_tool = next(t for t in agent.tools if t.name == "search_kb")
        result = await search_kb_tool.ainvoke({"query": "What services do you offer?"})

        # Verify result contains KB content
        assert "AI automation" in result
        assert "custom software development" in result

@pytest.mark.asyncio
async def test_request_consultation_tool_execution(mock_firestore_client):
    """Test request_consultation tool execution"""
    # Patch the marketing_retriever instance (even if not used directly, to prevent side effects)
    with patch("src.ai_agent.marketing.marketing_agent.marketing_retriever"):
        agent = MarketingAgent(db=mock_firestore_client)

        # Find and execute the request_consultation tool
        request_consultation_tool = next(t for t in agent.tools if t.name == "request_consultation")
        result = await request_consultation_tool.ainvoke({
            "name": "Test User",
            "email": "test@example.com",
            "project_type": "AI Automation",
            "message": "I need help with my business"
        })

        # Verify result confirms consultation request
        assert isinstance(result, str)
        assert "thank you" in result.lower() or "consultation" in result.lower()

def test_search_kb_tool_schema(agent_with_mocked_deps):
    """Test search_kb tool has proper schema"""
    agent = agent_with_mocked_deps
    search_kb_tool = next(t for t in agent.tools if t.name == "search_kb")

    # Verify tool has description
    assert search_kb_tool.description is not None
    assert len(search_kb_tool.description) > 0

    # Verify tool has args schema
    assert hasattr(search_kb_tool, "args_schema") or hasattr(search_kb_tool, "args")

def test_request_consultation_tool_schema(agent_with_mocked_deps):
    """Test request_consultation tool has proper schema"""
    agent = agent_with_mocked_deps
    request_consultation_tool = next(t for t in agent.tools if t.name == "request_consultation")

    # Verify tool has description
    assert request_consultation_tool.description is not None
    assert len(request_consultation_tool.description) > 0

@pytest.mark.asyncio
async def test_search_kb_empty_query_handling(mock_firestore_client):
    """Test search_kb handles empty queries gracefully"""
    with patch("src.ai_agent.marketing.marketing_agent.marketing_retriever") as mock_retriever:
        mock_retriever.retrieve = AsyncMock(return_value=[])

        agent = MarketingAgent(db=mock_firestore_client)
        search_kb_tool = next(t for t in agent.tools if t.name == "search_kb")

        result = await search_kb_tool.ainvoke({"query": ""})

        # Should return something even with empty query
        assert isinstance(result, str)
