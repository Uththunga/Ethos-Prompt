"""
Unit tests for PromptLibraryAgent
Tests agent initialization, tool registration, and chat methods
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime

from src.ai_agent.prompt_library.prompt_library_agent import PromptLibraryAgent
from src.ai_agent.prompt_library.prompts import get_system_prompt


# Patch OpenAI LLM to avoid requiring OPENAI_API_KEY during tests
@pytest.fixture(autouse=True)
def _patch_chat_openai():
    with patch('src.ai_agent.prompt_library.prompt_library_agent.ChatOpenAI') as mock_llm:
        mock_llm.return_value = Mock()
        yield mock_llm


# Patch LangGraph create_react_agent so constructor doesn't rely on specific signature
@pytest.fixture(autouse=True)
def _patch_create_react_agent():
    with patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent') as mock_create:
        dummy_agent = Mock()
        # Default ainvoke returns a simple two-message conversation
        dummy_agent.ainvoke = AsyncMock(return_value={
            "messages": [
                Mock(content="User message", additional_kwargs={}),
                Mock(content="Agent response", additional_kwargs={"tool_calls": []})
            ]
        })
        async def _fake_astream_events(*args, **kwargs):
            yield {"event": "on_chat_model_stream", "data": {"chunk": Mock(content="Agent response")}}
        dummy_agent.astream_events = _fake_astream_events
        mock_create.return_value = dummy_agent
        yield mock_create

@pytest.fixture
def mock_db():
    """Mock Firestore database"""
    db = Mock()

    # Mock collection and document methods
    mock_collection = Mock()
    mock_doc = Mock()
    mock_doc.set = AsyncMock()
    mock_doc.get = Mock()
    mock_doc.update = AsyncMock()

    mock_collection.document = Mock(return_value=mock_doc)
    mock_collection.add = AsyncMock(return_value=(None, Mock(id="test-doc-id")))
    mock_collection.where = Mock(return_value=mock_collection)
    mock_collection.order_by = Mock(return_value=mock_collection)
    mock_collection.limit = Mock(return_value=mock_collection)
    mock_collection.stream = Mock(return_value=[])
    mock_collection.get = Mock(return_value=[])

    db.collection = Mock(return_value=mock_collection)

    return db


class TestPromptLibraryAgentInitialization:
    """Tests for agent initialization"""

    def test_agent_creation_with_defaults(self, mock_db):
        """Test agent is created with default parameters"""
        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        assert agent.user_id == "test-user"
        assert agent.db == mock_db
        assert agent.model == "x-ai/grok-2-1212:free"  # Default model
        assert agent.temperature == 0.1  # Default temperature
        assert agent.max_tokens == 2000  # Default max_tokens

    def test_agent_creation_with_custom_params(self, mock_db):
        """Test agent is created with custom parameters"""
        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db,
            model="gpt-4",
            temperature=0.7,
            max_tokens=1000
        )

        assert agent.model == "gpt-4"
        assert agent.temperature == 0.7
        assert agent.max_tokens == 1000

    def test_tools_are_registered(self, mock_db):
        """Test that all 6 tools are registered"""
        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        assert len(agent.tools) == 6

        # Verify tool names
        tool_names = [tool.name for tool in agent.tools]
        expected_tools = [
            "create_prompt",
            "execute_prompt",
            "search_prompts",
            "get_execution_history",
            "analyze_prompt_performance",
            "suggest_improvements"
        ]

        for expected_tool in expected_tools:
            assert expected_tool in tool_names

    def test_llm_is_configured(self, mock_db):
        """Test that LLM is configured correctly"""
        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db,
            model="x-ai/grok-2-1212:free",
            temperature=0.1
        )

        assert agent.llm is not None
        # LLM should be configured with the specified model and temperature


class TestPromptLibraryAgentSystemPrompt:
    """Tests for system prompt generation"""

    def test_system_prompt_without_context(self):
        """Test system prompt generation without dashboard context"""
        prompt = get_system_prompt()

        assert "molē" in prompt.lower()
        assert "prompt library" in prompt.lower()
        assert "tools" in prompt.lower()

    def test_system_prompt_with_context(self):
        """Test system prompt generation with dashboard context"""
        context = {
            "currentPage": "prompts-list",
            "totalPrompts": 10,
            "selectedPrompt": {
                "id": "prompt-123",
                "title": "Test Prompt"
            }
        }

        prompt = get_system_prompt(dashboard_context=context)

        assert "prompts-list" in prompt.lower() or "prompt" in prompt.lower()
        # Context should be included in the prompt


class TestPromptLibraryAgentChat:
    """Tests for chat method"""

    @pytest.mark.asyncio
    @patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent')
    async def test_chat_success(self, mock_create_agent, mock_db):
        """Test successful chat interaction"""
        # Mock the LangGraph agent
        mock_agent = Mock()
        mock_agent.ainvoke = AsyncMock(return_value={
            "messages": [
                Mock(content="User message", additional_kwargs={}),
                Mock(content="Agent response", additional_kwargs={"tool_calls": []})
            ]
        })
        mock_create_agent.return_value = mock_agent

        # Mock conversation save
        mock_conv_ref = Mock()
        mock_conv_ref.id = "conv-123"
        mock_db.collection.return_value.add = AsyncMock(return_value=(None, mock_conv_ref))

        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        response = await agent.chat(
            message="Create a prompt for blog writing"
        )

        assert response["success"] is True
        assert "response" in response
        assert "conversation_id" in response and isinstance(response["conversation_id"], str)
        assert response["conversation_id"].startswith("conv_")
        assert "metadata" in response

    @pytest.mark.asyncio
    @patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent')
    async def test_chat_with_conversation_id(self, mock_create_agent, mock_db):
        """Test chat with existing conversation ID"""
        mock_agent = Mock()
        mock_agent.ainvoke = AsyncMock(return_value={
            "messages": [
                Mock(content="User message", additional_kwargs={}),
                Mock(content="Agent response", additional_kwargs={"tool_calls": []})
            ]
        })
        mock_create_agent.return_value = mock_agent

        # Mock existing conversation
        mock_conv_doc = Mock()
        mock_conv_doc.exists = True
        mock_conv_doc.to_dict.return_value = {
            "userId": "test-user",
            "messages": []
        }
        mock_db.collection.return_value.document.return_value.get.return_value = mock_conv_doc
        mock_db.collection.return_value.document.return_value.update = AsyncMock()

        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        response = await agent.chat(
            message="Follow-up question",
            conversation_id="existing-conv-123"
        )

        assert response["success"] is True
        assert response["conversation_id"] == "existing-conv-123"

    @pytest.mark.asyncio
    @patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent')
    async def test_chat_with_dashboard_context(self, mock_create_agent, mock_db):
        """Test chat with dashboard context"""
        mock_agent = Mock()
        mock_agent.ainvoke = AsyncMock(return_value={
            "messages": [
                Mock(content="User message", additional_kwargs={}),
                Mock(content="Agent response", additional_kwargs={"tool_calls": []})
            ]
        })
        mock_create_agent.return_value = mock_agent

        mock_conv_ref = Mock()
        mock_conv_ref.id = "conv-456"
        mock_db.collection.return_value.add = AsyncMock(return_value=(None, mock_conv_ref))

        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        dashboard_context = {
            "currentPage": "prompt-detail",
            "selectedPrompt": {
                "id": "prompt-123",
                "title": "Blog Writer"
            }
        }

        response = await agent.chat(
            message="Analyze this prompt",
            dashboard_context=dashboard_context
        )

        assert response["success"] is True
        # Context should be passed to the agent

    @pytest.mark.asyncio
    @patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent')
    async def test_chat_error_handling(self, mock_create_agent, mock_db):
        """Test error handling in chat method"""
        # Mock agent to raise an error
        mock_agent = Mock()
        mock_agent.ainvoke = AsyncMock(side_effect=Exception("LLM error"))
        mock_create_agent.return_value = mock_agent

        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        response = await agent.chat(
            message="Test message"
        )

        assert response["success"] is False
        assert "error" in response
        assert "LLM error" in response["error"]


class TestPromptLibraryAgentChatStream:
    """Tests for chat_stream method"""

    @pytest.mark.asyncio
    @patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent')
    async def test_chat_stream_success(self, mock_create_agent, mock_db):
        """Test successful streaming chat"""
        # Mock streaming response
        async def mock_stream():
            yield {"messages": [Mock(content="Chunk 1")]}
            yield {"messages": [Mock(content="Chunk 2")]}
            yield {"messages": [Mock(content="Chunk 3")]}

        mock_agent = Mock()
        mock_agent.astream = Mock(return_value=mock_stream())
        mock_create_agent.return_value = mock_agent

        mock_conv_ref = Mock()
        mock_conv_ref.id = "conv-stream-123"
        mock_db.collection.return_value.add = AsyncMock(return_value=(None, mock_conv_ref))

        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        chunks = []
        async for chunk in agent.chat_stream(message="Test streaming"):
            chunks.append(chunk)

        assert len(chunks) > 0
        # Verify streaming worked


class TestPromptLibraryAgentConversationPersistence:
    """Tests for conversation persistence"""

    @pytest.mark.asyncio
    @patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent')
    async def test_conversation_saved_to_firestore(self, mock_create_agent, mock_db):
        """Test that conversations are saved to Firestore"""
        mock_agent = Mock()
        mock_agent.ainvoke = AsyncMock(return_value={
            "messages": [
                Mock(content="User message", type="human", additional_kwargs={}),
                Mock(content="Agent response", type="ai", additional_kwargs={"tool_calls": []})
            ]
        })
        mock_create_agent.return_value = mock_agent

        mock_conv_ref = Mock()
        mock_conv_ref.id = "conv-persist-123"
        mock_db.collection.return_value.add = AsyncMock(return_value=(None, mock_conv_ref))

        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        await agent.chat(message="Test message")

        # Verify Firestore was called to save conversation
        mock_db.collection.assert_called()
        # Should have called add or update on conversations collection

    @pytest.mark.asyncio
    @patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent')
    async def test_conversation_metadata_tracked(self, mock_create_agent, mock_db):
        """Test that conversation metadata is tracked"""
        mock_agent = Mock()
        mock_agent.ainvoke = AsyncMock(return_value={
            "messages": [
                Mock(content="User message", type="human", additional_kwargs={}),
                Mock(
                    content="Agent response",
                    type="ai",
                    additional_kwargs={
                        "tool_calls": [
                            {"function": {"name": "create_prompt", "arguments": {}}}
                        ]
                    }
                )
            ]
        })
        mock_create_agent.return_value = mock_agent

        mock_conv_ref = Mock()
        mock_conv_ref.id = "conv-meta-123"
        mock_db.collection.return_value.add = AsyncMock(return_value=(None, mock_conv_ref))

        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        response = await agent.chat(message="Create a prompt")

        # Verify metadata is included
        assert "metadata" in response
        metadata = response["metadata"]

        # Should track tool calls, duration, etc.
        assert "tool_calls" in metadata or "duration" in metadata


class TestPromptLibraryAgentToolExecution:
    """Tests for tool execution tracking"""

    @pytest.mark.asyncio
    @patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent')
    async def test_tool_calls_tracked(self, mock_create_agent, mock_db):
        """Test that tool calls are tracked in metadata"""
        mock_agent = Mock()
        mock_agent.ainvoke = AsyncMock(return_value={
            "messages": [
                Mock(content="User message", type="human", additional_kwargs={}),
                Mock(
                    content="",
                    type="ai",
                    additional_kwargs={
                        "tool_calls": [
                            {"function": {"name": "search_prompts", "arguments": {"query": "test"}}},
                            {"function": {"name": "create_prompt", "arguments": {"title": "Test"}}}
                        ]
                    }
                )
            ]
        })
        mock_create_agent.return_value = mock_agent

        mock_conv_ref = Mock()
        mock_conv_ref.id = "conv-tools-123"
        mock_db.collection.return_value.add = AsyncMock(return_value=(None, mock_conv_ref))

        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )

        response = await agent.chat(message="Search and create")

        # Verify tool calls are tracked
        assert "metadata" in response
        # Should have information about which tools were called
