"""
TTL Configuration for Cache Invalidation
Defines TTL policies for different data types and cache layers
"""
from enum import Enum
from dataclasses import dataclass
from typing import Dict, Optional
from datetime import timedelta

class CacheLayer(Enum):
    """Cache layer types"""
    MEMORY = "memory"  # In-memory LRU cache
    FIRESTORE = "firestore"  # Firebase Firestore cache
    REDIS = "redis"  # Redis distributed cache (if available)

class DataType(Enum):
    """Data types with different TTL requirements"""
    # User data
    USER_PROFILE = "user_profile"
    USER_PREFERENCES = "user_preferences"
    USER_SESSIONS = "user_sessions"
    
    # Prompt data
    PROMPT_CONTENT = "prompt_content"
    PROMPT_METADATA = "prompt_metadata"
    PROMPT_EXECUTIONS = "prompt_executions"
    PROMPT_TEMPLATES = "prompt_templates"
    
    # Document data
    DOCUMENT_CONTENT = "document_content"
    DOCUMENT_METADATA = "document_metadata"
    DOCUMENT_CHUNKS = "document_chunks"
    
    # RAG data
    EMBEDDINGS = "embeddings"
    VECTOR_INDEX = "vector_index"
    SEARCH_RESULTS = "search_results"
    CONTEXT_RETRIEVAL = "context_retrieval"
    
    # Analytics data
    ANALYTICS_METRICS = "analytics_metrics"
    ANALYTICS_AGGREGATES = "analytics_aggregates"
    ANALYTICS_REPORTS = "analytics_reports"
    
    # Model data
    MODEL_CONFIGS = "model_configs"
    MODEL_PERFORMANCE = "model_performance"
    MODEL_PRICING = "model_pricing"
    
    # API data
    API_RESPONSES = "api_responses"
    API_RATE_LIMITS = "api_rate_limits"
    
    # Static data
    STATIC_CONTENT = "static_content"
    CONFIGURATION = "configuration"

@dataclass
class TTLPolicy:
    """TTL policy for a specific data type"""
    data_type: DataType
    memory_ttl: Optional[int] = None  # Seconds, None = no memory cache
    firestore_ttl: Optional[int] = None  # Seconds, None = no Firestore cache
    redis_ttl: Optional[int] = None  # Seconds, None = no Redis cache
    max_age: Optional[int] = None  # Maximum age before forced refresh
    stale_while_revalidate: bool = False  # Serve stale while fetching fresh
    cache_on_error: bool = False  # Cache even on error (for resilience)
    
    def get_ttl(self, layer: CacheLayer) -> Optional[int]:
        """Get TTL for specific cache layer"""
        if layer == CacheLayer.MEMORY:
            return self.memory_ttl
        elif layer == CacheLayer.FIRESTORE:
            return self.firestore_ttl
        elif layer == CacheLayer.REDIS:
            return self.redis_ttl
        return None

# =============================================================================
# TTL POLICY DEFINITIONS
# =============================================================================

# User Data Policies
USER_PROFILE_POLICY = TTLPolicy(
    data_type=DataType.USER_PROFILE,
    memory_ttl=300,  # 5 minutes
    firestore_ttl=3600,  # 1 hour
    redis_ttl=1800,  # 30 minutes
    max_age=7200,  # 2 hours
    stale_while_revalidate=True
)

USER_PREFERENCES_POLICY = TTLPolicy(
    data_type=DataType.USER_PREFERENCES,
    memory_ttl=600,  # 10 minutes
    firestore_ttl=7200,  # 2 hours
    redis_ttl=3600,  # 1 hour
    max_age=14400,  # 4 hours
    stale_while_revalidate=True
)

USER_SESSIONS_POLICY = TTLPolicy(
    data_type=DataType.USER_SESSIONS,
    memory_ttl=60,  # 1 minute
    firestore_ttl=300,  # 5 minutes
    redis_ttl=180,  # 3 minutes
    max_age=600,  # 10 minutes
    stale_while_revalidate=False
)

# Prompt Data Policies
PROMPT_CONTENT_POLICY = TTLPolicy(
    data_type=DataType.PROMPT_CONTENT,
    memory_ttl=600,  # 10 minutes
    firestore_ttl=3600,  # 1 hour
    redis_ttl=1800,  # 30 minutes
    max_age=7200,  # 2 hours
    stale_while_revalidate=True
)

PROMPT_METADATA_POLICY = TTLPolicy(
    data_type=DataType.PROMPT_METADATA,
    memory_ttl=300,  # 5 minutes
    firestore_ttl=1800,  # 30 minutes
    redis_ttl=900,  # 15 minutes
    max_age=3600,  # 1 hour
    stale_while_revalidate=True
)

