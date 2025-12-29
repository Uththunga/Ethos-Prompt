# Phase 2: Quick Reference Card

**Date**: October 17, 2025  
**Version**: 1.0.0  
**Purpose**: Quick command reference for Phase 2 deployment

---

## 🚀 Quick Start Commands

### Step 1: Run All Tests (30-45 min)

```powershell
# Backend tests
cd d:\react\React-App-000739\Prompt-Library\functions
pytest tests/ -v --cov=src --cov-report=html --cov-report=term-missing

# Frontend tests
cd ..\frontend
npm ci
npm run test:run
npm run test:coverage

# E2E tests
npm run test:e2e
```

**Expected**: 160+ tests pass, >80% coverage

---

### Step 2: Review Results (15-30 min)

```powershell
# Open coverage reports
Start-Process functions\htmlcov\index.html
Start-Process frontend\coverage\index.html

# Check for failures
cd functions
pytest tests/ -v --tb=long --maxfail=1

cd ..\frontend
npm run test:run -- --reporter=verbose
```

**Expected**: All tests passing, no P0/P1 issues

---

### Step 3: Deploy to Staging (30-45 min)

```powershell
# Set project to staging
firebase use staging

# Verify config
firebase functions:config:get --project rag-prompt-library-staging

# Deploy all components
bash scripts/deploy-staging.sh all

# Verify deployment
Start-Process https://rag-prompt-library-staging.web.app
```

**Expected**: Staging deployed and accessible

---

### Step 4: UAT on Staging (2-4 hours)

**Manual Testing Checklist**:
- [ ] Authentication (login, logout, registration)
- [ ] Chat basic conversation
- [ ] Tool: create_prompt
- [ ] Tool: execute_prompt
- [ ] Tool: search_prompts
- [ ] Tool: get_execution_history
- [ ] Tool: analyze_prompt_performance
- [ ] Tool: suggest_improvements
- [ ] Context-aware quick actions
- [ ] Conversation persistence
- [ ] Rate limiting (101 requests)
- [ ] Error handling
- [ ] Accessibility (keyboard navigation)
- [ ] Performance (response time < 5s)

**Expected**: All features working correctly

---

### Step 5: Deploy to Production (30-45 min)

```powershell
# Set environment variables
$env:FIREBASE_API_KEY = "your_api_key"
$env:FIREBASE_AUTH_DOMAIN = "react-app-000730.firebaseapp.com"
$env:FIREBASE_PROJECT_ID = "react-app-000730"
$env:FIREBASE_STORAGE_BUCKET = "react-app-000730.appspot.com"
$env:FIREBASE_MESSAGING_SENDER_ID = "your_sender_id"
$env:FIREBASE_APP_ID = "your_app_id"
$env:OPENROUTER_API_KEY = "your_openrouter_key"

# Set production config
firebase use production
firebase functions:config:set llm.default_model="openai/gpt-4-turbo" --project react-app-000730
firebase functions:config:set openrouter.api_key="YOUR_KEY" --project react-app-000730

# Create backup
gcloud firestore export gs://react-app-000730.appspot.com/backups/$(Get-Date -Format "yyyyMMdd-HHmmss")

# Deploy
bash scripts/deploy-production.sh

# Verify
Start-Process https://react-app-000730.web.app
```

**Expected**: Production deployed and verified

---

### Step 6: Monitor Production (24-48 hours)

```powershell
# Check logs
firebase functions:log --project react-app-000730 --limit 50

# Check console
Start-Process https://console.firebase.google.com/project/react-app-000730/functions/logs
Start-Process https://console.firebase.google.com/project/react-app-000730/performance
Start-Process https://console.firebase.google.com/project/react-app-000730/analytics

# Check costs
Start-Process https://console.cloud.google.com/billing
```

**Expected**: No errors, metrics within acceptable ranges

---

## 🔧 Common Commands

### Firebase CLI

```powershell
# Login
firebase login

# List projects
firebase projects:list

# Switch project
firebase use staging
firebase use production

# View config
firebase functions:config:get

# Set config
firebase functions:config:set key="value"

# View logs
firebase functions:log --limit 50

# Deploy specific components
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### Testing

```powershell
# Backend
cd functions
pytest tests/ -v                          # All tests
pytest tests/ -v --cov                    # With coverage
pytest tests/ -v -k "test_create_prompt"  # Specific test
pytest tests/ -v -m "unit"                # By marker

# Frontend
cd frontend
npm run test                              # Watch mode
npm run test:run                          # Run once
npm run test:coverage                     # With coverage
npm run test:ui                           # UI mode
npm run test:e2e                          # E2E tests
npm run test:e2e -- --headed              # E2E headed mode
npm run test:e2e:debug                    # E2E debug mode
```

### Build & Deploy

```powershell
# Frontend build
cd frontend
npm run build                             # Production build
npm run build:staging                     # Staging build
npm run preview                           # Preview build

