"""
Unit tests for new Prompt Library tools: update_prompt, delete_prompt, list_prompts
These tests avoid importing the full agent to prevent optional deps (langgraph) from being required.
"""

import pytest
from unittest.mock import Mock, MagicMock
from datetime import datetime, timezone, timedelta
from langchain_core.tools import StructuredTool

# Avoid requiring optional heavy deps during tests by stubbing their modules
import sys, types
# langgraph stubs
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
    class MemorySaver:  # minimal stub
        pass
    mem.MemorySaver = MemorySaver
    sys.modules['langgraph.checkpoint.memory'] = mem
# langchain_openai stub
if 'langchain_openai' not in sys.modules:
    lco = types.ModuleType('langchain_openai')
    class ChatOpenAI:
        def __init__(self, *a, **k):
            pass
    lco.ChatOpenAI = ChatOpenAI
    sys.modules['langchain_openai'] = lco
# firebase_admin.firestore stub
if 'firebase_admin' not in sys.modules:
    fa = types.ModuleType('firebase_admin')
    fs = types.ModuleType('firebase_admin.firestore')
    class _ArrayUnion:
        def __init__(self, v):
            self.v = v
    class _Increment:
        def __init__(self, v):
            self.v = v
    fs.ArrayUnion = _ArrayUnion
    fs.Increment = _Increment
    fs.SERVER_TIMESTAMP = object()
    sys.modules['firebase_admin'] = fa
    sys.modules['firebase_admin.firestore'] = fs
    fa.firestore = fs

from src.ai_agent.prompt_library.tools.update_prompt import create_update_prompt_tool
from src.ai_agent.prompt_library.tools.delete_prompt import create_delete_prompt_tool
from src.ai_agent.prompt_library.tools.list_prompts import create_list_prompts_tool


@pytest.fixture
def mock_db():
    """Create a minimal Firestore-like mock used by PromptService"""
    db = Mock()
    mock_collection = Mock()
    db.collection.return_value = mock_collection

    # Each test can override behaviors as needed
    return db


class TestUpdatePromptTool:
    def test_tool_creation(self, mock_db):
        tool = create_update_prompt_tool(user_id="test-user", db=mock_db)
        assert isinstance(tool, StructuredTool)
        assert tool.name == "update_prompt"
        assert "Update an existing prompt" in tool.description

    def test_update_prompt_success(self, mock_db):
        tool = create_update_prompt_tool(user_id="test-user", db=mock_db)

        # Mock prompt reference and get/update behavior
        prompt_ref = Mock()
        # First get() returns existing prompt; second get() returns updated prompt
        before_doc = Mock()
        before_doc.exists = True
        before_doc.to_dict.return_value = {
            "promptId": "prompt-123",
            "userId": "test-user",
            "title": "Old Title",
            "content": "Old content",
            "version": 1,
            "deletedAt": None,
        }
        after_doc = Mock()
        after_doc.exists = True
        after_doc.to_dict.return_value = {
            "promptId": "prompt-123",
            "userId": "test-user",
            "title": "New Title",
            "content": "New content",
            "version": 2,
            "deletedAt": None,
        }
        prompt_ref.get.side_effect = [before_doc, after_doc]
        mock_db.collection.return_value.document.return_value = prompt_ref

        result = tool.invoke({
            "prompt_id": "prompt-123",
            "title": "New Title",
            "content": "New content",
        })

        assert result["success"] is True
        assert result["prompt_id"] == "prompt-123"
        assert result["updated_prompt"]["version"] == 2
        assert "Updated prompt" in result["message"]
        prompt_ref.update.assert_called_once()

    def test_update_prompt_permission_error(self, mock_db):
        tool = create_update_prompt_tool(user_id="test-user", db=mock_db)

        prompt_ref = Mock()
        before_doc = Mock()
        before_doc.exists = True
        before_doc.to_dict.return_value = {
            "promptId": "prompt-123",
            "userId": "other-user",
            "title": "Old Title",
            "content": "Old content",
            "version": 1,
            "deletedAt": None,
        }
        prompt_ref.get.return_value = before_doc
        mock_db.collection.return_value.document.return_value = prompt_ref

        result = tool.invoke({
            "prompt_id": "prompt-123",
            "title": "New Title",
        })

        assert result["success"] is False
        assert "permission" in result["error"].lower() or "not" in result["error"].lower()


class TestDeletePromptTool:
    def test_tool_creation(self, mock_db):
        tool = create_delete_prompt_tool(user_id="test-user", db=mock_db)
        assert isinstance(tool, StructuredTool)
        assert tool.name == "delete_prompt"

    def test_soft_delete_prompt(self, mock_db):
        tool = create_delete_prompt_tool(user_id="test-user", db=mock_db)

        prompt_ref = Mock()
        doc = Mock()
        doc.exists = True
        doc.to_dict.return_value = {"userId": "test-user", "deletedAt": None}
        prompt_ref.get.return_value = doc
        mock_db.collection.return_value.document.return_value = prompt_ref

        result = tool.invoke({"prompt_id": "prompt-123"})
        assert result["success"] is True
        prompt_ref.update.assert_called_once()
        prompt_ref.delete.assert_not_called()

    def test_hard_delete_prompt(self, mock_db):
        tool = create_delete_prompt_tool(user_id="test-user", db=mock_db)

        prompt_ref = Mock()
        doc = Mock()
        doc.exists = True
        doc.to_dict.return_value = {"userId": "test-user", "deletedAt": None}
        prompt_ref.get.return_value = doc
        mock_db.collection.return_value.document.return_value = prompt_ref

        result = tool.invoke({"prompt_id": "prompt-123", "hard_delete": True})
        assert result["success"] is True
        prompt_ref.delete.assert_called_once()