PROMPT_EXECUTIONS_POLICY = TTLPolicy(
    data_type=DataType.PROMPT_EXECUTIONS,
    memory_ttl=60,  # 1 minute
    firestore_ttl=300,  # 5 minutes
    redis_ttl=180,  # 3 minutes
    max_age=600,  # 10 minutes
    stale_while_revalidate=False
)

PROMPT_TEMPLATES_POLICY = TTLPolicy(
    data_type=DataType.PROMPT_TEMPLATES,
    memory_ttl=1800,  # 30 minutes
    firestore_ttl=7200,  # 2 hours
    redis_ttl=3600,  # 1 hour
    max_age=14400,  # 4 hours
    stale_while_revalidate=True
)

# Document Data Policies
DOCUMENT_CONTENT_POLICY = TTLPolicy(
    data_type=DataType.DOCUMENT_CONTENT,
    memory_ttl=None,  # Too large for memory
    firestore_ttl=86400,  # 24 hours
    redis_ttl=43200,  # 12 hours
    max_age=172800,  # 48 hours
    stale_while_revalidate=True,
    cache_on_error=True
)

DOCUMENT_METADATA_POLICY = TTLPolicy(
    data_type=DataType.DOCUMENT_METADATA,
    memory_ttl=600,  # 10 minutes
    firestore_ttl=3600,  # 1 hour
    redis_ttl=1800,  # 30 minutes
    max_age=7200,  # 2 hours
    stale_while_revalidate=True
)

DOCUMENT_CHUNKS_POLICY = TTLPolicy(
    data_type=DataType.DOCUMENT_CHUNKS,
    memory_ttl=None,  # Too large for memory
    firestore_ttl=86400,  # 24 hours
    redis_ttl=43200,  # 12 hours
    max_age=172800,  # 48 hours
    stale_while_revalidate=True,
    cache_on_error=True
)

# RAG Data Policies
EMBEDDINGS_POLICY = TTLPolicy(
    data_type=DataType.EMBEDDINGS,
    memory_ttl=None,  # Too large for memory
    firestore_ttl=604800,  # 7 days
    redis_ttl=86400,  # 24 hours
    max_age=1209600,  # 14 days
    stale_while_revalidate=True,
    cache_on_error=True
)

VECTOR_INDEX_POLICY = TTLPolicy(
    data_type=DataType.VECTOR_INDEX,
    memory_ttl=None,  # Too large for memory
    firestore_ttl=604800,  # 7 days
    redis_ttl=86400,  # 24 hours
    max_age=1209600,  # 14 days
    stale_while_revalidate=True,
    cache_on_error=True
)

SEARCH_RESULTS_POLICY = TTLPolicy(
    data_type=DataType.SEARCH_RESULTS,
    memory_ttl=300,  # 5 minutes
    firestore_ttl=1800,  # 30 minutes
    redis_ttl=900,  # 15 minutes
    max_age=3600,  # 1 hour
    stale_while_revalidate=True
)

CONTEXT_RETRIEVAL_POLICY = TTLPolicy(
    data_type=DataType.CONTEXT_RETRIEVAL,
    memory_ttl=180,  # 3 minutes
    firestore_ttl=900,  # 15 minutes
    redis_ttl=600,  # 10 minutes
    max_age=1800,  # 30 minutes
    stale_while_revalidate=True
)

# Analytics Data Policies
ANALYTICS_METRICS_POLICY = TTLPolicy(
    data_type=DataType.ANALYTICS_METRICS,
    memory_ttl=60,  # 1 minute
    firestore_ttl=300,  # 5 minutes
    redis_ttl=180,  # 3 minutes
    max_age=600,  # 10 minutes
    stale_while_revalidate=True
)

ANALYTICS_AGGREGATES_POLICY = TTLPolicy(
    data_type=DataType.ANALYTICS_AGGREGATES,
    memory_ttl=300,  # 5 minutes
    firestore_ttl=1800,  # 30 minutes
    redis_ttl=900,  # 15 minutes
    max_age=3600,  # 1 hour
    stale_while_revalidate=True
)

ANALYTICS_REPORTS_POLICY = TTLPolicy(
    data_type=DataType.ANALYTICS_REPORTS,
    memory_ttl=600,  # 10 minutes
    firestore_ttl=3600,  # 1 hour
    redis_ttl=1800,  # 30 minutes
    max_age=7200,  # 2 hours
    stale_while_revalidate=True
)

# Model Data Policies
MODEL_CONFIGS_POLICY = TTLPolicy(
    data_type=DataType.MODEL_CONFIGS,
    memory_ttl=1800,  # 30 minutes
    firestore_ttl=7200,  # 2 hours
    redis_ttl=3600,  # 1 hour
    max_age=14400,  # 4 hours
    stale_while_revalidate=True
)

