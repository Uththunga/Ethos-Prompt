"""
Unit test for marketing agent configuration
Tests that max_tokens is set to appropriate value for complete responses
"""
import pytest
import os


def test_max_tokens_configuration():
    """Verify max_tokens is set to adequate value"""
    from src.ai_agent.marketing.config import get_config, reload_config

    # Reload to ensure fresh config
    config = reload_config()

    # Verify max_tokens is in acceptable range
    assert config.max_tokens >= 1000, (
        f"max_tokens too low: {config.max_tokens} "
        f"(minimum 1000 recommended for complete responses with sources)"
    )
    assert config.max_tokens <= 4000, (
        f"max_tokens too high: {config.max_tokens} "
        f"(maximum 4000 to avoid excessive latency)"
    )

    # Verify default value is 1500
    # Clear environment variable to test default
    original_value = os.environ.get("MARKETING_AGENT_MAX_TOKENS")
    try:
        if "MARKETING_AGENT_MAX_TOKENS" in os.environ:
            del os.environ["MARKETING_AGENT_MAX_TOKENS"]

        config = reload_config()
        assert config.max_tokens == 1500, (
            f"Default max_tokens should be 1500, got {config.max_tokens}"
        )
    finally:
        # Restore original value
        if original_value is not None:
            os.environ["MARKETING_AGENT_MAX_TOKENS"] = original_value


def test_config_from_environment():
    """Test that configuration can be overridden via environment variable"""
    from src.ai_agent.marketing.config import reload_config

    # Set custom value
    os.environ["MARKETING_AGENT_MAX_TOKENS"] = "2000"

    try:
        config = reload_config()
        assert config.max_tokens == 2000, (
            f"max_tokens from env should be 2000, got {config.max_tokens}"
        )
    finally:
        # Clean up
        if "MARKETING_AGENT_MAX_TOKENS" in os.environ:
            del os.environ["MARKETING_AGENT_MAX_TOKENS"]
