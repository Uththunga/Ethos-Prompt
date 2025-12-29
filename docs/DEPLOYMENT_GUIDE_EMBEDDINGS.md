# Google Embeddings Deployment Guide

## 🚀 Production Deployment

This guide covers deploying your Google embeddings implementation to production.

## Pre-Deployment Checklist

### ✅ Development Testing
- [ ] Google API key working in development
- [ ] Integration tests passing
- [ ] OpenRouter fallback tested
- [ ] Document processing working
- [ ] Vector storage compatible

### ✅ Environment Setup
- [ ] Production Google API key obtained
- [ ] Environment variables configured
- [ ] Redis cache available (optional)
- [ ] Monitoring setup ready

### ✅ Performance Validation
- [ ] Embedding generation speed acceptable
- [ ] Batch processing working
- [ ] Memory usage optimized
- [ ] Error handling tested

## Environment Configuration

### Production Environment Variables

```bash
# Primary embedding provider
GOOGLE_API_KEY=AIza...your-production-key

# Fallback and LLM providers
OPENROUTER_API_KEY=sk-or-v1-...your-key
COHERE_API_KEY=your-cohere-key
ANTHROPIC_API_KEY=your-anthropic-key

# Infrastructure
PINECONE_API_KEY=your-pinecone-key
REDIS_URL=redis://your-redis-server:6379

# Optional: Enhanced Google Cloud integration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Security Best Practices

1. **API Key Management**
   ```bash
   # Use environment variables, never hardcode
   export GOOGLE_API_KEY="your-key"
   
   # Or use secret management services
   # AWS Secrets Manager, Azure Key Vault, etc.
   ```

2. **Key Rotation**
   ```bash
   # Rotate keys regularly
   # Keep old key active during transition
   # Update all environments simultaneously
   ```

3. **Access Control**
   ```bash
   # Restrict API key permissions in Google AI Studio
   # Monitor usage and set quotas
   # Enable alerts for unusual activity
   ```

## Deployment Platforms

### Firebase Functions

```javascript
// functions/index.js
const functions = require('firebase-functions');

// Set environment variables in Firebase
// firebase functions:config:set google.api_key="your-key"

exports.processDocument = functions.https.onCall(async (data, context) => {
  // Your embedding code here
});
```

**Deploy:**
```bash
# Set environment variables
firebase functions:config:set google.api_key="your-key"
firebase functions:config:set openrouter.api_key="your-key"

# Deploy
firebase deploy --only functions
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Environment variables will be set at runtime
CMD ["python", "main.py"]
```

**Deploy:**
```bash
# Build image
docker build -t rag-embeddings .

# Run with environment variables
docker run -e GOOGLE_API_KEY="your-key" \
           -e OPENROUTER_API_KEY="your-key" \
           rag-embeddings
```

### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-embeddings
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rag-embeddings
  template:
    metadata:
      labels:
        app: rag-embeddings
    spec:
      containers:
      - name: rag-embeddings
        image: rag-embeddings:latest
        env:
        - name: GOOGLE_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: google-api-key
        - name: OPENROUTER_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openrouter-api-key
```

**Deploy:**
```bash
# Create secrets
kubectl create secret generic api-keys \
  --from-literal=google-api-key="your-key" \
  --from-literal=openrouter-api-key="your-key"

# Deploy
kubectl apply -f k8s-deployment.yaml
```

## Performance Optimization

### Caching Strategy

```python
# Production caching configuration
CACHE_CONFIG = {
    'redis_url': 'redis://production-redis:6379',
    'ttl_seconds': 7 * 24 * 3600,  # 7 days
    'max_memory': '2gb',
    'eviction_policy': 'allkeys-lru'
}
```

### Batch Processing

```python
# Optimize batch sizes for production
BATCH_CONFIG = {
    'google_batch_size': 100,      # Google's limit
    'openai_batch_size': 100,      # OpenAI's limit
    'concurrent_batches': 5,       # Parallel processing
    'retry_attempts': 3,           # Error resilience
    'retry_delay': 1.0             # Exponential backoff
}
```

### Connection Pooling

```python
# Configure connection pooling
import aiohttp

async def create_session():
    connector = aiohttp.TCPConnector(
        limit=100,              # Total connection pool size
        limit_per_host=30,      # Per-host connection limit
        ttl_dns_cache=300,      # DNS cache TTL
        use_dns_cache=True,     # Enable DNS caching
    )
    return aiohttp.ClientSession(connector=connector)
```

## Monitoring and Alerting

### Health Checks

```python
# Health check endpoint
async def health_check():
    """Check embedding service health"""
    try:
        # Test Google embeddings
        google_service = EmbeddingService(provider='google')
        google_available = google_service.is_available()
        
        # Test OpenRouter fallback
        openai_service = EmbeddingService(provider='openai')
        openai_available = openai_service.is_available()
        
        return {
            'status': 'healthy' if (google_available or openai_available) else 'unhealthy',
            'google_available': google_available,
            'openrouter_available': openai_available,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }
```

