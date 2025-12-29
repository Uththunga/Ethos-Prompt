# Phase 5: Staging Deployment Guide

**Date**: October 17, 2025  
**Project**: EthosPrompt (RAG Prompt Library)  
**Target**: Firebase Hosting Preview Channel (Staging)  
**Status**: Ready for Execution (Requires Firebase CLI and Authentication)

---

## 📋 Prerequisites

### 1. Firebase CLI Installation

Verify Firebase CLI is installed and accessible:

```bash
firebase --version
```

If not installed, install via npm:

```bash
npm install -g firebase-tools
```

### 2. Firebase Authentication

Authenticate with Firebase:

```bash
firebase login
```

Or use a CI token (if deploying from CI/CD):

```bash
firebase login:ci
# Save the token and use: firebase deploy --token <TOKEN>
```

### 3. Project Configuration

Verify project aliases in `.firebaserc`:

```json
{
  "projects": {
    "default": "rag-prompt-library",
    "staging": "rag-prompt-library-staging",
    "production": "rag-prompt-library"
  }
}
```

**Note**: Current configuration shows `staging` project as `rag-prompt-library-staging`. Verify this project exists in Firebase Console.

---

## 🚀 Deployment Steps

### Step 1: Set Environment Variables

Ensure `OPENROUTER_USE_MOCK=true` for any automated tests during deployment:

```bash
# PowerShell (Windows)
$env:OPENROUTER_USE_MOCK='true'

# Bash (Linux/macOS)
export OPENROUTER_USE_MOCK=true
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm ci
```

### Step 3: Build Frontend for Staging

```bash
npm run build
```

**Expected Output**:
- Build completes without errors
- `frontend/dist/` directory created with optimized assets

**Verification**:

```bash
# Check dist directory exists
ls dist/

# Expected files: index.html, assets/, vite.svg, etc.
```

### Step 4: Configure Staging Environment Variables (Functions)

Set Firebase Functions configuration for staging:

```bash
firebase use staging

firebase functions:config:set \
  openrouter.api_key="sk-or-v1-staging-key" \
  llm.default_model="x-ai/grok-2-1212:free" \
  rate_limit.max_requests="100" \
  app.environment="staging" \
  app.log_level="debug"
```

**Note**: Replace `sk-or-v1-staging-key` with actual staging API key from OpenRouter.

### Step 5: Deploy to Staging Hosting Channel

Deploy frontend to a preview channel:

```bash
firebase hosting:channel:deploy staging --expires 30d
```

**Expected Output**:

```
✔  Deploy complete!

Channel URL (staging): https://rag-prompt-library-staging--staging-<hash>.web.app
Expires: <30 days from now>
```

**Alternative**: If using the staging project directly (not a preview channel):

```bash
firebase deploy --only hosting --project rag-prompt-library-staging
```

### Step 6: Deploy Backend Functions (Optional)

If backend functions need to be deployed to staging:

```bash
firebase deploy --only functions --project rag-prompt-library-staging
```

**Note**: This deploys Node.js Cloud Functions. Python FastAPI endpoints are deployed separately (see Cloud Run deployment if applicable).

