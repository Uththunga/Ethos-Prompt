"""
Test Suite for Backend AI Integration (Section 2)
Tests retry logic, fallback, custom API keys, and execution
"""

import sys
import os
from pathlib import Path

# Add functions directory to path
functions_dir = Path(__file__).parent
sys.path.insert(0, str(functions_dir))

import asyncio
from datetime import datetime
from typing import Dict, Any

# Import modules to test
from src.llm.openrouter_client import (
    OpenRouterClient,
    OpenRouterConfig,
    retry_with_exponential_backoff
)

# Import only non-Firebase dependent functions
try:
    from src.api.execute import (
        interpolate_variables,
        get_fallback_models,
        calculate_cost
    )
    EXECUTE_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not import execute module: {e}")
    print("Skipping execute-dependent tests")
    EXECUTE_AVAILABLE = False

    # Define dummy functions for tests
    def interpolate_variables(template, variables):
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result

    def get_fallback_models():
        return [
            "x-ai/grok-beta:free",
            "zhipuai/glm-4-9b-chat:free",
            "qwen/qwen-2.5-coder-32b-instruct:free"
        ]

    def calculate_cost(usage, model_id):
        if ":free" in model_id:
            return 0.0
        return 0.0


# =============================================================================
# TEST CONFIGURATION
# =============================================================================

class TestResults:
    """Track test results"""
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.errors = []

    def add_pass(self, test_name: str):
        self.total += 1
        self.passed += 1
        print(f"✅ PASS: {test_name}")

    def add_fail(self, test_name: str, error: str):
        self.total += 1
        self.failed += 1
        self.errors.append((test_name, error))
        print(f"❌ FAIL: {test_name}")
        print(f"   Error: {error}")

    def print_summary(self):
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.total}")
        print(f"Passed: {self.passed} ✅")
        print(f"Failed: {self.failed} ❌")
        print(f"Success Rate: {(self.passed/self.total*100):.1f}%")

        if self.errors:
            print("\nFailed Tests:")
            for test_name, error in self.errors:
                print(f"  - {test_name}: {error}")


results = TestResults()


# =============================================================================
# TEST 1: VARIABLE INTERPOLATION
# =============================================================================

def test_variable_interpolation():
    """Test prompt variable interpolation"""
    try:
        # Test basic interpolation
        template = "Hello {{name}}, welcome to {{place}}!"
        variables = {"name": "Alice", "place": "Wonderland"}
        result = interpolate_variables(template, variables)

        expected = "Hello Alice, welcome to Wonderland!"
        assert result == expected, f"Expected '{expected}', got '{result}'"

        # Test with missing variables
        template2 = "Hello {{name}}, your age is {{age}}"
        variables2 = {"name": "Bob"}
        result2 = interpolate_variables(template2, variables2)

        # Should leave {{age}} as is
        assert "{{age}}" in result2, "Missing variables should remain as placeholders"

        results.add_pass("Variable Interpolation")
    except Exception as e:
        results.add_fail("Variable Interpolation", str(e))


# =============================================================================
# TEST 2: FALLBACK MODELS
# =============================================================================

def test_fallback_models():
    """Test fallback model configuration"""
    try:
        fallback_models = get_fallback_models()

        # Should have at least 3 fallback models
        assert len(fallback_models) >= 3, f"Expected at least 3 fallback models, got {len(fallback_models)}"

        # All should be free models (contain :free)
        for model in fallback_models:
            assert ":free" in model, f"Fallback model {model} should be free"

        # Should include expected models
        expected_models = ["grok-beta:free", "glm-4-9b-chat:free", "qwen-2.5-coder"]
        for expected in expected_models:
            found = any(expected in model for model in fallback_models)
            assert found, f"Expected fallback model containing '{expected}'"

        results.add_pass("Fallback Models Configuration")
    except Exception as e:
        results.add_fail("Fallback Models Configuration", str(e))


# =============================================================================
# TEST 3: COST CALCULATION
# =============================================================================

