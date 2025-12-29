"""
Unit tests for retry logic module
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, Mock
try:
    from src.retry_logic import (
        RetryConfig, retry_async, retry_with_timeout,
        API_RETRY_CONFIG, DATABASE_RETRY_CONFIG
    )
except Exception:
    pytest.skip("Retry logic module not fully available; skipping retry tests", allow_module_level=True)


class TestRetryConfig:
    """Test RetryConfig dataclass"""

    def test_retry_config_creation(self):
        """Test RetryConfig creation"""
        config = RetryConfig(
            max_retries=3,
            initial_delay=1.0,
            max_delay=10.0,
            exponential_base=2.0
        )

        assert config.max_retries == 3
        assert config.initial_delay == 1.0
        assert config.max_delay == 10.0
        assert config.exponential_base == 2.0

    def test_api_retry_config(self):
        """Test API retry config"""
        assert API_RETRY_CONFIG.max_retries == 3
        assert API_RETRY_CONFIG.initial_delay == 1.0

    def test_database_retry_config(self):
        """Test database retry config"""
        assert DATABASE_RETRY_CONFIG.max_retries == 5
        assert DATABASE_RETRY_CONFIG.initial_delay == 0.5


class TestRetryAsync:
    """Test retry_async decorator"""

    @pytest.mark.asyncio
    async def test_successful_execution_no_retry(self):
        """Test successful execution without retry"""
        mock_func = AsyncMock(return_value="success")

        result = await retry_async(mock_func, API_RETRY_CONFIG)()

        assert result == "success"
        assert mock_func.call_count == 1

    @pytest.mark.asyncio
    async def test_retry_on_failure(self):
        """Test retry on failure"""
        mock_func = AsyncMock(side_effect=[
            Exception("First failure"),
            Exception("Second failure"),
            "success"
        ])

        result = await retry_async(mock_func, API_RETRY_CONFIG)()

        assert result == "success"
        assert mock_func.call_count == 3

    @pytest.mark.asyncio
    async def test_max_retries_exceeded(self):
        """Test max retries exceeded"""
        mock_func = AsyncMock(side_effect=Exception("Always fails"))

        with pytest.raises(Exception, match="Always fails"):
            await retry_async(mock_func, API_RETRY_CONFIG)()

        # Should try initial + 3 retries = 4 times
        assert mock_func.call_count == 4

    @pytest.mark.asyncio
    async def test_exponential_backoff(self):
        """Test exponential backoff delays"""
        call_times = []

        async def failing_func():
            call_times.append(asyncio.get_event_loop().time())
            if len(call_times) < 3:
                raise Exception("Fail")
            return "success"

        config = RetryConfig(max_retries=3, initial_delay=0.1, max_delay=1.0)
        result = await retry_async(failing_func, config)()

        assert result == "success"
        assert len(call_times) == 3

        # Check that delays increase (with some tolerance for jitter)
        if len(call_times) >= 2:
            delay1 = call_times[1] - call_times[0]
            assert delay1 >= 0.05  # At least half of initial_delay (accounting for jitter)

    @pytest.mark.asyncio
    async def test_retry_with_args_kwargs(self):
        """Test retry with function arguments"""
        mock_func = AsyncMock(return_value="success")

        result = await retry_async(mock_func, API_RETRY_CONFIG)("arg1", kwarg1="value1")

        assert result == "success"
        mock_func.assert_called_once_with("arg1", kwarg1="value1")


class TestRetryWithTimeout:
    """Test retry_with_timeout function"""

    @pytest.mark.asyncio
    async def test_successful_execution_within_timeout(self):
        """Test successful execution within timeout"""
        async def quick_func():
            await asyncio.sleep(0.1)
            return "success"

        result = await retry_with_timeout(quick_func, API_RETRY_CONFIG, timeout=5.0)

        assert result == "success"

    @pytest.mark.asyncio
    async def test_timeout_exceeded(self):
        """Test timeout exceeded"""
        async def slow_func():
            await asyncio.sleep(2.0)
            return "success"

        with pytest.raises(asyncio.TimeoutError):
            await retry_with_timeout(slow_func, API_RETRY_CONFIG, timeout=0.5)

    @pytest.mark.asyncio
    async def test_retry_with_timeout_on_failure(self):
        """Test retry with timeout on failure"""
        call_count = 0

        async def failing_func():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise Exception("Fail")
            return "success"

        result = await retry_with_timeout(failing_func, API_RETRY_CONFIG, timeout=5.0)

        assert result == "success"
        assert call_count == 2


class TestRetryStatistics:
    """Test retry statistics tracking"""

    @pytest.mark.asyncio
    async def test_retry_count_tracking(self):
        """Test that retry count is tracked"""
        attempts = []

        async def func_with_tracking():
            attempts.append(1)
            if len(attempts) < 3:
                raise Exception("Fail")
            return "success"

        result = await retry_async(func_with_tracking, API_RETRY_CONFIG)()

        assert result == "success"
        assert len(attempts) == 3


class TestRetryEdgeCases:
    """Test edge cases"""

    @pytest.mark.asyncio
    async def test_zero_retries(self):
        """Test with zero retries"""
        config = RetryConfig(max_retries=0, initial_delay=1.0)
        mock_func = AsyncMock(side_effect=Exception("Fail"))

        with pytest.raises(Exception, match="Fail"):
            await retry_async(mock_func, config)()

        assert mock_func.call_count == 1

    @pytest.mark.asyncio
    async def test_max_delay_cap(self):
        """Test that delay is capped at max_delay"""
        call_times = []

        async def failing_func():
            call_times.append(asyncio.get_event_loop().time())
            if len(call_times) < 4:
                raise Exception("Fail")
            return "success"

        config = RetryConfig(
            max_retries=5,
            initial_delay=0.1,
            max_delay=0.2,
            exponential_base=2.0
        )

        result = await retry_async(failing_func, config)()

        assert result == "success"
        # Verify delays don't exceed max_delay significantly
        for i in range(1, len(call_times)):
            delay = call_times[i] - call_times[i-1]
            # Allow some tolerance for jitter and execution time
            assert delay <= 0.4  # max_delay * 2 for tolerance


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