### Step 7: Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes --project rag-prompt-library-staging
```

---

## 🧪 Smoke Tests

After deployment, run manual smoke tests on the staging URL.

### Test Checklist

- [ ] **Homepage loads**: Navigate to staging URL, verify homepage renders
- [ ] **Login works**: Test Firebase Auth login flow
- [ ] **Dashboard loads**: After login, verify dashboard page loads
- [ ] **Chat panel opens**: Click chat icon, verify DashboardChatPanel opens
- [ ] **Send test message**: Send "Hello" message, verify response received
- [ ] **Quick actions work**: Test context-aware quick actions on dashboard
- [ ] **Navigation works**: Test routing between dashboard pages
- [ ] **Responsive design**: Test on mobile viewport (Chrome DevTools)
- [ ] **No console errors**: Open DevTools Console, verify no critical errors

### Automated Smoke Test (Optional)

Run Playwright E2E tests against staging:

```bash
cd frontend
PLAYWRIGHT_BASE_URL=<staging-url> npm run test:e2e -- --project=chromium
```

---

## 📊 Monitoring Setup

### 1. Enable Firebase Performance Monitoring

In Firebase Console:
1. Navigate to **Performance** tab
2. Enable Performance Monitoring
3. Verify SDK is initialized in frontend code (already configured)

### 2. Configure Error Tracking

In Firebase Console:
1. Navigate to **Crashlytics** or integrate **Sentry**
2. Verify error tracking is active
3. Set up alert rules for critical errors

### 3. Set Up Cost Alerts

In Google Cloud Console:
1. Navigate to **Billing** > **Budgets & alerts**
2. Create budget alert for staging project
3. Set threshold: $50/month (adjust as needed)
4. Add email notification

### 4. Monitor Function Logs

View Cloud Functions logs:

```bash
firebase functions:log --project rag-prompt-library-staging --limit 50
```

Or in Firebase Console:
1. Navigate to **Functions** tab
2. Click on function name
3. View **Logs** tab

---

## 🔐 Security Checklist

- [ ] Firestore security rules deployed and tested
- [ ] Storage security rules deployed (if using Cloud Storage)
- [ ] CORS configured correctly in Cloud Functions
- [ ] API keys stored in Firebase config (not in code)
- [ ] Rate limiting enabled (100 requests/hour per user)
- [ ] HTTPS enforced (Firebase Hosting default)
- [ ] CSP headers configured (see `firebase.json`)

---

## 📝 Documentation

### Create Staging Deployment Log

Document deployment details in `docs/ai-agent/PHASE_5_STAGING_DEPLOYMENT_LOG.md`:

```markdown
# Staging Deployment Log

**Date**: <deployment-date>
**Git Commit**: <commit-hash>
**Deployed By**: <your-name>
**Staging URL**: <staging-url>

## Deployment Summary
- Frontend: Deployed to Firebase Hosting preview channel
- Backend: Functions deployed to staging project
- Database: Firestore rules and indexes deployed

## Test Credentials
- Test User 1: test1@example.com / <password>
- Test User 2: test2@example.com / <password>

## Known Issues
- None

## Next Steps
- Proceed to UAT (Phase 6)
```

---

## 🐛 Troubleshooting

### Issue: Firebase CLI not found

**Solution**: Install Firebase CLI globally:

```bash
npm install -g firebase-tools
```

### Issue: Authentication failed

**Solution**: Re-authenticate:

```bash
firebase logout
firebase login
```

### Issue: Build fails with TypeScript errors

**Solution**: Fix TypeScript errors before building:

```bash
cd frontend
npm run type-check
```

### Issue: Deployment fails with "Project not found"

**Solution**: Verify project exists and you have access:

```bash
firebase projects:list
firebase use staging
```

### Issue: Functions deployment fails

**Solution**: Check function logs for errors:

```bash
firebase functions:log --project rag-prompt-library-staging
```

---

## ✅ Success Criteria

Staging deployment is successful when:

- [x] Frontend deployed to staging URL
- [x] Backend functions deployed (if applicable)
- [x] Firestore rules and indexes deployed
- [x] Smoke tests pass (all checklist items)
- [x] No critical errors in console or logs
- [x] Monitoring and alerts configured
- [x] Deployment documented

---

## 🎯 Next Steps

After successful staging deployment:

1. **Create test accounts** for UAT (Phase 6)
2. **Notify stakeholders** of staging URL
3. **Proceed to Phase 6**: User Acceptance Testing
4. **Monitor staging** for 24-48 hours before UAT

---

**Document Version**: 1.0  
**Status**: Ready for Execution  
**Next Phase**: Phase 6 - User Acceptance Testing