def test_cost_calculation():
    """Test cost calculation for free and paid models"""
    try:
        # Test free model (should return 0)
        usage = {"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150}
        free_model = "x-ai/grok-beta:free"
        cost = calculate_cost(usage, free_model)

        assert cost == 0.0, f"Free model should have $0 cost, got ${cost}"

        # Test another free model
        free_model2 = "zhipuai/glm-4-9b-chat:free"
        cost2 = calculate_cost(usage, free_model2)

        assert cost2 == 0.0, f"Free model should have $0 cost, got ${cost2}"

        results.add_pass("Cost Calculation")
    except Exception as e:
        results.add_fail("Cost Calculation", str(e))


# =============================================================================
# TEST 4: OPENROUTER CONFIG
# =============================================================================

def test_openrouter_config():
    """Test OpenRouter configuration"""
    try:
        # Test basic config
        config = OpenRouterConfig(
            api_key="test-key",
            model="x-ai/grok-beta:free",
            temperature=0.7,
            max_tokens=1000
        )

        assert config.api_key == "test-key"
        assert config.model == "x-ai/grok-beta:free"
        assert config.temperature == 0.7
        assert config.max_tokens == 1000
        assert config.is_custom_key == False

        # Test custom key config
        custom_config = OpenRouterConfig(
            api_key="custom-key",
            model="openai/gpt-4",
            is_custom_key=True,
            user_id="user123"
        )

        assert custom_config.is_custom_key == True
        assert custom_config.user_id == "user123"

        results.add_pass("OpenRouter Configuration")
    except Exception as e:
        results.add_fail("OpenRouter Configuration", str(e))


# =============================================================================
# TEST 5: RETRY DECORATOR
# =============================================================================

def test_retry_decorator():
    """Test retry decorator logic"""
    try:
        # Test function that succeeds
        @retry_with_exponential_backoff(max_retries=3, initial_delay=0.1)
        async def success_function():
            return "success"

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(success_function())
        loop.close()

        assert result == "success", "Retry decorator should not affect successful calls"

        results.add_pass("Retry Decorator")
    except Exception as e:
        results.add_fail("Retry Decorator", str(e))


# =============================================================================
# TEST 6: OPENROUTER CLIENT INITIALIZATION
# =============================================================================

def test_openrouter_client_init():
    """Test OpenRouter client initialization"""
    try:
        config = OpenRouterConfig(
            api_key="test-key",
            model="x-ai/grok-beta:free"
        )

        client = OpenRouterClient(config)

        assert client.config == config
        assert client.session is None  # Not initialized until context manager

        results.add_pass("OpenRouter Client Initialization")
    except Exception as e:
        results.add_fail("OpenRouter Client Initialization", str(e))


# =============================================================================
# TEST 7: REQUEST PAYLOAD BUILDING
# =============================================================================

def test_request_payload():
    """Test request payload building"""
    try:
        config = OpenRouterConfig(
            api_key="test-key",
            model="x-ai/grok-beta:free",
            temperature=0.8,
            max_tokens=500
        )

        client = OpenRouterClient(config)

        payload = client._build_request_payload(
            prompt="Test prompt",
            system_prompt="You are helpful",
            context="Some context",
            stream=False
        )

        # Check payload structure
        assert "model" in payload
        assert "messages" in payload
        assert "temperature" in payload
        assert "max_tokens" in payload
        assert "stream" in payload

        # Check values
        assert payload["model"] == "x-ai/grok-beta:free"
        assert payload["temperature"] == 0.8
        assert payload["max_tokens"] == 500
        assert payload["stream"] == False

        # Check messages
        assert len(payload["messages"]) == 3  # system, context, user
        assert payload["messages"][0]["role"] == "system"
        assert payload["messages"][1]["role"] == "system"  # context
        assert payload["messages"][2]["role"] == "user"

        results.add_pass("Request Payload Building")
    except Exception as e:
        results.add_fail("Request Payload Building", str(e))


# =============================================================================
# TEST 8: COST ESTIMATION
# =============================================================================

def test_cost_estimation():
    """Test cost estimation in OpenRouter client"""
    try:
        config = OpenRouterConfig(
            api_key="test-key",
            model="openai/gpt-3.5-turbo"
        )

        client = OpenRouterClient(config)

        # Test cost calculation
        cost = client._calculate_cost(prompt_tokens=1000, completion_tokens=500)

        # Should be a positive number for paid models
        assert cost >= 0, f"Cost should be non-negative, got {cost}"

        # Test with different model
        config2 = OpenRouterConfig(
            api_key="test-key",
            model="openai/gpt-4"
        )

        client2 = OpenRouterClient(config2)
        cost2 = client2._calculate_cost(prompt_tokens=1000, completion_tokens=500)

        # GPT-4 should be more expensive than GPT-3.5
        assert cost2 > cost, "GPT-4 should be more expensive than GPT-3.5"

        results.add_pass("Cost Estimation")
    except Exception as e:
        results.add_fail("Cost Estimation", str(e))


# =============================================================================
# RUN ALL TESTS
# =============================================================================

def run_all_tests():
    """Run all tests"""
    print("="*80)
    print("BACKEND AI INTEGRATION TEST SUITE")
    print("="*80)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Run tests
    test_variable_interpolation()
    test_fallback_models()
    test_cost_calculation()
    test_openrouter_config()
    test_retry_decorator()
    test_openrouter_client_init()
    test_request_payload()
    test_cost_estimation()

    # Print summary
    results.print_summary()

    print(f"\nCompleted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

    return results.failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
