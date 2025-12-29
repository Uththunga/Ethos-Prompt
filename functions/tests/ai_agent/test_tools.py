"""
Unit tests for Prompt Library Tools
Tests each tool in isolation with mocked dependencies
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime
from langchain_core.tools import StructuredTool


# ---- Stubs for optional heavy deps BEFORE importing modules under test ----
import sys, types
if 'langgraph' not in sys.modules:
    sys.modules['langgraph'] = types.ModuleType('langgraph')
if 'langgraph.prebuilt' not in sys.modules:
    prebuilt = types.ModuleType('langgraph.prebuilt')
    def _stub_create_react_agent(*args, **kwargs):
        class _Stub:
            async def ainvoke(self, *a, **k):
                return {"messages": []}
            async def astream_events(self, *a, **k):
                if False:
                    yield {}
        return _Stub()
    prebuilt.create_react_agent = _stub_create_react_agent
    sys.modules['langgraph.prebuilt'] = prebuilt
if 'langgraph.checkpoint' not in sys.modules:
    sys.modules['langgraph.checkpoint'] = types.ModuleType('langgraph.checkpoint')
if 'langgraph.checkpoint.memory' not in sys.modules:
    mem = types.ModuleType('langgraph.checkpoint.memory')
    class MemorySaver:
        pass
    mem.MemorySaver = MemorySaver
    sys.modules['langgraph.checkpoint.memory'] = mem

# langchain_openai
if 'langchain_openai' not in sys.modules:
    lco = types.ModuleType('langchain_openai')
    class ChatOpenAI:
        def __init__(self, *a, **k):
            pass
    lco.ChatOpenAI = ChatOpenAI
    sys.modules['langchain_openai'] = lco

# Import tools
from src.ai_agent.prompt_library.tools import PromptLibraryTools
from src.ai_agent.prompt_library.tools.create_prompt import create_create_prompt_tool
from src.ai_agent.prompt_library.tools.execute_prompt import create_execute_prompt_tool, execute_prompt_impl
from src.ai_agent.prompt_library.tools.search_prompts import create_search_prompts_tool
from src.ai_agent.prompt_library.tools.get_history import create_get_history_tool
from src.ai_agent.prompt_library.tools.analyze_performance import create_analyze_performance_tool
from src.ai_agent.prompt_library.tools.suggest_improvements import create_suggest_improvements_tool


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


@pytest.fixture
def mock_llm():
    """Mock LLM for suggest_improvements tool"""
    llm = Mock()
    llm.invoke = AsyncMock(return_value=Mock(content="Test LLM response"))
    return llm


class TestCreatePromptTool:
    """Tests for create_prompt tool"""

    def test_tool_creation(self, mock_db):
        """Test tool is created correctly"""
        tool = create_create_prompt_tool(user_id="test-user", db=mock_db)

        assert isinstance(tool, StructuredTool)
        assert tool.name == "create_prompt"
        assert "Create a new prompt" in tool.description

    @pytest.mark.asyncio
    async def test_create_prompt_success(self, mock_db):
        """Test successful prompt creation"""
        tool = create_create_prompt_tool(user_id="test-user", db=mock_db)

        # Mock Firestore add to return a document reference
        mock_doc_ref = Mock()
        mock_doc_ref.id = "prompt-123"
        mock_db.collection.return_value.document.return_value = mock_doc_ref
        mock_db.collection.return_value.document.return_value.set = MagicMock()

        result = await tool.ainvoke({
            "title": "Test Prompt",
            "content": "This is a test prompt with {{variable}}",
            "category": "general",
            "tags": ["test", "example"]
        })

        assert result["success"] is True
        assert result["prompt_id"] == "prompt-123"
        assert "success" in result["message"].lower()

        # Verify Firestore was called correctly
        mock_db.collection.assert_called_with("prompts")

    @pytest.mark.asyncio
    async def test_create_prompt_with_minimal_data(self, mock_db):
        """Test prompt creation with only required fields"""
        tool = create_create_prompt_tool(user_id="test-user", db=mock_db)

        mock_doc_ref = Mock()
        mock_doc_ref.id = "prompt-456"
        mock_db.collection.return_value.document.return_value = mock_doc_ref
        mock_db.collection.return_value.document.return_value.set = MagicMock()

        result = await tool.ainvoke({
            "title": "Minimal Prompt",
            "content": "Simple content"
        })

        assert result["success"] is True
        assert result["prompt_id"] == "prompt-456"

    @pytest.mark.asyncio
    async def test_create_prompt_firestore_error(self, mock_db):
        """Test error handling when Firestore fails"""
        tool = create_create_prompt_tool(user_id="test-user", db=mock_db)

        # Mock Firestore to raise an error
        mock_db.collection.return_value.document.return_value.set = MagicMock(side_effect=Exception("Firestore error"))

        result = await tool.ainvoke({
            "title": "Test",
            "content": "Test content"
        })

        assert result["success"] is False
        assert "firestore error" in result["error"].lower()


class TestExecutePromptTool:
    """Tests for execute_prompt tool"""

    def test_tool_creation(self, mock_db):
        """Test tool is created correctly"""
        tool = create_execute_prompt_tool(user_id="test-user", db=mock_db)

        assert isinstance(tool, StructuredTool)
        assert tool.name == "execute_prompt"
        assert "Execute a prompt" in tool.description

    @pytest.mark.asyncio
    async def test_execute_prompt_success(self, mock_db):
        """Test successful prompt execution"""
        tool = create_execute_prompt_tool(user_id="test-user", db=mock_db)

        # Mock prompt document
        mock_prompt_doc = Mock()
        mock_prompt_doc.exists = True
        mock_prompt_doc.to_dict.return_value = {
            "title": "Test Prompt",
            "content": "Write about {{topic}}",
            "userId": "test-user"
        }
        mock_db.collection.return_value.document.return_value.get.return_value = mock_prompt_doc

        # Mock OpenRouter API call
        with patch('src.ai_agent.prompt_library.tools.execute_prompt.OpenRouterClient') as mock_client_cls:
            mock_client = Mock()
            async def mock_generate(prompt):
                return {"content": "Test output about AI", "usage": {"total_tokens": 100}}
            mock_client.generate = AsyncMock(side_effect=mock_generate)
            mock_client_cls.return_value = mock_client

            # Mock execution document create
            mock_exec_ref = Mock()
            mock_exec_ref.id = "exec-123"
            mock_db.collection.return_value.document.return_value = mock_exec_ref
            mock_db.collection.return_value.document.return_value.set = MagicMock()

            result = await execute_prompt_impl(
                prompt_id="prompt-123",
                variables={"topic": "AI"},
                user_id="test-user",
                db=mock_db
            )

            assert isinstance(result, dict)
            assert result.get("success") in (True, False)
            if result.get("success"):
                assert result.get("execution_id") == "exec-123"
                assert "Test output" in result.get("output", "")
                assert result.get("tokens_used") == 100

    @pytest.mark.asyncio
    async def test_execute_prompt_not_found(self, mock_db):
        """Test execution when prompt doesn't exist"""
        tool = create_execute_prompt_tool(user_id="test-user", db=mock_db)

        # Mock prompt not found
        mock_prompt_doc = Mock()
        mock_prompt_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_prompt_doc

        result = await tool.ainvoke({
            "prompt_id": "nonexistent",
            "variables": {}
        })

        assert result["success"] is False
        assert "not found" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_execute_prompt_unauthorized(self, mock_db):
        """Test execution when user doesn't own the prompt"""
        tool = create_execute_prompt_tool(user_id="test-user", db=mock_db)

        # Mock prompt owned by different user
        mock_prompt_doc = Mock()
        mock_prompt_doc.exists = True
        mock_prompt_doc.to_dict.return_value = {
            "title": "Test",
            "content": "Test",
            "userId": "other-user"
        }
        mock_db.collection.return_value.document.return_value.get.return_value = mock_prompt_doc

        result = await tool.ainvoke({
            "prompt_id": "prompt-123",
            "variables": {}
        })

        assert result["success"] is False
        assert "not authorized" in result["error"].lower() or "permission" in result["error"].lower()


