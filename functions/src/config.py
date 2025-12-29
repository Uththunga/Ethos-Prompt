"""
Configuration Management - Centralized settings with validation
"""
import os
import logging
from typing import Optional, List
from pydantic import Field, validator
from pydantic_settings import BaseSettings
from enum import Enum

logger = logging.getLogger(__name__)

class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class Settings(BaseSettings):
    """
    Application settings with validation
    """

    model_config = {
        "extra": "ignore",
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }

    # Environment
    environment: Environment = Field(default=Environment.DEVELOPMENT, env="NODE_ENV")  # type: ignore[call-overload]
    log_level: LogLevel = Field(default=LogLevel.INFO, env="LOG_LEVEL")  # type: ignore[call-overload]
    debug: bool = Field(default=False)  # type: ignore[call-overload]

    # API Keys - LLM Providers
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")  # type: ignore[call-overload]
    anthropic_api_key: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")  # type: ignore[call-overload]
    google_api_key: Optional[str] = Field(None, env="GOOGLE_API_KEY")  # type: ignore[call-overload]
    cohere_api_key: Optional[str] = Field(None, env="COHERE_API_KEY")  # type: ignore[call-overload]
    openrouter_api_key: Optional[str] = Field(None, env="OPENROUTER_API_KEY")  # type: ignore[call-overload]

    # Vector Database - Pinecone
    pinecone_api_key: Optional[str] = Field(None, env="PINECONE_API_KEY")  # type: ignore[call-overload]
    pinecone_environment: str = Field(default="us-east-1-aws", env="PINECONE_ENVIRONMENT")  # type: ignore[call-overload]
    pinecone_index_name: str = Field(default="rag-prompt-library", env="PINECONE_INDEX_NAME")  # type: ignore[call-overload]

    # Redis Configuration
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")  # type: ignore[call-overload]
    redis_max_connections: int = Field(default=20, env="REDIS_MAX_CONNECTIONS")  # type: ignore[call-overload]
    redis_timeout: int = Field(default=30, env="REDIS_TIMEOUT")  # type: ignore[call-overload]

    # Firebase Configuration
    firebase_project_id: Optional[str] = Field(None, env="FIREBASE_PROJECT_ID")  # type: ignore[call-overload]
    firebase_api_key: Optional[str] = Field(None, env="FIREBASE_API_KEY")  # type: ignore[call-overload]
    firebase_auth_domain: Optional[str] = Field(None, env="FIREBASE_AUTH_DOMAIN")  # type: ignore[call-overload]
    firebase_storage_bucket: Optional[str] = Field(None, env="FIREBASE_STORAGE_BUCKET")  # type: ignore[call-overload]
    google_application_credentials: Optional[str] = Field(None, env="GOOGLE_APPLICATION_CREDENTIALS")  # type: ignore[call-overload]

    # Security
    jwt_secret: Optional[str] = Field(None, env="JWT_SECRET")  # type: ignore[call-overload]
    encryption_key: Optional[str] = Field(None, env="ENCRYPTION_KEY")  # type: ignore[call-overload]

    # Application Settings
    app_domain: str = Field(default="localhost:3000", env="APP_DOMAIN")  # type: ignore[call-overload]
    production_site_url: str = Field(default="https://rag-prompt-library.web.app", env="PRODUCTION_SITE_URL")  # type: ignore[call-overload]
    frontend_port: int = Field(default=3000, env="FRONTEND_PORT")  # type: ignore[call-overload]
    backend_port: int = Field(default=8080, env="BACKEND_PORT")  # type: ignore[call-overload]

    # Rate Limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")  # type: ignore[call-overload]
    rate_limit_window: int = Field(default=3600, env="RATE_LIMIT_WINDOW")  # type: ignore[call-overload]  # seconds

    # File Upload Limits
    max_file_size: int = Field(default=10 * 1024 * 1024, env="MAX_FILE_SIZE")  # type: ignore[call-overload]  # 10MB
    allowed_file_types: List[str] = Field(  # type: ignore[call-overload]
        default=["txt", "pdf", "docx", "md"],
        env="ALLOWED_FILE_TYPES"
    )

    # LLM Settings
    default_llm_provider: str = Field(default="openrouter", env="DEFAULT_LLM_PROVIDER")  # type: ignore[call-overload]
    openrouter_model: str = Field(default="nvidia/nemotron-nano-9b-v2:free", env="OPENROUTER_MODEL")  # type: ignore[call-overload]
    prompt_generation_model: str = Field(default="meta-llama/llama-3.3-70b-instruct:free", env="PROMPT_GENERATION_MODEL")  # type: ignore[call-overload]
    rag_processing_model: str = Field(default="nvidia/nemotron-nano-9b-v2:free", env="RAG_PROCESSING_MODEL")  # type: ignore[call-overload]
    chat_model: str = Field(default="nvidia/nemotron-nano-9b-v2:free", env="CHAT_MODEL")  # type: ignore[call-overload]
    default_temperature: float = Field(default=0.7, env="DEFAULT_TEMPERATURE")  # type: ignore[call-overload]
    default_max_tokens: int = Field(default=1000, env="DEFAULT_MAX_TOKENS")  # type: ignore[call-overload]
    max_context_tokens: int = Field(default=4000, env="MAX_CONTEXT_TOKENS")  # type: ignore[call-overload]

    # Vector Search Settings
    vector_search_top_k: int = Field(default=10, env="VECTOR_SEARCH_TOP_K")  # type: ignore[call-overload]
    similarity_threshold: float = Field(default=0.7, env="SIMILARITY_THRESHOLD")  # type: ignore[call-overload]

    # Monitoring
    monitoring_enabled: bool = Field(default=False, env="MONITORING_ENABLED")  # type: ignore[call-overload]
    sentry_dsn: Optional[str] = Field(None, env="SENTRY_DSN")  # type: ignore[call-overload]

    # Development Settings
    firestore_emulator_host: Optional[str] = Field(None, env="FIRESTORE_EMULATOR_HOST")  # type: ignore[call-overload]



    @validator("debug", pre=True, always=True)
    def set_debug_mode(cls, v, values):
        """Set debug mode based on environment"""
        env = values.get("environment", Environment.DEVELOPMENT)
        return env == Environment.DEVELOPMENT

    @validator("allowed_file_types", pre=True)
    def parse_file_types(cls, v):
        """Parse file types from string or list"""
        if isinstance(v, str):
            return [ft.strip().lower() for ft in v.split(",")]
        return [ft.lower() for ft in v]

    @validator("pinecone_api_key")
    def validate_pinecone_key(cls, v):
        """Validate Pinecone API key format"""
        if not v:
            return None  # Allow None for optional key
        # Allow demo/test values
        if v.startswith("demo_") or v == "dummy":
            return v
        if len(v) < 10:
            raise ValueError("Invalid Pinecone API key format")
        return v

    @validator("jwt_secret")
    def validate_jwt_secret(cls, v):
        """Validate JWT secret strength"""
        if not v:
            return None  # Allow None for optional secret
        # Allow demo/test values
        if v.startswith("demo_") or v.startswith("dummy_"):
            return v
        if len(v) < 32:
            raise ValueError("JWT secret must be at least 32 characters long")
        return v

    @validator("redis_url")
    def validate_redis_url(cls, v):
        """Validate Redis URL format"""
        if not v.startswith(("redis://", "rediss://")):
            raise ValueError("Redis URL must start with redis:// or rediss://")
        return v

    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment == Environment.DEVELOPMENT

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment == Environment.PRODUCTION

    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins based on environment"""
        if self.is_development:
            return [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173",
                "http://localhost:5174",  # Added for emulator testing
                "http://localhost:5175",  # Added for emulator testing
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",  # Added for emulator testing
                "http://127.0.0.1:5175"  # Added for emulator testing
            ]
        else:
            return [
                f"https://{self.app_domain}",
                "https://rag-prompt-library.web.app",
                "https://rag-prompt-library.firebaseapp.com"
            ]

    def get_llm_api_key(self, provider: str) -> Optional[str]:
        """Get API key for specific LLM provider"""
        provider_map = {
            "openai": self.openai_api_key,
            "anthropic": self.anthropic_api_key,
            "google": self.google_api_key,
            "cohere": self.cohere_api_key,
            "openrouter": self.openrouter_api_key
        }
        return provider_map.get(provider.lower())

    def validate_configuration(self) -> List[str]:
        """Validate configuration and return list of issues"""
        issues = []

        # Check required API keys
        if not any([
            self.openai_api_key,
            self.anthropic_api_key,
            self.google_api_key,
            self.cohere_api_key,
            self.openrouter_api_key
        ]):
            issues.append("At least one LLM provider API key is required")

        # Check production requirements
        if self.is_production:
            if not self.encryption_key:
                issues.append("Encryption key is required in production")
            if not self.monitoring_enabled:
                issues.append("Monitoring should be enabled in production")
            if self.debug:
                issues.append("Debug mode should be disabled in production")

        return issues

# Create global settings instance
try:
    settings = Settings()

    # Validate configuration
    config_issues = settings.validate_configuration()
    if config_issues:
        logger.warning(f"Configuration issues found: {config_issues}")

    logger.info(f"Configuration loaded for {settings.environment} environment")

except Exception as e:
    logger.error(f"Failed to load configuration: {e}")
    # Create minimal settings for fallback
    settings = Settings(
        pinecone_api_key="dummy",
        jwt_secret="dummy_secret_for_development_only_32chars"
    )

# Export commonly used settings
DEBUG = settings.debug
ENVIRONMENT = settings.environment
LOG_LEVEL = settings.log_level
