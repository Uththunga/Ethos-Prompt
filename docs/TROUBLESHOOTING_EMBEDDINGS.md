# Embedding Service Troubleshooting Guide

## 🔧 Common Issues and Solutions

### 1. API Key Issues

#### ❌ "Google API key not available"

**Symptoms:**
- Service shows as unavailable
- Embeddings fail to generate
- Error: "Google API key not available"

**Solutions:**

1. **Check Environment Variable**
   ```bash
   # Test if key is set
   python -c "import os; print('GOOGLE_API_KEY:', 'SET' if os.getenv('GOOGLE_API_KEY') else 'NOT SET')"
   ```

2. **Verify .env File**
   ```bash
   # Check .env file
   grep GOOGLE_API_KEY .env
   
   # Should show:
   GOOGLE_API_KEY=AIza...your-actual-key
   ```

3. **Test Key Validity**
   ```bash
   cd functions
   python test_google_api_live.py
   ```

4. **Common Fixes**
   ```bash
   # Fix 1: Reload environment
   source .env  # Linux/Mac
   # Or restart terminal/IDE
   
   # Fix 2: Check key format
   # Should start with "AIza"
   # Should be ~39 characters long
   
   # Fix 3: Regenerate key
   # Go to https://aistudio.google.com/
   # Create new API key
   ```

#### ❌ "Invalid API key"

**Symptoms:**
- 401 Unauthorized errors
- "API key not valid" messages

**Solutions:**

1. **Verify Key Permissions**
   - Go to Google AI Studio
   - Check API key restrictions
   - Ensure Generative Language API is enabled

2. **Test Key Manually**
   ```bash
   curl -H "Authorization: Bearer $GOOGLE_API_KEY" \
        "https://generativelanguage.googleapis.com/v1beta/models"
   ```

3. **Regenerate Key**
   - Delete old key in Google AI Studio
   - Create new key
   - Update .env file

### 2. Service Availability Issues

#### ❌ "Service not available"

**Symptoms:**
- `service.is_available()` returns `False`
- Embeddings fail silently

**Diagnostic Steps:**

1. **Check Service Status**
   ```python
   from rag.embedding_service import EmbeddingService
   
   service = EmbeddingService(provider='google')
   print(f"Available: {service.is_available()}")
   print(f"API Key: {'SET' if service.google_api_key else 'NOT SET'}")
   ```

2. **Test Both Providers**
   ```python
   # Test Google
   google_service = EmbeddingService(provider='google')
   print(f"Google available: {google_service.is_available()}")
   
   # Test OpenRouter fallback
   openai_service = EmbeddingService(provider='openai')
   print(f"OpenRouter available: {openai_service.is_available()}")
   ```

3. **Check Dependencies**
   ```bash
   pip list | grep -E "(google|openai|requests)"
   
   # Should show:
   # google-cloud-aiplatform
   # google-generativeai
   # openai
   # requests
   ```

### 3. Embedding Generation Failures

#### ❌ "Failed to generate embedding"

**Symptoms:**
- `generate_embedding()` returns `None`
- Timeout errors
- Network connection issues

**Solutions:**

1. **Check Text Input**
   ```python
   # Test with simple text
   result = await service.generate_embedding("Hello world")
   
   # Check text length
   text = "your long text..."
   if len(text) > 8000:  # Approximate token limit
       print("Text too long, consider chunking")
   ```

2. **Test Network Connectivity**
   ```bash
   # Test Google API endpoint
   curl -I https://generativelanguage.googleapis.com/
   
   # Test OpenRouter endpoint
   curl -I https://openrouter.ai/
   ```

