"""
Integration tests for OpenRouter API
Task 1.10: Integration Testing with Real API

These tests require a valid OPENROUTER_API_KEY environment variable.
Run with: pytest tests/integration/test_openrouter_integration.py -v
"""
import pytest
import os
import asyncio
from datetime import datetime
from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig


# Skip all tests if API key is not available
pytestmark = pytest.mark.skipif(
    not os.environ.get('OPENROUTER_API_KEY'),
    reason="OPENROUTER_API_KEY not set"
)


class TestOpenRouterIntegration:
    """Integration tests with real OpenRouter API"""
    
    @pytest.fixture
    def api_key(self):
        """Get API key from environment"""
        return os.environ.get('OPENROUTER_API_KEY')
    
    @pytest.fixture
    def config(self, api_key):
        """Create OpenRouter config"""
        return OpenRouterConfig(
            api_key=api_key,
            model="openai/gpt-3.5-turbo",
            temperature=0.7,
            max_tokens=100
        )
    
    @pytest.mark.asyncio
    async def test_simple_completion(self, config):
        """Test simple completion with real API"""
        async with OpenRouterClient(config) as client:
            response = await client.generate_response(
                prompt="Say 'Hello, World!' and nothing else.",
                system_prompt="You are a helpful assistant."
            )
            
            assert response is not None
            assert response.content is not None
            assert len(response.content) > 0
            assert response.model == "openai/gpt-3.5-turbo"
            assert response.usage["total_tokens"] > 0
            assert response.cost_estimate > 0
            
            print(f"\n✅ Simple completion test passed")
            print(f"   Response: {response.content[:50]}...")
            print(f"   Tokens: {response.usage['total_tokens']}")
            print(f"   Cost: ${response.cost_estimate:.6f}")
    
    @pytest.mark.asyncio
    async def test_multiple_models(self, api_key):
        """Test with multiple models"""
        models = [
            "openai/gpt-3.5-turbo",
            "openai/gpt-4o-mini",
        ]
        
        results = []
        
        for model in models:
            config = OpenRouterConfig(
                api_key=api_key,
                model=model,
                max_tokens=50
            )
            
            async with OpenRouterClient(config) as client:
                response = await client.generate_response(
                    prompt="What is 2+2?",
                    system_prompt="You are a math tutor."
                )
                
                results.append({
                    "model": model,
                    "response": response.content,
                    "tokens": response.usage["total_tokens"],
                    "cost": response.cost_estimate
                })
        
        # Verify all models responded
        assert len(results) == len(models)
        for result in results:
            assert result["response"] is not None
            assert result["tokens"] > 0
            
        print(f"\n✅ Multiple models test passed")
        for result in results:
            print(f"   {result['model']}: {result['tokens']} tokens, ${result['cost']:.6f}")
    
    @pytest.mark.asyncio
    async def test_with_context(self, config):
        """Test completion with context"""
        context = "The user's name is Alice and she likes Python programming."
        
        async with OpenRouterClient(config) as client:
            response = await client.generate_response(
                prompt="What does the user like?",
                system_prompt="Answer based on the provided context.",
                context=context
            )
            
            assert response is not None
            assert "python" in response.content.lower() or "programming" in response.content.lower()
            
            print(f"\n✅ Context test passed")
            print(f"   Response: {response.content}")
    
    @pytest.mark.asyncio
    async def test_cost_calculation_accuracy(self, config):
        """Test that cost calculation is accurate"""
        async with OpenRouterClient(config) as client:
            response = await client.generate_response(
                prompt="Count from 1 to 5.",
                system_prompt="You are a helpful assistant."
            )
            
            # Verify cost is calculated
            assert response.cost_estimate > 0
            
            # Verify cost is reasonable for GPT-3.5
            # Should be less than $0.01 for a short prompt
            assert response.cost_estimate < 0.01
            
            print(f"\n✅ Cost calculation test passed")
            print(f"   Tokens: {response.usage['total_tokens']}")
            print(f"   Cost: ${response.cost_estimate:.6f}")
    
    @pytest.mark.asyncio
    async def test_error_handling(self, api_key):
        """Test error handling with invalid model"""
        config = OpenRouterConfig(
            api_key=api_key,
            model="invalid/model-name",
            max_tokens=50
        )
        
        async with OpenRouterClient(config) as client:
            with pytest.raises(Exception):
                await client.generate_response(
                    prompt="Test",
                    system_prompt="Test"
                )
        
        print(f"\n✅ Error handling test passed")
    
    @pytest.mark.asyncio
    async def test_timeout_handling(self, config):
        """Test timeout handling"""
        # Set very short timeout
        async with OpenRouterClient(config) as client:
            try:
                # This should complete normally
                response = await asyncio.wait_for(
                    client.generate_response(
                        prompt="Say hi",
                        system_prompt="You are helpful."
                    ),
                    timeout=30.0
                )
                assert response is not None
                print(f"\n✅ Timeout handling test passed")
            except asyncio.TimeoutError:
                pytest.fail("Request timed out unexpectedly")


