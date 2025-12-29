"""
Integration tests for Prompt Library Agent
Tests end-to-end flows with Firestore emulator
"""

import pytest
import os
from unittest.mock import patch, Mock, AsyncMock
from datetime import datetime
from firebase_admin import firestore

from src.ai_agent.prompt_library.prompt_library_agent import PromptLibraryAgent
from src.ai_agent.prompt_library.tools import PromptLibraryTools


# Mark all tests in this file as integration tests
pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
def firestore_client():
    """
    Get Firestore client for emulator
    Assumes Firebase emulator is running
    """
    # Set emulator environment variable
    os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"

    # Initialize default Firebase app if not already initialized
    import firebase_admin
    if not firebase_admin._apps:
        firebase_admin.initialize_app()

    # Fast probe: check if emulator port is open; skip immediately if not
    import socket
    try:
        with socket.create_connection(("127.0.0.1", 8080), timeout=0.2):
            pass
    except OSError as e:
        pytest.skip(f"Firestore emulator not running: {e}")

    try:
        db = firestore.client()
        yield db
    finally:
        # Cleanup: delete all test data
        # Note: In real tests, you'd want to clean up specific collections
        pass


@pytest.fixture
async def test_user_id():
    """Generate a unique test user ID"""
    return f"test-user-{datetime.now().timestamp()}"


@pytest.fixture
async def agent_with_emulator(firestore_client, test_user_id):
    """Create agent with Firestore emulator"""
    # Mock LLM to avoid actual API calls
    with patch('src.ai_agent.prompt_library.prompt_library_agent.ChatOpenAI') as mock_llm_class:
        mock_llm = Mock()
        mock_llm.invoke = AsyncMock(return_value=Mock(content="Mocked LLM response"))
        mock_llm_class.return_value = mock_llm

        agent = PromptLibraryAgent(
            user_id=test_user_id,
            db=firestore_client,
            model="x-ai/grok-2-1212:free",
            temperature=0.1
        )

        yield agent


class TestPromptCreationFlow:
    """Test complete prompt creation flow"""

    @pytest.mark.asyncio
    async def test_create_prompt_end_to_end(self, firestore_client, test_user_id):
        """Test creating a prompt and verifying it in Firestore"""
        tools = PromptLibraryTools(user_id=test_user_id, db=firestore_client)
        create_tool = tools.get_tools()[0]  # create_prompt is first tool

        # Create a prompt
        result = await create_tool.ainvoke({
            "title": "Integration Test Prompt",
            "content": "This is a test prompt with {{variable}}",
            "category": "general",
            "tags": ["test", "integration"]
        })

        assert result["success"] is True
        prompt_id = result["prompt_id"]

        # Verify prompt exists in Firestore
        prompt_doc = firestore_client.collection("prompts").document(prompt_id).get()
        assert prompt_doc.exists

        prompt_data = prompt_doc.to_dict()
        assert prompt_data["title"] == "Integration Test Prompt"
        assert prompt_data["userId"] == test_user_id
        assert "test" in prompt_data["tags"]

        # Cleanup
        firestore_client.collection("prompts").document(prompt_id).delete()


class TestPromptExecutionFlow:
    """Test complete prompt execution flow"""

    @pytest.mark.asyncio
    async def test_execute_prompt_end_to_end(self, firestore_client, test_user_id):
        """Test creating and executing a prompt"""
        tools = PromptLibraryTools(user_id=test_user_id, db=firestore_client)

        # First, create a prompt
        create_tool = next(t for t in tools.get_tools() if t.name == "create_prompt")
        create_result = await create_tool.ainvoke({
            "title": "Test Execution Prompt",
            "content": "Write about {{topic}}",
            "category": "general"
        })

        assert create_result["success"] is True
        prompt_id = create_result["prompt_id"]

        # Mock OpenRouter API call
        with patch('src.ai_agent.prompt_library.tools.execute_prompt.requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "choices": [{
                    "message": {"content": "Test output about AI"}
                }],
                "usage": {"total_tokens": 100}
            }
            mock_post.return_value = mock_response

            # Execute the prompt
            execute_tool = next(t for t in tools.get_tools() if t.name == "execute_prompt")
            execute_result = await execute_tool.ainvoke({
                "prompt_id": prompt_id,
                "variables": {"topic": "AI"}
            })

            assert execute_result["success"] is True
            execution_id = execute_result["execution_id"]

            # Verify execution exists in Firestore
            exec_doc = firestore_client.collection("executions").document(execution_id).get()
            assert exec_doc.exists

            exec_data = exec_doc.to_dict()
            assert exec_data["promptId"] == prompt_id
            assert exec_data["userId"] == test_user_id
            assert exec_data["status"] == "success"

        # Cleanup
        firestore_client.collection("prompts").document(prompt_id).delete()
        if execution_id:
            firestore_client.collection("executions").document(execution_id).delete()


