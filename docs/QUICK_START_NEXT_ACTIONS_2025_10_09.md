# Quick Start - Next Actions
**RAG Prompt Library Project**

**Date**: 2025-10-09  
**Status**: Ready for immediate action

---

## 🎯 Executive Summary

The RAG Prompt Library has a **strong foundation** (95% complete) with **critical deployment gaps** requiring immediate attention. This guide provides actionable next steps to complete staging deployment and Phase 2 features.

**Current Status**:
- ✅ Phase 1 Complete: Core features production-ready
- ⚠️ Staging Deployment: Configuration exists, verification needed
- 🚧 Phase 2 Features: 40% complete, UI components needed

**Immediate Priority**: Fix CI/CD issues and verify staging deployment (4.5 hours total)

---

## 🚀 Immediate Actions (Today - 30 minutes)

### 1. Fix Project ID Mismatch (5 minutes)

**File**: `.github/workflows/ci.yml`  
**Line**: 148

```yaml
# BEFORE
projectId: react-app-000730

# AFTER
projectId: rag-prompt-library
```

**Commands**:
```bash
# Edit file
code .github/workflows/ci.yml
# Line 148: Change project ID
# Save and commit
git add .github/workflows/ci.yml
git commit -m "fix: correct project ID in ci.yml workflow"
```

---

### 2. Fix Secret Names in ci-cd.yml (10 minutes)

**File**: `.github/workflows/ci-cd.yml`  
**Lines**: 199-210

```yaml
# BEFORE
- name: Setup Firebase Authentication
  run: |
    echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > $HOME/firebase-service-account.json

- name: Set Firebase Functions Environment Variables
  run: |
    firebase functions:config:set \
      openrouter.api_key="${{ secrets.OPENROUTER_API_KEY }}" \

# AFTER
- name: Setup Firebase Authentication
  run: |
    echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}' > $HOME/firebase-service-account.json

- name: Set Firebase Functions Environment Variables
  run: |
    firebase functions:config:set \
      openrouter.api_key="${{ secrets.STAGING_OPENROUTER_KEY }}" \
      app.environment="staging" \
      --project ${{ secrets.STAGING_PROJECT_ID }}
```

**Commands**:
```bash
# Edit file
code .github/workflows/ci-cd.yml
# Update secret names as shown above
# Save and commit
git add .github/workflows/ci-cd.yml
git commit -m "fix: correct secret names for staging deployment"
```

---

### 3. Update Documentation (15 minutes)

**File**: `docs/CRITICAL_GAPS_TEAM_WORKFLOW.md`  
**Section**: Task 1.2 (Lines 147-159)

Add note about Secret Manager vs functions:config:

```markdown
**Note**: The current implementation uses Secret Manager instead of functions:config.
To configure secrets:

```bash
# Option 1: Secret Manager (current implementation)
gcloud secrets create OPENROUTER_API_KEY \
  --data-file=- \
  --project=rag-prompt-library-staging

# Option 2: Functions config (legacy, requires code change)
firebase functions:config:set \
  openrouter.api_key="<KEY>" \
  --project rag-prompt-library-staging
```
```

**Commands**:
```bash
# Edit file
code docs/CRITICAL_GAPS_TEAM_WORKFLOW.md
# Add note in Task 1.2 section
# Save and commit
git add docs/CRITICAL_GAPS_TEAM_WORKFLOW.md
git commit -m "docs: clarify Secret Manager vs functions:config usage"
```

---

### 4. Create PR and Test (15 minutes)

```bash
# Create branch
git checkout -b fix/staging-deployment-issues

# Push changes
git push origin fix/staging-deployment-issues

# Create PR (using GitHub CLI)
gh pr create --title "Fix: Staging deployment CI/CD issues" \
  --body "Fixes project ID mismatch and secret naming inconsistencies for staging deployment"

# Monitor CI/CD workflow
gh pr checks
```

---

## 📋 This Week Actions (4 hours)

### Day 1: Staging Verification (2 hours)

#### 1. Verify Staging Project (30 minutes)

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login and list projects
firebase login
firebase projects:list

# Verify staging project exists
firebase use staging
firebase projects:list --json | jq '.[] | select(.projectId=="rag-prompt-library-staging")'

# Check services enabled
firebase apps:list --project rag-prompt-library-staging
```

**Expected Output**: Staging project exists with all services enabled

---

#### 2. Configure Secret Manager (30 minutes)

```bash
# Set project
gcloud config set project rag-prompt-library-staging

# Create secret
echo -n "sk-or-v1-YOUR_STAGING_KEY" | gcloud secrets create OPENROUTER_API_KEY --data-file=-

