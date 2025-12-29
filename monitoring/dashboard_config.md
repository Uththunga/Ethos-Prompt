# Monitoring Dashboard Configuration
# EthosPrompt Marketing Agent - Intelligent Caching

**Platform:** Google Cloud Monitoring
**Auto-refresh:** 1 minute
**Time Range:** Last 1 hour (adjustable)

---

## Dashboard 1: Performance Overview

**Purpose:** Real-time performance monitoring for marketing agent

### Widgets:

#### 1. Key Metrics (Scorecard Row)
- **Average TTFT**
  - Metric: `custom.googleapis.com/marketing_agent/ttft`
  - Target: < 1000ms
  - Alert: > 5000ms

- **Cache Hit Rate**
  - Metric: `custom.googleapis.com/marketing_agent/cache_hit_rate`
  - Target: > 60%
  - Alert: < 30%

- **Error Rate**
  - Metric: Cloud Run error ratio
  - Target: < 1%
  - Alert: > 2%

- **Active Instances**
  - Metric: `run.googleapis.com/container/instance_count`
  - Current value

#### 2. Latency Chart (Line Chart)
- **P50 Latency** (blue line)
- **P95 Latency** (orange line)
- **P99 Latency** (red line)
- Metric: `run.googleapis.com/request_latencies`
- Time: Last 1 hour
- Y-axis: milliseconds (log scale)

#### 3. Cache Performance (Stacked Area)
- **Cache Hits** (green)
- **Cache Misses** (yellow)
- **PII Rejections** (red)
- Metric: Custom metrics from logs
- Calculation: Count by message type

#### 4. Request Volume (Line Chart)
- **Total Requests**(blue)
- **Successful** (green)
- **Failed** (red)
- Metric: `run.googleapis.com/request_count`
- Grouping: By response_code_class

#### 5. Resource Utilization (2-column)
**CPU Usage:**
- Metric: `run.googleapis.com/container/cpu/utilization`
- Format: Percentage
- Alert: > 80%

**Memory Usage:**
- Metric: `run.googleapis.com/container/memory/utilization`
- Format: Percentage
- Alert: > 85%

---

## Dashboard 2: Cache Analytics

**Purpose:** Deep dive into caching performance

### Widgets:

#### 1. Cache Hit Rate Over Time (Line Chart)
- **Overall Hit Rate** (primary line)
- **By Page Context** (multiple lines)
  - pricing
  - services
  - support
- Time: Last 24 hours
- Target line at 60%

#### 2. Cache Statistics (Table)
| Metric | Count | Percentage |
|--------|-------|------------|
| Total Cache Attempts | X | 100% |
| Successful Caches | X | X% |
| PII Rejections | X | X% |
| Quality Rejections | X | X% |
| Cache Hits | X | X% |
| Cache Misses | X | X% |

#### 3. Semantic Similarity Hits (Gauge)
- Queries matched via embedding similarity
- Target: > 20% of cache hits
- Metric: Custom from logs

#### 4. Top Cached Queries (Table)
| Query (Truncated) | Hit Count | Last Hit |
|-------------------|-----------|----------|
| "What are your..." | 147 | 2 min ago |
| "How much does..." | 89 | 5 min ago |
| "Tell me about..." | 56 | 1 min ago |

#### 5. Cache Storage (Pie Chart)
- **Cached Responses**: 1,234 entries
- **Storage Used**: 45 MB
- **Average Response Size**: 36 KB

---

## Dashboard 3: Cost & ROI

**Purpose:** Track cost savings and ROI

### Widgets:

#### 1. LLM API Calls (Line Chart - Cost Impact)
- **Before Caching** (baseline - dashed)
- **With Caching** (current - solid)
- Metric: Count of Watsonx API calls
- Show savings area in green

#### 2. Cost Breakdown (Stacked Bar)
- **Watsonx API**: $XXX (60% reduction)
- **Firestore**: $XX (new)
- **Cloud Run**: $XX (+$30 for min-instances)
- **Total**: $XXX (50% reduction)

#### 3. Tokens Saved (Scorecard)
- **Tokens Saved This Month**
  - Calculation: (Cache Hits × Avg Tokens)
  - Display: XXX,XXX tokens
  - Cost Savings: $XXX

#### 4. ROI Calculator (Table)
| Metric | Value |
|--------|-------|
| Baseline Cost (30 days) | $500 |
| Current Cost (30 days) | $200 |
| Savings | $300 (60%) |
| Implementation Cost | $0 (labor only) |
| Payback Period | Immediate |

---

## Dashboard 4: Security & Compliance

**Purpose:** Monitor PII protection and GDPR compliance

### Widgets:

#### 1. PII Detection (Count - Alert if 0)
- **PII Detected in Queries**
  - Count: XX per hour
  - Color: Green if > 0 (proves detection works)

- **PII in Responses (Should be 0!)**
  - Count: Should always be 0
  - Alert: Red if > 0

