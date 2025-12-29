"""
Marketing Agent Configuration
Centralizes all configuration values for the marketing agent
"""
from typing import List, Optional
from pydantic import BaseModel, Field
import os


class MarketingAgentConfig(BaseModel):
    """Configuration for Marketing Agent behavior"""

    # LLM Settings
    model_name: str = Field(
        default_factory=lambda: os.getenv("OPENROUTER_MODEL", "z-ai/glm-4.5-air:free"),
        description="LLM model to use"
    )
    temperature: float = Field(
        default_factory=lambda: float(os.getenv("MARKETING_AGENT_TEMPERATURE", "0.6")),
        description="Temperature for response generation (lower = more focused)"
    )
    max_tokens: int = Field(
        default_factory=lambda: int(os.getenv("MARKETING_AGENT_MAX_TOKENS", "750")),
        description="Maximum tokens in response (allows complete answers with sources and follow-ups)"
    )

    # PERF-006 FIX: Configurable log level
    log_level: str = Field(
        default_factory=lambda: os.getenv("MARKETING_AGENT_LOG_LEVEL", "INFO"),
        description="Log level for marketing agent (DEBUG/INFO/WARNING/ERROR)"
    )

    # Response quality parameters
    min_response_length: int = Field(default=20, description="Minimum response length in characters")
    max_response_length: int = Field(default=2500, description="Maximum response length in characters")
    max_paragraph_length: int = Field(default=800, description="Maximum paragraph length in characters")
    max_input_length: int = Field(default=5000, description="Maximum user input length in characters")
    history_retention_limit: int = Field(default=20, description="Maximum number of messages to keep in history")

    # BIZ-004 FIX: KB Grounding threshold (was hardcoded 0.6)
    grounding_threshold: float = Field(
        default=0.6,
        description="Minimum grounding score (0.0-1.0) for response to pass KB validation"
    )

    # L2 FIX: Magic numbers moved to config
    min_word_warning_threshold: int = Field(
        default=50,
        description="Word count below which to warn about possible truncation"
    )
    max_follow_up_questions: int = Field(
        default=3,
        description="Maximum number of follow-up questions to include"
    )

    # Hallucination Detection
    hallucination_terms: List[str] = Field(
        default_factory=lambda: [
            "digital transformation",
            "ai prompt optimization"
        ],
        description="Terms that indicate possible hallucination if not in retrieved content"
    )

    # Brand Voice Enforcement
    forbidden_words: List[str] = Field(
        default_factory=lambda: [
            "delve",
            "tapestry",
            "landscape of",
            "realm of",
            "testament to"
        ],
        description="Words that violate brand voice"
    )

    # Reflection Settings
    max_reflection_iterations: int = Field(default=3, description="Max retries for reflection loop")

    # REF-002 FIX: Configurable triggers for validation rules
    min_word_count_for_followup: int = Field(default=10, description="Minimum words in user query to trigger follow-up check")
    long_response_threshold: int = Field(default=500, description="Length threshold (chars) to enforce strict formatting (bullets)")

    pricing_keywords: List[str] = Field(
        default_factory=lambda: ["price", "cost", "plan", "subscription"],
        description="Keywords that trigger CTA validation"
    )
    cta_keywords: List[str] = Field(
        default_factory=lambda: ["consultation", "contact", "reach out", "schedule"],
        description="Required call-to-action terms if pricing mentioned"
    )
    price_regex_pattern: str = Field(
        default=r'\$\d+(?:,\d+)*(?:\.\d+)?',
        description="Regex to detect specific dollar amounts"
    )

    # Redis Settings (for state persistence)
    redis_enabled: bool = Field(
        default_factory=lambda: os.getenv("REDIS_ENABLED", "false").lower() == "true",
        description="Enable Redis for conversation state persistence"
    )
    redis_host: str = Field(
        default_factory=lambda: os.getenv("REDIS_HOST", "localhost"),
        description="Redis host"
    )
    redis_port: int = Field(
        default_factory=lambda: int(os.getenv("REDIS_PORT", "6379")),
        description="Redis port"
    )
    redis_ttl: int = Field(
        default_factory=lambda: int(os.getenv("REDIS_STATE_TTL", "3600")),
        description="TTL for conversation state in Redis (seconds)"
    )

    # PII Protection
    enforce_pii_protection: bool = Field(
        default_factory=lambda: os.getenv("ENFORCE_PII_PROTECTION", "false").lower() == "true",
        description="Fail-closed if PII detection dependencies missing"
    )

    # Fallback Messages (Condensed for Australian brevity)
    kb_not_found_message: str = Field(
        default="""I don't have that specific info right now. EthosPrompt offers AI-powered business solutions including Smart Assistants, System Integration, and Custom Apps. For details, visit /contact or ask me about a specific service.""",
        description="Message when KB search returns no results"
    )

    kb_error_message: str = Field(
        default="""Having a quick hiccup accessing details. EthosPrompt helps businesses with AI automation and integration. For specific info, try asking again or reach out via /contact.""",
        description="Message when KB search encounters an error"
    )

    # SEC-005 FIX: Rate limiting configuration
    rate_limit_enabled: bool = Field(
        default_factory=lambda: os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true",
        description="Enable rate limiting for chat endpoint"
    )
    rate_limit_requests_per_minute: int = Field(
        default_factory=lambda: int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "30")),
        description="Maximum requests per minute per user"
    )
    rate_limit_burst: int = Field(
        default_factory=lambda: int(os.getenv("RATE_LIMIT_BURST", "5")),
        description="Burst capacity for rate limiting"
    )

    class Config:
        """Pydantic config"""
        env_prefix = "MARKETING_AGENT_"
        case_sensitive = False


# Singleton instance
_config_instance: Optional[MarketingAgentConfig] = None


def get_config() -> MarketingAgentConfig:
    """Get or create global config instance"""
    global _config_instance

    if _config_instance is None:
        _config_instance = MarketingAgentConfig()

    return _config_instance


def reload_config() -> MarketingAgentConfig:
    """Reload configuration (useful for testing)"""
    global _config_instance
    _config_instance = MarketingAgentConfig()
    return _config_instance
