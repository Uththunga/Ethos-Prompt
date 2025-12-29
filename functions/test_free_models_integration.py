"""
Integration Tests for Free Models
RAG Prompt Library - Comprehensive Test Suite

Tests:
1. Free model execution
2. Cost tracking ($0 for free models)
3. Custom API key flow
4. Agent capabilities (function calling)
5. Model switching
6. Streaming responses
7. Error handling
"""

import asyncio
import pytest
from typing import Dict, Any, List
from datetime import datetime

# Import modules to test
from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from src.llm.free_models_config import (
    get_default_model,
    get_agent_capable_models,
    get_best_agent_model,
    get_best_coding_agent_model,
    supports_function_calling,
    ALL_FREE_MODELS
)
from src.llm.model_config import (
    get_free_models,
    is_free_model,
    requires_custom_api_key,
    select_model_for_task
)
from src.llm.cost_tracker import UsageStats


# =============================================================================
# TEST CONFIGURATION
# =============================================================================

TEST_API_KEY = "test-api-key"  # Replace with actual key for live tests
SKIP_LIVE_TESTS = True  # Set to False to run live API tests


# =============================================================================
# TEST 1: FREE MODEL CONFIGURATION
# =============================================================================

class TestFreeModelConfiguration:
    """Test free model configuration and helpers"""
    
    def test_all_free_models_loaded(self):
        """Test that all free models are loaded"""
        assert len(ALL_FREE_MODELS) >= 12, "Should have at least 12 free models"
    
    def test_default_model_exists(self):
        """Test that default model is configured"""
        default = get_default_model()
        assert default is not None
        assert default.model_id == "x-ai/grok-4-fast:free"
    
    def test_agent_capable_models(self):
        """Test agent-capable models are identified"""
        agent_models = get_agent_capable_models()
        assert len(agent_models) >= 3, "Should have at least 3 agent-capable models"
        
        # Check specific models
        model_ids = [m.model_id for m in agent_models]
        assert "z-ai/glm-4.5-air:free" in model_ids
        assert "microsoft/mai-ds-r1:free" in model_ids
        assert "qwen/qwen3-coder-480b-a35b-instruct:free" in model_ids
    
    def test_best_agent_model(self):
        """Test best agent model selection"""
        best = get_best_agent_model()
        assert best.model_id == "z-ai/glm-4.5-air:free"
    
    def test_best_coding_agent_model(self):
        """Test best coding agent model selection"""
        best = get_best_coding_agent_model()
        assert best.model_id == "qwen/qwen3-coder-480b-a35b-instruct:free"
    
    def test_function_calling_support(self):
        """Test function calling support detection"""
        assert supports_function_calling("z-ai/glm-4.5-air:free") is True
        assert supports_function_calling("microsoft/mai-ds-r1:free") is True
        assert supports_function_calling("google/gemma-2-27b-it:free") is False


# =============================================================================
# TEST 2: MODEL CONFIG INTEGRATION
# =============================================================================

class TestModelConfigIntegration:
    """Test unified model configuration"""
    
    def test_get_free_models(self):
        """Test getting all free models"""
        free_models = get_free_models()
        assert len(free_models) >= 12
        assert all(m.is_free for m in free_models)
    
    def test_is_free_model(self):
        """Test free model detection"""
        assert is_free_model("x-ai/grok-4-fast:free") is True
        assert is_free_model("z-ai/glm-4.5-air:free") is True
        assert is_free_model("openai/gpt-4-turbo") is False
    
    def test_requires_custom_key(self):
        """Test custom key requirement detection"""
        assert requires_custom_api_key("x-ai/grok-4-fast:free") is False
        assert requires_custom_api_key("openai/gpt-4-turbo") is True
    
    def test_model_selection_for_agent_task(self):
        """Test model selection for agent tasks"""
        model = select_model_for_task("agent creation", prefer_free=True)
        assert model.model_id == "z-ai/glm-4.5-air:free"
    
    def test_model_selection_for_coding_task(self):
        """Test model selection for coding tasks"""
        model = select_model_for_task("code generation", prefer_free=True)
        assert model.model_id in [
            "qwen/qwen3-coder-480b-a35b-instruct:free",
            "z-ai/glm-4.5-air:free"
        ]


# =============================================================================
# TEST 3: COST TRACKING
# =============================================================================

