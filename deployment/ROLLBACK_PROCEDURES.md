# Rollback Procedures - Intelligent Caching Deployment

**Service:** EthosPrompt Marketing Agent
**Feature:** Intelligent Caching System
**Last Updated:** 2025-11-29

---

## 🚨 Emergency Rollback (< 1 minute)

### When to Execute

**Execute IMMEDIATELY if any of these occur:**

1. **Critical Errors**
   - Error rate > 5%
   - System completely down
   - PII leak detected in cache
   - Data corruption

2. **Security Issues**
   - Unauthorized cache access
   - PII in cached responses
   - GDPR violation detected

3. **Catastrophic Performance**
   - P95 latency > 30s (10x regression)
   - Complete cache failure (100% misses)
   - Memory/CPU exhaustion

### Emergency Rollback Command

```bash
# ONE-COMMAND ROLLBACK
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=100 \
  --region=australia-southeast1 \
  && curl -X POST https://marketing-api-blue.run.app/api/admin/cache/invalidate?key_pattern=all \
  -H "X-Admin-API-Key: ${ADMIN_API_KEY}"
```

**Expected Time:** < 60 seconds

---

## ⚠️ Standard Rollback (5 minutes)

### Triggers

1. **Error Rate Threshold**
   - Error rate > 2% for 5 minutes
   - Sustained increase in 4xx/5xx errors

2. **Performance Degradation**
   - P95 latency > 10s for 10 minutes
   - P50 latency > 5s
   - TTFT worse than baseline

3. **Cache Issues**
   - Cache hit rate < 50% (indicates caching broken)
   - PII detection rate = 0 (detection not working)
   - Quality rejections > 80% (too conservative)

4. **Cost Spike**
   - Firestore costs > 200% of projected
   - Unexpected resource usage

### Standard Rollback Procedure

**Step 1: Verify Issue (1 min)**
```bash
# Check current metrics
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 50 --format json --freshness=5m

# Check latency
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies"' \
  --interval-start-time="5 minutes ago"
```

**Step 2: Execute Rollback (1 min)**
```bash
# Start rollback
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=100 \
  --region=australia-southeast1
```

**Step 3: Clear Cache (1 min)**
```bash
# Invalidate all cached data to prevent stale/corrupted responses
curl -X POST https://marketing-api-blue.run.app/api/admin/cache/invalidate?key_pattern=all \
  -H "X-Admin-API-Key: ${ADMIN_API_KEY}"
```

**Step 4: Verify Rollback (2 min)**
```bash
# Confirm traffic shifted
gcloud run services describe marketing-api \
  --region=australia-southeast1 \
  --format="value(status.traffic)"

# Test health
curl https://marketing-api.run.app/health

# Test functionality
curl -X POST https://marketing-api.run.app/api/ai/marketing-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your pricing plans?"}'
```

**Step 5: Notify Team (immediate)**
```bash
# Post to Slack
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚨 ROLLBACK EXECUTED - Marketing Agent",
    "attachments": [{
      "color": "danger",
      "fields": [
        {"title": "Reason", "value": "Error rate > 2%", "short": true},
        {"title": "Rollback Time", "value": "'"$(date)"'", "short": true},
        {"title": "Executed By", "value": "'"$USER"'", "short": true}
      ]
    }]
  }'
```

---

## 📊 Gradual Rollback (staged)

### When to Use

- Non-critical issues
- Want to preserve partial functionality
- Testing rollback procedure

### Gradual Rollback Steps

**Stage 1: Reduce to 50% (Safe)**
```bash
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=50,marketing-api-green=50
```
**Monitor for 15 minutes**

**Stage 2: Reduce to 25%**
```bash
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=75,marketing-api-green=25
```
**Monitor for 15 minutes**

**Stage 3: Reduce to 5%**
```bash
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=95,marketing-api-green=5
```
**Monitor for 30 minutes**

**Stage 4: Complete Rollback**
```bash
gcloud run services update-traffic marketing-api \
  --to-revisions=marketing-api-blue=100
```

---

## 🔍 Post-Rollback Actions

### Immediate (Within 1 hour)

