# Phase 2: Deployment Guide

**Date**: October 17, 2025  
**Version**: 1.0.0  
**Status**: Ready for Deployment

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Cost Tracking](#cost-tracking)
7. [Rollback Procedures](#rollback-procedures)
8. [Post-Deployment Validation](#post-deployment-validation)

---

## 🔍 Pre-Deployment Checklist

### Code Quality
- [x] All tests passing (backend: 95+ tests, frontend: 50+ tests)
- [x] Linting passed (ESLint, Prettier)
- [x] Type checking passed (TypeScript strict mode)
- [x] Code review completed
- [x] Documentation updated

### Security
- [ ] Environment variables configured
- [ ] API keys rotated (if needed)
- [ ] Firestore security rules tested
- [ ] Rate limiting configured
- [ ] Authentication flows tested

### Performance
- [ ] Frontend bundle size < 200KB (gzipped)
- [ ] Lighthouse score > 90
- [ ] API response time < 500ms (p95)
- [ ] Cold start time < 2s

### Testing
- [x] Unit tests: 95+ tests passing
- [x] Integration tests: 10+ tests passing
- [x] E2E tests: 15+ scenarios covered
- [ ] UAT completed on staging

---

## ⚙️ Environment Configuration

### 1. Firebase Functions Environment Variables

Set environment variables using Firebase CLI:

```bash
# OpenRouter API Configuration
firebase functions:config:set \
  openrouter.api_key="YOUR_OPENROUTER_API_KEY" \
  openrouter.base_url="https://openrouter.ai/api/v1" \
  --project react-app-000730

# Default Model (use :free for testing, paid for production)
firebase functions:config:set \
  llm.default_model="x-ai/grok-2-1212:free" \
  --project react-app-000730

# Rate Limiting
firebase functions:config:set \
  rate_limit.max_requests="100" \
  rate_limit.window_hours="1" \
  --project react-app-000730

# Environment
firebase functions:config:set \
  app.environment="production" \
  app.log_level="warn" \
  --project react-app-000730

# Feature Flags
firebase functions:config:set \
  features.prompt_library_agent="true" \
  features.marketing_agent="true" \
  features.cost_tracking="true" \
  --project react-app-000730

# Cost Alerts
firebase functions:config:set \
  cost.alert_threshold_usd="10.00" \
  cost.alert_email="your-email@example.com" \
  --project react-app-000730
```

### 2. Verify Configuration

```bash
# View all config
firebase functions:config:get --project react-app-000730

# Test locally with emulator
firebase emulators:start --only functions
```

### 3. Frontend Environment Variables

Create `frontend/.env.production`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=react-app-000730.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=react-app-000730
VITE_FIREBASE_STORAGE_BUCKET=react-app-000730.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=https://australia-southeast1-react-app-000730.cloudfunctions.net
VITE_ENVIRONMENT=production
```

---

## 🚀 Staging Deployment

### 1. Deploy to Staging

```bash
# Run deployment script
./scripts/deploy-staging.sh

# Or manually:
cd frontend
npm run build
cd ..
firebase hosting:channel:deploy staging --expires 30d --project react-app-000730
firebase deploy --only functions,firestore --project react-app-000730
```

### 2. Staging URL

**Staging URL**: https://rag-prompt-library-staging.web.app/

### 3. Staging Validation

Test the following on staging:

#### Authentication
- [ ] User signup
- [ ] User login
- [ ] Password reset
- [ ] Logout

#### Prompt Library Agent
- [ ] Open chat panel
- [ ] Send message
- [ ] Receive response
- [ ] Context-aware quick actions
- [ ] Tool execution (create_prompt, search_prompts, etc.)
- [ ] Conversation persistence
- [ ] Clear conversation
- [ ] Rate limiting

#### Error Handling
- [ ] Network errors
- [ ] Authentication errors
- [ ] Rate limit errors
- [ ] Server errors

#### Performance
- [ ] Page load time < 3s
- [ ] Chat response time < 5s
- [ ] No console errors

---

## 🌐 Production Deployment

### 1. Pre-Production Checklist

- [ ] All staging tests passed
- [ ] UAT completed and approved
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Team notified of deployment

### 2. Deploy to Production

```bash
# Run deployment script
./scripts/deploy-production.sh

# Or manually:
cd frontend
npm run build
cd ..
firebase deploy --project react-app-000730
```

### 3. Production URL

**Production URL**: https://react-app-000730.web.app/

### 4. Post-Deployment Validation

Immediately after deployment:

1. **Smoke Tests** (5 minutes)
   - [ ] Homepage loads
   - [ ] Login works
   - [ ] Dashboard loads
   - [ ] Chat panel opens
   - [ ] Send test message

2. **Critical Path Tests** (15 minutes)
   - [ ] Create prompt
   - [ ] Execute prompt
   - [ ] Search prompts
   - [ ] View execution history
   - [ ] Analyze performance

3. **Monitor Logs** (30 minutes)
   - [ ] Check Firebase Console for errors
   - [ ] Monitor function execution logs
   - [ ] Check for rate limit violations
   - [ ] Verify API costs

---

## 📊 Monitoring Setup

### 1. Firebase Performance Monitoring

Already configured in `frontend/src/config/firebase.ts`.

Monitor:
- Page load times
- API response times
- Network requests
- Custom traces

**Dashboard**: https://console.firebase.google.com/project/react-app-000730/performance

### 2. Cloud Functions Monitoring

Monitor in Firebase Console:
- Function invocations
- Execution time
- Memory usage
- Error rate

**Dashboard**: https://console.firebase.google.com/project/react-app-000730/functions

### 3. Error Tracking (Sentry - Optional)

If using Sentry, configure in `functions/src/config.py`:

```python
import sentry_sdk

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    environment="production",
    traces_sample_rate=0.1,
)
```

### 4. Custom Metrics

Log custom metrics in Cloud Functions:

```python
from firebase_functions import logger

logger.info("Prompt Library Chat", extra={
    "user_id": user_id,
    "conversation_id": conversation_id,
    "tokens_used": tokens_used,
    "cost_usd": cost_usd,
    "model": model,
    "tool_calls": len(tool_calls),
})
```

### 5. Alerts

Set up alerts in Google Cloud Console:

1. **High Error Rate**: > 5% error rate for 5 minutes
2. **High Latency**: p95 > 5s for 5 minutes
3. **High Cost**: Daily cost > $10
4. **Rate Limit Violations**: > 10 violations per hour

---

## 💰 Cost Tracking

### 1. OpenRouter Cost Monitoring

Track costs in `functions/src/ai_agent/common/cost_tracker.py`:

```python
class CostTracker:
    def track_usage(self, user_id: str, tokens: int, cost: float):
        # Log to Firestore
        db.collection('usage_metrics').add({
            'user_id': user_id,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'tokens': tokens,
            'cost_usd': cost,
        })
```

### 2. Daily Cost Reports

Create a scheduled function to send daily cost reports:

```python
@scheduler.on_schedule(schedule="0 0 * * *")  # Daily at midnight
def send_daily_cost_report(event):
    # Calculate daily costs
    # Send email report
    pass
```

### 3. Cost Optimization

- Use `:free` models for testing
- Implement caching for repeated queries
- Set token limits per request
- Monitor and optimize prompt sizes

---

## 🔄 Rollback Procedures

### 1. Immediate Rollback (< 5 minutes)

If critical issues are detected:

```bash
# Rollback hosting to previous version
firebase hosting:rollback --project react-app-000730

# Rollback functions (deploy previous version)
git checkout <previous-tag>
firebase deploy --only functions --project react-app-000730
```

### 2. Database Rollback

If Firestore data is corrupted:

```bash
# Restore from backup (if available)
# Contact Firebase support for assistance
```

### 3. Partial Rollback

Disable specific features using feature flags:

```bash
firebase functions:config:set \
  features.prompt_library_agent="false" \
  --project react-app-000730

firebase deploy --only functions --project react-app-000730
```

---

## ✅ Post-Deployment Validation

### 1. Automated Tests

Run E2E tests against production:

```bash
cd frontend
npm run test:e2e:prod
```

### 2. Manual Testing

Test critical user flows:
- [ ] User signup and login
- [ ] Prompt creation
- [ ] Prompt execution
- [ ] Chat with Prompt Library Agent
- [ ] Document upload (if applicable)

### 3. Performance Validation

- [ ] Run Lighthouse audit (score > 90)
- [ ] Check Core Web Vitals
- [ ] Monitor API response times

### 4. User Acceptance Testing (UAT)

- [ ] Invite beta users to test
- [ ] Collect feedback
- [ ] Monitor user behavior
- [ ] Track error rates

---

## 📞 Support & Escalation

### Issue Severity Levels

**P0 - Critical**: Service down, data loss
- Response time: Immediate
- Action: Rollback immediately

**P1 - High**: Major feature broken, high error rate
- Response time: < 1 hour
- Action: Investigate and fix or rollback

**P2 - Medium**: Minor feature broken, low error rate
- Response time: < 4 hours
- Action: Fix in next deployment

**P3 - Low**: Cosmetic issues, minor bugs
- Response time: < 24 hours
- Action: Add to backlog

### Contact Information

- **Firebase Console**: https://console.firebase.google.com/project/react-app-000730
- **OpenRouter Dashboard**: https://openrouter.ai/dashboard
- **GitHub Repository**: [Your repo URL]

---

## 📝 Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] Staging tested and approved
- [ ] Team notified

### Deployment
- [ ] Deploy to staging
- [ ] Run staging validation
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor logs for 30 minutes

### Post-Deployment
- [ ] Run automated tests
- [ ] Perform manual testing
- [ ] Check performance metrics
- [ ] Monitor error rates
- [ ] Update documentation

---

**End of Deployment Guide**

