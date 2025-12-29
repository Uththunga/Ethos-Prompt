# Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the RAG Prompt Library to production. Follow these procedures carefully to ensure a smooth and secure deployment.

## Pre-Deployment Checklist

### ✅ Code Quality & Testing
- [ ] All unit tests passing (frontend and backend)
- [ ] Integration tests completed successfully
- [ ] End-to-end tests validated
- [ ] Code review completed and approved
- [ ] Security scan completed with no critical issues
- [ ] Performance benchmarks met
- [ ] Documentation updated

### ✅ Infrastructure Preparation
- [ ] Production Firebase project created and configured
- [ ] Domain names configured and SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Database indexes optimized
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting configured

### ✅ Security Validation
- [ ] Security rules reviewed and tested
- [ ] API keys rotated for production
- [ ] Environment variables secured
- [ ] Access controls configured
- [ ] Compliance requirements verified

### ✅ Team Readiness
- [ ] Deployment team briefed
- [ ] Support team trained
- [ ] Rollback procedures documented
- [ ] Communication plan prepared
- [ ] Incident response team on standby

## Deployment Timeline

### Phase 1: Infrastructure Setup (Day -7)
**Duration**: 1 day  
**Responsible**: DevOps Team

1. **Create Production Environment**
   ```bash
   # Create Firebase project
   firebase projects:create rag-prompt-library-prod
   
   # Configure project settings
   firebase use rag-prompt-library-prod
   firebase target:apply hosting production rag-prompt-library-prod
   ```

2. **Configure Domain and SSL**
   ```bash
   # Add custom domain
   firebase hosting:sites:create app-ragpromptlibrary-com
   firebase target:apply hosting app app-ragpromptlibrary-com
   
   # Configure SSL (automatic with Firebase Hosting)
   ```

3. **Set up Monitoring**
   ```bash
   # Run monitoring setup script
   ./deployment/monitoring/setup-monitoring.sh
   ```

### Phase 2: Database Migration (Day -3)
**Duration**: 4 hours  
**Responsible**: Backend Team

1. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules --project=rag-prompt-library-prod
   ```

2. **Deploy Firestore Indexes**
   ```bash
   firebase deploy --only firestore:indexes --project=rag-prompt-library-prod
   ```

3. **Migrate Beta User Data** (if applicable)
   ```bash
   # Run data migration script
   node scripts/migrate-beta-data.js --source=staging --target=production
   ```

### Phase 3: Backend Deployment (Day -1)
**Duration**: 2 hours  
**Responsible**: Backend Team

1. **Deploy Cloud Functions**
   ```bash
   # Set production environment variables
   firebase functions:config:set \
     openai.api_key="$OPENAI_PROD_API_KEY" \
     app.environment="production" \
     app.debug="false"
   
   # Deploy functions
   firebase deploy --only functions --project=rag-prompt-library-prod
   ```

2. **Deploy Storage Rules**
   ```bash
   firebase deploy --only storage --project=rag-prompt-library-prod
   ```

3. **Verify Backend Services**
   ```bash
   # Run backend validation
   ./deployment/scripts/validate-backend.sh
   ```

### Phase 4: Frontend Deployment (Day 0)
**Duration**: 1 hour  
**Responsible**: Frontend Team

1. **Build Production Assets**
   ```bash
   cd frontend
   npm run build:production
   ```

2. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy --only hosting --project=rag-prompt-library-prod
   ```

3. **Verify Frontend Deployment**
   ```bash
   # Run frontend validation
   ./deployment/scripts/validate-frontend.sh
   ```

### Phase 5: Go-Live Validation (Day 0)
**Duration**: 2 hours  
**Responsible**: Full Team

1. **Run Complete Validation Suite**
   ```bash
   ./deployment/scripts/validate-production.sh
   ```

2. **Execute Smoke Tests**
   ```bash
   npm run test:smoke:production
   ```

3. **Monitor Initial Traffic**
   - Watch monitoring dashboards
   - Check error rates and response times
   - Verify user registration and login flows

## Deployment Commands

### Complete Deployment Script
```bash
#!/bin/bash
# Complete production deployment

set -e

PROJECT_ID="rag-prompt-library-prod"
BACKUP_DIR="deployment/backups/$(date +%Y%m%d-%H%M%S)"

echo "Starting production deployment..."

# 1. Create backup
mkdir -p "$BACKUP_DIR"
./deployment/scripts/backup-current-state.sh "$BACKUP_DIR"

# 2. Run pre-deployment validation
./deployment/scripts/validate-production.sh

# 3. Deploy Firebase components
firebase deploy --project="$PROJECT_ID"

# 4. Run post-deployment validation
./deployment/scripts/validate-deployment.sh

# 5. Update monitoring
./deployment/monitoring/setup-monitoring.sh

echo "Production deployment completed successfully!"
```

### Rollback Script
```bash
#!/bin/bash
# Emergency rollback script

set -e

BACKUP_DIR="$1"
PROJECT_ID="rag-prompt-library-prod"

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

echo "Rolling back to backup: $BACKUP_DIR"

# Restore Firebase configuration
cp "$BACKUP_DIR/firebase.json" .
cp "$BACKUP_DIR/firestore.rules" .
cp "$BACKUP_DIR/storage.rules" .

# Redeploy previous version
firebase deploy --project="$PROJECT_ID"

echo "Rollback completed"
```

## Environment Configuration

