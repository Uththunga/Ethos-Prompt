# Firestore Vector Index Configuration (Task 4.2)

Date: 2025-10-03
Status: COMPLETE

## Overview
This document specifies optimal Firestore index configurations for the RAG vector search system.

## Vector Collection Structure

### Collection: `vector_embeddings`
```
vector_embeddings/
├── _metadata (document)
│   ├── dimensions: 768
│   ├── metric: "cosine"
│   ├── created_at: timestamp
│   ├── region: "australia-southeast1"
│   └── index_type: "firestore_vector_search"
└── {chunk_id} (documents)
    ├── embedding: Vector(768)
    ├── content: string
    ├── document_id: string
    ├── user_id: string
    ├── page_number: number
    ├── section_title: string
    ├── chunk_position: number
    ├── token_count: number
    ├── created_at: timestamp
    └── metadata: map
```

## Required Indexes

### 1. Vector Search Index (Automatic)
Firestore automatically creates vector indexes when vector fields are added.
- **Field**: `embedding`
- **Type**: Vector
- **Dimensions**: 768
- **Distance Measure**: COSINE
- **Region**: australia-southeast1

### 2. Composite Indexes for Filtered Queries

#### Index 1: User + Document Filter
```json
{
  "collectionGroup": "vector_embeddings",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "user_id", "order": "ASCENDING"},
    {"fieldPath": "document_id", "order": "ASCENDING"},
    {"fieldPath": "created_at", "order": "DESCENDING"}
  ]
}
```

#### Index 2: User + Date Range
```json
{
  "collectionGroup": "vector_embeddings",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "user_id", "order": "ASCENDING"},
    {"fieldPath": "created_at", "order": "DESCENDING"}
  ]
}
```

#### Index 3: Document + Position
```json
{
  "collectionGroup": "vector_embeddings",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "document_id", "order": "ASCENDING"},
    {"fieldPath": "chunk_position", "order": "ASCENDING"}
  ]
}
```

## firestore.indexes.json Configuration

```json
{
  "indexes": [
    {
      "collectionGroup": "vector_embeddings",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "user_id", "order": "ASCENDING"},
        {"fieldPath": "document_id", "order": "ASCENDING"},
        {"fieldPath": "created_at", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "vector_embeddings",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "user_id", "order": "ASCENDING"},
        {"fieldPath": "created_at", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "vector_embeddings",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "document_id", "order": "ASCENDING"},
        {"fieldPath": "chunk_position", "order": "ASCENDING"}
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Index Build Time Estimates
- Small collections (<1000 docs): ~1-2 minutes
- Medium collections (1000-10000 docs): ~5-15 minutes
- Large collections (>10000 docs): ~30-60 minutes

## Query Performance Targets
- Vector similarity search (no filters): <100ms p95
- Filtered vector search (1-2 filters): <200ms p95
- Complex filtered search (3+ filters): <500ms p95

## Deployment Instructions

1. Save the configuration to `firestore.indexes.json` in the project root
2. Deploy indexes using Firebase CLI:
   ```bash
   firebase deploy --only firestore:indexes
   ```
3. Monitor index build progress in Firebase Console
4. Verify index usage in query performance metrics

## Monitoring and Optimization

### Key Metrics to Track
- Index build time and status
- Query latency (p50, p95, p99)
- Index size and storage costs
- Query patterns and filter usage

### Optimization Strategies
1. Add indexes for frequently used filter combinations
2. Remove unused indexes to reduce storage costs
3. Use composite indexes for multi-field filters
4. Monitor query explain plans for missing indexes

## Notes
- Vector indexes are created automatically by Firestore
- Composite indexes must be explicitly defined
- Index creation is asynchronous and may take time
- Queries will fail if required composite indexes are missing
- Use Firebase Console to monitor index build status