# Grant access to Functions
PROJECT_NUMBER=$(gcloud projects describe rag-prompt-library-staging --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding OPENROUTER_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Verify
gcloud secrets versions access latest --secret="OPENROUTER_API_KEY"
```

**Expected Output**: Secret created and accessible

---

#### 3. Create Smoke Test Script (1 hour)

**File**: `scripts/staging-smoke-tests.sh`

```bash
#!/bin/bash
set -e

STAGING_URL="https://australia-southeast1-rag-prompt-library-staging.cloudfunctions.net"
STAGING_WEB="https://rag-prompt-library-staging.web.app"

echo "🧪 Running Staging Smoke Tests..."
echo "============================================"

# 1. Health Check
echo "1️⃣ Health Check..."
HEALTH=$(curl -s -f "$STAGING_URL/api" -H "Content-Type: application/json" -d '{"data":{"endpoint":"health"}}')
echo "✅ Health: $HEALTH"

# 2. OpenRouter Connectivity
echo "2️⃣ OpenRouter Connectivity..."
OPENROUTER=$(curl -s -f "$STAGING_URL/api" -H "Content-Type: application/json" -d '{"data":{"endpoint":"test_openrouter_connection"}}')
echo "✅ OpenRouter: $OPENROUTER"

# 3. Frontend Accessibility
echo "3️⃣ Frontend Accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_WEB")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Frontend accessible: HTTP $HTTP_CODE"
else
  echo "❌ Frontend error: HTTP $HTTP_CODE"
  exit 1
fi

echo ""
echo "✅ Automated smoke tests passed!"
echo "⚠️  Manual tests required for full validation"
```

**Commands**:
```bash
# Create script
touch scripts/staging-smoke-tests.sh
# Copy content above
# Make executable
chmod +x scripts/staging-smoke-tests.sh
# Commit
git add scripts/staging-smoke-tests.sh
git commit -m "feat: add staging smoke test script"
```

---

#### 4. Verify GitHub Secrets (15 minutes)

```bash
# Using GitHub CLI
gh secret list

# Expected output:
# FIREBASE_SERVICE_ACCOUNT_STAGING
# STAGING_PROJECT_ID
# STAGING_OPENROUTER_KEY
# STAGING_FIREBASE_API_KEY

# If missing, add them:
gh secret set FIREBASE_SERVICE_ACCOUNT_STAGING < service-account.json
gh secret set STAGING_PROJECT_ID --body "rag-prompt-library-staging"
gh secret set STAGING_OPENROUTER_KEY --body "sk-or-v1-..."
gh secret set STAGING_FIREBASE_API_KEY --body "AIzaSy..."
```

---

### Day 2: Staging Deployment (2 hours)

#### 1. Deploy Firestore Rules and Indexes (15 minutes)

```bash
firebase deploy --only firestore:rules,firestore:indexes --project rag-prompt-library-staging

# Monitor index build in Firebase Console
# https://console.firebase.google.com/project/rag-prompt-library-staging/firestore/indexes
```

---

#### 2. Deploy Cloud Functions (30 minutes)

```bash
cd functions
npm ci
npm run lint
firebase deploy --only functions --project rag-prompt-library-staging

# Verify health check
curl -X POST https://australia-southeast1-rag-prompt-library-staging.cloudfunctions.net/api \
  -H "Content-Type: application/json" \
  -d '{"data":{"endpoint":"health"}}'
```

**Expected Output**: All functions deployed successfully, health check returns 200 OK

---

#### 3. Deploy Frontend (20 minutes)

```bash
cd frontend
npm ci
npm run build:staging
npm run check:budget
firebase deploy --only hosting --project rag-prompt-library-staging

# Verify
curl -I https://rag-prompt-library-staging.web.app
```

**Expected Output**: Frontend accessible, performance budgets pass

---

#### 4. Run Smoke Tests (30 minutes)

```bash
# Run automated tests
bash scripts/staging-smoke-tests.sh