#### 2. Security Events Timeline
- PII detection events
- Cache invalidation requests
- Admin API access
- GDPR data requests

#### 3. GDPR Requests (Table)
| Type | Count (30 days) | Avg Response Time |
|------|-----------------|-------------------|
| Data Access | XX | X hours |
| Data Deletion | XX | X hours |
| Data Export | XX | X hours |

#### 4. Cache Consent Rate (Gauge)
- Users who consented to caching
- Target: > 90% (once implemented)

---

## Alert Policies

### Critical Alerts (PagerDuty)

**1. High Error Rate**
```yaml
condition: error_rate > 5%
duration: 1 minute
notification: pagerduty + slack
severity: critical
```

**2. Service Down**
```yaml
condition: uptime_check_failed
duration: 2 minutes
notification: pagerduty + email + sms
severity: critical
```

**3. PII Leak**
```yaml
condition: pii_in_cached_response > 0
duration: immediate
notification: pagerduty + email (security team)
severity: critical
action: auto_rollback
```

### High Priority Alerts (Slack + Email)

**4. High Latency**
```yaml
condition: p95_latency > 10000ms
duration: 5 minutes
notification: slack + email
severity: high
```

**5. Cache Failure**
```yaml
condition: cache_hit_rate < 30%
duration: 15 minutes
notification: slack + email
severity: high
```

**6. Resource Exhaustion**
```yaml
condition: memory_utilization > 90%
duration: 5 minutes
notification: slack + email
severity: high
```

### Medium Priority Alerts (Slack)

**7. Performance Degradation**
```yaml
condition: cache_hit_rate < 50%
duration: 30 minutes
notification: slack
severity: medium
```

**8. Cost Anomaly**
```yaml
condition: daily_cost > 2× baseline
duration: 1 hour
notification: slack + email (finance)
severity: medium
```

---

## Custom Metrics to Log

### Application Metrics

```python
# In code, log these metrics:

# 1. Cache Performance
logger.info("cache_hit", extra={
    "query_hash": hash,
    "similarity_score": 0.87,
    "hit_count": 5,
    "page_context": "pricing"
})

# 2. TTFT Tracking
logger.info("ttft_measured", extra={
    "ttft_ms": 247,
    "cached": True,
    "query_length": 45
})

# 3. PII Detection
logger.info("pii_detected", extra={
    "entity_type": "EMAIL_ADDRESS",
    "redacted": True,
    "query_hash": hash
})

# 4. Quality Metrics
logger.info("quality_validated", extra={
    "quality_score": 0.85,
    "cached": True,
    "rejection_reason": None
})
```

### Export to Cloud Monitoring

```bash
# Create custom metrics
gcloud logging metrics create cache_hit_rate \
  --description="Cache hit rate percentage" \
  --value-extractor='EXTRACT(jsonPayload.cached)'

gcloud logging metrics create ttft \
  --description="Time to first token" \
  --value-extractor='EXTRACT(jsonPayload.ttft_ms)'

gcloud logging metrics create pii_detections \
  --description="PII detection count" \
  --value-extractor='EXTRACT(jsonPayload.entity_type)'
```

---

## Dashboard JSON (Import into Cloud Monitoring)

```json
{
  "displayName": "Marketing Agent - Performance Overview",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 3,
        "height": 2,
        "widget": {
          "title": "Average TTFT",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"custom.googleapis.com/marketing_agent/ttft\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            },
            "sparkChartView": {
              "sparkChartType": "SPARK_LINE"
            },
            "thresholds": [
              {
                "value": 1000,
                "color": "YELLOW"
              },
              {
                "value": 5000,
                "color": "RED"
              }
            ]
          }
        }
      }
    ]
  }
}
```

---

## Grafana Alternative (If Preferred)

### Data Source
- **Type**: Google Cloud Monitoring
- **Project ID**: your-project-id
- **Service Account**: monitoring-reader

### Dashboard Panels
1. TTFT Graph (Time Series)
2. Cache Hit Rate (Stat)
3. Error Rate (Gauge)
4. Request Volume (Bar Gauge)
5. Cost Savings (Table)

---

## Streamlit Dashboard (Python)

For internal team use, create a Streamlit app:

```python
# dashboards/cache_analytics.py
import streamlit as st
from google.cloud import monitoring_v3
from google.cloud import logging

st.title("Marketing Agent - Cache Analytics")

# Realtime metrics
col1, col2, col3 = st.columns(3)
col1.metric("Cache Hit Rate", "67.3%", "+5.2%")
col2.metric("Avg TTFT", "342ms", "-156ms")
col3.metric("Cost Savings", "$347", "+$127")

# Charts
st.line_chart(get_cache_hit_rate_data())
st.bar_chart(get_cost_breakdown())
```

**Run with:**
```bash
streamlit run dashboards/cache_analytics.py
```

---

**Created:** 2025-11-29
**Owner:** DevOps Team
**Review:** Monthly
