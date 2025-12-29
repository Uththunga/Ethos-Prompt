"""
Model Configuration - Free-First Approach
RAG Prompt Library - Unified Model Configuration

This module provides a unified interface for model configuration,
prioritizing free models while supporting custom API keys for paid models.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

# Import free models configuration
from .free_models_config import (
    FreeModelConfig,
    ModelCapability,
    ModelTier,
    ALL_FREE_MODELS,
    get_default_model,
    get_model_by_id as get_free_model_by_id,
    get_agent_capable_models,
    get_best_agent_model,
    get_best_coding_agent_model,
    supports_function_calling
)


class ModelAccessType(Enum):
    """Model access type"""
    FREE = "free"  # Free models (no API key required)
    PAID = "paid"  # Paid models (custom API key required)
    BYOK = "byok"  # Bring Your Own Key (user-provided API key)


@dataclass
class ModelConfig:
    """Unified model configuration"""

    # Model identification
    model_id: str
    display_name: str
    provider: str

    # Access control
    access_type: ModelAccessType
    is_free: bool

    # Specifications
    context_length: int

    # Optional fields with defaults
    requires_custom_key: bool = False
    parameter_count: Optional[str] = None

    # Capabilities
    capabilities: List[ModelCapability] = field(default_factory=list)
    tier: ModelTier = ModelTier.SECONDARY

    # Metadata
    description: str = ""
    best_for: List[str] = field(default_factory=list)
    limitations: List[str] = field(default_factory=list)

    # Performance
    avg_latency_ms: Optional[int] = None
    tokens_per_second: Optional[int] = None

    # Pricing (for paid models)
    cost_per_million_input: float = 0.0
    cost_per_million_output: float = 0.0

    # Flags
    is_default: bool = False
    is_stable: bool = True
    is_experimental: bool = False
    is_recommended: bool = False

    # Usage notes
    usage_notes: Optional[str] = None


# =============================================================================
# FREE MODELS (Converted from FreeModelConfig)
# =============================================================================

def convert_free_model_to_model_config(free_model: FreeModelConfig) -> ModelConfig:
    """Convert FreeModelConfig to ModelConfig"""
    return ModelConfig(
        model_id=free_model.model_id,
        display_name=free_model.display_name,
        provider=free_model.provider,
        access_type=ModelAccessType.FREE,
        is_free=True,
        requires_custom_key=False,
        context_length=free_model.context_length,
        parameter_count=free_model.parameter_count,
        capabilities=free_model.capabilities,
        tier=free_model.tier,
        description=free_model.description,
        best_for=free_model.best_for,
        limitations=free_model.limitations,
        avg_latency_ms=free_model.avg_latency_ms,
        tokens_per_second=free_model.tokens_per_second,
        cost_per_million_input=0.0,
        cost_per_million_output=0.0,
        is_default=free_model.is_default,
        is_stable=free_model.is_stable,
        is_experimental=free_model.is_experimental,
        is_recommended=free_model.tier == ModelTier.PRIMARY,
        usage_notes=free_model.usage_notes
    )


# Convert all free models
FREE_MODELS = [convert_free_model_to_model_config(model) for model in ALL_FREE_MODELS]


# =============================================================================
# PAID MODELS (Require Custom API Key)
# =============================================================================

PAID_MODELS = [
    ModelConfig(
        model_id="openai/gpt-4-turbo",
        display_name="GPT-4 Turbo (Paid)",
        provider="OpenAI",
        access_type=ModelAccessType.PAID,
        is_free=False,
        requires_custom_key=True,
        context_length=128_000,
        parameter_count="Unknown",
        capabilities=[ModelCapability.GENERAL, ModelCapability.CODE, ModelCapability.REASONING],
        tier=ModelTier.PRIMARY,
        description="OpenAI's most capable model. Requires custom API key.",
        best_for=["Complex reasoning", "Code generation", "Long-form content"],
        limitations=["Requires paid API key", "Higher cost"],
        cost_per_million_input=10.0,
        cost_per_million_output=30.0,
        is_stable=True,
        usage_notes="Requires user to provide their own OpenRouter API key with credits."
    ),

    ModelConfig(
        model_id="anthropic/claude-3.5-sonnet",
        display_name="Claude 3.5 Sonnet (Paid)",
        provider="Anthropic",
        access_type=ModelAccessType.PAID,
        is_free=False,
        requires_custom_key=True,
        context_length=200_000,
        parameter_count="Unknown",
        capabilities=[ModelCapability.GENERAL, ModelCapability.CODE, ModelCapability.REASONING],
        tier=ModelTier.PRIMARY,
        description="Anthropic's most capable model. Requires custom API key.",
        best_for=["Complex analysis", "Code review", "Long documents"],
        limitations=["Requires paid API key", "Higher cost"],
        cost_per_million_input=3.0,
        cost_per_million_output=15.0,
        is_stable=True,
        usage_notes="Requires user to provide their own OpenRouter API key with credits."
    ),
]


# =============================================================================
# UNIFIED MODEL REGISTRY
# =============================================================================

# All models (free + paid)
ALL_MODELS = FREE_MODELS + PAID_MODELS

# Create lookup dictionaries
MODELS_BY_ID = {model.model_id: model for model in ALL_MODELS}
MODELS_BY_ACCESS_TYPE = {
    ModelAccessType.FREE: FREE_MODELS,
    ModelAccessType.PAID: PAID_MODELS
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_model_config(model_id: str) -> Optional[ModelConfig]:
    """Get model configuration by ID"""
    return MODELS_BY_ID.get(model_id)


def get_default_model_config() -> ModelConfig:
    """Get the default model (free)"""
    free_default = get_default_model()
    return convert_free_model_to_model_config(free_default)


def get_free_models() -> List[ModelConfig]:
    """Get all free models"""
    return FREE_MODELS


def get_paid_models() -> List[ModelConfig]:
    """Get all paid models"""
    return PAID_MODELS


def get_recommended_models() -> List[ModelConfig]:
    """Get recommended models (free PRIMARY tier)"""
    return [model for model in FREE_MODELS if model.tier == ModelTier.PRIMARY]


def get_agent_models() -> List[ModelConfig]:
    """Get all agent-capable models"""
    return [model for model in ALL_MODELS if ModelCapability.AGENT in model.capabilities]


def is_free_model(model_id: str) -> bool:
    """Check if a model is free"""
    model = get_model_config(model_id)
    return model is not None and model.is_free


def requires_custom_api_key(model_id: str) -> bool:
    """Check if a model requires a custom API key"""
    model = get_model_config(model_id)
    return model is not None and model.requires_custom_key


def get_model_cost(model_id: str) -> Dict[str, float]:
    """Get model cost per million tokens"""
    model = get_model_config(model_id)
    if not model:
        return {"input": 0.0, "output": 0.0}

    return {
        "input": model.cost_per_million_input,
        "output": model.cost_per_million_output
    }


def get_models_by_capability(capability: ModelCapability) -> List[ModelConfig]:
    """Get all models with a specific capability"""
    return [model for model in ALL_MODELS if capability in model.capabilities]


def get_models_by_tier(tier: ModelTier) -> List[ModelConfig]:
    """Get all models in a specific tier"""
    return [model for model in ALL_MODELS if model.tier == tier]


# =============================================================================
# MODEL SELECTION LOGIC
# =============================================================================

def select_model_for_task(
    task_type: str,
    prefer_free: bool = True,
    has_custom_key: bool = False
) -> ModelConfig:
    """
    Select the best model for a given task

    Args:
        task_type: Type of task (agent, code, reasoning, etc.)
        prefer_free: Prefer free models over paid
        has_custom_key: User has provided custom API key

    Returns:
        Selected ModelConfig
    """
    task_lower = task_type.lower()

    # If prefer_free or no custom key, only consider free models
    if prefer_free or not has_custom_key:
        available_models = FREE_MODELS
    else:
        available_models = ALL_MODELS

    # Agent tasks
    if 'agent' in task_lower:
        agent_models = [m for m in available_models if ModelCapability.AGENT in m.capabilities]
        if agent_models:
            return agent_models[0]  # Return best agent model

    # Code tasks
    if 'code' in task_lower or 'programming' in task_lower:
        code_models = [m for m in available_models if ModelCapability.CODE in m.capabilities]
        if code_models:
            return code_models[0]

    # Reasoning tasks
    if 'reason' in task_lower or 'analyze' in task_lower:
        reasoning_models = [m for m in available_models if ModelCapability.REASONING in m.capabilities]
        if reasoning_models:
            return reasoning_models[0]

    # Default to first recommended model
    recommended = [m for m in available_models if m.is_recommended]
    if recommended:
        return recommended[0]

    # Fallback to default
    return get_default_model_config()


# =============================================================================
# API RESPONSE FORMATTING
# =============================================================================

def format_model_for_api(model: ModelConfig) -> Dict[str, Any]:
    """Format model configuration for API response"""
    return {
        "model_id": model.model_id,
        "display_name": model.display_name,
        "provider": model.provider,
        "access_type": model.access_type.value,
        "is_free": model.is_free,
        "requires_custom_key": model.requires_custom_key,
        "context_length": model.context_length,
        "parameter_count": model.parameter_count,
        "capabilities": [cap.value for cap in model.capabilities],
        "tier": model.tier.value,
        "description": model.description,
        "best_for": model.best_for,
        "limitations": model.limitations,
        "cost": {
            "input_per_million": model.cost_per_million_input,
            "output_per_million": model.cost_per_million_output
        },
        "performance": {
            "avg_latency_ms": model.avg_latency_ms,
            "tokens_per_second": model.tokens_per_second
        },
        "flags": {
            "is_default": model.is_default,
            "is_stable": model.is_stable,
            "is_experimental": model.is_experimental,
            "is_recommended": model.is_recommended
        },
        "usage_notes": model.usage_notes
    }


def get_all_models_for_api() -> List[Dict[str, Any]]:
    """Get all models formatted for API response"""
    return [format_model_for_api(model) for model in ALL_MODELS]
