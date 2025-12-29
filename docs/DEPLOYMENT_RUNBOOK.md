# Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the RAG Prompt Library application to production and staging environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Git
- Access to Firebase project (react-app-000730)

### Required Credentials

- Firebase authentication (`firebase login`)
- Firebase project access (Owner or Editor role)
- OpenRouter API key (for Cloud Functions)

### Environment Setup

```bash
# Install dependencies
cd frontend && npm install
cd ../functions && npm install

# Login to Firebase
firebase login

# Select project
firebase use react-app-000730
```

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Bundle size within limits (<1MB)
- [ ] Performance budgets met (Lighthouse score >90)

### Security

- [ ] No secrets in code
- [ ] Firestore security rules updated
- [ ] API keys configured in Firebase environment
- [ ] CORS settings verified
- [ ] Rate limiting configured

### Documentation

- [ ] CHANGELOG.md updated
- [ ] API documentation current
- [ ] README.md reflects latest changes

### Verification Commands

```bash
# Run all checks
cd frontend
npm run lint
npm run type-check
npm run test
npm run build

cd ../functions
npm run lint
npm run test
```

---

## Staging Deployment

### 1. Deploy to Preview Channel

```bash
# Build frontend
cd frontend
npm run build

# Deploy to preview channel
firebase hosting:channel:deploy staging --expires 7d

# Note the preview URL
# Example: https://react-app-000730--staging-xyz.web.app
```

### 2. Deploy Cloud Functions (Staging)

```bash
# Deploy functions with staging config
firebase deploy --only functions --project react-app-000730
```

### 3. Deploy Firestore Rules (Staging)

```bash
firebase deploy --only firestore:rules --project react-app-000730
```

### 4. Run Smoke Tests

```bash
# Set staging URL
export STAGING_URL="https://react-app-000730--staging-xyz.web.app"

# Run smoke tests
python scripts/smoke_tests.py --url $STAGING_URL
```

### 5. Manual Testing

- [ ] Login/logout flow
- [ ] Create and execute prompt
- [ ] Upload document
- [ ] RAG-enabled execution
- [ ] Model comparison
- [ ] Analytics dashboard

---

## Production Deployment

### 1. Create Release Branch

```bash
git checkout main
git pull origin main
git checkout -b release/v1.x.x
```

### 2. Update Version

```bash
# Update package.json version
npm version patch  # or minor, major

# Update CHANGELOG.md
# Add release notes
```

### 3. Build Production Assets

```bash
cd frontend
npm run build

# Verify build
ls -lh dist/
```

### 4. Deploy to Production

```bash
# Deploy all (hosting + functions + rules)
firebase deploy --project react-app-000730

# Or deploy individually:
firebase deploy --only hosting --project react-app-000730
firebase deploy --only functions --project react-app-000730
firebase deploy --only firestore:rules --project react-app-000730
```

### 5. Tag Release

```bash
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
```

### 6. Monitor Deployment

```bash
# Watch function logs
firebase functions:log --project react-app-000730

# Monitor in Firebase Console
# https://console.firebase.google.com/project/react-app-000730
```

---

## Post-Deployment Verification

### Automated Checks

```bash
# Run E2E tests against production
PLAYWRIGHT_BASE_URL=https://react-app-000730.web.app npm run test:e2e

# Run load tests
artillery run tests/load/load_test.yml --target https://react-app-000730.web.app
```

### Manual Verification

#### Critical Paths

1. **Authentication**
   - [ ] Sign up new user
   - [ ] Login existing user
   - [ ] Password reset
   - [ ] Logout

2. **Prompt Management**
   - [ ] Create prompt
   - [ ] Edit prompt
   - [ ] Delete prompt
   - [ ] Execute prompt

3. **RAG Functionality**
   - [ ] Upload document
   - [ ] Process document
   - [ ] Execute RAG-enabled prompt
   - [ ] View RAG context

4. **Model Comparison**
   - [ ] Execute with multiple models
   - [ ] View comparison results
   - [ ] Rate executions