class TestListPromptsTool:
    def test_tool_creation(self, mock_db):
        tool = create_list_prompts_tool(user_id="test-user", db=mock_db)
        assert isinstance(tool, StructuredTool)
        assert tool.name == "list_prompts"

    def test_list_prompts_basic(self, mock_db):
        tool = create_list_prompts_tool(user_id="test-user", db=mock_db)

        # Mock chain: collection().where(...).where(...).stream()
        mock_collection = Mock()
        mock_db.collection.return_value = mock_collection
        mock_collection.where.return_value = mock_collection

        # Create mock docs
        now = datetime.now(timezone.utc)
        d1 = Mock(); d1.to_dict.return_value = {"title": "A", "updatedAt": now - timedelta(minutes=3), "tags": ["a"], "category": "general"}
        d2 = Mock(); d2.to_dict.return_value = {"title": "B", "updatedAt": now - timedelta(minutes=1), "tags": ["b"], "category": "creative"}
        d3 = Mock(); d3.to_dict.return_value = {"title": "C", "updatedAt": now - timedelta(minutes=2), "tags": ["a","b"], "category": "technical"}
        mock_collection.stream.return_value = [d1, d2, d3]

        result = tool.invoke({"limit": 10, "offset": 0})
        assert result["success"] is True
        assert result["total"] == 3
        # Sorted desc by updatedAt -> B, C, A
        titles = [p["title"] for p in result["prompts"]]
        assert titles == ["B", "C", "A"]

    def test_list_prompts_with_filters(self, mock_db):
        tool = create_list_prompts_tool(user_id="test-user", db=mock_db)

        mock_collection = Mock()
        mock_db.collection.return_value = mock_collection
        mock_collection.where.return_value = mock_collection

        now = datetime.now(timezone.utc)
        d1 = Mock(); d1.to_dict.return_value = {"title": "A", "updatedAt": now, "tags": ["x"], "category": "general"}
        d2 = Mock(); d2.to_dict.return_value = {"title": "B", "updatedAt": now, "tags": ["y"], "category": "creative"}
        d3 = Mock(); d3.to_dict.return_value = {"title": "C", "updatedAt": now, "tags": ["x","y"], "category": "technical"}
        mock_collection.stream.return_value = [d1, d2, d3]

        # Filter by category
        res_cat = tool.invoke({"category": "creative"})
        assert res_cat["total"] == 1
        assert res_cat["prompts"][0]["title"] == "B"

        # Filter by tags
        res_tags = tool.invoke({"tags": ["x"]})
        assert res_tags["total"] == 2


    def test_list_prompts_invalid_pagination(self, mock_db):
        tool = create_list_prompts_tool(user_id="test-user", db=mock_db)
        # limit too low should raise schema validation error before tool runs
        with pytest.raises(Exception) as e1:
            tool.invoke({"limit": 0})
        assert "validation" in str(e1.value).lower()
        # limit too high should also raise
        with pytest.raises(Exception) as e2:
            tool.invoke({"limit": 101})
        assert "validation" in str(e2.value).lower()

    def test_delete_prompt_permission_error(self, mock_db):
        tool = create_delete_prompt_tool(user_id="test-user", db=mock_db)
        prompt_ref = Mock()
        doc = Mock()
        doc.exists = True
        doc.to_dict.return_value = {"userId": "other-user", "deletedAt": None}
        prompt_ref.get.return_value = doc
        mock_db.collection.return_value.document.return_value = prompt_ref
        res = tool.invoke({"prompt_id": "prompt-123"})
        assert res["success"] is False
        assert res.get("error")

    def test_update_prompt_invalid_input(self, mock_db):
        tool = create_update_prompt_tool(user_id="test-user", db=mock_db)
        # prompt_id too short should raise schema validation error
        with pytest.raises(Exception) as e:
            tool.invoke({"prompt_id": "short", "title": "New"})
        assert "validation" in str(e.value).lower()

    def test_update_prompt_not_found(self, mock_db):
        tool = create_update_prompt_tool(user_id="test-user", db=mock_db)
        prompt_ref = Mock()
        doc = Mock(); doc.exists = False
        prompt_ref.get.return_value = doc
        mock_db.collection.return_value.document.return_value = prompt_ref
        res = tool.invoke({"prompt_id": "prompt-404", "title": "X"})
        assert res["success"] is False

    def test_list_prompts_user_scoping(self, mock_db, monkeypatch):
        # Ensure tool passes the authenticated user_id to service
        import src.ai_agent.prompt_library.tools.list_prompts as lp
        captured = {}
        async def fake_list_prompts(self, user_id, **kwargs):
            captured['user_id'] = user_id
            return {"prompts": [], "total": 0, "limit": 20, "offset": 0, "hasMore": False}
        monkeypatch.setattr(lp.PromptService, "list_prompts", fake_list_prompts, raising=True)

        tool = create_list_prompts_tool(user_id="test-user", db=mock_db)
        res = tool.invoke({})
        assert res["success"] is True
        assert captured.get("user_id") == "test-user"
