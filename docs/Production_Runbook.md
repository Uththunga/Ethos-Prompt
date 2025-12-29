# 🚨 Production Runbook
## React RAG Application - Operational Procedures

**Version**: 1.0.0  
**Last Updated**: 2025-07-24  
**On-Call Contact**: [Insert current on-call information]

---

## 🎯 Quick Reference

### Emergency Contacts
- **Critical Issues**: [Phone] / [Email]
- **Escalation**: [Manager Phone] / [Email]
- **Slack Channel**: #alerts-critical

### Key URLs
- **Production App**: https://react-rag-app.web.app
- **Health Check**: https://australia-southeast1-react-rag-app.cloudfunctions.net/health
- **Analytics Dashboard**: https://react-rag-app.web.app/analytics
- **Firebase Console**: https://console.firebase.google.com/project/react-rag-app

### Critical Thresholds
- **Response Time**: >5 seconds (P95)
- **Error Rate**: >5%
- **Availability**: <99.9%
- **Daily Cost**: >$50 USD

---

## 🚨 Incident Response Procedures

### 1. Service Down (Critical)
**Symptoms**: Health checks failing, 5xx errors, complete unavailability

**Immediate Actions** (0-5 minutes):
1. **Acknowledge Alert**
   ```bash
   # Check service status
   curl -f https://australia-southeast1-react-rag-app.cloudfunctions.net/health
   ```

2. **Check Firebase Console**
   - Navigate to Functions tab
   - Check function status and logs
   - Look for deployment issues

3. **Verify External Dependencies**
   ```bash
   # Test Google API
   curl -H "x-goog-api-key: $GOOGLE_API_KEY" \
        "https://generativelanguage.googleapis.com/v1beta/models"
   
   # Test OpenRouter API
   curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
        "https://openrouter.ai/api/v1/models"
   ```

**Investigation** (5-15 minutes):
1. **Check Recent Deployments**
   ```bash
   firebase functions:log --limit 50
   ```

2. **Review Error Patterns**
   - Check function logs for stack traces
   - Identify common error messages
   - Look for quota exhaustion

3. **Test Individual Components**
   ```bash
   # Test detailed health check
   curl https://australia-southeast1-react-rag-app.cloudfunctions.net/health_detailed
   ```

**Resolution** (15-30 minutes):
1. **Rollback if Recent Deployment**
   ```bash
   # Restore from backup
   firebase deploy --only functions --project production
   ```

2. **Restart Functions** (if needed)
   ```bash
   # Redeploy current version
   firebase functions:delete functionName
   firebase deploy --only functions:functionName
   ```

3. **Activate Fallback** (if API issues)
   - Temporarily disable Google API
   - Route all traffic to OpenRouter

**Communication**:
- Update #alerts-critical channel
- Post status page update
- Notify stakeholders if >30 min outage

---

### 2. High Error Rate (Warning)
**Symptoms**: Error rate >5%, increased 4xx/5xx responses

**Investigation**:
1. **Check Error Distribution**
   ```bash
   # Review recent errors
   firebase functions:log --limit 100 | grep ERROR
   ```

2. **Identify Error Types**
   - Authentication failures (401)
   - Rate limiting (429)
   - Server errors (500)
   - Timeout errors (504)

3. **Check API Quotas**
   ```bash
   # Monitor Google API usage
   curl -H "x-goog-api-key: $GOOGLE_API_KEY" \
        "https://generativelanguage.googleapis.com/v1beta/models" \
        -w "Response: %{http_code}\n"
   ```

**Resolution**:
- **Rate Limiting**: Implement backoff strategy
- **API Quota**: Switch to fallback provider
- **Authentication**: Check Firebase Auth configuration
- **Timeouts**: Optimize function performance

---

### 3. Slow Response Times (Warning)
**Symptoms**: P95 latency >5 seconds, user complaints

**Investigation**:
1. **Check Performance Metrics**
   ```bash
   # Get detailed health check
   curl https://australia-southeast1-react-rag-app.cloudfunctions.net/health_detailed
   ```