class TestExecutionMetrics:
    """Test execution metrics and performance"""
    
    @pytest.fixture
    def api_key(self):
        return os.environ.get('OPENROUTER_API_KEY')
    
    @pytest.fixture
    def config(self, api_key):
        return OpenRouterConfig(
            api_key=api_key,
            model="openai/gpt-3.5-turbo",
            max_tokens=100
        )
    
    @pytest.mark.asyncio
    async def test_execution_time(self, config):
        """Test execution time is reasonable"""
        start_time = datetime.now()
        
        async with OpenRouterClient(config) as client:
            response = await client.generate_response(
                prompt="Say hello",
                system_prompt="You are helpful."
            )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Should complete within 30 seconds
        assert execution_time < 30
        assert response is not None
        
        print(f"\n✅ Execution time test passed")
        print(f"   Time: {execution_time:.2f}s")
    
    @pytest.mark.asyncio
    async def test_token_usage_tracking(self, config):
        """Test token usage is tracked correctly"""
        async with OpenRouterClient(config) as client:
            response = await client.generate_response(
                prompt="Count from 1 to 10",
                system_prompt="You are a helpful assistant."
            )
            
            # Verify token usage is tracked
            assert "prompt_tokens" in response.usage
            assert "completion_tokens" in response.usage
            assert "total_tokens" in response.usage
            
            # Verify totals match
            assert response.usage["total_tokens"] == (
                response.usage["prompt_tokens"] + response.usage["completion_tokens"]
            )
            
            print(f"\n✅ Token tracking test passed")
            print(f"   Prompt tokens: {response.usage['prompt_tokens']}")
            print(f"   Completion tokens: {response.usage['completion_tokens']}")
            print(f"   Total tokens: {response.usage['total_tokens']}")


class TestBatchExecution:
    """Test batch execution scenarios"""
    
    @pytest.fixture
    def api_key(self):
        return os.environ.get('OPENROUTER_API_KEY')
    
    @pytest.fixture
    def config(self, api_key):
        return OpenRouterConfig(
            api_key=api_key,
            model="openai/gpt-3.5-turbo",
            max_tokens=50
        )
    
    @pytest.mark.asyncio
    async def test_sequential_executions(self, config):
        """Test multiple sequential executions"""
        prompts = [
            "What is 2+2?",
            "What is the capital of France?",
            "Name a programming language.",
        ]
        
        results = []
        total_cost = 0
        
        async with OpenRouterClient(config) as client:
            for prompt in prompts:
                response = await client.generate_response(
                    prompt=prompt,
                    system_prompt="Answer briefly."
                )
                results.append(response)
                total_cost += response.cost_estimate
        
        # Verify all completed
        assert len(results) == len(prompts)
        for response in results:
            assert response.content is not None
            assert len(response.content) > 0
        
        print(f"\n✅ Sequential executions test passed")
        print(f"   Executions: {len(results)}")
        print(f"   Total cost: ${total_cost:.6f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

