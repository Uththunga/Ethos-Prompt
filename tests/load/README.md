# Load Testing Guide

This directory contains load testing configurations for the RAG Prompt Library application.

## Prerequisites

Install Artillery:
```bash
npm install -g artillery@latest
```

## Running Load Tests

### Basic Load Test
```bash
artillery run tests/load/load_test.yml
```

### With Custom Target
```bash
artillery run --target https://your-app.web.app tests/load/load_test.yml
```

### Generate HTML Report
```bash
artillery run --output report.json tests/load/load_test.yml
artillery report report.json
```

## Test Scenarios

### 1. Homepage Load (30% weight)
- Tests static page loading
- Measures initial page load time
- Target: < 2s p95

### 2. Authentication Flow (20% weight)
- Tests login endpoint
- Simulates user authentication
- Target: < 1s p95

### 3. Prompt Execution (40% weight)
- Tests core functionality
- Executes prompts with free models
- Target: < 5s p95

### 4. Analytics Dashboard (10% weight)
- Tests analytics queries
- Measures dashboard load time
- Target: < 3s p95

## Load Phases

1. **Warm-up** (60s): 5 requests/sec
2. **Ramp-up** (120s): 10 → 50 requests/sec
3. **Sustained** (300s): 50 requests/sec
4. **Spike** (60s): 100 requests/sec
5. **Cool-down** (60s): 10 requests/sec

## Performance Thresholds

- **Max Error Rate**: 1%
- **P95 Response Time**: < 2s
- **P99 Response Time**: < 5s

## Interpreting Results

### Key Metrics

- **http.response_time**: Response time distribution
  - min, max, median, p95, p99
- **http.codes**: HTTP status code distribution
  - 2xx (success), 4xx (client errors), 5xx (server errors)
- **errors**: Error count and types
- **vusers.created**: Virtual users created
- **vusers.completed**: Virtual users completed

### Success Criteria

✅ **Pass**:
- Error rate < 1%
- P95 < 2000ms
- P99 < 5000ms
- No 5xx errors

❌ **Fail**:
- Error rate > 1%
- P95 > 2000ms
- P99 > 5000ms
- Presence of 5xx errors

## Advanced Usage

### Custom Scenarios

Create a custom scenario file:
```yaml
config:
  target: "https://your-app.web.app"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Custom Test"
    flow:
      - get:
          url: "/api/custom-endpoint"
```

### Environment Variables

```bash
export TARGET_URL="https://staging.web.app"
artillery run --environment staging tests/load/load_test.yml
```

### CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Run Load Tests
  run: |
    npm install -g artillery
    artillery run tests/load/load_test.yml --output report.json
    artillery report report.json
```

## Monitoring During Tests

1. **Firebase Console**: Monitor Cloud Functions metrics
2. **Firestore**: Watch read/write operations
3. **Performance Monitoring**: Track custom traces
4. **Logs**: Check for errors in Cloud Logging

## Troubleshooting

### High Error Rates
- Check Firebase quotas
- Verify API rate limits
- Review Cloud Function logs

### Slow Response Times
- Check cold start times
- Review database indexes
- Optimize query performance

### Connection Timeouts
- Increase timeout in config
- Check network connectivity
- Verify target URL

## Best Practices

1. **Start Small**: Begin with low load and gradually increase
2. **Use Free Models**: Avoid costs during load testing
3. **Monitor Costs**: Track Firebase usage during tests
4. **Clean Up**: Remove test data after completion
5. **Test Staging First**: Validate on staging before production

## Performance Baselines

Document baseline performance:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| P95 Response Time | < 2s | TBD | ⏳ |
| P99 Response Time | < 5s | TBD | ⏳ |
| Error Rate | < 1% | TBD | ⏳ |
| Throughput | 50 req/s | TBD | ⏳ |

Update after each test run.