### Production Environment Variables
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=rag-prompt-library-prod
FIREBASE_API_KEY=your-production-api-key
FIREBASE_AUTH_DOMAIN=rag-prompt-library-prod.firebaseapp.com
FIREBASE_DATABASE_URL=https://rag-prompt-library-prod.firebaseio.com
FIREBASE_STORAGE_BUCKET=rag-prompt-library-prod.appspot.com

# External API Keys
OPENAI_API_KEY=your-production-openai-key
ANTHROPIC_API_KEY=your-production-anthropic-key

# Application Settings
NODE_ENV=production
APP_ENV=production
DEBUG=false
LOG_LEVEL=info

# Security Settings
JWT_SECRET=your-production-jwt-secret
ENCRYPTION_KEY=your-production-encryption-key

# Monitoring
SENTRY_DSN=your-production-sentry-dsn
ANALYTICS_ID=your-production-analytics-id
```

### Firebase Functions Configuration
```bash
# Set production configuration
firebase functions:config:set \
  openai.api_key="$OPENAI_API_KEY" \
  anthropic.api_key="$ANTHROPIC_API_KEY" \
  app.environment="production" \
  app.debug="false" \
  app.log_level="info" \
  security.jwt_secret="$JWT_SECRET" \
  monitoring.sentry_dsn="$SENTRY_DSN"
```

## Monitoring and Health Checks

### Key Metrics to Monitor
- **Response Time**: < 500ms (95th percentile)
- **Error Rate**: < 0.1% for 5xx errors
- **Availability**: > 99.9% uptime
- **Database Performance**: < 100ms query time
- **Memory Usage**: < 80% of allocated memory

### Health Check Endpoints
```bash
# Application health
curl https://app.ragpromptlibrary.com/health

# API health
curl https://api.ragpromptlibrary.com/v1/health

# Database connectivity
curl https://api.ragpromptlibrary.com/v1/health/database
```

### Monitoring Dashboards
- **Operations Dashboard**: System performance and errors
- **Business Dashboard**: User metrics and feature adoption
- **Security Dashboard**: Authentication and security events

## Post-Deployment Tasks

### Immediate (0-2 hours)
- [ ] Verify all services are running
- [ ] Check monitoring dashboards
- [ ] Test critical user journeys
- [ ] Monitor error rates and response times
- [ ] Verify SSL certificates and security headers

### Short-term (2-24 hours)
- [ ] Monitor user feedback and support tickets
- [ ] Review performance metrics
- [ ] Check cost and usage patterns
- [ ] Validate backup procedures
- [ ] Update documentation

### Medium-term (1-7 days)
- [ ] Analyze user adoption patterns
- [ ] Review and optimize performance
- [ ] Conduct security review
- [ ] Plan capacity scaling
- [ ] Gather team feedback

## Troubleshooting

### Common Issues and Solutions

#### High Response Times
```bash
# Check function performance
gcloud functions logs read --project=rag-prompt-library-prod

# Monitor database performance
firebase firestore:databases:list --project=rag-prompt-library-prod
```

#### Authentication Issues
```bash
# Check Firebase Auth configuration
firebase auth:export users.json --project=rag-prompt-library-prod

# Verify security rules
firebase firestore:rules:get --project=rag-prompt-library-prod
```

#### Database Connection Errors
```bash
# Check Firestore status
gcloud firestore operations list --project=rag-prompt-library-prod

# Monitor connection pool
firebase functions:log --project=rag-prompt-library-prod
```

### Emergency Contacts
- **On-call Engineer**: +1-XXX-XXX-XXXX
- **DevOps Lead**: devops@ragpromptlibrary.com
- **Product Manager**: product@ragpromptlibrary.com
- **Security Team**: security@ragpromptlibrary.com

## Success Criteria

### Technical Metrics
- [ ] All health checks passing
- [ ] Response times within SLA
- [ ] Error rates below threshold
- [ ] Security scans clean
- [ ] Monitoring alerts configured

### Business Metrics
- [ ] User registration flow working
- [ ] Core features functional
- [ ] Payment processing operational (if applicable)
- [ ] Support system ready
- [ ] Analytics tracking active

### Team Readiness
- [ ] Support team trained
- [ ] Documentation updated
- [ ] Runbooks accessible
- [ ] Escalation procedures clear
- [ ] Communication channels active

## Communication Plan

### Internal Communication
- **Deployment Start**: Notify all teams
- **Each Phase Complete**: Update status in Slack
- **Issues Encountered**: Immediate escalation
- **Deployment Complete**: Success announcement

### External Communication
- **Status Page**: Update during deployment
- **User Notifications**: Planned maintenance notice
- **Social Media**: Launch announcement
- **Press Release**: Coordinate with marketing

### Templates

#### Deployment Start
```
🚀 PRODUCTION DEPLOYMENT STARTED
Time: [timestamp]
Expected Duration: 4 hours
Status Page: https://status.ragpromptlibrary.com
```

#### Deployment Complete
```
✅ PRODUCTION DEPLOYMENT COMPLETE
Time: [timestamp]
All systems operational
Welcome to RAG Prompt Library!
```

#### Issue Alert
```
🚨 DEPLOYMENT ISSUE
Severity: [High/Medium/Low]
Description: [brief description]
ETA for resolution: [time]
```

---

**Remember**: Always have a rollback plan ready and don't hesitate to use it if issues arise. The goal is a stable, secure production environment that serves our users reliably.
