"""
Centralized Configuration Management for Marketing Agent
Uses Pydantic for type-safe, validated configuration
"""
import os
from typing import Optional, Literal
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class MarketingAgentConfig(BaseSettings):
    """
    Marketing Agent Configuration

    All configuration is loaded from environment variables with the prefix MARKETING_AGENT_
    Example: MARKETING_AGENT_LLM_PROVIDER -> llm_provider
    """

    model_config = SettingsConfigDict(
        env_prefix='MARKETING_AGENT_',
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore'
    )

    # ========================================================================
    # Environment
    # ========================================================================
    environment: Literal['development', 'staging', 'production'] = Field(
        default='development',
        description="Deployment environment"
    )

    # ========================================================================
    # LLM Configuration
    # ========================================================================
    llm_provider: Literal['openrouter', 'granite'] = Field(
        default='openrouter',
        description="LLM provider to use"
    )

    # OpenRouter settings
    openrouter_api_key: Optional[str] = Field(
        default=None,
        description="OpenRouter API key"
    )

    openrouter_model: str = Field(
        default='z-ai/glm-4.5-air:free',
        description="OpenRouter model ID"
    )

    # Watsonx/Granite settings
    watsonx_api_key: Optional[str] = Field(
        default=None,
        description="IBM Watsonx API key"
    )

    watsonx_project_id: Optional[str] = Field(
        default=None,
        description="IBM Watsonx project ID"
    )

    watsonx_model_id: str = Field(
        default='ibm/granite-4-0-h-small',
        description="Watsonx model ID"
    )

    # ========================================================================
    # Model Parameters
    # ========================================================================
    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="LLM temperature (0.0-2.0) - higher for variety"
    )

    max_tokens: int = Field(
        default=400,
        ge=50,
        le=4000,
        description="Maximum tokens in response"
    )

    streaming: bool = Field(
        default=True,
        description="Enable streaming responses"
    )

    # ========================================================================
    # Retrieval Configuration
    # ========================================================================
    retrieval_top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of KB results to retrieve"
    )

    retrieval_use_hybrid: bool = Field(
        default=True,
        description="Use hybrid search (semantic + BM25)"
    )

    retrieval_semantic_weight: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Weight for semantic search in hybrid mode"
    )

    retrieval_bm25_weight: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Weight for BM25 search in hybrid mode"
    )

    retrieval_use_reranking: bool = Field(
        default=False,
        description="Use CrossEncoder reranking"
    )

    # ========================================================================
    # Redis Cache Configuration
    # ========================================================================
    redis_enabled: bool = Field(
        default=False,
        description="Enable Redis caching"
    )

    redis_host: str = Field(
        default='localhost',
        description="Redis host"
    )

    redis_port: int = Field(
        default=6379,
        ge=1,
        le=65535,
        description="Redis port"
    )

    redis_db: int = Field(
        default=0,
        ge=0,
        le=15,
        description="Redis database number"
    )

    redis_ttl: int = Field(
        default=3600,
        ge=60,
        description="Redis cache TTL in seconds"
    )

    # ========================================================================
    # Monitoring Configuration
    # ========================================================================
    monitoring_enabled: bool = Field(
        default=True,
        description="Enable Prometheus metrics"
    )

    sentry_dsn: Optional[str] = Field(
        default=None,
        description="Sentry DSN for error tracking"
    )

    # ========================================================================
    # Performance Configuration
    # ========================================================================
    use_mock_mode: bool = Field(
        default=False,
        description="Use mock LLM (for testing)"
    )

    enable_prompt_caching: bool = Field(
        default=True,
        description="Cache system prompts"
    )

    enable_http_session_reuse: bool = Field(
        default=True,
        description="Reuse HTTP connections"
    )

    # ========================================================================
    # Validation
    # ========================================================================
    @field_validator('llm_provider')
    @classmethod
    def validate_llm_provider(cls, v: str, info) -> str:
        """Validate LLM provider has required credentials"""
        if v == 'openrouter':
            # OpenRouter API key will be checked at runtime
            pass
        elif v == 'granite':
            # Watsonx credentials will be checked at runtime
            pass
        return v

    @field_validator('retrieval_semantic_weight', 'retrieval_bm25_weight')
    @classmethod
    def validate_weights_sum(cls, v: float, info) -> float:
        """Ensure retrieval weights sum to 1.0"""
        # This is a simplified check - full validation happens after both fields are set
        return v

    def validate_weights(self):
        """Validate that semantic and BM25 weights sum to 1.0"""
        total = self.retrieval_semantic_weight + self.retrieval_bm25_weight
        if abs(total - 1.0) > 0.01:
            raise ValueError(
                f"Retrieval weights must sum to 1.0, got {total:.2f} "
                f"(semantic={self.retrieval_semantic_weight}, bm25={self.retrieval_bm25_weight})"
            )

    # ========================================================================
    # Helper Methods
    # ========================================================================
    def get_llm_config(self) -> dict:
        """Get LLM configuration dict"""
        if self.llm_provider == 'openrouter':
            return {
                'provider': 'openrouter',
                'api_key': self.openrouter_api_key,
                'model': self.openrouter_model,
                'temperature': self.temperature,
                'max_tokens': self.max_tokens,
                'streaming': self.streaming
            }
        else:  # granite
            return {
                'provider': 'granite',
                'api_key': self.watsonx_api_key,
                'project_id': self.watsonx_project_id,
                'model': self.watsonx_model_id,
                'temperature': self.temperature,
                'max_tokens': self.max_tokens,
                'streaming': self.streaming
            }

    def get_retrieval_config(self) -> dict:
        """Get retrieval configuration dict"""
        return {
            'top_k': self.retrieval_top_k,
            'use_hybrid': self.retrieval_use_hybrid,
            'semantic_weight': self.retrieval_semantic_weight,
            'bm25_weight': self.retrieval_bm25_weight,
            'use_reranking': self.retrieval_use_reranking
        }

    def get_redis_config(self) -> dict:
        """Get Redis configuration dict"""
        return {
            'enabled': self.redis_enabled,
            'host': self.redis_host,
            'port': self.redis_port,
            'db': self.redis_db,
            'ttl': self.redis_ttl
        }

    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == 'production'

    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == 'development'


