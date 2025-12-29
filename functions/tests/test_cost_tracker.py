"""
Unit tests for cost tracker module
"""
import pytest
from decimal import Decimal
from datetime import datetime, timezone
from unittest.mock import MagicMock, AsyncMock, patch
from src.llm.cost_tracker import (
    CostTracker, CostEntry, UsageStats, CostLimit
)


class TestCostCalculation:
    """Test cost calculation"""
    
    def test_calculate_cost_openai_gpt35(self):
        """Test cost calculation for OpenAI GPT-3.5"""
        tracker = CostTracker()
        
        cost = tracker.calculate_cost(
            provider="openai",
            model="gpt-3.5-turbo",
            input_tokens=1000,
            output_tokens=500
        )
        
        # Expected: (1000/1000 * 0.0005) + (500/1000 * 0.0015)
        # = 0.0005 + 0.00075 = 0.00125
        assert cost == Decimal("0.001250")
    
    def test_calculate_cost_openai_gpt4(self):
        """Test cost calculation for OpenAI GPT-4"""
        tracker = CostTracker()
        
        cost = tracker.calculate_cost(
            provider="openai",
            model="gpt-4",
            input_tokens=1000,
            output_tokens=1000
        )
        
        # Expected: (1000/1000 * 0.03) + (1000/1000 * 0.06)
        # = 0.03 + 0.06 = 0.09
        assert cost == Decimal("0.090000")
    
    def test_calculate_cost_anthropic_claude(self):
        """Test cost calculation for Anthropic Claude"""
        tracker = CostTracker()
        
        cost = tracker.calculate_cost(
            provider="anthropic",
            model="claude-3-5-sonnet-20241022",
            input_tokens=1000,
            output_tokens=1000
        )
        
        # Expected: (1000/1000 * 0.003) + (1000/1000 * 0.015)
        # = 0.003 + 0.015 = 0.018
        assert cost == Decimal("0.018000")
    
    def test_calculate_cost_unknown_provider(self):
        """Test cost calculation for unknown provider"""
        tracker = CostTracker()
        
        cost = tracker.calculate_cost(
            provider="unknown",
            model="unknown-model",
            input_tokens=1000,
            output_tokens=1000
        )
        
        # Should return default minimal cost
        assert cost == Decimal("0.001")
    
    def test_calculate_cost_unknown_model(self):
        """Test cost calculation for unknown model"""
        tracker = CostTracker()
        
        cost = tracker.calculate_cost(
            provider="openai",
            model="unknown-model",
            input_tokens=1000,
            output_tokens=1000
        )
        
        # Should use average cost for provider
        assert cost > Decimal("0")
    
    def test_calculate_cost_zero_tokens(self):
        """Test cost calculation with zero tokens"""
        tracker = CostTracker()
        
        cost = tracker.calculate_cost(
            provider="openai",
            model="gpt-3.5-turbo",
            input_tokens=0,
            output_tokens=0
        )
        
        assert cost == Decimal("0.000000")


class TestCostTracking:
    """Test cost tracking functionality"""
    
    def test_track_usage(self):
        """Test track_usage method"""
        mock_db = MagicMock()
        tracker = CostTracker(firestore_client=mock_db)
        
        entry = tracker.track_usage(
            user_id="user-123",
            provider="openai",
            model="gpt-3.5-turbo",
            input_tokens=100,
            output_tokens=50,
            request_id="req-123",
            endpoint="execute_prompt"
        )
        
        assert isinstance(entry, CostEntry)
        assert entry.user_id == "user-123"
        assert entry.provider == "openai"
        assert entry.model == "gpt-3.5-turbo"
        assert entry.tokens_used == 150
        assert entry.cost > Decimal("0")
    
    @pytest.mark.asyncio
    async def test_track_cost_async(self, sample_cost_entry):
        """Test async cost tracking"""
        mock_db = MagicMock()
        tracker = CostTracker(firestore_client=mock_db)
        
        await tracker.track_cost_async(sample_cost_entry)
        
        # Verify entry was added to cache
        assert len(tracker.cost_entries) > 0
    
    def test_cost_entry_creation(self):
        """Test CostEntry creation"""
        entry = CostEntry(
            user_id="user-123",
            provider="openai",
            model="gpt-3.5-turbo",
            tokens_used=100,
            cost=Decimal("0.000150"),
            timestamp=datetime.now(timezone.utc),
            request_id="req-123",
            endpoint="execute_prompt",
            metadata={"test": True}
        )
        
        assert entry.user_id == "user-123"
        assert entry.tokens_used == 100
        assert entry.cost == Decimal("0.000150")
        assert entry.metadata["test"] is True


