"""
Free AI Models Configuration for OpenRouter Integration
RAG Prompt Library - Zero-Cost Model Configuration

This module defines all free models available through OpenRouter.ai
that can be used without any cost to the application or users.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class ModelCapability(Enum):
    """Model capability categories"""
    GENERAL = "general"
    REASONING = "reasoning"
    CODE = "code"
    FAST = "fast"
    MULTILINGUAL = "multilingual"
    LONG_CONTEXT = "long_context"
    AGENT = "agent"  # Function calling, tool use, agentic workflows


class ModelTier(Enum):
    """Model tier for UI organization"""
    PRIMARY = "primary"  # Top recommended models
    SECONDARY = "secondary"  # Alternative models
    EXPERIMENTAL = "experimental"  # Preview/beta models


@dataclass
class FreeModelConfig:
    """Configuration for a free AI model"""

    # Model identification
    model_id: str
    display_name: str
    provider: str

    # Specifications
    context_length: int
    parameter_count: Optional[str] = None

    # Capabilities
    capabilities: Optional[List[ModelCapability]] = None
    tier: ModelTier = ModelTier.SECONDARY

    # Metadata
    description: str = ""
    best_for: Optional[List[str]] = None
    limitations: Optional[List[str]] = None

    # Performance hints
    avg_latency_ms: Optional[int] = None
    tokens_per_second: Optional[int] = None

    # Flags
    is_default: bool = False
    is_stable: bool = True
    is_experimental: bool = False

    # Usage notes
    usage_notes: Optional[str] = None

    def __post_init__(self):
        if self.capabilities is None:
            self.capabilities = [ModelCapability.GENERAL]
        if self.best_for is None:
            self.best_for = []
        if self.limitations is None:
            self.limitations = []


# =============================================================================
# PRIMARY FREE MODELS (Top Tier - Recommended)
# =============================================================================

FREE_MODELS_PRIMARY = [
    # VALIDATED WORKING MODELS (Task 1.1 - 100% success rate)
    FreeModelConfig(
        model_id="z-ai/glm-4.5-air:free",
        display_name="GLM 4.5 Air (Free) ⚡ DEFAULT",
        provider="Zhipu AI",
        context_length=1_000_000,  # 1M tokens
        parameter_count="Unknown",
        capabilities=[
            ModelCapability.GENERAL,
            ModelCapability.AGENT,
            ModelCapability.FAST,
            ModelCapability.CODE
        ],
        tier=ModelTier.PRIMARY,
        description="Fastest validated model (2.61s avg), 100% success rate. Purpose-built for AI agents with function calling and tool use.",
        best_for=[
            "AI agents and agentic workflows",
            "Function calling and tool use",
            "Real-time applications",
            "High-throughput scenarios",
            "General-purpose tasks"
        ],
        limitations=[
            "1M context (smaller than Grok 4)"
        ],
        avg_latency_ms=2610,  # 2.61s average from validation
        is_default=True,
        is_stable=True,
        usage_notes="Validated in Task 1.1 with 100% success rate. Recommended as default model for best performance."
    ),
    FreeModelConfig(
        model_id="x-ai/grok-4-fast:free",
        display_name="Grok 4 Fast (Free)",
        provider="xAI",
        context_length=2_048_000,  # 2M tokens
        parameter_count="31.5B",
        capabilities=[
            ModelCapability.GENERAL,
            ModelCapability.LONG_CONTEXT,
            ModelCapability.FAST,
            ModelCapability.CODE
        ],
        tier=ModelTier.PRIMARY,
        description="Validated model (4.17s avg), 100% success rate. Massive 2M context window for complex prompts and long-form content.",
        best_for=[
            "Long-form content generation",
            "Complex prompt engineering",
            "Multi-turn conversations",
            "Document analysis with large context",
            "General-purpose tasks"
        ],
        limitations=[
            "Prompts may be used to improve future models",
            "May have rate limiting during peak usage"
        ],
        avg_latency_ms=4170,  # 4.17s average from validation
        is_stable=True,
        usage_notes="Validated in Task 1.1 with 100% success rate. Best for long-form content and large context needs."
    ),

    FreeModelConfig(
        model_id="microsoft/mai-ds-r1:free",
        display_name="Microsoft MAI-DS-R1 (Free) ⭐ AGENT OPTIMIZED",
        provider="Microsoft AI",
        context_length=163_840,  # 163K tokens
        parameter_count="Post-trained DeepSeek R1",
        capabilities=[
            ModelCapability.REASONING,
            ModelCapability.CODE,
            ModelCapability.AGENT,  # Enhanced for agent frameworks
            ModelCapability.GENERAL
        ],
        tier=ModelTier.PRIMARY,
        description="Validated model (3.97s avg), 100% success rate. Microsoft's post-trained DeepSeek R1 variant optimized for agent frameworks.",
        best_for=[
            "AI agent creation",
            "Agent framework integration",
            "Complex multi-step workflows",
            "Tool-calling applications",
            "Agentic reasoning tasks",
            "Agent orchestration"
        ],
        limitations=[
            "May be slower than lightweight models",
            "Best for agent-specific tasks"
        ],
        avg_latency_ms=3970,  # 3.97s average from validation
        is_stable=True,
        usage_notes="Validated in Task 1.1 with 100% success rate. Community favorite for agent frameworks."
    ),

    FreeModelConfig(
        model_id="mistralai/mistral-7b-instruct:free",
        display_name="Mistral 7B Instruct (Free) ⚡⚡ ULTRA-FAST",
        provider="Mistral AI",
        context_length=32_768,  # 32K tokens
        parameter_count="7B",
        capabilities=[
            ModelCapability.GENERAL,
            ModelCapability.FAST
        ],
        tier=ModelTier.PRIMARY,
        description="Ultra-fast validated model (1.33s avg), 100% success rate. Best for high-throughput and low-latency applications.",
        best_for=[
            "High-throughput applications",
            "Low-latency requirements",
            "Quick responses",
            "General text generation",
            "Simple coding tasks"
        ],
        limitations=[
            "Smaller context window (32K)",
            "May lack depth for complex tasks"
        ],
        avg_latency_ms=1330,  # 1.33s average from validation
        is_stable=True,
        usage_notes="Validated in Task 1.1 with 100% success rate. Fastest model for high-throughput scenarios."
    ),

    # DEPRECATED MODELS (Not validated - may be unavailable)
    FreeModelConfig(
        model_id="google/gemma-2-27b-it:free",
        display_name="Gemma 2 27B (Free) [DEPRECATED]",
        provider="Google",
        context_length=8_192,  # 8K tokens
        parameter_count="27B",
        capabilities=[
            ModelCapability.GENERAL,
            ModelCapability.CODE
        ],
        tier=ModelTier.SECONDARY,
        description="[DEPRECATED] Returns 404 Not Found. Model may have been removed or renamed by OpenRouter.",
        best_for=[],
        limitations=[
            "Model unavailable (404 error)",
            "Not validated in Task 1.1"
        ],
        is_stable=False,
        is_experimental=True,
        usage_notes="DEPRECATED: Model returns 404 error. Do not use."
    ),

    FreeModelConfig(
        model_id="qwen/qwen3-coder-480b-a35b-instruct:free",
        display_name="Qwen3 Coder 480B (Free) [DEPRECATED]",
        provider="Alibaba Cloud (Qwen)",
        context_length=32_768,  # 32K tokens
        parameter_count="480B (35B active MoE)",
        capabilities=[
            ModelCapability.CODE,
            ModelCapability.REASONING,
            ModelCapability.AGENT
        ],
        tier=ModelTier.SECONDARY,
        description="[DEPRECATED] Returns 400 Bad Request. Model may require different configuration or be unavailable.",
        best_for=[],
        limitations=[
            "Model unavailable (400 error)",
            "Not validated in Task 1.1"
        ],
        is_stable=False,
        is_experimental=True,
        usage_notes="DEPRECATED: Model returns 400 error. Do not use."
    ),

    FreeModelConfig(
        model_id="deepseek/deepseek-v3:free",
        display_name="DeepSeek V3 (Free) [DEPRECATED]",
        provider="DeepSeek",
        context_length=163_840,  # 163K tokens
        parameter_count="Unknown",
        capabilities=[
            ModelCapability.REASONING,
            ModelCapability.CODE,
            ModelCapability.GENERAL
        ],
        tier=ModelTier.SECONDARY,
        description="[DEPRECATED] Returns 400 Bad Request. Model may require different configuration or be unavailable.",
        best_for=[],
        limitations=[
            "Model unavailable (400 error)",
            "Not validated in Task 1.1"
        ],
        is_stable=False,
        is_experimental=True,
        usage_notes="DEPRECATED: Model returns 400 error. Do not use."
    ),
]


# =============================================================================
# SECONDARY FREE MODELS (Alternative Options)
# =============================================================================

FREE_MODELS_SECONDARY = [
    FreeModelConfig(
        model_id="meta-llama/llama-3.1-8b-instruct:free",
        display_name="Llama 3.1 8B Instruct (Free)",
        provider="Meta",
        context_length=131_072,  # 128K tokens
        parameter_count="8B",
        capabilities=[
            ModelCapability.GENERAL,
            ModelCapability.CODE,
            ModelCapability.LONG_CONTEXT
        ],
        tier=ModelTier.SECONDARY,
        description="Versatile instruction-following model from Meta. Good balance of capabilities.",
        best_for=[
            "Instruction-based prompts",
            "Code generation",
            "Creative writing",
            "Conversational AI"
        ],
        limitations=[
            "Smaller parameter count",
            "May be less capable than larger models"
        ],
        avg_latency_ms=700,
        tokens_per_second=40,
        is_stable=True
    ),

    FreeModelConfig(
        model_id="qwen/qwen-2.5-7b-instruct:free",
        display_name="Qwen 2.5 7B Instruct (Free) [DEPRECATED]",
        provider="Qwen",
        context_length=32_768,  # 32K tokens
        parameter_count="7B",
        capabilities=[
            ModelCapability.GENERAL,
            ModelCapability.MULTILINGUAL
        ],
        tier=ModelTier.SECONDARY,
        description="[DEPRECATED] Returns 404 Not Found. Model may have been removed or renamed by OpenRouter.",
        best_for=[],
        limitations=[
            "Model unavailable (404 error)",
            "Not validated in Task 1.1"
        ],
        is_stable=False,
        is_experimental=True,
        usage_notes="DEPRECATED: Model returns 404 error. Do not use."
    ),

    FreeModelConfig(
        model_id="tngtech/deepseek-r1t-chimera:free",
        display_name="DeepSeek R1T2 Chimera (Free)",
        provider="TNG",
        context_length=163_840,  # 163K tokens
        parameter_count="Unknown",
        capabilities=[
            ModelCapability.REASONING,
            ModelCapability.LONG_CONTEXT
        ],
        tier=ModelTier.SECONDARY,
        description="Specialized reasoning model with step-by-step problem solving capabilities.",
        best_for=[
            "Multi-step reasoning",
            "Complex problem-solving",
            "Educational content",
            "Prompt optimization"
        ],
        limitations=[
            "May be verbose in responses",
            "Newer model (less battle-tested)"
        ],
        avg_latency_ms=1100,
        tokens_per_second=32,
        is_stable=True,
        is_experimental=False
    ),
]


# =============================================================================
# EXPERIMENTAL FREE MODELS (Preview/Beta)
# =============================================================================

FREE_MODELS_EXPERIMENTAL = [
    FreeModelConfig(
        model_id="google/gemini-2.5-flash-preview-09-2025:free",
        display_name="Gemini 2.5 Flash Preview 09-2025 (Free) ⭐ AGENT CAPABLE",
        provider="Google",
        context_length=1_048_576,  # 1M tokens
        parameter_count="Unknown (Google proprietary)",
        capabilities=[
            ModelCapability.FAST,
            ModelCapability.LONG_CONTEXT,
            ModelCapability.GENERAL,
            ModelCapability.AGENT,  # Native function calling
            ModelCapability.CODE
        ],
        tier=ModelTier.EXPERIMENTAL,
        description="September 2025 preview with native function calling and agent-style task execution. Very fast with 1M context.",
        best_for=[
            "Function calling applications",
            "Agent-style task execution",
            "Multi-modal agent workflows",
            "Long-context agent tasks",
            "Rapid agent prototyping"
        ],
        limitations=[
            "Preview model - may be retired October 31, 2025",
            "Less stable than production models",
            "Monitor for deprecation notices"
        ],
        avg_latency_ms=500,
        tokens_per_second=100,
        is_stable=False,
        is_experimental=True,
        usage_notes="⚠️ PREVIEW: Excellent agent capabilities but monitor for deprecation (Oct 31, 2025)."
    ),

    FreeModelConfig(
        model_id="google/gemini-2.5-flash-lite-preview:free",
        display_name="Gemini 2.5 Flash Lite Preview (Free)",
        provider="Google",
        context_length=1_048_576,  # 1M tokens
        parameter_count="Unknown",
        capabilities=[
            ModelCapability.FAST,
            ModelCapability.LONG_CONTEXT,
            ModelCapability.GENERAL
        ],
        tier=ModelTier.EXPERIMENTAL,
        description="Experimental preview model with very fast inference and multimodal capabilities.",
        best_for=[
            "Rapid prototyping",
            "Testing new features",
            "High-throughput applications",
            "Multimodal prompts"
        ],
        limitations=[
            "Preview status (may change)",
            "Less stable than production models",
            "Features may be experimental",
            "May be retired October 31, 2025"
        ],
        avg_latency_ms=350,
        tokens_per_second=90,
        is_stable=False,
        is_experimental=True,
        usage_notes="⚠️ Use for testing only. Monitor for deprecation."
    ),
]


# =============================================================================
# COMBINED MODEL REGISTRY
# =============================================================================

ALL_FREE_MODELS = FREE_MODELS_PRIMARY + FREE_MODELS_SECONDARY + FREE_MODELS_EXPERIMENTAL

# Create lookup dictionaries
FREE_MODELS_BY_ID = {model.model_id: model for model in ALL_FREE_MODELS}
FREE_MODELS_BY_PROVIDER: Dict[str, List[FreeModelConfig]] = {}
for model in ALL_FREE_MODELS:
    if model.provider not in FREE_MODELS_BY_PROVIDER:
        FREE_MODELS_BY_PROVIDER[model.provider] = []
    FREE_MODELS_BY_PROVIDER[model.provider].append(model)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_default_model() -> FreeModelConfig:
    """Get the default free model"""
    for model in ALL_FREE_MODELS:
        if model.is_default:
            return model
    return FREE_MODELS_PRIMARY[0]  # Fallback to first primary model


def get_model_by_id(model_id: str) -> Optional[FreeModelConfig]:
    """Get model configuration by ID"""
    return FREE_MODELS_BY_ID.get(model_id)


def get_models_by_capability(capability: ModelCapability) -> List[FreeModelConfig]:
    """Get all models with a specific capability"""
    return [model for model in ALL_FREE_MODELS if model.capabilities and capability in model.capabilities]


def get_models_by_tier(tier: ModelTier) -> List[FreeModelConfig]:
    """Get all models in a specific tier"""
    return [model for model in ALL_FREE_MODELS if model.tier == tier]


def get_stable_models() -> List[FreeModelConfig]:
    """Get all stable (non-experimental) models"""
    return [model for model in ALL_FREE_MODELS if model.is_stable and not model.is_experimental]


def get_fastest_model() -> FreeModelConfig:
    """Get the fastest model based on latency"""
    return min(ALL_FREE_MODELS, key=lambda m: m.avg_latency_ms or 1000)


def get_model_for_use_case(use_case: str) -> FreeModelConfig:
    """Get recommended model for a specific use case"""
    use_case_lower = use_case.lower()

    # Agent-related (highest priority)
    if any(keyword in use_case_lower for keyword in ['agent', 'function call', 'tool use', 'agentic', 'workflow']):
        return get_model_by_id("z-ai/glm-4.5-air:free") or get_default_model()

    # Coding agent-related
    if any(keyword in use_case_lower for keyword in ['coding agent', 'code agent', 'agentic coding']):
        return get_model_by_id("qwen/qwen3-coder-480b-a35b-instruct:free") or get_default_model()

    # Code-related
    if any(keyword in use_case_lower for keyword in ['code', 'programming', 'debug', 'refactor']):
        return get_model_by_id("qwen/qwen3-coder-480b-a35b-instruct:free") or get_default_model()

    # Reasoning-related
    if any(keyword in use_case_lower for keyword in ['reason', 'analyze', 'logic', 'problem']):
        return get_model_by_id("deepseek/deepseek-v3:free") or get_default_model()

    # Speed-related
    if any(keyword in use_case_lower for keyword in ['fast', 'quick', 'real-time', 'stream']):
        return get_model_by_id("z-ai/glm-4.5-air:free") or get_default_model()

    # Multilingual
    if any(keyword in use_case_lower for keyword in ['multilingual', 'translate', 'chinese']):
        return get_model_by_id("qwen/qwen-2.5-7b-instruct:free") or get_default_model()

    # Default to Grok 4 Fast
    return get_default_model()


# =============================================================================
# MODEL METADATA FOR API RESPONSES
# =============================================================================

def get_model_metadata(model_id: str) -> Dict:
    """Get model metadata for API responses"""
    model = get_model_by_id(model_id)
    if not model:
        return {}

    return {
        "model_id": model.model_id,
        "display_name": model.display_name,
        "provider": model.provider,
        "context_length": model.context_length,
        "parameter_count": model.parameter_count,
        "capabilities": [cap.value for cap in (model.capabilities or [])],
        "tier": model.tier.value,
        "description": model.description,
        "best_for": model.best_for,
        "limitations": model.limitations,
        "is_free": True,
        "cost_per_million_tokens": {
            "input": 0.0,
            "output": 0.0
        },
        "is_default": model.is_default,
        "is_stable": model.is_stable,
        "is_experimental": model.is_experimental,
        "performance": {
            "avg_latency_ms": model.avg_latency_ms,
            "tokens_per_second": model.tokens_per_second
        }
    }


def get_all_models_metadata() -> List[Dict]:
    """Get metadata for all free models"""
    return [get_model_metadata(model.model_id) for model in ALL_FREE_MODELS]


# =============================================================================
# AGENT-SPECIFIC HELPER FUNCTIONS
# =============================================================================

def get_agent_capable_models() -> List[FreeModelConfig]:
    """Get all models with agent capabilities (function calling, tool use)"""
    return [model for model in ALL_FREE_MODELS if model.capabilities and ModelCapability.AGENT in model.capabilities]


def get_best_agent_model() -> FreeModelConfig:
    """Get the best model for agent creation (GLM-4.5 Air)"""
    return get_model_by_id("z-ai/glm-4.5-air:free") or get_default_model()


def get_best_coding_agent_model() -> FreeModelConfig:
    """Get the best model for coding agents (Qwen3 Coder)"""
    return get_model_by_id("qwen/qwen3-coder-480b-a35b-instruct:free") or get_default_model()


def get_agent_framework_model() -> FreeModelConfig:
    """Get the best model for agent frameworks (Microsoft MAI-DS-R1)"""
    return get_model_by_id("microsoft/mai-ds-r1:free") or get_default_model()


def supports_function_calling(model_id: str) -> bool:
    """Check if a model supports function calling"""
    model = get_model_by_id(model_id)
    return model is not None and model.capabilities is not None and ModelCapability.AGENT in model.capabilities


def get_models_for_agent_creation() -> Dict[str, List[FreeModelConfig]]:
    """Get categorized models for agent creation"""
    return {
        "primary": [
            get_model_by_id("z-ai/glm-4.5-air:free") or get_default_model(),
            get_model_by_id("microsoft/mai-ds-r1:free") or get_default_model(),
            get_model_by_id("qwen/qwen3-coder-480b-a35b-instruct:free") or get_default_model()
        ],
        "experimental": [
            get_model_by_id("google/gemini-2.5-flash-preview-09-2025:free") or get_default_model()
        ]
    }