# ============================================================================
# Global Configuration Instance
# ============================================================================

_config: Optional[MarketingAgentConfig] = None


def get_config() -> MarketingAgentConfig:
    """
    Get the global configuration instance (singleton pattern)

    Returns:
        MarketingAgentConfig: The configuration instance
    """
    global _config

    if _config is None:
        _config = MarketingAgentConfig()
        _config.validate_weights()  # Validate after loading

    return _config


def reload_config() -> MarketingAgentConfig:
    """
    Reload configuration from environment variables

    Returns:
        MarketingAgentConfig: The new configuration instance
    """
    global _config
    _config = MarketingAgentConfig()
    _config.validate_weights()
    return _config


# ============================================================================
# Configuration Presets
# ============================================================================

def get_development_config() -> MarketingAgentConfig:
    """Get development configuration preset"""
    return MarketingAgentConfig(
        environment='development',
        llm_provider='openrouter',
        temperature=0.7,
        max_tokens=800,
        retrieval_top_k=3,
        redis_enabled=False,
        use_mock_mode=False
    )


def get_production_config() -> MarketingAgentConfig:
    """Get production configuration preset"""
    return MarketingAgentConfig(
        environment='production',
        llm_provider='granite',
        temperature=0.6,
        max_tokens=400,
        retrieval_top_k=5,
        redis_enabled=True,
        use_mock_mode=False,
        monitoring_enabled=True
    )


def get_test_config() -> MarketingAgentConfig:
    """Get test configuration preset"""
    return MarketingAgentConfig(
        environment='development',
        llm_provider='openrouter',
        temperature=0.5,
        max_tokens=200,
        retrieval_top_k=2,
        redis_enabled=False,
        use_mock_mode=True,
        monitoring_enabled=False
    )