2. **Identify Bottlenecks**
   - Database query performance
   - API call latency
   - Function cold starts
   - Memory/CPU usage

3. **Monitor Resource Usage**
   - Check function memory allocation
   - Review concurrent execution limits
   - Analyze database performance

**Resolution**:
- **Cold Starts**: Implement keep-alive pings
- **Database**: Optimize queries and indexing
- **Memory**: Increase function memory allocation
- **Concurrency**: Adjust concurrent execution limits

---

### 4. API Quota Exhaustion (Warning)
**Symptoms**: Google API quota >90%, fallback activation

**Investigation**:
1. **Check Current Usage**
   ```bash
   # Review usage metrics
   curl https://australia-southeast1-react-rag-app.cloudfunctions.net/usage_metrics
   ```

2. **Analyze Usage Patterns**
   - Unusual traffic spikes
   - Inefficient API calls
   - Retry loops

**Resolution**:
1. **Immediate**: Activate OpenRouter fallback
2. **Short-term**: Implement rate limiting
3. **Long-term**: Optimize embedding requests

---

## 🔧 Maintenance Procedures

### Daily Health Checks
```bash
#!/bin/bash
# daily_health_check.sh

echo "🏥 Daily Health Check - $(date)"
echo "================================"

# Check main health endpoint
echo "Testing main health endpoint..."
curl -f https://australia-southeast1-react-rag-app.cloudfunctions.net/health || echo "❌ Health check failed"

# Check detailed health
echo "Testing detailed health endpoint..."
curl -f https://australia-southeast1-react-rag-app.cloudfunctions.net/health_detailed || echo "❌ Detailed health failed"

# Check usage metrics
echo "Checking usage metrics..."
curl -f https://australia-southeast1-react-rag-app.cloudfunctions.net/usage_metrics || echo "❌ Usage metrics failed"

# Check recent errors
echo "Checking recent errors..."
firebase functions:log --limit 20 | grep ERROR | wc -l

echo "✅ Daily health check complete"
```

### Weekly Performance Review
```bash
#!/bin/bash
# weekly_performance_review.sh

echo "📊 Weekly Performance Review - $(date)"
echo "======================================"

# Get performance metrics
curl -s https://australia-southeast1-react-rag-app.cloudfunctions.net/usage_metrics?hours=168 > weekly_metrics.json

# Analyze key metrics
echo "Analyzing performance trends..."
python3 << EOF
import json
with open('weekly_metrics.json', 'r') as f:
    data = json.load(f)

summary = data.get('summary', {})
print(f"Total Embeddings: {summary.get('total_embeddings_generated', 0)}")
print(f"Total Cost: \${summary.get('total_cost_usd', 0):.2f}")
print(f"Error Rate: {summary.get('error_rate', 0)*100:.2f}%")
print(f"Total Requests: {summary.get('total_api_requests', 0)}")
EOF

echo "✅ Weekly performance review complete"
```

### Monthly Security Audit
```bash
#!/bin/bash
# monthly_security_audit.sh

echo "🔐 Monthly Security Audit - $(date)"
echo "=================================="

# Check for hardcoded secrets
echo "Scanning for hardcoded secrets..."
grep -r "AIza\|sk-" functions/ --exclude-dir=node_modules || echo "✅ No hardcoded secrets found"

# Verify CORS configuration
echo "Checking CORS configuration..."
curl -H "Origin: https://malicious-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://australia-southeast1-react-rag-app.cloudfunctions.net/health

# Check SSL certificate
echo "Verifying SSL certificate..."
openssl s_client -connect react-rag-app.web.app:443 -servername react-rag-app.web.app < /dev/null 2>/dev/null | openssl x509 -noout -dates

echo "✅ Monthly security audit complete"
```

---

## 📊 Monitoring Commands

### Check System Status
```bash
# Quick status check
curl -s https://australia-southeast1-react-rag-app.cloudfunctions.net/health | jq '.status'

# Detailed status with metrics
curl -s https://australia-southeast1-react-rag-app.cloudfunctions.net/health_detailed | jq '.'

# Check readiness
curl -s https://australia-southeast1-react-rag-app.cloudfunctions.net/health_ready | jq '.ready'
```

