"""
Endpoint integration test (mocked) for /api/ai/prompt-library-chat
- Verifies dependency override for auth, stubs for heavy modules, and that
  endpoint surfaces tool_calls metadata and conversation_id
"""

import sys, types
from unittest.mock import Mock
from fastapi.testclient import TestClient

# ---- Stubs for optional heavy deps BEFORE importing app ----
# langgraph
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

# firebase_admin.firestore
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
    fs.client = lambda: Mock()
    sys.modules['firebase_admin'] = fa
    sys.modules['firebase_admin.firestore'] = fs
    fa.firestore = fs

    # Stub firebase_admin.auth as well
    auth_mod = types.ModuleType('firebase_admin.auth')
    def _verify_id_token(token):
        return {"uid": "test-user"}
    auth_mod.verify_id_token = _verify_id_token
    sys.modules['firebase_admin.auth'] = auth_mod
    fa.auth = auth_mod


# ---- Imports under test ----
from src.api.main import app, get_current_user


def test_prompt_library_chat_endpoint_mocked(monkeypatch):
    # Override auth dependency to bypass token validation
    app.dependency_overrides[get_current_user] = lambda authorization=None: {"uid": "test-user"}

    # Monkeypatch PromptLibraryAgent.chat to return a canned response
    from src.ai_agent.prompt_library import prompt_library_agent as pla

    async def fake_chat(self, message: str, conversation_id=None, dashboard_context=None):
        return {
            "success": True,
            "response": "Here are your prompts: 2 found.",
            "conversation_id": conversation_id or "conv_test",
            "metadata": {
                "tool_calls": [
                    {"tool": "list_prompts", "arguments": "{}"},
                    {"tool": "update_prompt", "arguments": "p1"},
                    {"tool": "delete_prompt", "arguments": "p2"},
                ]
            }
        }

    monkeypatch.setattr(pla.PromptLibraryAgent, "chat", fake_chat, raising=True)

    client = TestClient(app)
    payload = {"message": "show my prompts", "conversation_id": None, "dashboard_context": {"currentPage": "dashboard"}}
    res = client.post("/api/ai/prompt-library-chat", json=payload, headers={"Authorization": "Bearer test"})

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["conversation_id"]
    assert isinstance(data.get("metadata", {}), dict)
    tc = data["metadata"].get("tool_calls")
    assert isinstance(tc, list) and {t.get("tool") for t in tc} >= {"list_prompts", "update_prompt", "delete_prompt"}
