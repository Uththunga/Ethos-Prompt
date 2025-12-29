# Load Testing Guide

## Overview

This guide covers load testing strategies, tools, and performance baselines for the RAG Prompt Library project.

## Table of Contents

1. [Setup](#setup)
2. [Running Tests](#running-tests)
3. [Test Scenarios](#test-scenarios)
4. [Performance Baselines](#performance-baselines)
5. [Interpreting Results](#interpreting-results)
6. [Optimization](#optimization)

---

## Setup

### Install Artillery

```bash
npm install -g artillery@latest
```

### Install k6 (Alternative)

```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## Running Tests

### Artillery Tests

#### Basic Test
```bash
cd tests/load
artillery run artillery-config.yml
```

#### With Custom Target
```bash
artillery run --target https://your-app.web.app artillery-config.yml
```

#### Generate HTML Report
```bash
artillery run --output report.json artillery-config.yml
artillery report report.json
```

#### Quick Test (Reduced Duration)
```bash
artillery quick --count 10 --num 100 https://react-app-000730.web.app
```

### k6 Tests

```bash
cd tests/load
k6 run k6-script.js
```

#### With Custom VUs and Duration
```bash
k6 run --vus 50 --duration 5m k6-script.js
```

#### Cloud Test
```bash
k6 cloud k6-script.js
```

---

## Test Scenarios

### 1. Homepage and Authentication (20% weight)
- Load homepage
- Navigate to login
- Access dashboard
- **Expected**: < 500ms response time

### 2. Browse Prompts (30% weight)
- List prompts
- View prompt details
- **Expected**: < 1s response time

### 3. Execute Prompt (25% weight)
- Submit prompt execution
- Poll for results
- **Expected**: < 5s total time (including AI processing)

### 4. Document Upload and RAG (15% weight)
- Upload document
- Process document
- Search documents
- **Expected**: < 10s for upload + processing

### 5. Analytics Dashboard (10% weight)
- Load dashboard data
- Fetch model stats
- Get recommendations
- **Expected**: < 2s response time

---

## Performance Baselines

### Response Time Targets

| Endpoint | p50 | p95 | p99 | Max |
|----------|-----|-----|-----|-----|
| Homepage | 200ms | 500ms | 1s | 2s |
| Prompt List | 300ms | 800ms | 1.5s | 3s |
| Prompt Detail | 250ms | 700ms | 1.2s | 2.5s |
| Prompt Execution | 2s | 5s | 10s | 30s |
| Document Upload | 1s | 3s | 5s | 10s |
| Document Search | 500ms | 1.5s | 3s | 5s |
| Analytics Dashboard | 800ms | 2s | 4s | 8s |
| Model Stats | 400ms | 1s | 2s | 4s |

### Throughput Targets

- **Requests per second**: 100+ RPS
- **Concurrent users**: 500+
- **Error rate**: < 1%
- **Success rate**: > 99%

### Resource Utilization

- **CPU**: < 70% average
- **Memory**: < 80% average
- **Database reads**: < 10,000/min
- **Database writes**: < 1,000/min

---

## Interpreting Results

### Artillery Output

```
Summary report @ 14:23:45(+0000)
  Scenarios launched:  1000
  Scenarios completed: 995
  Requests completed:  4975
  Mean response/sec:   82.92
  Response time (msec):
    min: 45
    max: 3421
    median: 234
    p95: 1245
    p99: 2134
  Scenario counts:
    Browse Prompts: 300 (30%)
    Execute Prompt: 250 (25%)
    Homepage and Auth Flow: 200 (20%)
    Document Upload and RAG: 150 (15%)
    Analytics Dashboard: 100 (10%)
  Codes:
    200: 4850
    201: 50
    401: 25
    429: 30
    500: 20
```

### Key Metrics

1. **Scenarios Completed**: Should be close to launched (> 99%)
2. **Mean Response/sec**: Throughput (target: > 50 RPS)
3. **Response Time p95**: 95% of requests (target: < 2s)
4. **Response Time p99**: 99% of requests (target: < 5s)
5. **Error Codes**: 4xx/5xx errors (target: < 1%)

### Red Flags

🚨 **High Error Rate** (> 5%)
- Check server logs
- Verify rate limiting
- Check database connection pool

🚨 **High p99 Latency** (> 10s)
- Identify slow queries
- Check for N+1 queries
- Review cache hit rates

🚨 **Low Throughput** (< 20 RPS)
- Check server resources
- Review database indexes
- Optimize slow endpoints

---

## Optimization

### 1. Identify Bottlenecks

```bash
# Run test with detailed metrics
artillery run --output report.json artillery-config.yml

# Analyze report
artillery report report.json

# Look for:
# - Slowest endpoints
# - Highest error rates
# - Resource saturation
```

### 2. Database Optimization

```typescript
// Add indexes for slow queries
// See DATABASE_OPTIMIZATION_GUIDE.md

// Example: Add composite index
{
  "collectionGroup": "executions",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

### 3. Caching

```typescript
// Cache frequently accessed data
import { cache_invalidation_service } from '../cache/cache_invalidation_service';

const data = await cache_invalidation_service.get_with_fallback(
  key='expensive-query',
  data_type=DataType.ANALYTICS_AGGREGATES,
  fetch_fn=async () => {
    // Expensive query
    return await fetchData();
  }
);
```

### 4. Rate Limiting

```typescript
// Implement rate limiting for expensive operations
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later'
});

app.post('/api/prompts/execute', limiter, executePrompt);
```

### 5. Connection Pooling

```python
# Increase Firestore connection pool
from google.cloud import firestore

db = firestore.Client(
    project='react-app-000730',
    # Increase pool size for high load
    client_options={'pool_size': 50}
)
```

---

## Continuous Load Testing

### CI/CD Integration

Add to `.github/workflows/load-test.yml`:

```yaml
name: Load Test

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Artillery
        run: npm install -g artillery@latest
      
      - name: Run load test
        run: |
          cd tests/load
          artillery run --output report.json artillery-config.yml
      
      - name: Generate report
        run: artillery report report.json
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: load-test-report
          path: report.html
      
      - name: Check thresholds
        run: |
          # Parse report.json and check thresholds
          # Fail if thresholds exceeded
```

### Monitoring

```typescript
// Set up alerts for performance degradation
import { logMetric } from '../analytics/metrics';

// After load test
const results = parseLoadTestResults();

if (results.p95 > 2000) {
  await logMetric({
    name: 'load_test_threshold_exceeded',
    value: results.p95,
    metadata: { threshold: 2000 }
  });
  
  // Send alert
  await sendAlert({
    title: 'Load Test Threshold Exceeded',
    message: `p95 latency: ${results.p95}ms (threshold: 2000ms)`
  });
}
```

---

## Troubleshooting

### Issue: High Error Rate

**Symptoms**: > 5% 5xx errors

**Solutions**:
1. Check server logs for errors
2. Verify database connection pool size
3. Check for rate limiting
4. Review error handling in code

### Issue: Slow Response Times

**Symptoms**: p95 > 5s

**Solutions**:
1. Identify slow queries with monitoring
2. Add database indexes
3. Implement caching
4. Optimize N+1 queries

### Issue: Low Throughput

**Symptoms**: < 20 RPS

**Solutions**:
1. Increase server resources
2. Optimize database queries
3. Implement connection pooling
4. Use CDN for static assets

### Issue: Memory Leaks

**Symptoms**: Memory usage increases over time

**Solutions**:
1. Profile application with memory profiler
2. Check for unclosed connections
3. Review cache eviction policies
4. Fix circular references

---

## Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [k6 Documentation](https://k6.io/docs/)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)
- [Database Optimization Guide](./DATABASE_OPTIMIZATION_GUIDE.md)
- [Cache Invalidation Guide](./CACHE_INVALIDATION_GUIDE.md)

---

**Last Updated**: 2025-10-04  
**Maintained By**: Development Team

