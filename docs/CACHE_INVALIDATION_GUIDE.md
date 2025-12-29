# Cache Invalidation Guide

## Overview

This guide explains the cache invalidation strategies implemented in the RAG Prompt Library, including TTL-based and event-based invalidation across multiple cache layers.

## Table of Contents

1. [Architecture](#architecture)
2. [TTL Policies](#ttl-policies)
3. [Cache Layers](#cache-layers)
4. [Usage Examples](#usage-examples)
5. [Event-Based Invalidation](#event-based-invalidation)
6. [Monitoring](#monitoring)
7. [Best Practices](#best-practices)

---

## Architecture

### Multi-Layer Caching

The system uses a three-tier caching architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cache Invalidation Service                │
│  • TTL-based invalidation                                    │
│  • Event-based invalidation                                  │
│  • Multi-layer coordination                                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Memory Cache │    │   Firestore  │    │    Redis     │
│   (LRU)      │    │    Cache     │    │    Cache     │
│              │    │              │    │  (Optional)  │
│ • Fast       │    │ • Persistent │    │ • Distributed│
│ • Volatile   │    │ • Scalable   │    │ • Fast       │
│ • 100MB max  │    │ • Durable    │    │ • Shared     │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Components

1. **TTL Config** (`ttl_config.py`): Defines TTL policies for different data types
2. **Cache Invalidation Service** (`cache_invalidation_service.py`): Coordinates invalidation across layers
3. **Firebase Cache** (`firebase_cache.py`): Firestore-based persistent cache
4. **LRU Cache** (`cache_manager.py`): In-memory LRU cache
5. **Redis Cache** (`cache_manager.py`): Optional distributed cache

---

## TTL Policies

### Data Types and TTL Values

| Data Type | Memory TTL | Firestore TTL | Redis TTL | Max Age |
|-----------|------------|---------------|-----------|---------|
| **User Data** |
| User Profile | 5 min | 1 hour | 30 min | 2 hours |
| User Preferences | 10 min | 2 hours | 1 hour | 4 hours |
| User Sessions | 1 min | 5 min | 3 min | 10 min |
| **Prompt Data** |
| Prompt Content | 10 min | 1 hour | 30 min | 2 hours |
| Prompt Metadata | 5 min | 30 min | 15 min | 1 hour |
| Prompt Executions | 1 min | 5 min | 3 min | 10 min |
| Prompt Templates | 30 min | 2 hours | 1 hour | 4 hours |
| **Document Data** |
| Document Content | - | 24 hours | 12 hours | 48 hours |
| Document Metadata | 10 min | 1 hour | 30 min | 2 hours |
| Document Chunks | - | 24 hours | 12 hours | 48 hours |
| **RAG Data** |
| Embeddings | - | 7 days | 24 hours | 14 days |
| Vector Index | - | 7 days | 24 hours | 14 days |
| Search Results | 5 min | 30 min | 15 min | 1 hour |
| Context Retrieval | 3 min | 15 min | 10 min | 30 min |
| **Analytics Data** |
| Analytics Metrics | 1 min | 5 min | 3 min | 10 min |
| Analytics Aggregates | 5 min | 30 min | 15 min | 1 hour |
| Analytics Reports | 10 min | 1 hour | 30 min | 2 hours |
| **Model Data** |
| Model Configs | 30 min | 2 hours | 1 hour | 4 hours |
| Model Performance | 5 min | 30 min | 15 min | 1 hour |
| Model Pricing | 1 hour | 4 hours | 2 hours | 8 hours |
| **API Data** |
| API Responses | 1 min | 5 min | 3 min | 10 min |
| API Rate Limits | 10 sec | 1 min | 30 sec | 2 min |
| **Static Data** |
| Static Content | 1 hour | 24 hours | 12 hours | 7 days |
| Configuration | 30 min | 2 hours | 1 hour | 4 hours |

### TTL Policy Features

- **Stale-While-Revalidate**: Serve stale data while fetching fresh data in background
- **Cache-on-Error**: Cache data even on errors for resilience
- **Max Age**: Maximum age before forced refresh regardless of TTL

---

## Cache Layers

### 1. Memory Cache (LRU)

**Characteristics:**
- Fastest access (< 1ms)
- Volatile (lost on restart)
- Limited size (100MB default)
- Process-local

**Best For:**
- Frequently accessed small data
- Hot data
- Session data

**Configuration:**
```python
from rag.cache_manager import LRUCache

cache = LRUCache(
    max_size=1000,  # Max number of entries
    max_memory_mb=100  # Max memory usage
)
```

### 2. Firestore Cache

**Characteristics:**
- Persistent
- Scalable
- Slower than memory (10-50ms)
- Shared across instances

**Best For:**
- Large data
- Persistent data
- Shared data

**Configuration:**
```python
from cache.firebase_cache import FirebaseCache

cache = FirebaseCache()
await cache.set(key, value, ttl_seconds=3600)
```

### 3. Redis Cache (Optional)

**Characteristics:**
- Fast (1-5ms)
- Distributed
- Persistent (optional)
- Shared across instances

**Best For:**
- High-traffic data
- Distributed systems
- Real-time data

**Configuration:**
```python
from rag.cache_manager import RedisCache

cache = RedisCache(redis_url="redis://localhost:6379")
cache.put(key, value, ttl_seconds=1800)
```

---

## Usage Examples

### Basic Usage

```python
from cache.cache_invalidation_service import cache_invalidation_service
from cache.ttl_config import DataType

# Set value with automatic TTL
await cache_invalidation_service.set_with_ttl(
    key="user:123:profile",
    value=user_profile_data,
    data_type=DataType.USER_PROFILE
)

# Get value with multi-layer fallback
profile = await cache_invalidation_service.get_with_fallback(
    key="user:123:profile",
    data_type=DataType.USER_PROFILE,
    fetch_fn=lambda: fetch_user_profile_from_db(123)
)
```

### Manual Invalidation

```python
from cache.cache_invalidation_service import cache_invalidation_service, InvalidationReason
from cache.ttl_config import DataType, CacheLayer

# Invalidate specific key
await cache_invalidation_service.invalidate(
    key="user:123:profile",
    data_type=DataType.USER_PROFILE,
    reason=InvalidationReason.DATA_UPDATED,
    layers=[CacheLayer.MEMORY, CacheLayer.FIRESTORE]
)

# Invalidate pattern
count = await cache_invalidation_service.invalidate_pattern(
    pattern="user:123:*",
    data_type=DataType.USER_PROFILE,
    reason=InvalidationReason.DATA_UPDATED
)
print(f"Invalidated {count} keys")
```

### Custom TTL

```python
# Override default TTL for specific use case
await cache_invalidation_service.firestore_cache.set(
    key="temporary:data",
    value=temp_data,
    ttl_seconds=60  # 1 minute
)
```

---

## Event-Based Invalidation

### Firestore Triggers

Automatically invalidate cache when data changes:

```python
# functions/src/api/prompts.py

from cache.cache_invalidation_service import cache_invalidation_service, InvalidationReason
from cache.ttl_config import DataType

async def update_prompt(prompt_id: str, updates: dict):
    # Update in Firestore
    await db.collection('prompts').document(prompt_id).update(updates)
    
    # Invalidate cache
    await cache_invalidation_service.invalidate(
        key=f"prompt:{prompt_id}",
        data_type=DataType.PROMPT_CONTENT,
        reason=InvalidationReason.DATA_UPDATED,
        metadata={'prompt_id': prompt_id, 'updates': list(updates.keys())}
    )
```

### Dependency-Based Invalidation

Invalidate dependent caches:

```python
async def update_document(doc_id: str, updates: dict):
    # Update document
    await db.collection('documents').document(doc_id).update(updates)
    
    # Invalidate document cache
    await cache_invalidation_service.invalidate(
        key=f"document:{doc_id}",
        data_type=DataType.DOCUMENT_CONTENT,
        reason=InvalidationReason.DATA_UPDATED
    )
    
    # Invalidate dependent caches
    await cache_invalidation_service.invalidate_pattern(
        pattern=f"document:{doc_id}:chunks:*",
        data_type=DataType.DOCUMENT_CHUNKS,
        reason=InvalidationReason.DEPENDENCY_CHANGED
    )
    
    await cache_invalidation_service.invalidate_pattern(
        pattern=f"document:{doc_id}:embeddings:*",
        data_type=DataType.EMBEDDINGS,
        reason=InvalidationReason.DEPENDENCY_CHANGED
    )
```

---

## Monitoring

### Cache Statistics

```python
# Get invalidation stats
stats = cache_invalidation_service.get_invalidation_stats()
print(f"Total invalidations: {stats['total_invalidations']}")
print(f"By reason: {stats['by_reason']}")
print(f"By data type: {stats['by_data_type']}")

# Get memory cache stats
memory_stats = cache_invalidation_service.memory_cache.get_stats()
print(f"Hit ratio: {memory_stats['hit_ratio']:.2%}")
print(f"Entries: {memory_stats['entries']}")
print(f"Size: {memory_stats['size_mb']:.2f} MB")
```

### Logging

Cache operations are logged at DEBUG level:

```python
import logging

logging.getLogger('cache.cache_invalidation_service').setLevel(logging.DEBUG)
logging.getLogger('cache.firebase_cache').setLevel(logging.DEBUG)
```

### Metrics

Track cache performance in production:

```python
from firebase_admin import firestore

# Log cache metrics to Firestore
await db.collection('metrics').add({
    'type': 'cache_stats',
    'timestamp': firestore.SERVER_TIMESTAMP,
    'stats': cache_invalidation_service.get_invalidation_stats()
})
```

---

## Best Practices

### 1. Choose Appropriate TTL

- **Short TTL (< 5 min)**: Real-time data, frequently changing data
- **Medium TTL (5 min - 1 hour)**: User data, prompt data
- **Long TTL (> 1 hour)**: Static data, configuration, embeddings

### 2. Use Stale-While-Revalidate

Enable for non-critical data to improve performance:

```python
# Configured in ttl_config.py
PROMPT_CONTENT_POLICY = TTLPolicy(
    data_type=DataType.PROMPT_CONTENT,
    memory_ttl=600,
    stale_while_revalidate=True  # Serve stale while fetching fresh
)
```

### 3. Invalidate on Updates

Always invalidate cache when data changes:

```python
async def update_data(key: str, value: Any):
    # Update database
    await db.update(key, value)
    
    # Invalidate cache
    await cache_invalidation_service.invalidate(
        key=key,
        data_type=DataType.PROMPT_CONTENT,
        reason=InvalidationReason.DATA_UPDATED
    )
```

### 4. Use Pattern Invalidation for Related Data

```python
# Invalidate all user-related caches
await cache_invalidation_service.invalidate_pattern(
    pattern=f"user:{user_id}:*",
    data_type=DataType.USER_PROFILE,
    reason=InvalidationReason.DATA_UPDATED
)
```

### 5. Monitor Cache Performance

- Track hit ratios (target: > 80%)
- Monitor memory usage
- Alert on high eviction rates
- Review invalidation patterns

### 6. Handle Cache Failures Gracefully

```python
try:
    value = await cache_invalidation_service.get_with_fallback(
        key=key,
        data_type=DataType.PROMPT_CONTENT,
        fetch_fn=fetch_from_db
    )
except Exception as e:
    logger.error(f"Cache error: {e}")
    # Fallback to direct database access
    value = await fetch_from_db()
```

---

## Resources

- [TTL Config](../functions/src/cache/ttl_config.py)
- [Cache Invalidation Service](../functions/src/cache/cache_invalidation_service.py)
- [Firebase Cache](../functions/src/cache/firebase_cache.py)
- [Cache Manager](../functions/src/rag/cache_manager.py)

---

**Last Updated**: 2025-10-04  
**Maintained By**: Development Team

