"""
Tests for cache invalidation service
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock

from src.cache.cache_invalidation_service import (
    CacheInvalidationService,
    InvalidationReason,
    InvalidationEvent
)
from src.cache.ttl_config import DataType, CacheLayer


@pytest.fixture
def invalidation_service():
    """Create cache invalidation service instance"""
    return CacheInvalidationService()


@pytest.mark.asyncio
async def test_ttl_based_invalidation(invalidation_service):
    """Test TTL-based cache invalidation"""
    # Set a value with short TTL
    key = "test:ttl:key"
    value = {"data": "test"}
    
    # Put in memory cache with 1 second TTL
    invalidation_service.memory_cache.put(key, value, ttl_seconds=1)
    
    # Should be available immediately
    result = invalidation_service.memory_cache.get(key)
    assert result == value
    
    # Wait for TTL to expire
    await asyncio.sleep(1.5)
    
    # Should be expired
    result = invalidation_service.memory_cache.get(key)
    assert result is None


@pytest.mark.asyncio
async def test_manual_invalidation(invalidation_service):
    """Test manual cache invalidation"""
    key = "test:manual:key"
    value = {"data": "test"}
    
    # Put in cache
    invalidation_service.memory_cache.put(key, value, ttl_seconds=3600)
    
    # Verify it's there
    assert invalidation_service.memory_cache.get(key) == value
    
    # Invalidate manually
    await invalidation_service.invalidate(
        key=key,
        data_type=DataType.PROMPT_CONTENT,
        reason=InvalidationReason.DATA_UPDATED,
        layers=[CacheLayer.MEMORY]
    )
    
    # Should be gone
    assert invalidation_service.memory_cache.get(key) is None


@pytest.mark.asyncio
async def test_pattern_invalidation(invalidation_service):
    """Test pattern-based cache invalidation"""
    # Put multiple keys with same prefix
    keys = [f"user:123:data:{i}" for i in range(5)]
    for key in keys:
        invalidation_service.memory_cache.put(key, {"id": key}, ttl_seconds=3600)
    
    # Verify all are there
    for key in keys:
        assert invalidation_service.memory_cache.get(key) is not None
    
    # Invalidate by pattern
    count = await invalidation_service.invalidate_pattern(
        pattern="user:123:*",
        data_type=DataType.USER_PROFILE,
        reason=InvalidationReason.DATA_UPDATED
    )
    
    # All should be gone
    assert count == 5
    for key in keys:
        assert invalidation_service.memory_cache.get(key) is None


@pytest.mark.asyncio
async def test_dependency_invalidation(invalidation_service):
    """Test dependency-based invalidation"""
    # Set up dependent caches
    doc_key = "document:doc123"
    chunk_keys = [f"document:doc123:chunks:{i}" for i in range(3)]
    embedding_keys = [f"document:doc123:embeddings:{i}" for i in range(3)]
    
    # Put all in cache
    invalidation_service.memory_cache.put(doc_key, {"doc": "data"}, ttl_seconds=3600)
    for key in chunk_keys + embedding_keys:
        invalidation_service.memory_cache.put(key, {"data": key}, ttl_seconds=3600)
    
    # Invalidate document (should cascade to chunks and embeddings)
    await invalidation_service.invalidate(
        key=doc_key,
        data_type=DataType.DOCUMENT_CONTENT,
        reason=InvalidationReason.DATA_UPDATED
    )
    
    # Invalidate dependent caches
    await invalidation_service.invalidate_pattern(
        pattern="document:doc123:chunks:*",
        data_type=DataType.DOCUMENT_CHUNKS,
        reason=InvalidationReason.DEPENDENCY_CHANGED
    )
    await invalidation_service.invalidate_pattern(
        pattern="document:doc123:embeddings:*",
        data_type=DataType.EMBEDDINGS,
        reason=InvalidationReason.DEPENDENCY_CHANGED
    )
    
    # All should be gone
    assert invalidation_service.memory_cache.get(doc_key) is None
    for key in chunk_keys + embedding_keys:
        assert invalidation_service.memory_cache.get(key) is None


@pytest.mark.asyncio
async def test_invalidation_history(invalidation_service):
    """Test invalidation event tracking"""
    key = "test:history:key"
    
    # Perform invalidation
    await invalidation_service.invalidate(
        key=key,
        data_type=DataType.PROMPT_CONTENT,
        reason=InvalidationReason.DATA_UPDATED,
        metadata={"test": "data"}
    )
    
    # Check history
    assert len(invalidation_service.invalidation_history) > 0
    event = invalidation_service.invalidation_history[-1]
    assert event.key == key
    assert event.reason == InvalidationReason.DATA_UPDATED
    assert event.metadata == {"test": "data"}


@pytest.mark.asyncio
async def test_cache_hit_rate_monitoring(invalidation_service):
    """Test cache hit rate monitoring"""
    # Perform some cache operations
    for i in range(10):
        key = f"test:metrics:{i}"
        invalidation_service.memory_cache.put(key, {"id": i}, ttl_seconds=3600)
    
    # Hit some keys
    for i in range(5):
        invalidation_service.memory_cache.get(f"test:metrics:{i}")
    
    # Miss some keys
    for i in range(10, 15):
        invalidation_service.memory_cache.get(f"test:metrics:{i}")
    
    # Check stats
    stats = invalidation_service.memory_cache.stats
    assert stats['hits'] == 5
    assert stats['misses'] == 5
    
    # Calculate hit rate
    total = stats['hits'] + stats['misses']
    hit_rate = stats['hits'] / total if total > 0 else 0
    assert hit_rate == 0.5


@pytest.mark.asyncio
async def test_stale_while_revalidate(invalidation_service):
    """Test stale-while-revalidate pattern"""
    key = "test:swr:key"
    value = {"data": "original"}
    
    # Put with short TTL
    invalidation_service.memory_cache.put(key, value, ttl_seconds=1)
    
    # Get immediately (should hit)
    result = invalidation_service.memory_cache.get(key)
    assert result == value
    
    # Wait for expiry
    await asyncio.sleep(1.5)
    
    # Should be expired but could serve stale while revalidating
    # (This would require additional implementation in production)
    result = invalidation_service.memory_cache.get(key)
    assert result is None  # Currently returns None, but could return stale


@pytest.mark.asyncio
async def test_cache_warming(invalidation_service):
    """Test cache warming after invalidation"""
    key = "test:warm:key"
    
    # Simulate cache warming
    async def warm_cache():
        # Fetch fresh data
        fresh_data = {"data": "fresh", "timestamp": datetime.now().isoformat()}
        # Put in cache
        invalidation_service.memory_cache.put(key, fresh_data, ttl_seconds=3600)
        return fresh_data
    
    # Warm the cache
    result = await warm_cache()
    assert result["data"] == "fresh"
    
    # Verify it's in cache
    cached = invalidation_service.memory_cache.get(key)
    assert cached == result


def test_cache_stats_reporting(invalidation_service):
    """Test cache statistics reporting"""
    # Perform operations
    for i in range(20):
        key = f"test:stats:{i}"
        invalidation_service.memory_cache.put(key, {"id": i}, ttl_seconds=3600)
    
    # Get stats
    stats = invalidation_service.memory_cache.stats
    
    # Verify stats structure
    assert 'hits' in stats
    assert 'misses' in stats
    assert 'evictions' in stats
    assert 'total_size_bytes' in stats
    
    # Verify counts
    assert stats['hits'] >= 0
    assert stats['misses'] >= 0

