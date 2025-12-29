"""
Fallback Configuration for AI Providers
Defines fallback strategies and provider priorities
"""

from typing import Dict, List, Any
from enum import Enum

class FallbackStrategy(Enum):
    """Fallback strategies for different error types"""
    RETRY_SAME_PROVIDER = "retry_same_provider"
    TRY_NEXT_PROVIDER = "try_next_provider"
    REDUCE_COMPLEXITY = "reduce_complexity"
    USE_CACHE = "use_cache"
    FAIL_GRACEFULLY = "fail_gracefully"

class ErrorType(Enum):
    """Types of errors that can occur"""
    RATE_LIMIT = "rate_limit"
    TIMEOUT = "timeout"
    AUTHENTICATION = "authentication"
    QUOTA_EXCEEDED = "quota_exceeded"
    MODEL_UNAVAILABLE = "model_unavailable"
    NETWORK_ERROR = "network_error"
    INVALID_REQUEST = "invalid_request"
    UNKNOWN = "unknown"

# Provider priority order (first is preferred)
PROVIDER_PRIORITY = [
    'openrouter',
    'google',
    'anthropic',
    'openai',
    'cohere'
]

# Fallback strategies for different error types
FALLBACK_STRATEGIES = {
    ErrorType.RATE_LIMIT: [
        FallbackStrategy.TRY_NEXT_PROVIDER,
        FallbackStrategy.REDUCE_COMPLEXITY,
        FallbackStrategy.FAIL_GRACEFULLY
    ],
    ErrorType.TIMEOUT: [
        FallbackStrategy.REDUCE_COMPLEXITY,
        FallbackStrategy.TRY_NEXT_PROVIDER,
        FallbackStrategy.FAIL_GRACEFULLY
    ],
    ErrorType.AUTHENTICATION: [
        FallbackStrategy.TRY_NEXT_PROVIDER,
        FallbackStrategy.FAIL_GRACEFULLY
    ],
    ErrorType.QUOTA_EXCEEDED: [
        FallbackStrategy.TRY_NEXT_PROVIDER,
        FallbackStrategy.FAIL_GRACEFULLY
    ],
    ErrorType.MODEL_UNAVAILABLE: [
        FallbackStrategy.TRY_NEXT_PROVIDER,
        FallbackStrategy.FAIL_GRACEFULLY
    ],
    ErrorType.NETWORK_ERROR: [
        FallbackStrategy.RETRY_SAME_PROVIDER,
        FallbackStrategy.TRY_NEXT_PROVIDER,
        FallbackStrategy.FAIL_GRACEFULLY
    ],
    ErrorType.INVALID_REQUEST: [
        FallbackStrategy.REDUCE_COMPLEXITY,
        FallbackStrategy.TRY_NEXT_PROVIDER,
        FallbackStrategy.FAIL_GRACEFULLY
    ],
    ErrorType.UNKNOWN: [
        FallbackStrategy.TRY_NEXT_PROVIDER,
        FallbackStrategy.FAIL_GRACEFULLY
    ]
}

# Provider-specific configurations
PROVIDER_CONFIGS = {
    'openrouter': {
        'max_retries': 3,
        'timeout': 30,
        'rate_limit_delay': 1,
        'fallback_models': [
            'nvidia/nemotron-nano-9b-v2:free',
            'google/gemma-3-27b-it:free',
            'meta-llama/llama-3.3-70b-instruct:free',
            'mistralai/mistral-7b-instruct:free'
        ]
    },
    'google': {
        'max_retries': 2,
        'timeout': 25,
        'rate_limit_delay': 2,
        'fallback_models': [
            'gemini-1.5-flash',
            'gemini-1.5-pro'
        ]
    },
    'anthropic': {
        'max_retries': 2,
        'timeout': 30,
        'rate_limit_delay': 3,
        'fallback_models': [
            'claude-3-haiku-20240307',
            'claude-3-sonnet-20240229'
        ]
    },
    'openai': {
        'max_retries': 3,
        'timeout': 25,
        'rate_limit_delay': 1,
        'fallback_models': [
            'gpt-3.5-turbo',
            'gpt-4o-mini'
        ]
    },
    'cohere': {
        'max_retries': 2,
        'timeout': 20,
        'rate_limit_delay': 2,
        'fallback_models': [
            'command-r',
            'command-r-plus'
        ]
    }
}

# Complexity reduction strategies
COMPLEXITY_REDUCTION = {
    'max_tokens': [4000, 2000, 1000, 500],
    'temperature': [0.7, 0.5, 0.3],
    'context_length': [8000, 4000, 2000, 1000]
}

def get_fallback_providers(primary_provider: str) -> List[str]:
    """Get list of fallback providers for a given primary provider"""
    providers = PROVIDER_PRIORITY.copy()
    
    # Move primary provider to front if it's in the list
    if primary_provider in providers:
        providers.remove(primary_provider)
        providers.insert(0, primary_provider)
    else:
        # If primary provider is not in standard list, add it to front
        providers.insert(0, primary_provider)
    
    return providers

def get_error_type(error_message: str) -> ErrorType:
    """Determine error type from error message"""
    error_lower = error_message.lower()
    
    if any(term in error_lower for term in ['rate limit', 'too many requests', '429']):
        return ErrorType.RATE_LIMIT
    elif any(term in error_lower for term in ['timeout', 'deadline', 'time out']):
        return ErrorType.TIMEOUT
    elif any(term in error_lower for term in ['auth', 'unauthorized', '401', '403']):
        return ErrorType.AUTHENTICATION
    elif any(term in error_lower for term in ['quota', 'limit exceeded', 'usage limit']):
        return ErrorType.QUOTA_EXCEEDED
    elif any(term in error_lower for term in ['model not found', 'model unavailable', 'model not available']):
        return ErrorType.MODEL_UNAVAILABLE
    elif any(term in error_lower for term in ['network', 'connection', 'dns', 'unreachable']):
        return ErrorType.NETWORK_ERROR
    elif any(term in error_lower for term in ['invalid', 'bad request', '400']):
        return ErrorType.INVALID_REQUEST
    else:
        return ErrorType.UNKNOWN

def get_fallback_strategy(error_type: ErrorType) -> List[FallbackStrategy]:
    """Get fallback strategies for a given error type"""
    return FALLBACK_STRATEGIES.get(error_type, [FallbackStrategy.FAIL_GRACEFULLY])

def get_provider_config(provider: str) -> Dict[str, Any]:
    """Get configuration for a specific provider"""
    return PROVIDER_CONFIGS.get(provider, {
        'max_retries': 2,
        'timeout': 30,
        'rate_limit_delay': 2,
        'fallback_models': []
    })

def should_retry(attempt: int, max_retries: int, error_type: ErrorType) -> bool:
    """Determine if we should retry based on attempt count and error type"""
    if attempt >= max_retries:
        return False
    
    # Don't retry authentication errors
    if error_type == ErrorType.AUTHENTICATION:
        return False
    
    # Don't retry invalid request errors
    if error_type == ErrorType.INVALID_REQUEST:
        return False
    
    return True

def get_retry_delay(attempt: int, base_delay: float = 1.0) -> float:
    """Calculate retry delay with exponential backoff"""
    return base_delay * (2 ** attempt)
