"""
Test suite for OpenRouter LLM integration
"""

import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
import aiohttp

# Import components to test
try:
    from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig, LLMResponse
    from src.llm.token_counter import TokenCounter
except Exception:
    pytest.skip("LLM modules not available in this environment; skipping OpenRouter integration tests", allow_module_level=True)

class TestOpenRouterConfig:
    """Test OpenRouter configuration"""

    def test_default_config(self):
        """Test default configuration values"""
        config = OpenRouterConfig(api_key="test-key")

        assert config.api_key == "test-key"
        assert config.base_url == "https://openrouter.ai/api/v1"
        assert config.model == "meta-llama/llama-3.2-11b-vision-instruct:free"
        assert config.max_tokens == 4000
        assert config.temperature == 0.7
        assert config.top_p == 1.0
        assert config.max_retries == 3

    def test_custom_config(self):
        """Test custom configuration values"""
        config = OpenRouterConfig(
            api_key="custom-key",
            model="meta-llama/llama-3.1-8b-instruct:free",
            max_tokens=2000,
            temperature=0.5
        )

        assert config.api_key == "custom-key"
        assert config.model == "meta-llama/llama-3.1-8b-instruct:free"
        assert config.max_tokens == 2000
        assert config.temperature == 0.5

class TestOpenRouterClient:
    """Test OpenRouter client functionality"""

    @pytest.fixture
    def config(self):
        return OpenRouterConfig(api_key="test-key")

    @pytest.fixture
    def client(self, config):
        return OpenRouterClient(config)

    def test_client_initialization(self, client):
        """Test client initialization"""
        assert client.config.api_key == "test-key"
        assert client.session is None  # Not initialized until context manager
        assert client.tokenizer is not None

    def test_model_pricing_lookup(self, client):
        """Test model pricing lookup"""
        # Test free model
        assert client.MODEL_PRICING["meta-llama/llama-3.2-11b-vision-instruct:free"]["input"] == 0.0
        assert client.MODEL_PRICING["meta-llama/llama-3.2-11b-vision-instruct:free"]["output"] == 0.0

    def test_cost_calculation(self, client):
        """Test cost calculation for free models"""
        cost = client._calculate_cost(1000, 500)
        assert cost == 0.0  # Free model should have zero cost

    def test_token_counting(self, client):
        """Test token counting functionality"""
        text = "Hello, world! This is a test."
        token_count = client.count_tokens(text)
        assert isinstance(token_count, int)
        assert token_count > 0

    @pytest.mark.asyncio
    async def test_context_manager(self, client):
        """Test async context manager"""
        async with client as c:
            assert c.session is not None
            assert isinstance(c.session, aiohttp.ClientSession)

        # Session should be closed after context
        assert client.session.closed

    def test_response_processing(self, client):
        """Test response processing"""
        mock_response = {
            "choices": [{
                "message": {"content": "Test response"},
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15
            }
        }

        start_time = 1000.0
        with patch('time.time', return_value=1002.5):  # 2.5 seconds later
            response = client._process_response(mock_response, start_time)

        assert isinstance(response, LLMResponse)
        assert response.content == "Test response"
        assert response.model == client.config.model
        assert response.usage["total_tokens"] == 15
        assert response.finish_reason == "stop"
        assert response.response_time == 2.5
        assert response.cost_estimate == 0.0  # Free model

    def test_response_processing_error(self, client):
        """Test response processing with invalid data"""
        invalid_response = {"invalid": "data"}

        with pytest.raises(ValueError):
            client._process_response(invalid_response, 1000.0)

    def test_get_model_info(self, client):
        """Test model info retrieval"""
        info = client.get_model_info()

        assert info["model"] == client.config.model
        assert info["max_tokens"] == client.config.max_tokens
        assert info["temperature"] == client.config.temperature
        assert info["is_free"] == True  # Free model
        assert "pricing" in info

class TestTokenCounter:
    """Test token counting utilities"""

    @pytest.fixture
    def counter(self):
        return TokenCounter("meta-llama/llama-3.2-11b-vision-instruct:free")

    def test_initialization(self, counter):
        """Test token counter initialization"""
        assert counter.model == "meta-llama/llama-3.2-11b-vision-instruct:free"
        assert counter.encoding_name == "cl100k_base"
        assert counter.multiplier == 1.2  # Llama multiplier
        assert counter.encoding is not None

    def test_token_counting(self, counter):
        """Test basic token counting"""
        text = "Hello, world!"
        count = counter.count_tokens(text)
        assert isinstance(count, int)
        assert count > 0

        # Empty text should return 0
        assert counter.count_tokens("") == 0
        assert counter.count_tokens(None) == 0

    def test_message_token_counting(self, counter):
        """Test message format token counting"""
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello!"},
            {"role": "assistant", "content": "Hi there!"}
        ]

        count = counter.count_message_tokens(messages)
        assert isinstance(count, int)
        assert count > 0

        # Should be more than just content tokens due to formatting overhead
        content_only = sum(counter.count_tokens(msg["content"]) for msg in messages)
        assert count > content_only

    def test_prompt_with_context_counting(self, counter):
        """Test RAG prompt token counting"""
        prompt = "What is the capital of France?"
        context = "France is a country in Europe. Paris is its capital city."
        system_prompt = "You are a helpful assistant."

        counts = counter.count_prompt_with_context_tokens(prompt, context, system_prompt)

        assert "prompt_tokens" in counts
        assert "context_tokens" in counts
        assert "system_tokens" in counts
        assert "total_input_tokens" in counts
        assert "enhancement_overhead" in counts

        assert counts["prompt_tokens"] > 0
        assert counts["context_tokens"] > 0
        assert counts["system_tokens"] > 0
        assert counts["total_input_tokens"] > counts["prompt_tokens"] + counts["context_tokens"]

    def test_token_validation(self, counter):
        """Test token limit validation"""
        text = "Short text"
        validation = counter.validate_token_limits(text, 100)

        assert validation["valid"] == True
        assert validation["token_count"] > 0
        assert validation["max_tokens"] == 100
        assert validation["excess_tokens"] == 0
        assert 0 < validation["utilization"] < 1

    def test_text_truncation(self, counter):
        """Test text truncation to token limits"""
        long_text = "This is a very long text. " * 100
        max_tokens = 50

        truncated = counter.truncate_to_token_limit(long_text, max_tokens)
        truncated_count = counter.count_tokens(truncated)

        assert truncated_count <= max_tokens
        assert len(truncated) < len(long_text)

    def test_cost_calculation(self, counter):
        """Test cost calculation"""
        cost_info = counter.calculate_cost_estimate(
            prompt_tokens=1000,
            completion_tokens=500,
            input_price_per_1m=1.0,
            output_price_per_1m=2.0
        )

        assert cost_info["input_cost"] == 0.001  # 1000/1M * 1.0
        assert cost_info["output_cost"] == 0.001  # 500/1M * 2.0
        assert cost_info["total_cost"] == 0.002
        assert cost_info["total_tokens"] == 1500

    def test_model_info(self, counter):
        """Test model info retrieval"""
        info = counter.get_model_info()

        assert info["model"] == counter.model
        assert info["encoding"] == counter.encoding_name
        assert info["multiplier"] == counter.multiplier
        assert info["model_family"] == "meta-llama"

