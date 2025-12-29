# Blue/Green Deployment Strategy for Watsonx Optimization

**Service:** EthosPrompt Marketing Agent
**Feature:** Intelligent Caching with Semantic Similarity
**Strategy:** Zero-downtime deployment with instant rollback capability

---

## Overview

Blue/Green deployment allows us to:
- Deploy new caching features with zero downtime
- Test in production with 0% traffic before cutover
- Instantly rollback if issues detected
- Minimize risk to users

---

## Architecture

```
┌──────────────┐
│ Cloud Load   │
│  Balancer    │
└──────┬───────┘
       │
       ├─── Traffic Split ───┐
       │                     │
  ┌────▼─────┐         ┌────▼─────┐
  │  BLUE    │         │  GREEN   │
  │ (Current │         │  (New    │
  │  v1.0)   │         │   v2.0)  │
  └──────────┘         └──────────┘
   • No cache          • With cache
   • Stable            • Testing
```

---

## Deployment Steps

### Phase 1: Pre-Deployment (30 min)

**1. Create Green Environment**
```bash
# Deploy new revision WITH caching
gcloud run deploy marketing-api-green \
  --source functions \
  --region australia-southeast1 \
  --min-instances 1 \
  --max-instances 10 \
  --cpu-boost \
  --timeout 300s \
  --set-env-vars="CACHE_ENABLED=true,CACHE_TTL=2592000,SIMILARITY_THRESHOLD=0.85" \
  --no-traffic  # Critical: No traffic yet!
```

**2. Verify Green Deployment**
```bash
# Get green URL
GREEN_URL=$(gcloud run services describe marketing-api-green \
  --region=australia-southeast1 \
  --format='value(status.url)')

# Health check
curl "${GREEN_URL}/health"

# Test cache functionality
curl -X POST "${GREEN_URL}/api/ai/marketing-chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your pricing plans?"}'
```

### Phase 2: Canary Testing (2 hours)

**Stage 1: 5% Traffic (30 min)**
```bash
# Split traffic: 95% blue, 5% green
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=95,marketing-api-green=5 \
  --region=australia-southeast1
```

**Monitor:**
- Error rate < 2%
- Average TTFT < 5s
- Cache hit rate > 20%

**Stage 2: 25% Traffic (30 min)**
```bash
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=75,marketing-api-green=25
```

**Monitor:**
- Error rate < 1.5%
- Cache hit rate > 30%
- No PII leaks (check logs)

**Stage 3: 50% Traffic (60 min)**
```bash
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=50,marketing-api-green=50
```

**Monitor:**
- Cost reduction visible
- User satisfaction metrics
- Cache performance stats

### Phase 3: Full Cutover (15 min)

**100% Traffic to Green**
```bash
# Full cutover
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-green=100

# Keep blue for 24h before deleting
```

### Phase 4: Verification (1 hour)

**Check Metrics:**
```bash
# Cache hit rate
gcloud logging read "resource.type=cloud_run_revision AND \
  jsonPayload.message=~'Cache hit'" --limit 1000 --format json

# Average TTFT
gcloud monitoring time series list \
  --filter='metric.type="run.googleapis.com/request_latencies"'
```

**Success Criteria:**
- ✅ Error rate < 1%
- ✅ Average TTFT < 1s (80% cached)
- ✅ Cache hit rate > 60%
- ✅ No PII in cached responses
- ✅ Cost reduction > 50%

---

## Rollback Procedure

**Instant Rollback (< 1 minute)**
```bash
# Emergency rollback to blue
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=100 \
  --region=australia-southeast1

# Clear cache to prevent stale data
# (via admin endpoint)
curl -X POST https://marketing-api-blue.run.app/api/admin/cache/invalidate?key_pattern=all \
  -H "X-Admin-API-Key: ${ADMIN_API_KEY}"
```

**Rollback Triggers:**
- Error rate > 2% for 5 minutes
- TTFT > 10s (performance regression)
- PII detected in cache
- Cache hit rate < 50% (caching broken)
- User complaints spike

---

## Monitoring During Deployment

**Real-Time Dashboard:**
```bash
# Open Cloud Console
open "https://console.cloud.google.com/run/detail/australia-southeast1/marketing-api/metrics"
```

**Key Metrics to Watch:**
1. **Error Rate** - Must stay < 2%
2. **P95 Latency** - Should decrease with caching
3. **Request Count** - Validate traffic split
4. **Cache Hit Rate** - From application logs
5. **PII Detection Rate** - Should be > 0 (proving detection works)

---

## Post-Deployment

**Day 1-7: Monitoring Period**
- Daily cache hit rate review
- Weekly cost analysis
- User feedback collection
- Cache warming (top 100 queries)

**Day 8-30: Optimization**
- Adjust similarity threshold if needed
- Fine-tune quality threshold
- Add more pre-generated responses
- Analyze cache miss patterns

---

## Cleanup (After 24 hours of stable green)

```bash
# Delete blue revision (keep as backup for 1 week)
gcloud run revisions delete marketing-api-blue \
  --region=australia-southeast1
```

---

## Contingency Plans

### Scenario 1: Cache Not Working
**Symptoms:** Hit rate < 10%
**Action:** Rollback, investigate embedding model loading
**Timeline:** Immediate

### Scenario 2: PII Leak Detected
**Symptoms:** PII found in cached response
**Action:** Immediate rollback + cache invalidation
**Timeline:** < 5 minutes
**Follow-up:** Security incident report

### Scenario 3: Performance Degradation
**Symptoms:** TTFT worse than baseline
**Action:** Rollback, analyze bottleneck
**Timeline:** Immediate

### Scenario 4: Firestore Cost Spike
**Symptoms:** Unexpected high Firestore costs
**Action:** Reduce cache TTL, increase quality threshold
**Timeline:** 1 hour

---

## Success Metrics

**Immediate (Week 1):**
- Zero production incidents
- Error rate < 1%
- Cache hit rate > 40%

**Short-term (Month 1):**
- Average TTFT < 1s
- Cache hit rate > 70%
- Cost reduction > 60%

**Long-term (Month 3):**
- Cache hit rate > 80%
- Cost reduction > 75%
- User satisfaction increase measurable

---

## Communication Plan

**Pre-Deployment:**
- Notify team 24h in advance
- Schedule during low-traffic period
- Have rollback team on standby

**During Deployment:**
- Slack updates every 30 min
- Dashboard link shared
- Incident commander assigned

**Post-Deployment:**
- Summary report within 24h
- Metrics dashboard published
- Lessons learned documented

---

**Prepared by:** AI Assistant
**Last Updated:** 2025-11-29
**Review Date:** Before first deployment