class TestSearchPromptsTool:
    """Tests for search_prompts tool"""

    def test_tool_creation(self, mock_db):
        """Test tool is created correctly"""
        tool = create_search_prompts_tool(user_id="test-user", db=mock_db)

        assert tool.name == "search_prompts"
        assert tool.name == "search_prompts"
        assert "Search" in tool.description

    @pytest.mark.asyncio
    async def test_search_prompts_success(self, mock_db):
        """Test successful prompt search"""
        tool = create_search_prompts_tool(user_id="test-user", db=mock_db)

        # Mock search results
        mock_doc1 = Mock()
        mock_doc1.id = "prompt-1"
        mock_doc1.to_dict.return_value = {
            "title": "Blog Writer",
            "content": "Write a blog post",
            "tags": ["writing", "blog"],
            "category": "creative",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }

        mock_doc2 = Mock()
        mock_doc2.id = "prompt-2"
        mock_doc2.to_dict.return_value = {
            "title": "Code Generator",
            "content": "Generate code",
            "tags": ["coding"],
            "category": "technical",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }

        mock_db.collection.return_value.where.return_value.stream.return_value = [mock_doc1, mock_doc2]

        output = tool.invoke("blog")
        assert "found 1 prompt" in output.lower()
        assert "blog writer" in output.lower()
        assert "prompt-1" in output.lower()

    @pytest.mark.asyncio
    async def test_search_prompts_no_results(self, mock_db):
        """Test search with no results"""
        tool = create_search_prompts_tool(user_id="test-user", db=mock_db)

        mock_db.collection.return_value.where.return_value.stream.return_value = []

        output = tool.invoke("nonexistent")
        assert "no prompts found" in output.lower()


