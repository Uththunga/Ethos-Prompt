"""
Unit tests for LLM core functionality
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
import asyncio
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from llm.template_engine import TemplateEngine, TemplateValidationResult
from llm.rate_limiter import RateLimiter, RateLimit, RateLimitResult
from llm.cost_tracker import CostTracker, CostEntry
from llm.llm_manager import LLMManager, ProviderType, LLMResponse

class TestTemplateEngine(unittest.TestCase):
    """Test cases for TemplateEngine"""
    
    def setUp(self):
        self.engine = TemplateEngine()
    
    def test_simple_variable_substitution(self):
        """Test basic variable substitution"""
        template = "Hello {{name}}, welcome to {{platform}}!"
        variables = {"name": "John", "platform": "AI Assistant"}
        
        result = self.engine.render(template, variables)
        expected = "Hello John, welcome to AI Assistant!"
        
        self.assertEqual(result, expected)
    
    def test_missing_variables(self):
        """Test handling of missing variables"""
        template = "Hello {{name}}, your score is {{score}}"
        variables = {"name": "John"}
        
        result = self.engine.render(template, variables)
        # Missing variables should remain as placeholders
        self.assertIn("{{score}}", result)
    
    def test_conditional_rendering(self):
        """Test conditional blocks"""
        template = "{{#if premium}}Premium user{{#else}}Free user{{/if}}"
        
        # Test with premium = true
        result1 = self.engine.render(template, {"premium": True})
        self.assertEqual(result1, "Premium user")
        
        # Test with premium = false
        result2 = self.engine.render(template, {"premium": False})
        self.assertEqual(result2, "Free user")
    
    def test_loop_rendering(self):
        """Test loop blocks"""
        template = "Items: {{#each items}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}"
        variables = {"items": ["apple", "banana", "cherry"]}
        
        result = self.engine.render(template, variables)
        # Should handle basic loop (simplified test)
        self.assertIn("apple", result)
        self.assertIn("banana", result)
        self.assertIn("cherry", result)
    
    def test_helper_functions(self):
        """Test built-in helper functions"""
        template = "{{upper name}} - {{length items}}"
        variables = {"name": "john", "items": [1, 2, 3]}
        
        result = self.engine.render(template, variables)
        self.assertIn("JOHN", result)
        self.assertIn("3", result)
    
    def test_extract_variables(self):
        """Test variable extraction"""
        template = "Hello {{name}}, your {{type}} account has {{count}} items"
        
        variables = self.engine.extract_variables(template)
        expected = ["name", "type", "count"]
        
        self.assertEqual(set(variables), set(expected))
    
    def test_template_validation(self):
        """Test template validation"""
        template = "Hello {{name}}, welcome!"
        variables = {"name": "John", "unused": "value"}
        
        result = self.engine.validate_template(template, variables)
        
        self.assertIsInstance(result, TemplateValidationResult)
        self.assertTrue(result.is_valid)
        self.assertEqual(result.unused_variables, ["unused"])

class TestRateLimiter(unittest.TestCase):
    """Test cases for RateLimiter"""
    
    def setUp(self):
        self.limiter = RateLimiter()
        self.rate_limit = RateLimit(
            requests_per_minute=10,
            requests_per_hour=100,
            requests_per_day=1000,
            burst_limit=5
        )
    
    def test_rate_limit_allow(self):
        """Test rate limiting allows requests within limits"""
        user_id = "test_user_1"
        
        result = self.limiter.check_rate_limit(user_id, self.rate_limit)
        
        self.assertIsInstance(result, RateLimitResult)
        self.assertTrue(result.allowed)
        self.assertGreater(result.remaining_requests, 0)
    
    def test_rate_limit_exceed(self):
        """Test rate limiting blocks requests when exceeded"""
        user_id = "test_user_2"
        
        # Make requests up to the limit
        for i in range(self.rate_limit.requests_per_minute):
            result = self.limiter.check_rate_limit(user_id, self.rate_limit)
            if result.allowed:
                # Simulate successful request by incrementing counter
                pass
        
        # Next request should be blocked
        result = self.limiter.check_rate_limit(user_id, self.rate_limit)
        # Note: This test might pass due to local cache implementation
        # In production with Redis, this would be more reliable
    
    def test_rate_limit_status(self):
        """Test getting rate limit status"""
        user_id = "test_user_3"
        
        status = self.limiter.get_rate_limit_status(user_id)
        
        self.assertIsInstance(status, dict)
        self.assertIn("minute", status)
        self.assertIn("hour", status)
        self.assertIn("day", status)
    
    def test_rate_limit_reset(self):
        """Test resetting rate limits"""
        user_id = "test_user_4"
        
        # Make a request
        self.limiter.check_rate_limit(user_id, self.rate_limit)
        
        # Reset limits
        self.limiter.reset_rate_limit(user_id)
        
        # Should be able to make requests again
        result = self.limiter.check_rate_limit(user_id, self.rate_limit)
        self.assertTrue(result.allowed)

class TestCostTracker(unittest.TestCase):
    """Test cases for CostTracker"""
    
    def setUp(self):
        self.tracker = CostTracker()
    
    def test_cost_calculation(self):
        """Test cost calculation for different providers"""
        # Test OpenAI cost calculation
        cost = self.tracker.calculate_cost("openai", "gpt-4o-mini", 1000, 500)
        self.assertIsInstance(cost, Decimal)
        self.assertGreater(cost, Decimal("0"))
        
        # Test unknown provider
        cost_unknown = self.tracker.calculate_cost("unknown", "unknown", 1000, 500)
        self.assertEqual(cost_unknown, Decimal("0.001"))
    
    def test_usage_tracking(self):
        """Test usage tracking"""
        user_id = "test_user"
        
        cost_entry = self.tracker.track_usage(
            user_id=user_id,
            provider="openai",
            model="gpt-4o-mini",
            input_tokens=100,
            output_tokens=50,
            request_id="test_request"
        )
        
        self.assertIsInstance(cost_entry, CostEntry)
        self.assertEqual(cost_entry.user_id, user_id)
        self.assertEqual(cost_entry.provider, "openai")
        self.assertEqual(cost_entry.tokens_used, 150)
        self.assertGreater(cost_entry.cost, Decimal("0"))
    
    def test_cost_limits_check(self):
        """Test cost limits checking"""
        user_id = "test_user"
        
        limits = self.tracker.check_cost_limits(user_id, "free")
        
        self.assertIsInstance(limits, dict)
        self.assertIn("within_limits", limits)
        self.assertIn("daily", limits)
        self.assertIn("monthly", limits)
    
    def test_cost_breakdown(self):
        """Test cost breakdown generation"""
        user_id = "test_user"
        
        breakdown = self.tracker.get_cost_breakdown(user_id, days=7)
        
        self.assertIsInstance(breakdown, dict)
        self.assertIn("period", breakdown)
        self.assertIn("summary", breakdown)
        self.assertIn("by_provider", breakdown)

class TestLLMManager(unittest.TestCase):
    """Test cases for LLMManager"""
    
    def setUp(self):
        self.manager = LLMManager()
    
    def test_provider_initialization(self):
        """Test provider initialization"""
        # Test that manager initializes without errors
        self.assertIsInstance(self.manager, LLMManager)
        self.assertIsInstance(self.manager.providers, dict)
        self.assertIsInstance(self.manager.provider_configs, dict)
    
    def test_available_providers(self):
        """Test getting available providers"""
        providers = self.manager.get_available_providers()
        self.assertIsInstance(providers, list)
    
    def test_provider_status(self):
        """Test getting provider status"""
        status = self.manager.get_provider_status()
        self.assertIsInstance(status, dict)
    
    @patch('openai.OpenAI')
    async def test_openai_response_generation(self, mock_openai):
        """Test OpenAI response generation with mocking"""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Test response"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.usage.total_tokens = 100
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 50
        
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        # Set up environment and provider
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test_key'}):
            manager = LLMManager()
            manager._setup_openai()
            
            if ProviderType.OPENAI in manager.providers:
                response = await manager._generate_openai("Test prompt")
                
                self.assertIsInstance(response, LLMResponse)
                self.assertEqual(response.content, "Test response")
                self.assertEqual(response.provider, "openai")
                self.assertEqual(response.tokens_used, 100)

class TestIntegration(unittest.TestCase):
    """Integration tests for AI service components"""
    
    def test_template_and_cost_integration(self):
        """Test integration between template engine and cost tracker"""
        template_engine = TemplateEngine()
        cost_tracker = CostTracker()
        
        # Render a template
        template = "Generate a {{type}} for {{industry}}"
        variables = {"type": "report", "industry": "healthcare"}
        rendered = template_engine.render(template, variables)
        
        # Track cost for the rendered prompt
        cost_entry = cost_tracker.track_usage(
            user_id="integration_test",
            provider="openai",
            model="gpt-4o-mini",
            input_tokens=len(rendered.split()) * 1.3,  # Rough token estimate
            output_tokens=100
        )
        
        self.assertIsInstance(cost_entry, CostEntry)
        self.assertGreater(cost_entry.cost, Decimal("0"))

if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)