class TestSearchFlow:
    """Test prompt search flow"""

    @pytest.mark.asyncio
    async def test_search_prompts_end_to_end(self, firestore_client, test_user_id):
        """Test creating prompts and searching for them"""
        tools = PromptLibraryTools(user_id=test_user_id, db=firestore_client)
        create_tool = next(t for t in tools.get_tools() if t.name == "create_prompt")

        # Create multiple prompts
        prompt_ids = []

        for i in range(3):
            result = await create_tool.ainvoke({
                "title": f"Search Test Prompt {i}",
                "content": f"Content for prompt {i}",
                "category": "general",
                "tags": ["search-test"]
            })
            assert result["success"] is True
            prompt_ids.append(result["prompt_id"])

        # Search for prompts
        search_tool = next(t for t in tools.get_tools() if t.name == "search_prompts")
        search_result = await search_tool.ainvoke({
            "query": "Search Test",
            "limit": 10
        })

        assert search_result["success"] is True
        assert search_result["total_results"] >= 3

        # Cleanup
        for prompt_id in prompt_ids:
            firestore_client.collection("prompts").document(prompt_id).delete()


class TestAnalyticsFlow:
    """Test analytics and performance analysis flow"""

    @pytest.mark.asyncio
    async def test_analyze_performance_end_to_end(self, firestore_client, test_user_id):
        """Test creating executions and analyzing performance"""
        tools = PromptLibraryTools(user_id=test_user_id, db=firestore_client)

        # Create a prompt
        create_tool = next(t for t in tools.get_tools() if t.name == "create_prompt")
        create_result = await create_tool.ainvoke({
            "title": "Analytics Test Prompt",
            "content": "Test content",
            "category": "general"
        })
        prompt_id = create_result["prompt_id"]

        # Create multiple executions manually
        execution_ids = []
        for i in range(3):
            exec_ref = firestore_client.collection("executions").document()
            exec_ref.set({
                "promptId": prompt_id,
                "userId": test_user_id,
                "status": "success",
                "output": f"Output {i}",
                "tokensUsed": 100 + i * 10,
                "cost": 0.001 + i * 0.0001,
                "model": "gpt-4",
                "createdAt": datetime.now()
            })
            execution_ids.append(exec_ref.id)

        # Analyze performance
        analyze_tool = next(t for t in tools.get_tools() if t.name == "analyze_prompt_performance")
        analyze_result = await analyze_tool.ainvoke({
            "prompt_id": prompt_id
        })

        assert analyze_result["success"] is True
        assert analyze_result["total_executions"] == 3
        assert analyze_result["success_rate"] == 100.0
        assert analyze_result["avg_tokens"] > 0

        # Cleanup
        firestore_client.collection("prompts").document(prompt_id).delete()
        for exec_id in execution_ids:
            firestore_client.collection("executions").document(exec_id).delete()