3. **Enable Debug Logging**
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   
   # Run embedding generation
   result = await service.generate_embedding("test")
   ```

#### ❌ "Quota exceeded" / Rate Limiting

**Symptoms:**
- 429 Too Many Requests errors
- "Quota exceeded" messages
- Slow response times

**Solutions:**

1. **Check Quota Usage**
   - Go to Google AI Studio
   - Check usage dashboard
   - Monitor rate limits

2. **Implement Backoff**
   ```python
   import asyncio
   
   async def generate_with_backoff(text, max_retries=3):
       for attempt in range(max_retries):
           try:
               return await service.generate_embedding(text)
           except Exception as e:
               if "quota" in str(e).lower() or "rate" in str(e).lower():
                   wait_time = 2 ** attempt
                   await asyncio.sleep(wait_time)
               else:
                   raise e
       return None
   ```

3. **Use Fallback**
   ```python
   # Automatic fallback to OpenRouter
   try:
       result = await google_service.generate_embedding(text)
   except Exception:
       result = await openai_service.generate_embedding(text)
   ```

### 4. Performance Issues

#### ❌ Slow Embedding Generation

**Symptoms:**
- Generation takes > 5 seconds
- Timeouts in production
- High latency

**Solutions:**

1. **Use Batch Processing**
   ```python
   # Instead of individual calls
   results = []
   for text in texts:
       result = await service.generate_embedding(text)  # Slow
       results.append(result)
   
   # Use batch processing
   batch_result = await service.generate_batch_embeddings(texts)  # Fast
   ```

2. **Enable Caching**
   ```bash
   # Set Redis URL
   export REDIS_URL="redis://localhost:6379"
   
   # Or in .env file
   REDIS_URL=redis://localhost:6379
   ```

3. **Optimize Text Processing**
   ```python
   # Remove unnecessary whitespace
   text = " ".join(text.split())
   
   # Limit text length
   if len(text) > 2000:  # characters
       text = text[:2000]
   ```

#### ❌ High Memory Usage

**Symptoms:**
- Memory leaks
- Out of memory errors
- Slow performance

**Solutions:**

1. **Process in Chunks**
   ```python
   async def process_large_dataset(texts, chunk_size=100):
       for i in range(0, len(texts), chunk_size):
           chunk = texts[i:i + chunk_size]
           batch_result = await service.generate_batch_embeddings(chunk)
           # Process results immediately
           yield batch_result.results
   ```

2. **Clear Cache Periodically**
   ```python
   # Clear embedding cache
   service.clear_cache()
   
   # Or clear specific patterns
   service.clear_cache("embedding:old-model:*")
   ```

### 5. Integration Issues

#### ❌ Document Processing Failures

**Symptoms:**
- Document processing pipeline fails
- Embeddings not stored in vector database
- Inconsistent results

**Solutions:**

1. **Check Document Processor Config**
   ```python
   from rag.document_processor import DocumentProcessingPipeline
   
   processor = DocumentProcessingPipeline()
   print(f"Embedding model: {processor.config['embedding_model']}")
   
   # Should be: text-embedding-004
   ```

2. **Test Pipeline Components**
   ```python
   # Test embedding service
   from rag.embedding_service import embedding_service
   result = await embedding_service.generate_embedding("test")
   print(f"Service working: {result is not None}")
   
   # Test vector store
   from rag.vector_store import vector_store
   print(f"Vector store available: {vector_store.is_available()}")
   ```

#### ❌ Dimension Mismatch

**Symptoms:**
- Vector database errors
- "Dimension mismatch" errors
- Search results inconsistent

**Solutions:**

1. **Check Vector Dimensions**
   ```python
   # Google embeddings: 768 dimensions
   google_result = await google_service.generate_embedding("test")
   print(f"Google dimensions: {google_result.dimensions}")  # 768
   
   # OpenAI embeddings: 1536 dimensions
   openai_result = await openai_service.generate_embedding("test")
   print(f"OpenAI dimensions: {openai_result.dimensions}")  # 1536
   ```

2. **Update Vector Store Config**
   ```python
   # Configure for Google embeddings
   VECTOR_CONFIG = {
       'dimension': 768,  # Google text-embedding-004
       'metric': 'cosine',
       'index_type': 'IVF'
   }
   ```

3. **Migration Strategy**
   ```python
   # Gradual migration approach
   # 1. Create new index for Google embeddings
   # 2. Migrate documents gradually
   # 3. Switch search to new index
   # 4. Delete old index
   ```

### 6. Cache Issues

#### ❌ Redis Connection Failures

**Symptoms:**
- "Failed to connect to Redis" warnings
- No caching working
- Repeated API calls for same text

**Solutions:**

1. **Check Redis Status**
   ```bash
   # Test Redis connection
   redis-cli ping
   
   # Should return: PONG
   ```

2. **Verify Redis URL**
   ```python
   import os
   print(f"Redis URL: {os.getenv('REDIS_URL')}")
   
   # Should be: redis://localhost:6379
   ```

3. **Test Cache Manually**
   ```python
   import redis
   
   try:
       r = redis.from_url(os.getenv('REDIS_URL'))
       r.ping()
       print("Redis connection successful")
   except Exception as e:
       print(f"Redis connection failed: {e}")
   ```

### 7. Debugging Tools

#### Debug Script

```python
#!/usr/bin/env python3
"""
Comprehensive debugging script for embedding service
"""
import os
import sys
import asyncio
from dotenv import load_dotenv

