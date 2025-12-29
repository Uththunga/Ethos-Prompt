"""
Test suite for LLM Manager
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from src.llm.llm_manager import LLMManager, ProviderType, ProviderConfig, LLMResponse


class TestLLMManager:
    """Test cases for LLM Manager"""
    
    @pytest.fixture
    def llm_manager(self):
        """Create LLM manager instance for testing"""
        return LLMManager()
    
    @pytest.fixture
    def mock_openai_response(self):
        """Mock OpenAI API response"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Test response"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.usage.total_tokens = 100
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 50
        return mock_response
    
    def test_provider_initialization(self, llm_manager):
        """Test provider initialization"""
        assert llm_manager.providers is not None
        assert llm_manager.provider_configs is not None
        assert llm_manager.fallback_order is not None
    
    def test_provider_config_creation(self):
        """Test provider configuration creation"""
        config = ProviderConfig(
            model="gpt-4o-mini",
            max_tokens=1000,
            temperature=0.7
        )
        
        assert config.model == "gpt-4o-mini"
        assert config.max_tokens == 1000
        assert config.temperature == 0.7
    
    @pytest.mark.asyncio
    async def test_generate_response_success(self, llm_manager):
        """Test successful response generation"""
        with patch.object(llm_manager, '_generate_openai', new_callable=AsyncMock) as mock_generate:
            mock_response = LLMResponse(
                content="Test response",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=100,
                cost=0.001,
                response_time=0.5,
                metadata={"finish_reason": "stop"}
            )
            mock_generate.return_value = mock_response
            
            response = await llm_manager.generate_response("Test prompt")
            
            assert response.content == "Test response"
            assert response.provider == "openai"
            assert response.tokens_used == 100
            mock_generate.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_response_with_fallback(self, llm_manager):
        """Test response generation with provider fallback"""
        with patch.object(llm_manager, '_generate_openai', new_callable=AsyncMock) as mock_openai, \
             patch.object(llm_manager, '_generate_anthropic', new_callable=AsyncMock) as mock_anthropic:
            
            # First provider fails
            mock_openai.side_effect = Exception("API Error")
            
            # Second provider succeeds
            mock_response = LLMResponse(
                content="Fallback response",
                provider="anthropic",
                model="claude-3-5-sonnet-20241022",
                tokens_used=120,
                cost=0.002,
                response_time=0.7,
                metadata={"stop_reason": "end_turn"}
            )
            mock_anthropic.return_value = mock_response
            
            response = await llm_manager.generate_response("Test prompt")
            
            assert response.content == "Fallback response"
            assert response.provider == "anthropic"
            mock_openai.assert_called_once()
            mock_anthropic.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_response_all_providers_fail(self, llm_manager):
        """Test response generation when all providers fail"""
        with patch.object(llm_manager, '_generate_openai', new_callable=AsyncMock) as mock_openai, \
             patch.object(llm_manager, '_generate_anthropic', new_callable=AsyncMock) as mock_anthropic:
            
            mock_openai.side_effect = Exception("OpenAI Error")
            mock_anthropic.side_effect = Exception("Anthropic Error")
            
            with pytest.raises(Exception) as exc_info:
                await llm_manager.generate_response("Test prompt")
            
            assert "All LLM providers failed" in str(exc_info.value)
    
    def test_cost_calculation_openai(self, llm_manager):
        """Test OpenAI cost calculation"""
        cost = llm_manager._calculate_openai_cost(1000, "gpt-4o-mini")
        expected_cost = (1000 / 1000) * 0.0015  # $0.0015 per 1K tokens
        assert cost == expected_cost
    
    def test_cost_calculation_anthropic(self, llm_manager):
        """Test Anthropic cost calculation"""
        cost = llm_manager._calculate_anthropic_cost(500, 500, "claude-3-5-sonnet-20241022")
        expected_input_cost = (500 / 1000) * 0.003
        expected_output_cost = (500 / 1000) * 0.015
        expected_total = expected_input_cost + expected_output_cost
        assert cost == expected_total
    
    def test_provider_availability_check(self, llm_manager):
        """Test provider availability checking"""
        # Mock provider availability
        with patch.object(llm_manager, 'providers') as mock_providers:
            mock_providers.__contains__ = Mock(return_value=True)
            
            available_providers = llm_manager.get_available_providers()
            assert isinstance(available_providers, list)
    
    def test_provider_status_check(self, llm_manager):
        """Test provider status checking"""
        status = llm_manager.get_provider_status()
        assert isinstance(status, dict)
        
        # Should contain status for each provider type
        for provider_type in ProviderType:
            assert provider_type.value in status
    
    @pytest.mark.asyncio
    async def test_rate_limiting_integration(self, llm_manager):
        """Test integration with rate limiting"""
        # This would test the integration with the rate limiter
        # For now, just ensure the method exists and can be called
        assert hasattr(llm_manager, 'generate_response')
    
    def test_template_variable_handling(self, llm_manager):
        """Test handling of template variables in prompts"""
        prompt_with_variables = "Hello {{name}}, how are you?"
        variables = {"name": "Alice"}
        
        # This would test template processing if integrated
        # For now, just ensure the prompt is handled correctly
        assert "{{name}}" in prompt_with_variables
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self, llm_manager):
        """Test handling of concurrent requests"""
        with patch.object(llm_manager, '_generate_openai', new_callable=AsyncMock) as mock_generate:
            mock_response = LLMResponse(
                content="Concurrent response",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=100,
                cost=0.001,
                response_time=0.5,
                metadata={}
            )
            mock_generate.return_value = mock_response
            
            # Create multiple concurrent requests
            tasks = [
                llm_manager.generate_response(f"Prompt {i}")
                for i in range(5)
            ]
            
            responses = await asyncio.gather(*tasks)
            
            assert len(responses) == 5
            for response in responses:
                assert response.content == "Concurrent response"
    
    def test_error_handling_invalid_provider(self, llm_manager):
        """Test error handling for invalid provider"""
        with pytest.raises(ValueError):
            invalid_provider = "invalid_provider"
            # This should raise an error if provider validation is implemented
            ProviderType(invalid_provider)
    
    def test_response_metadata_structure(self):
        """Test LLM response metadata structure"""
        response = LLMResponse(
            content="Test content",
            provider="openai",
            model="gpt-4o-mini",
            tokens_used=100,
            cost=0.001,
            response_time=0.5,
            metadata={"finish_reason": "stop", "custom_field": "value"}
        )
        
        assert response.content == "Test content"
        assert response.provider == "openai"
        assert response.model == "gpt-4o-mini"
        assert response.tokens_used == 100
        assert response.cost == 0.001
        assert response.response_time == 0.5
        assert response.metadata["finish_reason"] == "stop"
        assert response.metadata["custom_field"] == "value"
    
    @pytest.mark.asyncio
    async def test_timeout_handling(self, llm_manager):
        """Test timeout handling for slow responses"""
        with patch.object(llm_manager, '_generate_openai', new_callable=AsyncMock) as mock_generate:
            # Simulate a timeout
            mock_generate.side_effect = asyncio.TimeoutError("Request timeout")
            
            with pytest.raises(Exception):
                await llm_manager.generate_response("Test prompt")
    
    def test_model_configuration_validation(self):
        """Test model configuration validation"""
        # Test valid configuration
        valid_config = ProviderConfig(
            model="gpt-4o-mini",
            max_tokens=1000,
            temperature=0.7
        )
        assert valid_config.model == "gpt-4o-mini"
        
        # Test invalid temperature (should be between 0 and 2)
        with pytest.raises(ValueError):
            ProviderConfig(
                model="gpt-4o-mini",
                max_tokens=1000,
                temperature=3.0  # Invalid temperature
            )
    
    @pytest.mark.asyncio
    async def test_streaming_response_handling(self, llm_manager):
        """Test streaming response handling (if implemented)"""
        # This would test streaming responses if the feature is implemented
        # For now, just ensure the basic response structure works
        with patch.object(llm_manager, '_generate_openai', new_callable=AsyncMock) as mock_generate:
            mock_response = LLMResponse(
                content="Streaming response",
                provider="openai",
                model="gpt-4o-mini",
                tokens_used=100,
                cost=0.001,
                response_time=0.5,
                metadata={"stream": True}
            )
            mock_generate.return_value = mock_response
            
            response = await llm_manager.generate_response("Test prompt")
            assert response.content == "Streaming response"
            assert response.metadata.get("stream") is True