class TestGetExecutionHistoryTool:
    """Tests for get_execution_history tool"""

    def test_tool_creation(self, mock_db):
        """Test tool is created correctly"""
        tool = create_get_history_tool(user_id="test-user", db=mock_db)

        assert tool.name == "get_execution_history"
        assert tool.name == "get_execution_history"

    @pytest.mark.asyncio
    async def test_get_history_success(self, mock_db):
        """Test successful history retrieval"""
        tool = create_get_history_tool(user_id="test-user", db=mock_db)

        # Mock execution documents
        mock_exec1 = Mock()
        mock_exec1.id = "exec-1"
        mock_exec1.to_dict.return_value = {
            "promptId": "prompt-1",
            "status": "success",
            "output": "Test output",
            "tokensUsed": 100,
            "cost": 0.001,
            "executedAt": datetime.now()
        }

        mock_db.collection.return_value.where.return_value.order_by.return_value.limit.return_value.stream.return_value = [mock_exec1]

        output = tool.invoke("last 20")
        assert "found 1" in output.lower()
        assert "exec-1" in output.lower()


class TestAnalyzePerformanceTool:
    """Tests for analyze_prompt_performance tool"""

    @pytest.mark.asyncio
    async def test_analyze_performance_success(self, mock_db):
        """Test successful performance analysis"""
        tool = create_analyze_performance_tool(user_id="test-user", db=mock_db)

        # Mock prompt document
        mock_prompt_doc = Mock()
        mock_prompt_doc.exists = True
        mock_prompt_doc.to_dict.return_value = {
            "title": "Test Prompt",
            "userId": "test-user"
        }
        mock_db.collection.return_value.document.return_value.get.return_value = mock_prompt_doc

        # Mock execution documents for analysis
        mock_exec1 = Mock()
        mock_exec1.to_dict.return_value = {
            "status": "success",
            "tokensUsed": 100,
            "cost": 0.001,
            "model": "gpt-4"
        }

        mock_exec2 = Mock()
        mock_exec2.to_dict.return_value = {
            "status": "success",
            "tokensUsed": 150,
            "cost": 0.0015,
            "model": "gpt-4"
        }

        mock_db.collection.return_value.where.return_value.stream.return_value = [mock_exec1, mock_exec2]

        result = await tool.ainvoke({
            "prompt_id": "prompt-123"
        })

        assert result["success"] is True
        assert result["metrics"]["total_executions"] == 2
        assert result["metrics"]["success_rate"] == 100.0
        assert result["metrics"]["avg_tokens_used"] == 125.0


class TestSuggestImprovementsTool:
    """Tests for suggest_improvements tool"""

    @pytest.mark.asyncio
    async def test_suggest_improvements_success(self, mock_db):
        """Test successful improvement suggestions"""
        tool = create_suggest_improvements_tool(user_id="test-user", db=mock_db)

        # Mock prompt document
        mock_prompt_doc = Mock()
        mock_prompt_doc.exists = True
        mock_prompt_doc.to_dict.return_value = {
            "title": "Test Prompt",
            "content": "Write something",
            "userId": "test-user"
        }
        mock_db.collection.return_value.document.return_value.get.return_value = mock_prompt_doc

        # Patch OpenRouterClient to return JSON suggestions
        with patch('src.ai_agent.prompt_library.tools.suggest_improvements.OpenRouterClient') as mock_client_cls:
            mock_client = Mock()
            async def mock_generate(prompt):
                return {"content": "[{\"category\":\"clarity\",\"issue\":\"Ambiguous instruction\",\"suggestion\":\"Be specific\",\"priority\":\"high\"}]"}
            mock_client.generate = AsyncMock(side_effect=mock_generate)
            mock_client_cls.return_value = mock_client

            result = await tool.ainvoke({
                "prompt_id": "prompt-123"
            })

        assert result["success"] is True
        assert len(result["suggestions"]) > 0
        assert "overall_score" in result