class TestIntegration:
    """Integration tests for OpenRouter LLM functionality"""

    @pytest.mark.asyncio
    async def test_mock_api_call(self):
        """Test mocked API call flow"""
        config = OpenRouterConfig(api_key="test-key")

        # Mock response data
        mock_response_data = {
            "choices": [{
                "message": {"content": "Hello! How can I help you today?"},
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 15,
                "completion_tokens": 10,
                "total_tokens": 25
            }
        }

        with patch('aiohttp.ClientSession.post') as mock_post:
            # Mock the response
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_response_data)
            mock_post.return_value.__aenter__.return_value = mock_response

            async with OpenRouterClient(config) as client:
                response = await client.generate_response("Hello!")

                assert isinstance(response, LLMResponse)
                assert response.content == "Hello! How can I help you today?"
                assert response.usage["total_tokens"] == 25
                assert response.cost_estimate == 0.0  # Free model

    @pytest.mark.asyncio
    async def test_context_enhanced_generation(self):
        """Test context-enhanced generation"""
        config = OpenRouterConfig(api_key="test-key")

        mock_response_data = {
            "choices": [{
                "message": {"content": "Based on the context, Paris is the capital of France."},
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 50,
                "completion_tokens": 15,
                "total_tokens": 65
            }
        }

        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_response_data)
            mock_post.return_value.__aenter__.return_value = mock_response

            async with OpenRouterClient(config) as client:
                response = await client.generate_with_context(
                    prompt="What is the capital of France?",
                    context="France is a country in Europe. Paris is its capital."
                )

                assert isinstance(response, LLMResponse)
                assert "Paris" in response.content
                assert response.usage["total_tokens"] == 65

    @pytest.mark.asyncio
    async def test_api_error_handling(self):
        """Test API error handling"""
        config = OpenRouterConfig(api_key="invalid-key", max_retries=1)

        with patch('aiohttp.ClientSession.post') as mock_post:
            # Mock 401 error
            mock_response = AsyncMock()
            mock_response.status = 401
            mock_response.text = AsyncMock(return_value="Unauthorized")
            mock_post.return_value.__aenter__.return_value = mock_response

            async with OpenRouterClient(config) as client:
                with pytest.raises(Exception) as exc_info:
                    await client.generate_response("Hello!")

                assert "401" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_rate_limit_retry(self):
        """Test rate limit retry logic"""
        config = OpenRouterConfig(api_key="test-key", max_retries=2, retry_delay=0.1)

        success_response = {
            "choices": [{
                "message": {"content": "Success after retry"},
                "finish_reason": "stop"
            }],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
        }

        with patch('aiohttp.ClientSession.post') as mock_post:
            # First call returns 429, second succeeds
            responses = [
                AsyncMock(status=429),  # Rate limit
                AsyncMock(status=200, json=AsyncMock(return_value=success_response))  # Success
            ]
            mock_post.return_value.__aenter__.side_effect = responses

            async with OpenRouterClient(config) as client:
                response = await client.generate_response("Hello!")

                assert response.content == "Success after retry"
                assert mock_post.call_count == 2  # Should have retried once

if __name__ == "__main__":
    pytest.main([__file__])
