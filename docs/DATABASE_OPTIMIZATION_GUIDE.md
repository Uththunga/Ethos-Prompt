# Database Optimization Guide

## Overview

This guide covers Firestore query optimization, indexing strategies, and caching for the RAG Prompt Library project.

## Table of Contents

1. [Query Optimization](#query-optimization)
2. [Composite Indexes](#composite-indexes)
3. [Query Result Caching](#query-result-caching)
4. [Best Practices](#best-practices)
5. [Performance Monitoring](#performance-monitoring)

---

## Query Optimization

### General Principles

1. **Minimize Document Reads**: Each document read costs money
2. **Use Pagination**: Always paginate large result sets
3. **Filter Early**: Apply most selective filters first
4. **Avoid N+1 Queries**: Batch reads when possible
5. **Cache Aggressively**: Cache frequently accessed data

### Optimized Query Patterns

#### ✅ Good: Paginated Query with Limit
```typescript
const promptsQuery = query(
  collection(db, 'prompts'),
  where('userId', '==', userId),
  where('status', '==', 'published'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

#### ❌ Bad: Fetching All Documents
```typescript
// Don't do this - fetches all documents
const promptsQuery = query(
  collection(db, 'prompts'),
  where('userId', '==', userId)
);
```

### Query Optimization Strategies

#### 1. Use Cursor-Based Pagination
```typescript
// First page
const firstQuery = query(
  collection(db, 'prompts'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc'),
  limit(20)
);

const firstSnapshot = await getDocs(firstQuery);
const lastVisible = firstSnapshot.docs[firstSnapshot.docs.length - 1];

// Next page
const nextQuery = query(
  collection(db, 'prompts'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc'),
  startAfter(lastVisible),
  limit(20)
);
```

#### 2. Denormalize for Read Performance
```typescript
// Store frequently accessed data together
interface Prompt {
  id: string;
  title: string;
  content: string;
  userId: string;
  userName: string;  // Denormalized from users collection
  userAvatar: string;  // Denormalized from users collection
  executionCount: number;  // Denormalized aggregate
  avgRating: number;  // Denormalized aggregate
}
```

#### 3. Use Subcollections for One-to-Many
```typescript
// Instead of storing all versions in one document
// Use subcollection for better scalability
const versionsRef = collection(db, 'prompts', promptId, 'versions');
```

#### 4. Batch Reads for Related Data
```typescript
// Batch read multiple documents
const promptIds = ['id1', 'id2', 'id3'];
const promptRefs = promptIds.map(id => doc(db, 'prompts', id));
const promptDocs = await Promise.all(promptRefs.map(ref => getDoc(ref)));
```

---

## Composite Indexes

### Required Indexes

Create these composite indexes in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "executions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "executions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "promptId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "uploadedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "model_performance",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "model_id", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "model_performance_stats",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "time_period", "order": "ASCENDING" },
        { "fieldPath": "quality_score", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "analytics_aggregates",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Creating Indexes

#### Via Firebase Console
1. Go to Firebase Console → Firestore → Indexes
2. Click "Create Index"
3. Select collection and fields
4. Choose ascending/descending order
5. Click "Create"

#### Via CLI
```bash
# Deploy indexes from firestore.indexes.json
firebase deploy --only firestore:indexes
```

#### Auto-Generated from Errors
When you run a query that needs an index, Firestore provides a link to create it automatically.

---

## Query Result Caching

### Cache Strategy

Use the cache invalidation service for query results:

```typescript
import { cache_invalidation_service } from '../cache/cache_invalidation_service';
import { DataType } from '../cache/ttl_config';

// Cache query results
async function getPrompts(userId: string): Promise<Prompt[]> {
  const cacheKey = `prompts:user:${userId}`;
  
  // Try cache first
  const cached = await cache_invalidation_service.get_with_fallback(
    key=cacheKey,
    data_type=DataType.PROMPT_CONTENT,
    fetch_fn=async () => {
      // Fetch from Firestore
      const q = query(
        collection(db, 'prompts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  );
  
  return cached;
}
```

### Invalidate on Mutations

```typescript
// When creating/updating/deleting prompts
async function updatePrompt(promptId: string, updates: Partial<Prompt>) {
  // Update Firestore
  await updateDoc(doc(db, 'prompts', promptId), updates);
  
  // Invalidate cache
  await cache_invalidation_service.invalidate(
    key=`prompt:${promptId}`,
    data_type=DataType.PROMPT_CONTENT,
    reason=InvalidationReason.DATA_UPDATED
  );
  
  // Invalidate user's prompt list
  const prompt = await getDoc(doc(db, 'prompts', promptId));
  const userId = prompt.data()?.userId;
  if (userId) {
    await cache_invalidation_service.invalidate(
      key=`prompts:user:${userId}`,
      data_type=DataType.PROMPT_CONTENT,
      reason=InvalidationReason.DEPENDENCY_CHANGED
    );
  }
}
```

---

## Best Practices

### 1. Query Design

✅ **Do:**
- Use equality filters before range filters
- Order by the same field you filter on
- Limit result sets
- Use pagination
- Cache frequently accessed data

❌ **Don't:**
- Fetch all documents without limit
- Use multiple range filters (requires composite index)
- Query without indexes
- Ignore cache opportunities

### 2. Data Modeling

✅ **Do:**
- Denormalize for read performance
- Use subcollections for one-to-many relationships
- Store aggregates (counts, sums) in documents
- Use batch writes for related updates

❌ **Don't:**
- Over-normalize (causes N+1 queries)
- Store large arrays (use subcollections)
- Update aggregates on every write (use scheduled functions)

### 3. Indexing

✅ **Do:**
- Create indexes for all production queries
- Monitor index usage
- Remove unused indexes
- Use single-field indexes for simple queries

❌ **Don't:**
- Create indexes you don't need
- Ignore index warnings
- Use array-contains with other filters without index

### 4. Caching

✅ **Do:**
- Cache frequently accessed data
- Use appropriate TTLs
- Invalidate on mutations
- Monitor cache hit rates

❌ **Don't:**
- Cache everything
- Use stale data for critical operations
- Forget to invalidate caches

---

## Performance Monitoring

### Firestore Metrics

Monitor these metrics in Firebase Console:

1. **Document Reads**: Track read operations
2. **Document Writes**: Track write operations
3. **Index Entries**: Monitor index size
4. **Query Latency**: Track query performance

### Custom Monitoring

```typescript
// Log slow queries
async function monitoredQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`Slow query: ${queryName} took ${duration}ms`);
      // Log to analytics
      await logMetric({
        name: 'slow_query',
        value: duration,
        metadata: { queryName }
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Query failed: ${queryName}`, error);
    throw error;
  }
}

// Usage
const prompts = await monitoredQuery(
  () => getPrompts(userId),
  'getPrompts'
);
```

### Cache Performance

```typescript
// Monitor cache hit rates
const stats = cache_invalidation_service.get_invalidation_stats();
console.log(`Cache hit ratio: ${stats.memory_cache_stats.hit_ratio}`);

// Alert on low hit rates
if (stats.memory_cache_stats.hit_ratio < 0.7) {
  console.warn('Low cache hit rate, consider adjusting TTLs');
}
```

---

## Query Optimization Checklist

- [ ] All queries have appropriate indexes
- [ ] Queries use pagination with limits
- [ ] Frequently accessed data is cached
- [ ] Cache invalidation is implemented
- [ ] Slow queries are monitored and logged
- [ ] Denormalization is used where appropriate
- [ ] Batch operations are used for related data
- [ ] Query results are cached with appropriate TTLs
- [ ] Cache hit rates are monitored
- [ ] Unused indexes are removed

---

## Resources

- [Firestore Query Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore Indexing](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Cache Invalidation Guide](./CACHE_INVALIDATION_GUIDE.md)
- [Performance Budget Guide](./PERFORMANCE_BUDGET_GUIDE.md)

---

**Last Updated**: 2025-10-04  
**Maintained By**: Development Team