1. **Preserve Evidence**
   ```bash
   # Export logs
   gcloud logging read "resource.type=cloud_run_revision AND \
     resource.labels.revision_name=marketing-api-green" \
     --limit=10000 --format json > rollback_logs_$(date +%Y%m%d_%H%M%S).json

   # Export metrics
   gcloud monitoring time-series list \
     --filter='resource.type="cloud_run_revision" AND \
       resource.labels.revision_name="marketing-api-green"' \
     --format json > rollback_metrics_$(date +%Y%m%d_%H%M%S).json
   ```

2. **Create Incident Report**
   - Use template: `incident_reports/TEMPLATE.md`
   - Document timeline
   - Root cause analysis (preliminary)
   - Impact assessment

3. **Notify Stakeholders**
   - Engineering team
   - Product team
   - Customer success (if user-facing)

### Short-term (Within 24 hours)

1. **Root Cause Analysis**
   - Analyze logs and metrics
   - Reproduce issue in staging
   - Document findings

2. **Fix Implementation**
   - Create hotfix branch
   - Implement fix
   - Test thoroughly in staging

3. **Prepare for Redeployment**
   - Update deployment plan
   - Add additional monitoring
   - Schedule new deployment

### Long-term (Within 1 week)

1. **Post-Mortem**
   - Team retrospective
   - Document lessons learned
   - Update runbooks

2. **Process Improvements**
   - Update rollback procedures
   - Enhance monitoring
   - Improve testing

---

## 🎯 Success Criteria After Rollback

**Immediate (< 5 min after rollback):**
- ✅ Traffic 100% on blue (stable) revision
- ✅ Error rate < 1%
- ✅ Latency back to baseline
- ✅ No user-facing errors

**Short-term (1 hour):**
- ✅ All metrics stable
- ✅ No customer complaints
- ✅ Incident report created
- ✅ Team notified

**Follow-up (24 hours):**
- ✅ Root cause identified
- ✅ Fix implemented and tested
- ✅ Redeployment plan created

---

## 📱Contact Information

### Rollback Authority
- **Primary:** Engineering Manager
- **Secondary:** DevOps Lead
- **Emergency:** CTO

### On-Call Team
- **SRE:** [Phone number]
- **Backend Engineer:** [Phone number]
- **DevOps:** [Phone number]

### Communication Channels
- **Slack:** #incident-response
- **Email:** devops@example.com
- **PagerDuty:** [Integration key]

---

## 🧪 Rollback Testing

### Monthly Drill
- Practice emergency rollback
- Time the procedure
- Validate all steps
- Update documentation

### Test Checklist
- [ ] Rollback command works
- [ ] Cache invalidation works
- [ ] Monitoring alerts trigger
- [ ] Team receives notifications
- [ ] Documentation is current

---

## 📋 Rollback Checklist

**Pre-Rollback:**
- [ ] Verify issue is real (check metrics)
- [ ] Get rollback authority approval (if time permits)
- [ ] Notify team of impending rollback

**During Rollback:**
- [ ] Execute rollback command
- [ ] Clear cache
- [ ] Monitor error rate
- [ ] Verify traffic shifted

**Post-Rollback:**
- [ ] Export logs and metrics
- [ ] Create incident report
- [ ] Notify stakeholders
- [ ] Schedule post-mortem

**Follow-up:**
- [ ] Root cause analysis
- [ ] Fix implementation
- [ ] Update procedures
- [ ] Redeployment plan

---

## 🔒 Cache-Specific Rollback Considerations

### Cache State After Rollback

**Option 1: Clear All Cache (Recommended)**
- Ensures no stale/corrupted data
- Clean state for blue revision
- May cause temporary latency spike

**Option 2: Preserve Cache**
- Faster rollback
- Risk of stale data
- Only if cache format unchanged

### PII Leak Response

**If PII detected in cache:**

1. **Immediate Actions (< 1 min)**
   ```bash
   # Emergency rollback
   gcloud run services update-traffic marketing-api \
     --to-revisions=marketing-api-blue=100

   # Clear ALL cache
   curl -X POST .../api/admin/cache/invalidate?key_pattern=all
   ```

2. **Compliance Actions (< 1 hour)**
   - Document incident
   - Notify data protection officer
   - Prepare user notification
   - Review GDPR requirements

3. **Technical Investigation**
   - How did PII bypass detection?
   - Was PII served to users?
   - Fix PII detection logic

---

**Version:** 1.0
**Last Tested:** [Date of last drill]
**Next Review:** Monthly
