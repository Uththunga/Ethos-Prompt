"""
Pytest configuration and fixtures
"""
import pytest
import asyncio
from unittest.mock import Mock, MagicMock
from datetime import datetime, timezone
from decimal import Decimal


@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_firestore_client():
    """Mock Firestore client"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_document = MagicMock()

    mock_db.collection.return_value = mock_collection
    mock_collection.document.return_value = mock_document

    return mock_db


@pytest.fixture
def mock_openrouter_response():
    """Mock OpenRouter API response"""
    return {
        "id": "gen-123",
        "model": "openai/gpt-3.5-turbo",
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "This is a test response"
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 5,
            "total_tokens": 15
        }
    }


@pytest.fixture
def sample_prompt_data():
    """Sample prompt data for testing"""
    return {
        "id": "prompt-123",
        "title": "Test Prompt",
        "content": "Hello {name}, how are you?",
        "userId": "user-123",
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }


@pytest.fixture
def sample_cost_entry():
    """Sample cost entry for testing"""
    from src.llm.cost_tracker import CostEntry

    return CostEntry(
        user_id="user-123",
        provider="openai",
        model="gpt-3.5-turbo",
        tokens_used=100,
        cost=Decimal("0.000150"),
        timestamp=datetime.now(timezone.utc),
        request_id="req-123",
        endpoint="execute_prompt",
        metadata={"test": True}
    )


@pytest.fixture
def sample_execution_result():
    """Sample execution result"""
    return {
        "output": "Hello John, how are you?",
        "context": "",
        "metadata": {
            "model": "openai/gpt-3.5-turbo",
            "executionTime": 1.5,
            "tokensUsed": 15,
            "promptTokens": 10,
            "completionTokens": 5,
            "cost": 0.000023,
            "finishReason": "stop",
            "useRag": False,
            "contextMetadata": {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }


@pytest.fixture
def mock_vector_store(mock_firestore_client):
    """Mock vector store with Firestore client"""
    from src.rag.vector_store import VectorStore
    return VectorStore(firestore_client=mock_firestore_client)


# ============================================================================
# Prompt Library Agent Fixtures
# ============================================================================

@pytest.fixture
def sample_prompt_library_data():
    """Sample prompt data for prompt library tests"""
    return {
        "prompt_id": "prompt-pl-123",
        "title": "Blog Post Writer",
        "content": "Write a blog post about {{topic}} in {{tone}} tone",
        "category": "creative",
        "tags": ["writing", "blog", "content"],
        "userId": "test-user-123",
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
        "version": 1
    }


@pytest.fixture
def sample_execution_data():
    """Sample execution data for prompt library tests"""
    return {
        "execution_id": "exec-123",
        "promptId": "prompt-pl-123",
        "userId": "test-user-123",
        "status": "success",
        "output": "Here is a blog post about AI...",
        "variables": {"topic": "AI", "tone": "professional"},
        "model": "gpt-4",
        "tokensUsed": 250,
        "cost": 0.005,
        "createdAt": datetime.now(timezone.utc)
    }


@pytest.fixture
def sample_conversation_data():
    """Sample conversation data for agent tests"""
    return {
        "conversation_id": "conv-123",
        "userId": "test-user-123",
        "messages": [
            {
                "role": "user",
                "content": "Create a prompt for blog writing",
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            {
                "role": "assistant",
                "content": "I'll help you create a blog writing prompt.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "tool_calls": ["create_prompt"]
            }
        ],
        "metadata": {
            "tool_calls": ["create_prompt"],
            "total_tokens": 150,
            "duration": 2.5
        },
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }


@pytest.fixture
def mock_llm():
    """Mock LLM for agent tests"""
    mock = Mock()
    mock.invoke = Mock(return_value=Mock(content="Mocked LLM response"))
    return mock


@pytest.fixture
def mock_agent_tools():
    """Mock tools for agent tests"""
    from langchain_core.tools import StructuredTool

    def mock_create_prompt(**kwargs):
        return {"success": True, "prompt_id": "new-prompt-123", "message": "Prompt created"}

    def mock_execute_prompt(**kwargs):
        return {"success": True, "execution_id": "exec-456", "output": "Test output", "tokens_used": 100, "cost": 0.001}

    def mock_search_prompts(**kwargs):
        return {"success": True, "results": [], "total_results": 0}

    tools = [
        StructuredTool.from_function(
            func=mock_create_prompt,
            name="create_prompt",
            description="Create a new prompt"
        ),
        StructuredTool.from_function(
            func=mock_execute_prompt,
            name="execute_prompt",
            description="Execute a prompt"
        ),
        StructuredTool.from_function(
            func=mock_search_prompts,
            name="search_prompts",
            description="Search prompts"
        )
    ]

    return tools


@pytest.fixture
def mock_dashboard_context():
    """Mock dashboard context for tests"""
    return {
        "currentPage": "prompts-list",
        "selectedPrompt": {
            "id": "prompt-123",
            "title": "Test Prompt"
        },
        "recentExecutions": [
            {
                "id": "exec-1",
                "status": "success",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ],
        "totalPrompts": 10,
        "userPreferences": {
            "defaultModel": "gpt-4",
            "defaultTemperature": 0.7
        }
    }



# ============================================================================
# Marketing Agent Fixtures
# ============================================================================

@pytest.fixture
def mock_marketing_retriever():
    """Mock marketing retriever"""
    mock = Mock()
    mock.search = Mock(return_value=[
        {"content": "EthosPrompt offers AI automation services.", "metadata": {"source": "services"}},
        {"content": "Pricing starts at $5000.", "metadata": {"source": "pricing"}}
    ])
    return mock

@pytest.fixture
def mock_marketing_tools():
    """Mock marketing tools"""
    from langchain_core.tools import StructuredTool

    def mock_search_kb(query: str):
        return "Mocked KB search result"

    def mock_get_pricing(service_type: str):
        return "Mocked pricing info"

    def mock_request_consultation(email: str, topic: str):
        return "Consultation requested"

    return [
        StructuredTool.from_function(func=mock_search_kb, name="search_kb"),
        StructuredTool.from_function(func=mock_get_pricing, name="get_pricing"),
        StructuredTool.from_function(func=mock_request_consultation, name="request_consultation")
    ]