# Deployment
bash scripts/deploy-staging.sh all        # Staging (all)
bash scripts/deploy-staging.sh functions  # Staging (functions only)
bash scripts/deploy-production.sh         # Production
```

### Debugging

```powershell
# Backend
cd functions
pytest tests/ -vv --tb=long               # Verbose with full traceback
pytest tests/ --pdb                       # Drop into debugger on failure
python -m pdb src/ai_agent/...            # Debug specific file

# Frontend
cd frontend
npm run test:ui                           # Visual test debugging
npm run test:e2e:debug                    # E2E debugging
npm run dev                               # Dev server with hot reload
```

---

## 🚨 Emergency Procedures

### Rollback Staging

```powershell
firebase use staging
git checkout <previous-commit>
firebase deploy --only functions,hosting --project rag-prompt-library-staging
git checkout main
```

### Rollback Production

```powershell
firebase use production

# Rollback hosting
firebase hosting:clone react-app-000730:PREVIOUS_CHANNEL react-app-000730:live

# Rollback functions
git checkout v1.0.0
firebase deploy --only functions --project react-app-000730
git checkout main

# Restore Firestore (if needed)
gcloud firestore import gs://react-app-000730.appspot.com/backups/BACKUP_TIMESTAMP
```

### Emergency Contacts

- **DevOps Lead**: [Name/Email]
- **Product Owner**: [Name/Email]
- **On-Call Engineer**: [Phone/Slack]

---

## 📊 Success Criteria

### Tests
- ✅ Backend: 95+ tests passing
- ✅ Frontend: 50+ tests passing
- ✅ E2E: 15+ scenarios passing
- ✅ Coverage: >80% for critical paths

### Staging
- ✅ All components deployed
- ✅ Health check passing
- ✅ No errors in logs
- ✅ UAT tests passed

### Production
- ✅ All components deployed
- ✅ Health check passing
- ✅ No errors in logs
- ✅ Smoke tests passed
- ✅ Monitoring enabled

### Monitoring (24-48 hours)
- ✅ Error rate < 1%
- ✅ Response time < 500ms (p95)
- ✅ Costs within budget
- ✅ No critical issues

---

## 🔗 Important URLs

### Staging
- **Frontend**: https://rag-prompt-library-staging.web.app
- **Functions**: https://australia-southeast1-rag-prompt-library-staging.cloudfunctions.net
- **Console**: https://console.firebase.google.com/project/rag-prompt-library-staging

### Production
- **Frontend**: https://react-app-000730.web.app
- **Functions**: https://australia-southeast1-react-app-000730.cloudfunctions.net
- **Console**: https://console.firebase.google.com/project/react-app-000730

### Monitoring
- **Firebase Console**: https://console.firebase.google.com
- **Cloud Console**: https://console.cloud.google.com
- **Billing**: https://console.cloud.google.com/billing

---

## 📚 Documentation Links

- **Full Task List**: `docs/ai-agent/PHASE_2_NEXT_STEPS_TASK_LIST.md`
- **Gap Analysis**: `docs/ai-agent/PHASE_2_GAP_ANALYSIS_REPORT.md`
- **Deployment Guide**: `docs/ai-agent/PHASE_2_DEPLOYMENT_GUIDE.md`
- **Architecture**: `docs/ai-agent/PHASE_2_ARCHITECTURE.md`
- **Security**: `docs/ai-agent/PHASE_2_SECURITY.md`
- **Troubleshooting**: See Section 10 in `PHASE_2_NEXT_STEPS_TASK_LIST.md`

---

## ⚡ Quick Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Tests failing | `pip install -r requirements.txt` (backend)<br>`npm ci` (frontend) |
| Deployment fails | `firebase login`<br>`firebase use <project>` |
| Rate limit error | Wait 1 hour or increase limit in config |
| 401 Unauthorized | Re-authenticate user |
| Missing env vars | `firebase functions:config:set key="value"` |
| Index not found | Wait 5-15 min for index build |
| Cold start timeout | Increase timeout in `firebase.json` |

---

## 📞 Support

For detailed troubleshooting, see:
- **Section 10** in `PHASE_2_NEXT_STEPS_TASK_LIST.md`
- **Deployment Guide**: `PHASE_2_DEPLOYMENT_GUIDE.md`

For urgent issues:
- Check Firebase Console logs
- Review error messages in browser DevTools
- Contact on-call engineer

---

**Last Updated**: October 17, 2025  
**Version**: 1.0.0  
**Status**: Ready for Use