load_dotenv()
sys.path.append('src')

async def debug_embedding_service():
    print("🔍 Embedding Service Debug Report")
    print("=" * 50)
    
    # 1. Environment Check
    print("\n1. Environment Variables:")
    env_vars = ['GOOGLE_API_KEY', 'OPENROUTER_API_KEY', 'REDIS_URL']
    for var in env_vars:
        value = os.getenv(var)
        status = "✅ SET" if value else "❌ NOT SET"
        print(f"   {status} {var}")
    
    # 2. Service Availability
    print("\n2. Service Availability:")
    try:
        from rag.embedding_service import EmbeddingService
        
        google_service = EmbeddingService(provider='google')
        openai_service = EmbeddingService(provider='openai')
        
        print(f"   ✅ Google available: {google_service.is_available()}")
        print(f"   ✅ OpenRouter available: {openai_service.is_available()}")
    except Exception as e:
        print(f"   ❌ Service check failed: {e}")
    
    # 3. Test Embedding Generation
    print("\n3. Embedding Generation Test:")
    try:
        from rag.embedding_service import embedding_service
        
        result = await embedding_service.generate_embedding("Debug test")
        if result:
            print(f"   ✅ Embedding generated: {result.dimensions} dimensions")
        else:
            print("   ❌ Embedding generation failed")
    except Exception as e:
        print(f"   ❌ Embedding test failed: {e}")
    
    # 4. Cache Test
    print("\n4. Cache Test:")
    try:
        import redis
        redis_url = os.getenv('REDIS_URL')
        if redis_url:
            r = redis.from_url(redis_url)
            r.ping()
            print("   ✅ Redis connection successful")
        else:
            print("   ⚠️ Redis URL not set")
    except Exception as e:
        print(f"   ❌ Redis connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_embedding_service())
```

#### Quick Test Commands

```bash
# Quick service test
python -c "
import asyncio
import sys
sys.path.append('src')
from rag.embedding_service import embedding_service
result = asyncio.run(embedding_service.generate_embedding('test'))
print('✅ Working' if result else '❌ Failed')
"

# Check environment
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
keys = ['GOOGLE_API_KEY', 'OPENROUTER_API_KEY']
for key in keys:
    print(f'{key}: {\"SET\" if os.getenv(key) else \"NOT SET\"}')
"

# Test API connectivity
curl -s -o /dev/null -w "%{http_code}" \
  "https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_API_KEY"
```

## 🆘 Getting Help

### Support Resources

1. **Test Scripts**
   - `functions/test_google_api_live.py` - Live API testing
   - `functions/test_google_embeddings_integration.py` - Integration testing

2. **Documentation**
   - `docs/google-embeddings-migration.md` - Complete guide
   - `docs/API_REFERENCE_EMBEDDINGS.md` - API documentation

3. **Logs and Monitoring**
   - Enable debug logging: `logging.basicConfig(level=logging.DEBUG)`
   - Check service health: `service.is_available()`
   - Monitor usage: `service.get_cache_stats()`

### Emergency Contacts

- **Google AI Studio**: https://aistudio.google.com/
- **OpenRouter Support**: https://openrouter.ai/
- **Redis Documentation**: https://redis.io/docs/