class TestAgentConversationFlow:
    """Test complete agent conversation flow"""

    @pytest.mark.asyncio
    async def test_agent_conversation_persistence(self, agent_with_emulator, firestore_client, test_user_id):
        """Test that agent conversations are persisted"""
        # Mock the agent's invoke to return a simple response
        with patch.object(agent_with_emulator.agent, 'ainvoke') as mock_invoke:
            mock_invoke.return_value = {
                "messages": [
                    Mock(content="User message", type="human"),
                    Mock(content="Agent response", type="ai", tool_calls=[])
                ]
            }

            # Have a conversation
            response = await agent_with_emulator.chat(
                message="Create a prompt for blog writing"
            )

            assert response["success"] is True
            conversation_id = response["conversation_id"]

            # Verify conversation exists in Firestore
            conv_doc = firestore_client.collection("conversations").document(conversation_id).get()
            assert conv_doc.exists

            conv_data = conv_doc.to_dict()
            assert conv_data["userId"] == test_user_id
            assert len(conv_data["messages"]) > 0

            # Cleanup
            firestore_client.collection("conversations").document(conversation_id).delete()

    @pytest.mark.asyncio
    async def test_agent_multi_turn_conversation(self, agent_with_emulator, firestore_client, test_user_id):
        """Test multi-turn conversation with the same conversation ID"""
        with patch.object(agent_with_emulator.agent, 'ainvoke') as mock_invoke:
            mock_invoke.return_value = {
                "messages": [
                    Mock(content="User message", type="human"),
                    Mock(content="Agent response", type="ai", tool_calls=[])
                ]
            }

            # First message
            response1 = await agent_with_emulator.chat(
                message="First message"
            )
            conversation_id = response1["conversation_id"]

            # Second message in same conversation
            response2 = await agent_with_emulator.chat(
                message="Second message",
                conversation_id=conversation_id
            )

            assert response2["conversation_id"] == conversation_id

            # Verify conversation has multiple messages
            conv_doc = firestore_client.collection("conversations").document(conversation_id).get()
            conv_data = conv_doc.to_dict()

            # Should have messages from both turns
            assert len(conv_data["messages"]) >= 2

            # Cleanup
            firestore_client.collection("conversations").document(conversation_id).delete()


class TestUserDataIsolation:
    """Test that users can only access their own data"""

    @pytest.mark.asyncio
    async def test_user_cannot_access_other_user_prompts(self, firestore_client):
        """Test that users cannot access prompts from other users"""
        user1_id = "test-user-1"
        user2_id = "test-user-2"

        # User 1 creates a prompt
        tools_user1 = PromptLibraryTools(user_id=user1_id, db=firestore_client)
        create_tool = next(t for t in tools_user1.get_tools() if t.name == "create_prompt")

        result = await create_tool.ainvoke({
            "title": "User 1 Prompt",
            "content": "Private content",
            "category": "general"
        })
        prompt_id = result["prompt_id"]

        # User 2 tries to execute User 1's prompt
        tools_user2 = PromptLibraryTools(user_id=user2_id, db=firestore_client)
        execute_tool = next(t for t in tools_user2.get_tools() if t.name == "execute_prompt")

        execute_result = await execute_tool.ainvoke({
            "prompt_id": prompt_id,
            "variables": {}
        })

        # Should fail due to authorization
        assert execute_result["success"] is False
        assert "not authorized" in execute_result["error"].lower() or "permission" in execute_result["error"].lower()

        # Cleanup
        firestore_client.collection("prompts").document(prompt_id).delete()

    @pytest.mark.asyncio
    async def test_search_only_returns_user_prompts(self, firestore_client):
        """Test that search only returns prompts owned by the user"""
        user1_id = "test-user-search-1"
        user2_id = "test-user-search-2"

        # User 1 creates prompts
        tools_user1 = PromptLibraryTools(user_id=user1_id, db=firestore_client)
        create_tool_user1 = next(t for t in tools_user1.get_tools() if t.name == "create_prompt")

        user1_prompt_ids = []
        for i in range(2):
            result = await create_tool_user1.ainvoke({
                "title": f"User 1 Prompt {i}",
                "content": "Content",
                "category": "general",
                "tags": ["isolation-test"]
            })
            user1_prompt_ids.append(result["prompt_id"])

        # User 2 creates prompts
        tools_user2 = PromptLibraryTools(user_id=user2_id, db=firestore_client)
        create_tool_user2 = next(t for t in tools_user2.get_tools() if t.name == "create_prompt")

        user2_prompt_ids = []
        for i in range(2):
            result = await create_tool_user2.ainvoke({
                "title": f"User 2 Prompt {i}",
                "content": "Content",
                "category": "general",
                "tags": ["isolation-test"]
            })
            user2_prompt_ids.append(result["prompt_id"])

        # User 1 searches
        search_tool_user1 = next(t for t in tools_user1.get_tools() if t.name == "search_prompts")
        search_result_user1 = await search_tool_user1.ainvoke({
            "query": "Prompt",
            "tags": ["isolation-test"],
            "limit": 10
        })

        # Should only see User 1's prompts
        assert search_result_user1["success"] is True
        assert search_result_user1["total_results"] == 2

        # Cleanup
        for prompt_id in user1_prompt_ids + user2_prompt_ids:
            firestore_client.collection("prompts").document(prompt_id).delete()