### Metrics Collection

```python
# Metrics to track
METRICS = {
    'embedding_requests_total': 'Counter of embedding requests',
    'embedding_duration_seconds': 'Histogram of embedding generation time',
    'embedding_tokens_total': 'Counter of tokens processed',
    'embedding_errors_total': 'Counter of embedding errors',
    'cache_hits_total': 'Counter of cache hits',
    'cache_misses_total': 'Counter of cache misses',
    'provider_usage': 'Counter by provider (google/openai)',
}
```

### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
- name: embedding_alerts
  rules:
  - alert: EmbeddingServiceDown
    expr: up{job="rag-embeddings"} == 0
    for: 5m
    annotations:
      summary: "Embedding service is down"
      
  - alert: HighEmbeddingLatency
    expr: histogram_quantile(0.95, embedding_duration_seconds) > 5
    for: 10m
    annotations:
      summary: "High embedding generation latency"
      
  - alert: EmbeddingErrorRate
    expr: rate(embedding_errors_total[5m]) > 0.1
    for: 5m
    annotations:
      summary: "High embedding error rate"
```

## Cost Management

### Usage Monitoring

```python
# Track usage and costs
class CostTracker:
    def __init__(self):
        self.usage_stats = {
            'google_tokens': 0,
            'openai_tokens': 0,
            'total_cost': 0.0
        }
    
    def track_usage(self, provider, tokens):
        if provider == 'google':
            self.usage_stats['google_tokens'] += tokens
            cost = tokens * 0.00001 / 1000  # Google pricing
        elif provider == 'openai':
            self.usage_stats['openai_tokens'] += tokens
            cost = tokens * 0.00002 / 1000  # OpenAI pricing
        
        self.usage_stats['total_cost'] += cost
        
        # Log to monitoring system
        logger.info(f"Usage: {provider}, tokens: {tokens}, cost: ${cost:.6f}")
```

### Cost Optimization

1. **Prefer Google**: 50% cheaper than OpenAI
2. **Enable Caching**: Avoid duplicate embeddings
3. **Batch Processing**: More efficient than individual requests
4. **Monitor Quotas**: Set alerts for usage limits
5. **Optimize Text**: Remove unnecessary content before embedding

## Troubleshooting

### Common Issues

1. **API Key Issues**
   ```bash
   # Check key validity
   curl -H "Authorization: Bearer $GOOGLE_API_KEY" \
        "https://generativelanguage.googleapis.com/v1beta/models"
   ```

2. **Rate Limiting**
   ```python
   # Implement exponential backoff
   async def retry_with_backoff(func, max_retries=3):
       for attempt in range(max_retries):
           try:
               return await func()
           except RateLimitError:
               wait_time = 2 ** attempt
               await asyncio.sleep(wait_time)
       raise Exception("Max retries exceeded")
   ```

3. **Memory Issues**
   ```python
   # Process large batches in chunks
   async def process_large_batch(texts, chunk_size=100):
       results = []
       for i in range(0, len(texts), chunk_size):
           chunk = texts[i:i + chunk_size]
           batch_result = await embedding_service.generate_batch_embeddings(chunk)
           results.extend(batch_result.results)
       return results
   ```

## Rollback Plan

### Emergency Rollback

1. **Switch to OpenRouter Only**
   ```bash
   # Temporarily disable Google embeddings
   export GOOGLE_API_KEY=""
   # System will use OpenRouter fallback
   ```

2. **Revert to Previous Version**
   ```bash
   # Git rollback
   git revert <commit-hash>
   
   # Redeploy
   firebase deploy --only functions
   ```

3. **Configuration Rollback**
   ```bash
   # Restore previous embedding model
   # In document_processor.py:
   'embedding_model': 'text-embedding-3-small'  # OpenAI model
   ```

## Post-Deployment Validation

### Validation Checklist

- [ ] Health checks passing
- [ ] Embedding generation working
- [ ] Fallback mechanism tested
- [ ] Performance metrics normal
- [ ] Cost tracking active
- [ ] Alerts configured
- [ ] Documentation updated

### Performance Benchmarks

```bash
# Run performance tests
cd functions
python -m pytest tests/test_performance.py -v

# Expected results:
# - Embedding generation: < 2 seconds
# - Batch processing: < 5 seconds for 100 texts
# - Cache hit rate: > 80%
# - Error rate: < 1%
```

## Success Metrics

Track these KPIs post-deployment:

- **Cost Reduction**: 50% savings vs OpenAI
- **Availability**: > 99.9% uptime
- **Performance**: < 2s average embedding time
- **Error Rate**: < 1% failed requests
- **Cache Hit Rate**: > 80% for repeated content
