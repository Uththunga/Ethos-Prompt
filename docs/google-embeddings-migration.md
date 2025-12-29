# Google Embeddings Migration Guide

## Overview

This document describes the migration from Cohere embeddings to Google's text-embedding-004 model as the primary embedding provider for the RAG application. This change improves cost efficiency and performance while maintaining full compatibility with existing functionality.

## Changes Made

### 1. Dependencies Updated

**Removed:**
- `cohere>=4.0.0` (for embeddings only)
- `langchain-cohere>=0.1.0` (for embeddings only)

**Added:**
- `google-cloud-aiplatform>=1.38.0`

**Note:** Cohere is still available for LLM generation and reranking functionality.

### 2. Embedding Service Enhanced

The `EmbeddingService` class now supports multiple providers:

```python
# Google embeddings (default)
service = EmbeddingService(provider='google')

# OpenAI embeddings (fallback)
service = EmbeddingService(provider='openai')
```

**New Google Models Supported:**
- `text-embedding-004` (768 dimensions) - Primary model
- `textembedding-gecko@003` (768 dimensions) - Alternative model

### 3. Configuration Changes

**Environment Variables:**
- `GOOGLE_API_KEY` - Required for Google embeddings (primary)
- `OPENAI_API_KEY` - Optional for OpenAI embeddings (fallback)
- `COHERE_API_KEY` - Still required for Cohere LLM and reranking

**Default Settings:**
- Default embedding model: `text-embedding-004`
- Default provider: `google`
- Batch size: 100 (same as before)

### 4. Document Processing Pipeline

The document processing pipeline now uses Google embeddings by default:

```python
config = {
    'embedding_model': 'text-embedding-004',  # Changed from 'text-embedding-3-small'
    'chunk_size': 1000,
    'chunk_overlap': 200,
    'vector_namespace': 'documents',
    'batch_size': 50
}
```

## API Usage

### Single Embedding Generation

```python
from rag.embedding_service import embedding_service

# Generate single embedding
result = await embedding_service.generate_embedding(
    "Your text here",
    model="text-embedding-004"
)

print(f"Dimensions: {result.dimensions}")  # 768
print(f"Tokens used: {result.tokens_used}")
```

### Batch Embedding Generation

```python
# Generate batch embeddings
texts = ["Text 1", "Text 2", "Text 3"]
batch_result = await embedding_service.generate_batch_embeddings(
    texts,
    model="text-embedding-004"
)

print(f"Success count: {batch_result.success_count}")
print(f"Total tokens: {batch_result.total_tokens}")
```

### Provider-Specific Usage

```python
# Explicitly use Google embeddings
google_service = EmbeddingService(provider='google', api_key='your-google-key')

# Explicitly use OpenAI embeddings
openai_service = EmbeddingService(provider='openai', api_key='your-openai-key')
```

## Migration Benefits

### 1. Cost Efficiency
- Google text-embedding-004: ~$0.00001 per 1K tokens
- OpenAI text-embedding-3-small: $0.00002 per 1K tokens
- **50% cost reduction** for embedding generation

### 2. Performance
- Google embeddings: 768 dimensions (more efficient)
- Faster processing for large document collections
- Better integration with Google Cloud infrastructure

### 3. Quality
- Google's text-embedding-004 provides excellent semantic understanding
- Optimized for multilingual content
- Better performance on domain-specific content

## Backward Compatibility

### OpenAI Embeddings Still Available
```python
# Use OpenAI as fallback
service = EmbeddingService(provider='openai')
result = await service.generate_embedding(text, model='text-embedding-3-small')
```

### Existing Vector Stores
- Existing embeddings remain compatible
- New embeddings use 768 dimensions (Google) vs 1536 (OpenAI)
- Vector stores handle dimension differences automatically

### Configuration Flexibility
```python
# Environment-based provider selection
provider = os.getenv('EMBEDDING_PROVIDER', 'google')
service = EmbeddingService(provider=provider)
```

## Testing

### Integration Tests
Run the comprehensive test suite:

```bash
cd functions
python test_google_embeddings_integration.py
```

### Unit Tests
```bash
cd functions
python -m pytest tests/test_google_embeddings.py -v
```

### Live API Testing
Set your Google API key and run:

```bash
export GOOGLE_API_KEY="your-api-key"
python test_google_embeddings_integration.py
```

## Environment Setup

### Required Environment Variables

```bash
# Primary embedding provider
GOOGLE_API_KEY=your-google-api-key

# Fallback embedding provider (optional)
OPENAI_API_KEY=your-openai-api-key

# LLM providers
OPENROUTER_API_KEY=your-openrouter-key
ANTHROPIC_API_KEY=your-anthropic-key
COHERE_API_KEY=your-cohere-key  # For LLM and reranking

# Infrastructure
REDIS_URL=your-redis-url
PINECONE_API_KEY=your-pinecone-key
```

### Google Cloud Setup (Optional)

For enhanced Google Cloud integration:

```bash
# Set up Google Cloud project
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## Troubleshooting

### Common Issues

1. **"Google API key not available"**
   - Ensure `GOOGLE_API_KEY` is set in environment
   - Verify API key has Generative AI API access enabled

2. **"Service not available"**
   - Check that `google-cloud-aiplatform` is installed
   - Verify API key permissions

3. **Dimension mismatch errors**
   - Google embeddings: 768 dimensions
   - OpenAI embeddings: 1536 dimensions
   - Ensure vector store configuration matches

### Fallback to OpenAI

If Google embeddings fail, the system can fallback to OpenAI:

```python
try:
    # Try Google first
    service = EmbeddingService(provider='google')
    if not service.is_available():
        # Fallback to OpenAI
        service = EmbeddingService(provider='openai')
except Exception:
    # Use OpenAI as last resort
    service = EmbeddingService(provider='openai')
```

## Performance Monitoring

Monitor embedding performance:

```python
# Get service statistics
stats = embedding_service.get_cache_stats()
print(f"Cache hit rate: {stats.get('hit_rate', 0)}")

# Monitor model performance
model_info = embedding_service.get_model_info('text-embedding-004')
print(f"Model dimensions: {model_info['dimensions']}")
print(f"Cost per 1K tokens: ${model_info['cost_per_1k_tokens']}")
```

## Next Steps

1. **Monitor Performance**: Track embedding generation metrics
2. **Optimize Caching**: Tune Redis cache settings for better performance
3. **Scale Testing**: Test with larger document collections
4. **Cost Analysis**: Monitor actual cost savings vs. OpenAI

## Support

For issues or questions:
- Check the integration test results
- Review error logs in the embedding service
- Verify API key permissions and quotas
- Test with smaller batches if encountering rate limits