### Monitor Performance
```bash
# Get current usage metrics
curl -s https://australia-southeast1-react-rag-app.cloudfunctions.net/usage_metrics | jq '.summary'

# Check provider statistics
curl -s https://australia-southeast1-react-rag-app.cloudfunctions.net/usage_metrics | jq '.provider_stats'

# Monitor costs
curl -s https://australia-southeast1-react-rag-app.cloudfunctions.net/usage_metrics | jq '.summary.total_cost_usd'
```

### Check Logs
```bash
# Recent function logs
firebase functions:log --limit 50

# Error logs only
firebase functions:log --limit 100 | grep ERROR

# Specific function logs
firebase functions:log --only generate_embeddings --limit 20
```

---

## 🔄 Deployment Procedures

### Standard Deployment
```bash
#!/bin/bash
# deploy_production.sh

echo "🚀 Production Deployment"
echo "======================="

# Pre-deployment checks
echo "Running pre-deployment tests..."
cd functions
python -m pytest tests/ -v || exit 1

# Backup current deployment
echo "Creating deployment backup..."
BACKUP_DIR="deployment_backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r functions "$BACKUP_DIR/"

# Deploy to production
echo "Deploying to production..."
firebase deploy --only functions --project production

# Post-deployment verification
echo "Verifying deployment..."
sleep 30
curl -f https://australia-southeast1-react-rag-app.cloudfunctions.net/health || exit 1

echo "✅ Deployment successful"
```

### Emergency Rollback
```bash
#!/bin/bash
# emergency_rollback.sh

echo "🚨 Emergency Rollback"
echo "===================="

# Find latest backup
LATEST_BACKUP=$(ls -t deployment_backups/ | head -1)
echo "Rolling back to: $LATEST_BACKUP"

# Restore functions
rm -rf functions
cp -r "deployment_backups/$LATEST_BACKUP/functions" .

# Deploy previous version
firebase deploy --only functions --project production --force

echo "✅ Rollback complete"
```

---

## 🔧 Troubleshooting Guide

### Common Issues

#### Issue: Function Cold Starts
**Symptoms**: First request takes >3 seconds
**Solution**:
```bash
# Implement keep-alive
curl https://australia-southeast1-react-rag-app.cloudfunctions.net/health
```

#### Issue: Memory Exhaustion
**Symptoms**: Function crashes, out of memory errors
**Solution**:
1. Increase function memory in firebase.json
2. Optimize data processing
3. Implement streaming for large files

#### Issue: API Rate Limiting
**Symptoms**: 429 errors, quota exceeded
**Solution**:
1. Implement exponential backoff
2. Switch to fallback provider
3. Optimize request patterns

#### Issue: Database Connection Timeout
**Symptoms**: Firestore timeout errors
**Solution**:
1. Check Firestore rules
2. Optimize query patterns
3. Implement connection pooling

---

## 📞 Escalation Procedures

### Level 1: On-Call Engineer (0-15 minutes)
- Acknowledge alert
- Initial investigation
- Apply standard fixes

### Level 2: Team Lead + DevOps (15-30 minutes)
- Complex troubleshooting
- Architecture decisions
- Resource allocation

### Level 3: Engineering Manager (30-60 minutes)
- Cross-team coordination
- External vendor escalation
- Business impact assessment

### Level 4: Executive Team (>60 minutes)
- Customer communication
- Business continuity decisions
- Post-incident review

---

## 📋 Post-Incident Procedures

### Immediate (0-2 hours)
1. Confirm service restoration
2. Update status page
3. Internal communication
4. Preliminary timeline

### Short-term (2-24 hours)
1. Detailed incident analysis
2. Root cause identification
3. Temporary fixes validation
4. Customer communication

### Long-term (1-7 days)
1. Post-incident review meeting
2. Action items assignment
3. Process improvements
4. Documentation updates

---

**This runbook should be reviewed and updated monthly. Keep it accessible to all on-call engineers and ensure procedures are tested regularly.**