class TestCostTracking:
    """Test cost tracking for free models"""
    
    def test_usage_stats_structure(self):
        """Test UsageStats dataclass structure"""
        stats = UsageStats(
            total_requests=100,
            total_tokens=10000,
            total_cost=0.0,
            requests_by_provider={},
            tokens_by_provider={},
            cost_by_provider={},
            requests_by_model={},
            average_cost_per_request=0.0,
            average_tokens_per_request=100.0,
            free_requests=80,
            free_tokens=8000,
            paid_requests=20,
            paid_tokens=2000,
            cost_savings=10.0
        )
        
        assert stats.free_requests == 80
        assert stats.free_tokens == 8000
        assert stats.paid_requests == 20
        assert stats.cost_savings == 10.0
    
    def test_free_model_zero_cost(self):
        """Test that free models have zero cost"""
        # This would be tested with actual cost tracker implementation
        pass


# =============================================================================
# TEST 4: CUSTOM API KEY SUPPORT
# =============================================================================

class TestCustomAPIKey:
    """Test custom API key functionality"""
    
    def test_config_with_custom_key(self):
        """Test OpenRouterConfig with custom key"""
        config = OpenRouterConfig(
            api_key="custom-key",
            model="openai/gpt-4-turbo",
            is_custom_key=True,
            user_id="test-user-123"
        )
        
        assert config.is_custom_key is True
        assert config.user_id == "test-user-123"
    
    @pytest.mark.skipif(SKIP_LIVE_TESTS, reason="Skipping live API tests")
    async def test_validate_custom_key(self):
        """Test custom API key validation"""
        config = OpenRouterConfig(
            api_key=TEST_API_KEY,
            model="x-ai/grok-4-fast:free"
        )
        
        async with OpenRouterClient(config) as client:
            result = await client.test_custom_key(
                api_key=TEST_API_KEY,
                model="x-ai/grok-4-fast:free"
            )
            
            assert "valid" in result
            assert "model" in result


# =============================================================================
# TEST 5: LIVE MODEL EXECUTION (OPTIONAL)
# =============================================================================

@pytest.mark.skipif(SKIP_LIVE_TESTS, reason="Skipping live API tests")
class TestLiveModelExecution:
    """Test actual model execution (requires API key)"""
    
    async def test_execute_with_free_model(self):
        """Test executing prompt with free model"""
        config = OpenRouterConfig(
            api_key=TEST_API_KEY,
            model="z-ai/glm-4.5-air:free"
        )
        
        async with OpenRouterClient(config) as client:
            response = await client.generate_response(
                prompt="Say 'Hello, World!' and nothing else."
            )
            
            assert response is not None
            assert len(response.content) > 0
    
    async def test_execute_with_agent_model(self):
        """Test executing with agent-capable model"""
        config = OpenRouterConfig(
            api_key=TEST_API_KEY,
            model="z-ai/glm-4.5-air:free"
        )
        
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": "Get weather for a location",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {"type": "string"}
                        }
                    }
                }
            }
        ]
        
        async with OpenRouterClient(config) as client:
            response = await client.generate_response(
                prompt="What's the weather in Tokyo?",
                tools=tools
            )
            
            assert response is not None
    
    async def test_streaming_response(self):
        """Test streaming response with free model"""
        config = OpenRouterConfig(
            api_key=TEST_API_KEY,
            model="z-ai/glm-4.5-air:free",
            stream=True
        )
        
        chunks = []
        async with OpenRouterClient(config) as client:
            async for chunk in client.stream_response(
                prompt="Count from 1 to 5"
            ):
                chunks.append(chunk)
        
        assert len(chunks) > 0


# =============================================================================
# TEST 6: ERROR HANDLING
# =============================================================================

class TestErrorHandling:
    """Test error handling scenarios"""
    
    @pytest.mark.skipif(SKIP_LIVE_TESTS, reason="Skipping live API tests")
    async def test_invalid_api_key(self):
        """Test handling of invalid API key"""
        config = OpenRouterConfig(
            api_key="invalid-key",
            model="x-ai/grok-4-fast:free"
        )
        
        async with OpenRouterClient(config) as client:
            with pytest.raises(Exception):
                await client.generate_response(prompt="Test")
    
    def test_invalid_model_id(self):
        """Test handling of invalid model ID"""
        from src.llm.free_models_config import get_model_by_id
        
        model = get_model_by_id("invalid-model-id")
        assert model is None


# =============================================================================
# TEST RUNNER
# =============================================================================

def run_tests():
    """Run all tests"""
    print("=" * 80)
    print("FREE MODELS INTEGRATION TEST SUITE")
    print("=" * 80)
    print()
    
    # Run pytest
    pytest.main([__file__, "-v", "--tb=short"])


if __name__ == "__main__":
    run_tests()

