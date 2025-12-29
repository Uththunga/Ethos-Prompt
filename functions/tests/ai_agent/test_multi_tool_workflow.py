"""
End-to-end multi-tool workflow test (list -> update -> delete) using monkeypatches.
This verifies tools chain correctly without requiring external services.
"""
import sys, types
from unittest.mock import Mock

# Stubs to avoid optional heavy deps in imports
if 'langgraph' not in sys.modules:
    sys.modules['langgraph'] = types.ModuleType('langgraph')
if 'langgraph.prebuilt' not in sys.modules:
    pre = types.ModuleType('langgraph.prebuilt')
    def create_react_agent(*a, **k):
        class _A: pass
        return _A()
    pre.create_react_agent = create_react_agent
    sys.modules['langgraph.prebuilt'] = pre
if 'langgraph.checkpoint' not in sys.modules:
    sys.modules['langgraph.checkpoint'] = types.ModuleType('langgraph.checkpoint')
if 'langgraph.checkpoint.memory' not in sys.modules:
    mem = types.ModuleType('langgraph.checkpoint.memory')
    class MemorySaver: pass
    mem.MemorySaver = MemorySaver
    sys.modules['langgraph.checkpoint.memory'] = mem
if 'langchain_openai' not in sys.modules:
    lco = types.ModuleType('langchain_openai')
    class ChatOpenAI: pass
    lco.ChatOpenAI = ChatOpenAI
    sys.modules['langchain_openai'] = lco

from src.ai_agent.prompt_library.tools.list_prompts import create_list_prompts_tool
from src.ai_agent.prompt_library.tools.update_prompt import create_update_prompt_tool
from src.ai_agent.prompt_library.tools.delete_prompt import create_delete_prompt_tool


def test_multi_tool_list_update_delete(monkeypatch):
    mock_db = Mock()

    # Patch service methods to simulate stateful behavior
    prompts_store = {
        'prompt-0001': {"promptId": "prompt-0001", "userId": "u1", "title": "Alpha", "content": "c1", "version": 1, "deletedAt": None},
        'prompt-0002': {"promptId": "prompt-0002", "userId": "u1", "title": "Beta", "content": "c2", "version": 1, "deletedAt": None},
    }

    async def fake_list_prompts(self, user_id, category=None, tags=None, limit=20, offset=0, include_public=False):
        items = [p for p in prompts_store.values() if p["userId"] == user_id and p.get("deletedAt") is None]
        items_sorted = sorted(items, key=lambda x: x.get("title"))
        return {"prompts": items_sorted, "total": len(items_sorted), "limit": limit, "offset": offset, "hasMore": False}

    async def fake_update_prompt(self, prompt_id, user_id, update_data, save_version=True):
        p = prompts_store[prompt_id]
        if p["userId"] != user_id:
            raise PermissionError("no permission")
        if update_data.title is not None:
            p["title"] = update_data.title
        p["version"] = p.get("version", 1) + 1
        return p

    async def fake_delete_prompt(self, prompt_id, user_id, hard_delete=False):
        p = prompts_store[prompt_id]
        if p["userId"] != user_id:
            raise PermissionError("no permission")
        if hard_delete:
            del prompts_store[prompt_id]
        else:
            p["deletedAt"] = True
        return True

    # Apply patches to PromptService used by tools
    import src.ai_agent.prompt_library.tools.list_prompts as lp
    import src.ai_agent.prompt_library.tools.update_prompt as up
    import src.ai_agent.prompt_library.tools.delete_prompt as dp
    monkeypatch.setattr(lp.PromptService, "list_prompts", fake_list_prompts, raising=True)
    monkeypatch.setattr(up.PromptService, "update_prompt", fake_update_prompt, raising=True)
    monkeypatch.setattr(dp.PromptService, "delete_prompt", fake_delete_prompt, raising=True)

    list_tool = create_list_prompts_tool("u1", mock_db)
    update_tool = create_update_prompt_tool("u1", mock_db)
    delete_tool = create_delete_prompt_tool("u1", mock_db)

    # 1) List
    res_list = list_tool.invoke({})
    assert res_list["success"] is True
    assert res_list["total"] == 2

    # 2) Update p1 title
    res_update = update_tool.invoke({"prompt_id": "prompt-0001", "title": "Alpha v2"})
    assert res_update["success"] is True
    assert res_update["updated_prompt"]["version"] == 2
    assert prompts_store["prompt-0001"]["title"] == "Alpha v2"

    # 3) Soft delete prompt-0002
    res_delete = delete_tool.invoke({"prompt_id": "prompt-0002"})
    assert res_delete["success"] is True

    # 4) List should now return only 1 prompt
    res_list2 = list_tool.invoke({})
    assert res_list2["total"] == 1
