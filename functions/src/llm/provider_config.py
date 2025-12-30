"""
Dynamic Provider Configuration Management
"""
import logging
import os
import json
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from enum import Enum
import yaml

logger = logging.getLogger(__name__)

class Environment(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

@dataclass
class ModelConfig:
    name: str
    max_tokens: int
    temperature: float
    top_p: Optional[float] = None
    top_k: Optional[int] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None
    stop_sequences: Optional[List[str]] = None

@dataclass
class ProviderConfig:
    provider_name: str
    api_key_env_var: str
    base_url: Optional[str] = None
    default_model: str = ""
    models: Dict[str, ModelConfig] = None
    rate_limits: Dict[str, int] = None
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: float = 1.0
    enabled: bool = True
    priority: int = 1
    cost_multiplier: float = 1.0

    def __post_init__(self):
        if self.models is None:
            self.models = {}
        if self.rate_limits is None:
            self.rate_limits = {
                "requests_per_minute": 60,
                "requests_per_hour": 3600,
                "tokens_per_minute": 100000
            }

class ProviderConfigManager:
    """
    Manage provider configurations with environment-based settings
    """

    def __init__(self, environment: Environment = Environment.PRODUCTION):
        self.environment = environment
        self.configs: Dict[str, ProviderConfig] = {}
        self.config_file_path = self._get_config_file_path()

        # Load configurations
        self._load_default_configs()
        self._load_config_file()
        self._load_environment_overrides()
        self._validate_configurations()

    def _get_config_file_path(self) -> str:
        """Get configuration file path based on environment"""
        base_path = os.path.dirname(__file__)
        config_dir = os.path.join(base_path, "configs")

        # Create config directory if it doesn't exist
        os.makedirs(config_dir, exist_ok=True)

        return os.path.join(config_dir, f"providers_{self.environment.value}.yaml")

    def _load_default_configs(self):
        """Load default provider configurations"""
        self.configs = {
            # WatsonX/IBM Granite - PRIMARY PROVIDER (enabled)
            "watsonx": ProviderConfig(
                provider_name="watsonx",
                api_key_env_var="WATSONX_API_KEY",
                default_model="ibm/granite-4-h-small",
                models={
                    "ibm/granite-4-h-small": ModelConfig(
                        name="ibm/granite-4-h-small",
                        max_tokens=8192,
                        temperature=0.6,
                        top_p=0.95,
                        top_k=50
                    ),
                    "ibm/granite-3-8b-instruct": ModelConfig(
                        name="ibm/granite-3-8b-instruct",
                        max_tokens=4096,
                        temperature=0.7,
                        top_p=0.95,
                        top_k=50
                    )
                },
                rate_limits={
                    "requests_per_minute": 60,
                    "requests_per_hour": 3600,
                    "tokens_per_minute": 100000
                },
                priority=1,
                cost_multiplier=0.3,
                enabled=True
            ),

            # OpenAI - DISABLED (WatsonX-only mode)
            "openai": ProviderConfig(
                provider_name="openai",
                api_key_env_var="OPENAI_API_KEY",
                default_model="gpt-4o-mini",
                models={
                    "gpt-4o-mini": ModelConfig(
                        name="gpt-4o-mini",
                        max_tokens=16384,
                        temperature=0.7,
                        top_p=1.0,
                        frequency_penalty=0.0,
                        presence_penalty=0.0
                    ),
                    "gpt-4o": ModelConfig(
                        name="gpt-4o",
                        max_tokens=128000,
                        temperature=0.7,
                        top_p=1.0,
                        frequency_penalty=0.0,
                        presence_penalty=0.0
                    ),
                    "gpt-3.5-turbo": ModelConfig(
                        name="gpt-3.5-turbo",
                        max_tokens=4096,
                        temperature=0.7,
                        top_p=1.0,
                        frequency_penalty=0.0,
                        presence_penalty=0.0
                    )
                },
                rate_limits={
                    "requests_per_minute": 3500,
                    "requests_per_hour": 200000,
                    "tokens_per_minute": 1000000
                },
                priority=99,
                cost_multiplier=1.0,
                enabled=False  # DISABLED - WatsonX only
            ),

            # Anthropic - DISABLED (WatsonX-only mode)
            "anthropic": ProviderConfig(
                provider_name="anthropic",
                api_key_env_var="ANTHROPIC_API_KEY",
                default_model="claude-3-5-sonnet-20241022",
                models={
                    "claude-3-5-sonnet-20241022": ModelConfig(
                        name="claude-3-5-sonnet-20241022",
                        max_tokens=200000,
                        temperature=0.7,
                        top_p=1.0,
                        top_k=40
                    ),
                    "claude-3-haiku-20240307": ModelConfig(
                        name="claude-3-haiku-20240307",
                        max_tokens=200000,
                        temperature=0.7,
                        top_p=1.0,
                        top_k=40
                    )
                },
                rate_limits={
                    "requests_per_minute": 1000,
                    "requests_per_hour": 50000,
                    "tokens_per_minute": 400000
                },
                priority=99,
                cost_multiplier=1.2,
                enabled=False  # DISABLED - WatsonX only
            ),

            # Google - DISABLED (WatsonX-only mode)
            "google": ProviderConfig(
                provider_name="google",
                api_key_env_var="GOOGLE_API_KEY",
                default_model="gemini-1.5-flash",
                models={
                    "gemini-1.5-flash": ModelConfig(
                        name="gemini-1.5-flash",
                        max_tokens=8192,
                        temperature=0.7,
                        top_p=0.95,
                        top_k=40
                    ),
                    "gemini-1.5-pro": ModelConfig(
                        name="gemini-1.5-pro",
                        max_tokens=32768,
                        temperature=0.7,
                        top_p=0.95,
                        top_k=40
                    )
                },
                rate_limits={
                    "requests_per_minute": 60,
                    "requests_per_hour": 1000,
                    "tokens_per_minute": 32000
                },
                priority=99,
                cost_multiplier=0.5,
                enabled=False  # DISABLED - WatsonX only
            ),

            # Cohere - DISABLED (WatsonX-only mode)
            "cohere": ProviderConfig(
                provider_name="cohere",
                api_key_env_var="COHERE_API_KEY",
                default_model="command-r-plus",
                models={
                    "command-r-plus": ModelConfig(
                        name="command-r-plus",
                        max_tokens=4096,
                        temperature=0.7,
                        top_p=0.75,
                        top_k=0,
                        frequency_penalty=0.0,
                        presence_penalty=0.0
                    ),
                    "command-r": ModelConfig(
                        name="command-r",
                        max_tokens=4096,
                        temperature=0.7,
                        top_p=0.75,
                        top_k=0,
                        frequency_penalty=0.0,
                        presence_penalty=0.0
                    )
                },
                rate_limits={
                    "requests_per_minute": 1000,
                    "requests_per_hour": 10000,
                    "tokens_per_minute": 100000
                },
                priority=99,
                cost_multiplier=0.8,
                enabled=False  # DISABLED - WatsonX only
            )
        }

    def _load_config_file(self):
        """Load configuration from YAML file"""
        try:
            if os.path.exists(self.config_file_path):
                with open(self.config_file_path, 'r') as f:
                    config_data = yaml.safe_load(f)

                if config_data:
                    self._merge_configs(config_data)
                    logger.info(f"Loaded configuration from {self.config_file_path}")
            else:
                # Create default config file
                self._save_config_file()
                logger.info(f"Created default configuration file at {self.config_file_path}")

        except Exception as e:
            logger.error(f"Error loading config file: {e}")

    def _load_environment_overrides(self):
        """Load environment-specific overrides"""
        env_prefix = f"LLM_{self.environment.value.upper()}_"

        for provider_name in self.configs:
            # Check for provider-specific environment variables
            enabled_var = f"{env_prefix}{provider_name.upper()}_ENABLED"
            if os.getenv(enabled_var):
                self.configs[provider_name].enabled = os.getenv(enabled_var).lower() == 'true'

            priority_var = f"{env_prefix}{provider_name.upper()}_PRIORITY"
            if os.getenv(priority_var):
                try:
                    self.configs[provider_name].priority = int(os.getenv(priority_var))
                except ValueError:
                    logger.warning(f"Invalid priority value for {priority_var}")

            # Override API key environment variable
            api_key_var = f"{env_prefix}{provider_name.upper()}_API_KEY_VAR"
            if os.getenv(api_key_var):
                self.configs[provider_name].api_key_env_var = os.getenv(api_key_var)

    def _merge_configs(self, config_data: Dict[str, Any]):
        """Merge configuration data with existing configs"""
        for provider_name, provider_data in config_data.items():
            if provider_name in self.configs:
                # Update existing config
                config = self.configs[provider_name]

                # Update basic fields
                for field in ['enabled', 'priority', 'default_model', 'timeout', 'retry_attempts']:
                    if field in provider_data:
                        setattr(config, field, provider_data[field])

                # Update rate limits
                if 'rate_limits' in provider_data:
                    config.rate_limits.update(provider_data['rate_limits'])

                # Update models
                if 'models' in provider_data:
                    for model_name, model_data in provider_data['models'].items():
                        config.models[model_name] = ModelConfig(**model_data)
            else:
                # Create new config
                self.configs[provider_name] = ProviderConfig(**provider_data)

    def _validate_configurations(self):
        """Validate provider configurations"""
        for provider_name, config in self.configs.items():
            # Check if API key is available
            api_key = os.getenv(config.api_key_env_var)
            if not api_key and config.enabled:
                logger.warning(f"API key not found for {provider_name} (env var: {config.api_key_env_var})")
                config.enabled = False

            # Validate model configurations
            for model_name, model_config in config.models.items():
                if model_config.temperature < 0 or model_config.temperature > 2:
                    logger.warning(f"Invalid temperature for {provider_name}/{model_name}: {model_config.temperature}")

                if model_config.max_tokens <= 0:
                    logger.warning(f"Invalid max_tokens for {provider_name}/{model_name}: {model_config.max_tokens}")

    def _save_config_file(self):
        """Save current configuration to file"""
        try:
            config_data = {}
            for provider_name, config in self.configs.items():
                config_dict = asdict(config)
                # Convert ModelConfig objects to dictionaries
                config_dict['models'] = {
                    name: asdict(model) for name, model in config.models.items()
                }
                config_data[provider_name] = config_dict

            with open(self.config_file_path, 'w') as f:
                yaml.dump(config_data, f, default_flow_style=False, indent=2)

        except Exception as e:
            logger.error(f"Error saving config file: {e}")

    def get_provider_config(self, provider_name: str) -> Optional[ProviderConfig]:
        """Get configuration for a specific provider"""
        return self.configs.get(provider_name)

    def get_enabled_providers(self) -> List[str]:
        """Get list of enabled providers"""
        return [name for name, config in self.configs.items() if config.enabled]

    def get_providers_by_priority(self) -> List[str]:
        """Get providers sorted by priority"""
        return sorted(
            self.get_enabled_providers(),
            key=lambda name: self.configs[name].priority
        )

    def update_provider_config(self, provider_name: str, updates: Dict[str, Any]):
        """Update provider configuration"""
        if provider_name not in self.configs:
            raise ValueError(f"Provider {provider_name} not found")

        config = self.configs[provider_name]

        for field, value in updates.items():
            if hasattr(config, field):
                setattr(config, field, value)
            else:
                logger.warning(f"Unknown configuration field: {field}")

        # Save updated configuration
        self._save_config_file()
        logger.info(f"Updated configuration for {provider_name}")

    def add_model_config(self, provider_name: str, model_name: str, model_config: ModelConfig):
        """Add or update model configuration"""
        if provider_name not in self.configs:
            raise ValueError(f"Provider {provider_name} not found")

        self.configs[provider_name].models[model_name] = model_config
        self._save_config_file()
        logger.info(f"Added model {model_name} to {provider_name}")

    def remove_model_config(self, provider_name: str, model_name: str):
        """Remove model configuration"""
        if provider_name not in self.configs:
            raise ValueError(f"Provider {provider_name} not found")

        if model_name in self.configs[provider_name].models:
            del self.configs[provider_name].models[model_name]
            self._save_config_file()
            logger.info(f"Removed model {model_name} from {provider_name}")

    def get_model_config(self, provider_name: str, model_name: str) -> Optional[ModelConfig]:
        """Get model configuration"""
        provider_config = self.get_provider_config(provider_name)
        if provider_config:
            return provider_config.models.get(model_name)
        return None

    def validate_api_keys(self) -> Dict[str, bool]:
        """Validate API keys for all providers"""
        results = {}

        for provider_name, config in self.configs.items():
            api_key = os.getenv(config.api_key_env_var)
            results[provider_name] = bool(api_key and len(api_key.strip()) > 0)

        return results

    def get_configuration_summary(self) -> Dict[str, Any]:
        """Get configuration summary"""
        return {
            'environment': self.environment.value,
            'config_file': self.config_file_path,
            'providers': {
                name: {
                    'enabled': config.enabled,
                    'priority': config.priority,
                    'default_model': config.default_model,
                    'models_count': len(config.models),
                    'has_api_key': bool(os.getenv(config.api_key_env_var))
                }
                for name, config in self.configs.items()
            },
            'enabled_providers': self.get_enabled_providers(),
            'providers_by_priority': self.get_providers_by_priority()
        }

# Global configuration manager instance
config_manager = ProviderConfigManager()
