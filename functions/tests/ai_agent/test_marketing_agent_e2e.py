"""
End-to-end tests for Marketing Agent
Tests full agent flow including initialization, chat, and streaming
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import sys
import os

# Mock environment variables for tests
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

@pytest.mark.asyncio
async def test_marketing_agent_initialization(mock_firestore_client):
    """Test that the marketing agent initializes correctly"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=mock_firestore_client)
    assert agent.db == mock_firestore_client
    # Verify tools are initialized
    assert hasattr(agent, 'tools')
    assert len(agent.tools) > 0

@pytest.mark.asyncio
async def test_marketing_agent_tools_registered(mock_firestore_client):
    """Test that all expected tools are registered"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=mock_firestore_client)
    tool_names = [t.name for t in agent.tools]

    assert "search_kb" in tool_names
    # Note: get_pricing was removed in pricing strategy update (quote-based system)
    assert "request_consultation" in tool_names


@pytest.mark.asyncio
async def test_marketing_agent_has_agent_attribute(mock_firestore_client):
    """Test that agent has LangGraph agent attribute"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=mock_firestore_client)

    # Agent uses LangGraph pattern with .agent attribute
    assert hasattr(agent, 'agent')
    assert agent.agent is not None

@pytest.mark.asyncio
async def test_search_kb_tool_callable(mock_firestore_client):
    """Test that search_kb tool can be called and returns a string"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=mock_firestore_client)
    search_kb_tool = next((t for t in agent.tools if t.name == "search_kb"), None)

    assert search_kb_tool is not None
    assert hasattr(search_kb_tool, 'description')
    # Updated after context optimization: tool description shortened from "knowledge base" to "KB"
    assert "kb" in search_kb_tool.description.lower() or "knowledge base" in search_kb_tool.description.lower()

    # Test tool execution using ainvoke (LangChain tool method)
    # The tool will return fallback content since KB is not mocked
    result = await search_kb_tool.ainvoke({"query": "test query"})
    assert isinstance(result, str)
    assert len(result) > 0
    # Tool should return helpful fallback content even without KB
    assert "EthosPrompt" in result or "help" in result.lower() or "consultation" in result.lower()

@pytest.mark.asyncio
async def test_request_consultation_tool_callable(mock_firestore_client):
    """Test that request_consultation tool can be called"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=mock_firestore_client)
    request_consultation_tool = next((t for t in agent.tools if t.name == "request_consultation"), None)

    assert request_consultation_tool is not None
    assert hasattr(request_consultation_tool, 'description')
    assert "consultation" in request_consultation_tool.description.lower()

    # Test tool execution using ainvoke (LangChain tool method)
    result = await request_consultation_tool.ainvoke({
        "name": "Test User",
        "email": "test@example.com",
        "project_type": "AI Automation"
    })
    assert isinstance(result, str)
    assert "thank you" in result.lower() or "consultation" in result.lower() or "contact" in result.lower()

@pytest.mark.asyncio
async def test_marketing_agent_chat_response_structure(mock_firestore_client):
    """Test that chat() returns proper response structure"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=mock_firestore_client)

    response = await agent.chat(
        message="What services do you offer?",
        context={"page_context": "test", "conversation_id": "test123"}
    )

    # Response should have required fields
    assert "response" in response
    assert "sources" in response
    assert "suggested_questions" in response
    assert "metadata" in response
    assert "conversation_id" in response

    # Response content validation
    assert isinstance(response["response"], str)
    assert len(response["response"]) > 0
    assert isinstance(response["suggested_questions"], list)
