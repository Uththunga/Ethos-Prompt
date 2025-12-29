# Marketing Agent Operations Runbook
# Intelligent Caching System

**Service:** EthosPrompt Marketing Agent
**Owner:** DevOps Team
**On-Call:** SRE + Backend Engineer
**Last Updated:** 2025-11-29

---

## Quick Reference

**Service URL:** https://marketing-api-HASH.a.run.app
**Health Check:** https://marketing-api-HASH.a.run.app/health
**Dashboard:** [Cloud Console](https://console.cloud.google.com/run)
**Logs:** `gcloud logging read "resource.type=cloud_run_revision"`
**Alerts:** Slack #marketing-agent-alerts

**Emergency Rollback:**
```bash
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=100 --region=australia-southeast1
```

---

## Common Operations

### 1. Check Service Health

```bash
# Health endpoint
curl https://marketing-api.run.app/health

# Expected:
# {"status": "healthy", "cache_enabled": true, "version": "v2.0"}

# Check metrics
gcloud run services describe marketing-api \
  --region=australia-southeast1 \
  --format="value(status.conditions)"
```

### 2. View Latest Logs

```bash
# Last 50 logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=marketing-api" \
  --limit=50 --format=json

# Filter errors only
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20

# Filter cache hits
gcloud logging read "jsonPayload.message=~'Cache hit'" \
  --limit=10 --freshness=1h
```

### 3. Check Cache Performance

```bash
# Cache hit rate (last hour)
gcloud logging read "jsonPayload.message=~'Cache (hit|miss)'" \
  --format=json --freshness=1h | \
  jq -r '.[] | .jsonPayload.message' | \
  grep -c "Cache hit"

# PII detection count
gcloud logging read "jsonPayload.message=~'PII detected'" \
  --freshness=24h | wc -l
```

### 4. Clear Cache (Emergency)

```bash
# Get admin API key
ADMIN_KEY=$(gcloud secrets versions access latest --secret=admin-api-key)

# Clear all cache
curl -X POST "https://marketing-api.run.app/api/admin/cache/invalidate?key_pattern=all" \
  -H "X-Admin-API-Key: ${ADMIN_KEY}"

# Clear specific context
curl -X POST "https://marketing-api.run.app/api/admin/cache/invalidate?key_pattern=pricing:*" \
  -H "X-Admin-API-Key: ${ADMIN_KEY}"
```

### 5. Scale Service

```bash
# Scale up (more instances)
gcloud run services update marketing-api \
  --max-instances=20 \
  --region=australia-southeast1

# Scale down (cost savings)
gcloud run services update marketing-api \
  --max-instances=5 \
  --region=australia-southeast1

# Keep warm (prevent cold starts)
gcloud run services update marketing-api \
  --min-instances=1 \
  --region=australia-southeast1
```

### 6. Update Environment Variables

```bash
# Update caching settings
gcloud run services update marketing-api \
  --update-env-vars="SIMILARITY_THRESHOLD=0.80,QUALITY_THRESHOLD=0.75" \
  --region=australia-southeast1

# Disable caching (emergency)
gcloud run services update marketing-api \
  --update-env-vars="CACHE_ENABLED=false" \
  --region=australia-southeast1
```

---

## Incident Response Procedures

### Incident: High Error Rate (> 5%)

**Detection:** PagerDuty alert OR Monitoring dashboard

**Immediate Actions (< 5 min):**
1. Check error logs:
   ```bash
   gcloud logging read "severity>=ERROR" --limit=50
   ```

2. Identify error pattern:
   - LLM API errors? → Check Watsonx status
   - Cache errors? → Clear cache
   - Timeout errors? → Increase timeout

3. If critical, execute rollback:
   ```bash
   ./deployment/rollback.sh
   ```

**Root Cause Analysis (< 1 hour):**
1. Export logs for analysis
2. Check recent deployments
3. Review configuration changes
4. Document findings

**Resolution:**
1. Fix identified issue
2. Test in staging
3. Deploy fix
4. Monitor for 1 hour

---

### Incident: Slow Performance (TTFT > 10s)

**Detection:** CloudMonitoring alert OR User complaints

**Diagnosis:**
```bash
# Check P95 latency
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies"' \
  --interval-start-time="15 minutes ago"

# Check cache hit rate
gcloud logging read "jsonPayload.message=~'Cache'" \
  --freshness=15m --format=json
```

**Common Causes & Fixes:**

**1. Low Cache Hit Rate (<30%)**
```bash
# Check cache stats in logs
# Fix: Pre-generate common queries

# Or adjust similarity threshold
gcloud run services update marketing-api \
  --update-env-vars="SIMILARITY_THRESHOLD=0.80"
```

**2. Embedding Model Loading Slow**
```bash
# Check logs for "Loading embedding model"
# Fix: Ensure min-instances=1 (keeps warm)

gcloud run services update marketing-api \
  --min-instances=1
```

**3. Firestore Slow**
```bash
# Check Firestore metrics
# Fix: Ensure indexes exist

gcloud firestore indexes list
```

**4. LLM API Slow**
```bash
# Check Watsonx status page
# Fix: Nothing we can do, wait or use cache
```

---

### Incident: PII Leak in Cache

**Detection:** Alert "PII in cached response > 0"

**CRITICAL - Execute Immediately:**

1. **Rollback (< 1 min):**
   ```bash
   gcloud run services update-traffic marketing-api \
     --to-revisions=marketing-api-blue=100
   ```

2. **Clear Cache (< 1 min):**
   ```bash
   ADMIN_KEY=$(gcloud secrets versions access latest --secret=admin-api-key)
   curl -X POST ".../api/admin/cache/invalidate?key_pattern=all" \
     -H "X-Admin-API-Key: ${ADMIN_KEY}"
   ```

3. **Notify (immediate):**
   - Security team
   - Data protection officer
   - Engineering manager

4. **Investigate (< 1 hour):**
   ```bash
   # Find PII leak
   gcloud logging read "jsonPayload.message=~'PII'" \
     --format=json > pii_leak_evidence.json

   # Check what was cached
   # Review PII detection logic
   ```

5. **Comply (< 24 hours):**
   - Document incident
   - Notify affected users (if applicable)
   - Report to DPO
   - Update procedures

---

### Incident: Cache Corruption

**Symptoms:** Incorrect/stale responses being served

**Fix:**
```bash
# Clear all cache
ADMIN_KEY=$(gcloud secrets versions access latest --secret=admin-api-key)
curl -X POST ".../api/admin/cache/invalidate?key_pattern=all" \
  -H "X-Admin-API-Key: ${ADMIN_KEY}"

# Restart service (clear memory cache)
gcloud run services update marketing-api \
  --update-env-vars="CACHE_VERSION=v2" \
  --region=australia-southeast1
```

---

## Maintenance Procedures

### Weekly Tasks

**Monday Morning (15 min):**
1. Review last week's metrics
   - Cache hit rate
   - Error rate
   - Latency
   - Costs

2. Check alerts
   - Any incidents?
   - False positives?

3. Review top queries
   - New patterns?
   - Pre-generate responses?

### Monthly Tasks

**First Tuesday Monthly (1 hour):**

1. **Cost Review:**
   ```bash
   # Export billing data
   gcloud billing accounts list
   # Analyze trends
   ```

2. **Cache Cleanup:**
   ```bash
   # Check cache size
   # Delete old entries (>30 days handled automatically)
   ```

3. **Security Audit:**
   - Review admin API access logs
   - Check PII detection stats
   - Verify GDPR compliance

4. **Performance Tuning:**
   - Analyze cache miss patterns
   - Adjust similarity threshold if needed
   - Review quality threshold

### Quarterly Tasks

**Quarterly Review (4 hours):**

1. **Comprehensive Audit:**
   - Security review
   - Cost analysis vs budget
   - Performance benchmarks
   - User satisfaction

2. **Optimization:**
   - Identify optimization opportunities
   - Plan improvements
   - Update documentation

3. **Disaster Recovery Test:**
   - Practice rollback procedure
   - Test backup restoration
   - Verify monitoring alerts

---

## Monitoring Checklist

### Daily
- [ ] Check dashboard (1 min)
- [ ] Review error rate (< 1%)
- [ ] Verify cache hit rate (> 60%)
- [ ] Check costs (within budget)

### Weekly
- [ ] Review incidents
- [ ] Analyze trends
- [ ] Update runbook
- [ ] Team sync

### Monthly
- [ ] Cost analysis
- [ ] Security audit
- [ ] Performance review
- [ ] Optimization planning

---

## Troubleshooting Guide

### Problem: "Service Unavailable" (503)

**Cause:** No healthy instances

**Fix:**
```bash
# Check instance count
gcloud run services describe marketing-api \
  --format="value(status.conditions)"

# Force new deployment
gcloud run services update marketing-api \
  --min-instances=1
```

### Problem: "Deadline Exceeded" (504)

**Cause:** Request timeout

**Fix:**
```bash
# Increase timeout
gcloud run services update marketing-api \
  --timeout=600s

# Check for slow queries in logs
gcloud logging read "jsonPayload.ttft_ms>10000" --limit=10
```

### Problem: Cache Always Missing

**Cause:** Embedding model not loading OR similarity threshold too high

**Diagnosis:**
```bash
# Check for embedding errors
gcloud logging read "message=~'embedding'" --limit=20

# Check similarity scores
gcloud logging read "jsonPayload.similarity_score" --limit=10
```

**Fix:**
```bash
# Lower threshold
gcloud run services update marketing-api \
  --update-env-vars="SIMILARITY_THRESHOLD=0.75"
```

### Problem: High Memory Usage

**Cause:** Embedding model + large cache

**Fix:**
```bash
# Increase memory
gcloud run services update marketing-api \
  --memory=8Gi

# Or clear cache
curl -X POST ".../api/admin/cache/invalidate?key_pattern=all"
```

---

## Useful Commands Reference

### Logs
```bash
# Tail logs (real-time)
gcloud logging tail "resource.type=cloud_run_revision"

# Export logs
gcloud logging read "..." --format=json > logs.json

# Count by severity
gcloud logging read "..." | grep -c "ERROR"
```

### Metrics
```bash
# List metrics
gcloud monitoring metrics-descriptors list --filter="resource.type=cloud_run_revision"

# Query specific metric
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"'
```

### Deployment
```bash
# List revisions
gcloud run revisions list --service=marketing-api

# Describe revision
gcloud run revisions describe REVISION_NAME

# Delete old revision
gcloud run revisions delete REVISION_NAME
```

### Secrets
```bash
# List secrets
gcloud secrets list

# Access secret
gcloud secrets versions access latest --secret=SECRET_NAME

# Update secret
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=-
```

---

## Contact Information

### On-Call Escalation

**Level 1: SRE (First Response)**
- Phone: [NUMBER]
- Slack: @sre-oncall
- Response Time: < 15 min

**Level 2: Backend Engineer**
- Phone: [NUMBER]
- Slack: @backend-oncall
- Escalate if: Code changes needed

**Level 3: Engineering Manager**
- Phone: [NUMBER]
- Escalate if: Major incident, rollback decision

**Security Incidents:**
- Security Team: security@example.com
- Data Protection Officer: dpo@example.com
- Immediate escalation for PII leaks

### External Dependencies

**Watsonx Support:**
- Status: https://cloud.ibm.com/status
- Support: IBM Cloud Support Portal

**Google Cloud Support:**
- Support: Google Cloud Console
- Phone: [NUMBER]

---

## Appendices

### A. Environment Variables Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| CACHE_ENABLED | true | Enable/disable caching |
| CACHE_TTL | 2592000 | Cache expiry (seconds) |
| SIMILARITY_THRESHOLD | 0.85 | Semantic match threshold |
| QUALITY_THRESHOLD | 0.7 | Minimum quality score |
| PII_DETECTION_THRESHOLD | 0.5 | PII detection sensitivity |
| MIN_INSTANCES | 1 | Minimum warm instances |
| MAX_INSTANCES | 10 | Maximum instances |

### B. Common Log Patterns

```bash
# Cache hit
"jsonPayload.message": "Cache hit"
"jsonPayload.similarity_score": 0.87

# Cache miss
"jsonPayload.message": "Cache miss"

# PII detected
"jsonPayload.message": "PII detected"
"jsonPayload.entity_type": "EMAIL_ADDRESS"

# Quality rejection
"jsonPayload.message": "Low quality response"
"jsonPayload.quality_score": 0.65
```

### C. Success Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Error Rate | < 1% | > 2% |
| P95 Latency | < 2000ms | > 5000ms |
| Cache Hit Rate | > 60% | < 30% |
| PII Leaks | 0 | > 0 |
| Uptime | 99.9% | < 99% |

---

**Version:** 1.0
**Last Updated:** 2025-11-29
**Next Review:** Monthly