# Manual tests:
# 1. Visit https://rag-prompt-library-staging.web.app
# 2. Sign up with test email
# 3. Verify email sent
# 4. Log in successfully
# 5. Create a prompt
# 6. Execute prompt with free model
# 7. Verify response received
# 8. Upload a document
# 9. Execute RAG-enabled prompt
# 10. Verify RAG context used
```

**Expected Output**: All automated tests pass, manual tests successful

---

## 📅 Next Sprint Actions (2 weeks)

### Week 1: Phase 2 UI Components (3 days)

#### Day 1: RAG Context Preview UI
- Create `RAGContextPreview` component
- Display retrieved chunks with relevance scores
- Add expand/collapse and keyword highlighting
- Write unit tests

#### Day 2: Execution Rating System
- Create `ExecutionRating` component (thumbs up/down)
- Add optional feedback text area
- Integrate with `submit_rating` Cloud Function
- Write unit and integration tests

#### Day 3: Real-time Analytics Dashboard (Part 1)
- Create `AnalyticsDashboard` component
- Implement real-time Firestore listeners
- Display key metrics (executions, costs, success rate)

---

### Week 2: Phase 2 Completion (2 days)

#### Day 4: Real-time Analytics Dashboard (Part 2)
- Add charts (execution timeline, model usage, cost breakdown)
- Implement 5-second auto-refresh
- Add date range filters
- Write unit and integration tests

#### Day 5: Enhanced Document Management
- Enhance `DocumentUploadZone` with drag-and-drop
- Improve `ProcessingStatus` with detailed progress
- Add document list with search and filters
- Write unit and integration tests

---

### Week 2: Test Coverage Improvement (2 days)

#### Days 6-7: Frontend Test Coverage
- Identify untested components and functions
- Write unit tests for critical paths
- Write integration tests for key user flows
- Achieve 80%+ coverage
- Update CI/CD to enforce coverage thresholds

---

## 📊 Progress Tracking

### Completion Checklist

**Phase 1: Critical Fixes (P0)**
- [ ] Fix project ID mismatch in ci.yml
- [ ] Fix secret names in ci-cd.yml
- [ ] Update documentation for Secret Manager
- [ ] Create PR and verify CI/CD

**Phase 2: Staging Verification (P1)**
- [ ] Verify staging project exists
- [ ] Configure Secret Manager for staging
- [ ] Create comprehensive smoke test script
- [ ] Verify GitHub secrets

**Phase 3: Staging Deployment (P1)**
- [ ] Deploy Firestore rules and indexes
- [ ] Deploy Cloud Functions
- [ ] Deploy frontend
- [ ] Run staging smoke tests

**Phase 4: Phase 2 Features (P2)**
- [ ] Implement RAG context preview UI
- [ ] Implement execution rating system
- [ ] Implement real-time analytics dashboard
- [ ] Enhance document management UI
- [ ] Improve frontend test coverage to 80%+

**Phase 5: Advanced Features (P3)**
- [ ] Implement A/B testing framework
- [ ] Implement cost optimization engine
- [ ] Implement hybrid search enhancement

---

## 🎯 Success Metrics

### Phase 1 Complete
- ✅ All CI/CD workflows passing
- ✅ No project ID or secret naming errors
- ✅ Documentation updated and accurate

### Phase 2 Complete
- ✅ Staging project verified and accessible
- ✅ Secret Manager configured correctly
- ✅ Smoke test script created and passing
- ✅ All GitHub secrets configured

### Phase 3 Complete
- ✅ All components deployed to staging
- ✅ Health checks passing
- ✅ Frontend accessible and functional
- ✅ All smoke tests passing

### Phase 4 Complete
- ✅ All Phase 2 UI components implemented
- ✅ Frontend test coverage ≥ 80%
- ✅ All features tested and documented
- ✅ Performance budgets passing

---

## 📞 Support & Resources

### Documentation
- **Comprehensive Analysis**: `docs/COMPREHENSIVE_CODEBASE_GAP_ANALYSIS_2025_10_09.md`
- **Gap Analysis Report**: `docs/GAP_ANALYSIS_SYSTEMATIC_REPORT_2025_10_08.md`
- **Critical Gaps Workflow**: `docs/CRITICAL_GAPS_TEAM_WORKFLOW.md`

### Key Files
- **CI/CD Workflows**: `.github/workflows/ci.yml`, `.github/workflows/ci-cd.yml`
- **Firebase Config**: `.firebaserc`, `firebase.json`
- **Frontend Config**: `frontend/.env.staging`, `frontend/package.json`
- **Functions**: `functions/index.js`, `functions/main.py`

### Commands Reference
```bash
# Firebase
firebase login
firebase projects:list
firebase use staging
firebase deploy --only functions,hosting,firestore

# Google Cloud
gcloud config set project rag-prompt-library-staging
gcloud secrets create OPENROUTER_API_KEY --data-file=-
gcloud secrets versions access latest --secret="OPENROUTER_API_KEY"

# GitHub
gh secret list
gh secret set SECRET_NAME --body "value"
gh pr create --title "Title" --body "Description"

# Testing
npm run test:ci
npm run test:e2e
bash scripts/staging-smoke-tests.sh
```

---

## 🚨 Troubleshooting

### Issue: Firebase project not found
**Solution**: Verify project exists with `firebase projects:list`, create if needed

### Issue: Secret Manager access denied
**Solution**: Grant IAM permissions to Cloud Functions service account

### Issue: GitHub secrets not working
**Solution**: Verify secret names match exactly in workflows

### Issue: Functions deployment fails
**Solution**: Check Secret Manager configuration, verify dependencies installed

### Issue: Frontend build fails
**Solution**: Check environment variables in `.env.staging`, run `npm ci`

---

**Last Updated**: 2025-10-09  
**Next Review**: After Phase 1 completion  
**Owner**: Full team (DevOps, Backend, Frontend, ML, QA)

