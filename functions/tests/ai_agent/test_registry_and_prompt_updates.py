"""
Integration-ish tests to verify:
- Tool registry exposes all 9 tools, including update/delete/list
- System prompt text lists new tools

These tests stub optional heavy deps (langgraph, langchain_openai, firebase_admin.firestore)
so they can run in a minimal environment.
"""

import sys, types
from unittest.mock import Mock

# -------- Stubs for optional deps (must be defined before imports) --------
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
    sys.modules['firebase_admin'] = fa
    sys.modules['firebase_admin.firestore'] = fs
    fa.firestore = fs

# -------- Imports under test --------
from src.ai_agent.prompt_library.tools import PromptLibraryTools
from src.ai_agent.prompt_library.prompts import get_system_prompt


def _mock_db():
    db = Mock()
    db.collection.return_value = Mock()
    return db


def test_tool_registry_includes_all_9_tools():
    registry = PromptLibraryTools(user_id="test-user", db=_mock_db())
    tools = registry.get_tools()
    names = {t.name for t in tools}

    assert len(tools) == 9, f"Expected 9 tools, got {len(tools)}: {sorted(names)}"
    assert {"update_prompt", "delete_prompt", "list_prompts"}.issubset(names)


def test_system_prompt_lists_new_tools():
    prompt = get_system_prompt()

    # Sanity: should mention a count of 9 tools
    assert "9 specialized tools" in prompt

    # Ensure new tool names are present in capabilities section
    for tool in ("update_prompt", "delete_prompt", "list_prompts"):
        assert tool in prompt, f"System prompt missing tool name: {tool}"

