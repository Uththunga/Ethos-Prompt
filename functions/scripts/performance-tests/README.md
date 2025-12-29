# Performance Test Suite - README

## Overview

Comprehensive PowerShell-based performance testing suite for the Marketing Agent staging environment.

## Test Scripts

### 1. Run-PerformanceTests.ps1 (Main Runner)
Orchestrates all performance tests and generates comprehensive reports.

**Usage:**
```powershell
.\Run-PerformanceTests.ps1 -Environment staging -Iterations 10 -GenerateReport
```

### 2. Test-ResponseTime.ps1
Measures end-to-end response times across diverse queries with statistical analysis.

**Metrics:**
- Average, Min, Max response times
- P50, P95, P99 percentiles
- Word count validation
- Success rate

### 3. Test-CachePerformance.ps1
Tests intelligent caching system effectiveness with three scenarios:
- Identical query caching
- Semantic similarity caching
- Cache miss baseline

**Metrics:**
- Cache hit speedup
- Cache effectiveness percentage
- First vs subsequent request times

### 4. Test-LatencyBreakdown.ps1
Detailed latency analysis breaking down request phases:
- DNS resolution time
- TTFB (Time To First Byte)
- Content download time
- Processing time

### 5. Test-LoadStress.ps1
High-load stress testing to validate stability and rate limiting.

**Metrics:**
- Throughput (requests/sec)
- Error rate under load
- Rate limit behavior

## Running Tests

**Quick Test (5 iterations):**
```powershell
cd functions\scripts\performance-tests
.\Run-PerformanceTests.ps1 -Iterations 5
```

**Full Test Suite (10 iterations with report):**
```powershell
.\Run-PerformanceTests.ps1 -Iterations 10 -GenerateReport
```

**Individual Test:**
```powershell
.\Test-ResponseTime.ps1 -Iterations 10
.\Test-CachePerformance.ps1
.\Test-LatencyBreakdown.ps1 -Iterations 5
```

## Results

All test results are saved to: `test-results/performance/`

**Files:**
- `response_time_TIMESTAMP.json` - Response time test data
- `cache_performance_TIMESTAMP.json` - Cache analysis data
- `latency_breakdown_TIMESTAMP.json` - Latency breakdown data
- `performance_report_TIMESTAMP.json` - Combined test results
- `*_report.md` - Markdown formatted reports

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| P95 Response Time | < 3 seconds | ✅ |
| Success Rate | 100% | ✅ |
| Cache Effectiveness | > 50% | ✅ |
| Throughput | > 1 req/sec | ✅ |

## Interpreting Results

**Response Times:**
- **Excellent:** P95 < 3s
- **Good:** P95 < 5s
- **Needs Improvement:** P95 > 5s

**Cache Performance:**
- **Excellent:** > 50% speedup
- **Good:** > 20% speedup
- **Needs Optimization:** < 20% speedup

**Throughput:**
- **Good:** ≥ 1 req/sec
- **Acceptable:** ≥ 0.5 req/sec
- **Low:** < 0.5 req/sec

## Troubleshooting

**Rate Limiting Errors:**
- Reduce iterations or add delays between requests
- Check rate limit configuration (default: 10 req/min)

**Timeout Errors:**
- Increase timeout in scripts (default: 60s)
- Check network connectivity
- Verify staging endpoint is responsive

**Permission Errors:**
- Run PowerShell as Administrator
- Check execution policy: `Set-ExecutionPolicy RemoteSigned`

## Requirements

- PowerShell 5.1 or higher
- Network access to staging environment
- Write permissions for test-results directory

## Contact

For issues or questions about performance tests, refer to:
- `MARKETING_AGENT_RUNBOOK.md`
- `marketing_agent_comprehensive_audit_report.md`