MODEL_PERFORMANCE_POLICY = TTLPolicy(
    data_type=DataType.MODEL_PERFORMANCE,
    memory_ttl=300,  # 5 minutes
    firestore_ttl=1800,  # 30 minutes
    redis_ttl=900,  # 15 minutes
    max_age=3600,  # 1 hour
    stale_while_revalidate=True
)

MODEL_PRICING_POLICY = TTLPolicy(
    data_type=DataType.MODEL_PRICING,
    memory_ttl=3600,  # 1 hour
    firestore_ttl=14400,  # 4 hours
    redis_ttl=7200,  # 2 hours
    max_age=28800,  # 8 hours
    stale_while_revalidate=True
)

# API Data Policies
API_RESPONSES_POLICY = TTLPolicy(
    data_type=DataType.API_RESPONSES,
    memory_ttl=60,  # 1 minute
    firestore_ttl=300,  # 5 minutes
    redis_ttl=180,  # 3 minutes
    max_age=600,  # 10 minutes
    stale_while_revalidate=True
)

API_RATE_LIMITS_POLICY = TTLPolicy(
    data_type=DataType.API_RATE_LIMITS,
    memory_ttl=10,  # 10 seconds
    firestore_ttl=60,  # 1 minute
    redis_ttl=30,  # 30 seconds
    max_age=120,  # 2 minutes
    stale_while_revalidate=False
)

# Static Data Policies
STATIC_CONTENT_POLICY = TTLPolicy(
    data_type=DataType.STATIC_CONTENT,
    memory_ttl=3600,  # 1 hour
    firestore_ttl=86400,  # 24 hours
    redis_ttl=43200,  # 12 hours
    max_age=604800,  # 7 days
    stale_while_revalidate=True,
    cache_on_error=True
)

CONFIGURATION_POLICY = TTLPolicy(
    data_type=DataType.CONFIGURATION,
    memory_ttl=1800,  # 30 minutes
    firestore_ttl=7200,  # 2 hours
    redis_ttl=3600,  # 1 hour
    max_age=14400,  # 4 hours
    stale_while_revalidate=True
)

# =============================================================================
# POLICY REGISTRY
# =============================================================================

TTL_POLICIES: Dict[DataType, TTLPolicy] = {
    # User data
    DataType.USER_PROFILE: USER_PROFILE_POLICY,
    DataType.USER_PREFERENCES: USER_PREFERENCES_POLICY,
    DataType.USER_SESSIONS: USER_SESSIONS_POLICY,
    
    # Prompt data
    DataType.PROMPT_CONTENT: PROMPT_CONTENT_POLICY,
    DataType.PROMPT_METADATA: PROMPT_METADATA_POLICY,
    DataType.PROMPT_EXECUTIONS: PROMPT_EXECUTIONS_POLICY,
    DataType.PROMPT_TEMPLATES: PROMPT_TEMPLATES_POLICY,
    
    # Document data
    DataType.DOCUMENT_CONTENT: DOCUMENT_CONTENT_POLICY,
    DataType.DOCUMENT_METADATA: DOCUMENT_METADATA_POLICY,
    DataType.DOCUMENT_CHUNKS: DOCUMENT_CHUNKS_POLICY,
    
    # RAG data
    DataType.EMBEDDINGS: EMBEDDINGS_POLICY,
    DataType.VECTOR_INDEX: VECTOR_INDEX_POLICY,
    DataType.SEARCH_RESULTS: SEARCH_RESULTS_POLICY,
    DataType.CONTEXT_RETRIEVAL: CONTEXT_RETRIEVAL_POLICY,
    
    # Analytics data
    DataType.ANALYTICS_METRICS: ANALYTICS_METRICS_POLICY,
    DataType.ANALYTICS_AGGREGATES: ANALYTICS_AGGREGATES_POLICY,
    DataType.ANALYTICS_REPORTS: ANALYTICS_REPORTS_POLICY,
    
    # Model data
    DataType.MODEL_CONFIGS: MODEL_CONFIGS_POLICY,
    DataType.MODEL_PERFORMANCE: MODEL_PERFORMANCE_POLICY,
    DataType.MODEL_PRICING: MODEL_PRICING_POLICY,
    
    # API data
    DataType.API_RESPONSES: API_RESPONSES_POLICY,
    DataType.API_RATE_LIMITS: API_RATE_LIMITS_POLICY,
    
    # Static data
    DataType.STATIC_CONTENT: STATIC_CONTENT_POLICY,
    DataType.CONFIGURATION: CONFIGURATION_POLICY,
}

def get_ttl_policy(data_type: DataType) -> TTLPolicy:
    """Get TTL policy for a data type"""
    return TTL_POLICIES.get(data_type, STATIC_CONTENT_POLICY)

def get_ttl(data_type: DataType, layer: CacheLayer) -> Optional[int]:
    """Get TTL for a specific data type and cache layer"""
    policy = get_ttl_policy(data_type)
    return policy.get_ttl(layer)

