"""
Unit tests for OpenRouter client
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.llm.openrouter_client import (
    OpenRouterClient, OpenRouterConfig, LLMResponse, StreamChunk, TokenCounter
)


class TestOpenRouterConfig:
    """Test OpenRouterConfig"""
    
    def test_config_creation(self):
        """Test config creation"""
        config = OpenRouterConfig(
            api_key="test-key",
            model="openai/gpt-3.5-turbo",
            temperature=0.7,
            max_tokens=1000
        )
        
        assert config.api_key == "test-key"
        assert config.model == "openai/gpt-3.5-turbo"
        assert config.temperature == 0.7
        assert config.max_tokens == 1000
    
    def test_config_defaults(self):
        """Test config defaults"""
        config = OpenRouterConfig(api_key="test-key")
        
        assert config.model == "openai/gpt-3.5-turbo"
        assert config.temperature == 0.7
        assert config.max_tokens == 2000


class TestTokenCounter:
    """Test TokenCounter"""
    
    def test_token_counting(self):
        """Test token counting"""
        counter = TokenCounter(model="openai/gpt-3.5-turbo")
        
        text = "Hello, how are you?"
        tokens = counter.count_tokens(text)
        
        # Should return a positive number
        assert tokens > 0
        assert isinstance(tokens, int)
    
    def test_token_counting_empty_string(self):
        """Test token counting with empty string"""
        counter = TokenCounter(model="openai/gpt-3.5-turbo")
        
        tokens = counter.count_tokens("")
        
        assert tokens == 0
    
    def test_token_counting_long_text(self):
        """Test token counting with long text"""
        counter = TokenCounter(model="openai/gpt-3.5-turbo")
        
        text = "Hello " * 1000
        tokens = counter.count_tokens(text)
        
        # Should be roughly 1000-2000 tokens
        assert tokens > 500
        assert tokens < 3000


class TestLLMResponse:
    """Test LLMResponse dataclass"""
    
    def test_llm_response_creation(self):
        """Test LLMResponse creation"""
        response = LLMResponse(
            content="Test response",
            model="openai/gpt-3.5-turbo",
            usage={"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
            finish_reason="stop",
            cost_estimate=0.000023
        )
        
        assert response.content == "Test response"
        assert response.model == "openai/gpt-3.5-turbo"
        assert response.usage["total_tokens"] == 15
        assert response.finish_reason == "stop"
        assert response.cost_estimate == 0.000023


class TestStreamChunk:
    """Test StreamChunk dataclass"""
    
    def test_stream_chunk_creation(self):
        """Test StreamChunk creation"""
        chunk = StreamChunk(
            content="Hello",
            model="openai/gpt-3.5-turbo",
            finish_reason=None
        )
        
        assert chunk.content == "Hello"
        assert chunk.model == "openai/gpt-3.5-turbo"
        assert chunk.finish_reason is None


class TestOpenRouterClient:
    """Test OpenRouterClient"""
    
    @pytest.mark.asyncio
    async def test_client_initialization(self):
        """Test client initialization"""
        config = OpenRouterConfig(api_key="test-key")
        
        async with OpenRouterClient(config) as client:
            assert client.config == config
            assert client.session is not None
    
    @pytest.mark.asyncio
    async def test_generate_response_success(self, mock_openrouter_response):
        """Test successful response generation"""
        config = OpenRouterConfig(api_key="test-key")
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_openrouter_response)
            mock_post.return_value.__aenter__.return_value = mock_response
            
            async with OpenRouterClient(config) as client:
                response = await client.generate_response(
                    prompt="Test prompt",
                    system_prompt="You are a helpful assistant"
                )
                
                assert isinstance(response, LLMResponse)
                assert response.content == "This is a test response"
                assert response.model == "openai/gpt-3.5-turbo"
                assert response.usage["total_tokens"] == 15
    
    @pytest.mark.asyncio
    async def test_generate_response_with_context(self, mock_openrouter_response):
        """Test response generation with context"""
        config = OpenRouterConfig(api_key="test-key")
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_openrouter_response)
            mock_post.return_value.__aenter__.return_value = mock_response
            
            async with OpenRouterClient(config) as client:
                response = await client.generate_response(
                    prompt="Test prompt",
                    context="This is context information"
                )
                
                assert isinstance(response, LLMResponse)
                assert response.content is not None
    
    @pytest.mark.asyncio
    async def test_generate_response_api_error(self):
        """Test API error handling"""
        config = OpenRouterConfig(api_key="test-key")
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 500
            mock_response.text = AsyncMock(return_value="Internal Server Error")
            mock_post.return_value.__aenter__.return_value = mock_response
            
            async with OpenRouterClient(config) as client:
                with pytest.raises(Exception):
                    await client.generate_response(prompt="Test prompt")
    
    @pytest.mark.asyncio
    async def test_cost_calculation(self, mock_openrouter_response):
        """Test cost calculation"""
        config = OpenRouterConfig(api_key="test-key")
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_openrouter_response)
            mock_post.return_value.__aenter__.return_value = mock_response
            
            async with OpenRouterClient(config) as client:
                response = await client.generate_response(prompt="Test prompt")
                
                # Should have cost estimate
                assert response.cost_estimate >= 0


class TestOpenRouterClientEdgeCases:
    """Test edge cases"""
    
    @pytest.mark.asyncio
    async def test_empty_prompt(self):
        """Test with empty prompt"""
        config = OpenRouterConfig(api_key="test-key")
        
        async with OpenRouterClient(config) as client:
            with pytest.raises(Exception):
                await client.generate_response(prompt="")
    
    @pytest.mark.asyncio
    async def test_very_long_prompt(self, mock_openrouter_response):
        """Test with very long prompt"""
        config = OpenRouterConfig(api_key="test-key")
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=mock_openrouter_response)
            mock_post.return_value.__aenter__.return_value = mock_response
            
            async with OpenRouterClient(config) as client:
                long_prompt = "Hello " * 10000
                response = await client.generate_response(prompt=long_prompt)
                
                assert isinstance(response, LLMResponse)
    
    @pytest.mark.asyncio
    async def test_invalid_api_key(self):
        """Test with invalid API key"""
        config = OpenRouterConfig(api_key="invalid-key")
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 401
            mock_response.text = AsyncMock(return_value="Unauthorized")
            mock_post.return_value.__aenter__.return_value = mock_response
            
            async with OpenRouterClient(config) as client:
                with pytest.raises(Exception):
                    await client.generate_response(prompt="Test")


class TestOpenRouterClientStreaming:
    """Test streaming functionality"""
    
    @pytest.mark.asyncio
    async def test_streaming_response(self):
        """Test streaming response generation"""
        config = OpenRouterConfig(api_key="test-key")
        
        # Mock streaming response
        async def mock_stream():
            chunks = [
                b'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
                b'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
                b'data: [DONE]\n\n'
            ]
            for chunk in chunks:
                yield chunk
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.content.iter_any = mock_stream
            mock_post.return_value.__aenter__.return_value = mock_response
            
            async with OpenRouterClient(config) as client:
                chunks_received = []
                async for chunk in client.generate_response_stream(prompt="Test"):
                    chunks_received.append(chunk)
                
                # Should receive chunks
                assert len(chunks_received) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