5. **Analytics**
   - [ ] View dashboard
   - [ ] Real-time updates
   - [ ] Export data

### Performance Checks

```bash
# Run Lighthouse
npx lighthouse https://react-app-000730.web.app --view

# Check Core Web Vitals
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1
```

### Monitoring

- [ ] Check Firebase Console for errors
- [ ] Verify Cloud Function execution counts
- [ ] Check Firestore read/write operations
- [ ] Monitor API costs (OpenRouter)
- [ ] Review error logs in Cloud Logging

---

## Rollback Procedures

### Immediate Rollback (Hosting)

```bash
# List recent releases
firebase hosting:releases:list --project react-app-000730

# Rollback to previous release
firebase hosting:rollback --project react-app-000730
```

### Rollback Cloud Functions

```bash
# List function versions
gcloud functions list --project react-app-000730

# Rollback specific function
firebase deploy --only functions:functionName --project react-app-000730
# (Deploy previous version from git)
```

### Rollback Firestore Rules

```bash
# Checkout previous rules
git checkout HEAD~1 firestore.rules

# Deploy previous rules
firebase deploy --only firestore:rules --project react-app-000730
```

### Full Rollback Process

1. **Identify Issue**
   - Check error logs
   - Review user reports
   - Analyze metrics

2. **Assess Impact**
   - Critical: Immediate rollback
   - Major: Rollback within 1 hour
   - Minor: Fix forward

3. **Execute Rollback**
   ```bash
   # Rollback hosting
   firebase hosting:rollback
   
   # Rollback functions (deploy previous version)
   git checkout v1.x.x-previous
   firebase deploy --only functions
   
   # Rollback rules if needed
   git checkout v1.x.x-previous firestore.rules
   firebase deploy --only firestore:rules
   ```

4. **Verify Rollback**
   - Run smoke tests
   - Check critical paths
   - Monitor error rates

5. **Post-Mortem**
   - Document incident
   - Identify root cause
   - Create action items

---

## Troubleshooting

### Deployment Fails

**Issue**: `firebase deploy` fails

**Solutions**:
```bash
# Check Firebase CLI version
firebase --version
# Update if needed: npm install -g firebase-tools

# Check authentication
firebase login --reauth

# Check project selection
firebase use --add

# Check build output
cd frontend && npm run build
ls -lh dist/
```

### Function Deployment Timeout

**Issue**: Cloud Functions deployment times out

**Solutions**:
```bash
# Deploy functions individually
firebase deploy --only functions:functionName

# Increase timeout
firebase functions:config:set timeout=540

# Check function size
cd functions && npm run build
ls -lh lib/
```

### Hosting Not Updating

**Issue**: Changes not visible after deployment

**Solutions**:
```bash
# Clear CDN cache
# Wait 5-10 minutes for propagation

# Hard refresh browser
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)

# Check deployment status
firebase hosting:releases:list

# Verify build output
cat frontend/dist/index.html
```

### Firestore Rules Errors

**Issue**: Permission denied errors after rules deployment

**Solutions**:
```bash
# Test rules locally
firebase emulators:start --only firestore
npm run test:rules

# Check rules syntax
firebase firestore:rules:get

# Rollback rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### High Error Rates

**Issue**: Increased errors after deployment

**Solutions**:
1. Check Cloud Logging for error details
2. Review recent code changes
3. Check API quotas and limits
4. Verify environment configuration
5. Consider immediate rollback if critical

---

## Emergency Contacts

- **Firebase Support**: https://firebase.google.com/support
- **OpenRouter Support**: https://openrouter.ai/docs
- **On-Call Engineer**: [Add contact info]

---

## Deployment Schedule

- **Staging**: Daily (automated via CI/CD)
- **Production**: Weekly (Thursdays, 10 AM UTC)
- **Hotfixes**: As needed (with approval)

---

**Last Updated**: 2025-10-05  
**Next Review**: 2026-01-05