class TestCostLimits:
    """Test cost limit checking"""
    
    def test_cost_limit_creation(self):
        """Test CostLimit creation"""
        limit = CostLimit(
            daily_limit=Decimal("1.00"),
            monthly_limit=Decimal("10.00"),
            per_request_limit=Decimal("0.10"),
            enabled=True
        )
        
        assert limit.daily_limit == Decimal("1.00")
        assert limit.monthly_limit == Decimal("10.00")
        assert limit.per_request_limit == Decimal("0.10")
        assert limit.enabled is True
    
    def test_default_cost_limits(self):
        """Test default cost limits"""
        tracker = CostTracker()
        
        # Free tier
        free_limit = tracker.default_limits["free"]
        assert free_limit.daily_limit == Decimal("1.00")
        assert free_limit.monthly_limit == Decimal("10.00")
        
        # Pro tier
        pro_limit = tracker.default_limits["pro"]
        assert pro_limit.daily_limit == Decimal("50.00")
        assert pro_limit.monthly_limit == Decimal("500.00")
        
        # Enterprise tier
        enterprise_limit = tracker.default_limits["enterprise"]
        assert enterprise_limit.daily_limit == Decimal("1000.00")
        assert enterprise_limit.monthly_limit == Decimal("10000.00")


class TestCostAggregation:
    """Test cost aggregation"""
    
    def test_usage_stats_creation(self):
        """Test UsageStats creation"""
        stats = UsageStats(
            total_requests=100,
            total_tokens=10000,
            total_cost=Decimal("1.50"),
            requests_by_provider={"openai": 80, "anthropic": 20},
            tokens_by_provider={"openai": 8000, "anthropic": 2000},
            cost_by_provider={"openai": Decimal("1.20"), "anthropic": Decimal("0.30")},
            requests_by_model={"gpt-3.5-turbo": 80, "claude-3-sonnet": 20},
            average_cost_per_request=Decimal("0.015"),
            average_tokens_per_request=100.0
        )
        
        assert stats.total_requests == 100
        assert stats.total_tokens == 10000
        assert stats.total_cost == Decimal("1.50")
        assert stats.average_cost_per_request == Decimal("0.015")


class TestCostTrackerEdgeCases:
    """Test edge cases"""
    
    def test_cost_tracker_without_firestore(self):
        """Test cost tracker without Firestore client"""
        tracker = CostTracker(firestore_client=None)
        
        entry = tracker.track_usage(
            user_id="user-123",
            provider="openai",
            model="gpt-3.5-turbo",
            input_tokens=100,
            output_tokens=50
        )
        
        # Should still work, just won't save to Firestore
        assert isinstance(entry, CostEntry)
    
    def test_cost_calculation_with_large_numbers(self):
        """Test cost calculation with large token counts"""
        tracker = CostTracker()
        
        cost = tracker.calculate_cost(
            provider="openai",
            model="gpt-4",
            input_tokens=100000,
            output_tokens=50000
        )
        
        # Expected: (100000/1000 * 0.03) + (50000/1000 * 0.06)
        # = 3.0 + 3.0 = 6.0
        assert cost == Decimal("6.000000")
    
    def test_cost_precision(self):
        """Test cost calculation precision"""
        tracker = CostTracker()
        
        cost = tracker.calculate_cost(
            provider="openai",
            model="gpt-3.5-turbo",
            input_tokens=1,
            output_tokens=1
        )
        
        # Should have 6 decimal places
        assert len(str(cost).split('.')[-1]) <= 6


class TestCostTrackerIntegration:
    """Test cost tracker integration scenarios"""
    
    @pytest.mark.asyncio
    async def test_multiple_cost_entries(self):
        """Test tracking multiple cost entries"""
        mock_db = MagicMock()
        tracker = CostTracker(firestore_client=mock_db)
        
        # Track multiple entries
        for i in range(5):
            entry = CostEntry(
                user_id="user-123",
                provider="openai",
                model="gpt-3.5-turbo",
                tokens_used=100,
                cost=Decimal("0.000150"),
                timestamp=datetime.now(timezone.utc),
                request_id=f"req-{i}",
                endpoint="execute_prompt",
                metadata={}
            )
            await tracker.track_cost_async(entry)
        
        # Verify all entries were cached
        assert len(tracker.cost_entries) == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

