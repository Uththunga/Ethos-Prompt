# Embedding Service API Reference

## Overview

The `EmbeddingService` provides a unified interface for generating text embeddings using multiple providers (Google, OpenAI via OpenRouter).

## Classes

### EmbeddingService

Main service class for generating embeddings.

```python
from rag.embedding_service import EmbeddingService

# Initialize with provider
service = EmbeddingService(provider='google', api_key='your-key')
```

#### Constructor Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `provider` | str | `'google'` | Provider: `'google'` or `'openai'` |
| `api_key` | str | `None` | API key (uses env vars if None) |
| `redis_url` | str | `None` | Redis URL for caching |
| `google_project_id` | str | `None` | Google Cloud project ID |
| `google_location` | str | `'us-central1'` | Google Cloud location |

#### Methods

##### `generate_embedding(text, model=None)`

Generate embedding for single text.

```python
result = await service.generate_embedding(
    "Your text here",
    model="text-embedding-004"
)
```

**Parameters:**
- `text` (str): Text to embed
- `model` (str, optional): Model name

**Returns:** `EmbeddingResult` or `None`

##### `generate_batch_embeddings(texts, model=None)`

Generate embeddings for multiple texts.

```python
texts = ["Text 1", "Text 2", "Text 3"]
batch_result = await service.generate_batch_embeddings(texts)
```

**Parameters:**
- `texts` (List[str]): List of texts to embed
- `model` (str, optional): Model name

**Returns:** `BatchEmbeddingResult`

##### `is_available()`

Check if service is available.

```python
if service.is_available():
    # Service ready
    pass
```

**Returns:** `bool`

##### `get_model_info(model=None)`

Get model configuration information.

```python
# Get specific model info
info = service.get_model_info('text-embedding-004')

# Get all models
all_models = service.get_model_info()
```

**Returns:** `Dict[str, Any]`

## Data Classes

### EmbeddingResult

Result from single embedding generation.

```python
@dataclass
class EmbeddingResult:
    text: str                    # Original text
    embedding: List[float]       # Embedding vector
    model: str                   # Model used
    dimensions: int              # Vector dimensions
    tokens_used: int             # Tokens consumed
    processing_time: float       # Time taken (seconds)
    cached: bool = False         # From cache?
```

### BatchEmbeddingResult

Result from batch embedding generation.

```python
@dataclass
class BatchEmbeddingResult:
    results: List[EmbeddingResult]  # Individual results
    total_tokens: int               # Total tokens used
    total_time: float               # Total time taken
    success_count: int              # Successful embeddings
    error_count: int                # Failed embeddings
    errors: List[str]               # Error messages
```

## Supported Models

### Google Models

| Model | Dimensions | Max Tokens | Cost/1K Tokens |
|-------|------------|------------|----------------|
| `text-embedding-004` | 768 | 2,048 | $0.00001 |
| `textembedding-gecko@003` | 768 | 3,072 | $0.00001 |

### OpenAI Models (via OpenRouter)

| Model | Dimensions | Max Tokens | Cost/1K Tokens |
|-------|------------|------------|----------------|
| `text-embedding-3-small` | 1,536 | 8,191 | $0.00002 |
| `text-embedding-3-large` | 3,072 | 8,191 | $0.00013 |
| `text-embedding-ada-002` | 1,536 | 8,191 | $0.0001 |

## Global Instance

Pre-configured global instance available:

```python
from rag.embedding_service import embedding_service

# Uses Google embeddings by default
result = await embedding_service.generate_embedding("Your text")
```

## Environment Variables

### Required

```bash
GOOGLE_API_KEY=your-google-key          # Primary provider
OPENROUTER_API_KEY=your-openrouter-key  # Fallback provider
```

### Optional

```bash
REDIS_URL=redis://localhost:6379        # Caching
GOOGLE_CLOUD_PROJECT=your-project-id    # Enhanced Google integration
```

## Error Handling

### Common Exceptions

```python
try:
    result = await service.generate_embedding("text")
except Exception as e:
    if "quota" in str(e).lower():
        # Handle quota exceeded
        pass
    elif "invalid" in str(e).lower():
        # Handle invalid API key
        pass
    else:
        # Handle other errors
        pass
```

### Automatic Fallback

Service automatically falls back to OpenRouter if Google fails:

```python
# This automatically tries Google first, then OpenRouter
result = await embedding_service.generate_embedding("text")
```

## Caching

### Redis Caching

Embeddings are automatically cached in Redis if available:

```python
# First call - generates embedding
result1 = await service.generate_embedding("text")
print(result1.cached)  # False

# Second call - from cache
result2 = await service.generate_embedding("text")
print(result2.cached)  # True
```

### Cache Management

```python
# Get cache statistics
stats = service.get_cache_stats()
print(f"Cache available: {stats['cache_available']}")

# Clear cache
service.clear_cache()
```

## Usage Examples

### Basic Usage

```python
import asyncio
from rag.embedding_service import embedding_service

async def main():
    # Single embedding
    result = await embedding_service.generate_embedding(
        "This is a test sentence."
    )
    print(f"Dimensions: {result.dimensions}")
    
    # Batch embeddings
    texts = ["Text 1", "Text 2", "Text 3"]
    batch = await embedding_service.generate_batch_embeddings(texts)
    print(f"Processed: {batch.success_count} embeddings")

asyncio.run(main())
```

### Provider-Specific Usage

```python
# Force Google embeddings
google_service = EmbeddingService(provider='google')
result = await google_service.generate_embedding("text")

# Force OpenAI via OpenRouter
openai_service = EmbeddingService(provider='openai')
result = await openai_service.generate_embedding("text")
```

### Error Handling with Fallback

```python
async def robust_embedding(text):
    try:
        # Try Google first
        service = EmbeddingService(provider='google')
        if service.is_available():
            return await service.generate_embedding(text)
    except Exception as e:
        print(f"Google failed: {e}")
    
    try:
        # Fallback to OpenRouter
        service = EmbeddingService(provider='openai')
        return await service.generate_embedding(text)
    except Exception as e:
        print(f"OpenRouter failed: {e}")
        return None
```

## Performance Tips

1. **Use batch processing** for multiple texts
2. **Enable Redis caching** for repeated texts
3. **Use Google as primary** for cost efficiency
4. **Monitor token usage** to optimize costs
5. **Handle rate limits** gracefully
