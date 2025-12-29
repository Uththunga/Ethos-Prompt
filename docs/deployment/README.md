# Deployment Documentation

Complete deployment and operations documentation for the RAG Prompt Library.

## 📋 Deployment Overview

The RAG Prompt Library uses Firebase for hosting and cloud functions, providing a scalable, serverless architecture. This documentation covers all aspects of deployment, from local development to production operations.

### Deployment Environments
- **Development**: Local Firebase emulators for development and testing
- **Staging**: Firebase project for pre-production testing
- **Production**: Firebase project for live user traffic

## 📚 Documentation Sections

### [Deployment Guide](deployment-guide.md)
Complete step-by-step guide for deploying to production.

### [Environment Setup](environment-setup.md)
Configuration and setup for all environments (dev, staging, production).

### [CI/CD Pipeline](cicd.md)
Automated deployment pipeline using GitHub Actions.

### [Monitoring & Observability](monitoring.md)
Production monitoring, logging, and alerting setup.

### [Backup & Recovery](backup-recovery.md)
Data backup strategies and disaster recovery procedures.

### [Security Operations](security-operations.md)
Security monitoring, incident response, and compliance procedures.

## 🚀 Quick Deployment

### Prerequisites
```bash
# Install required tools
npm install -g firebase-tools
npm install -g @google-cloud/functions-framework

# Authenticate with Firebase
firebase login

# Clone and setup project
git clone <repository-url>
cd Prompt-Library
npm install
```

### Local Development
```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start frontend
cd frontend
npm run dev

# Access application
# Frontend: http://localhost:5173
# Firebase UI: http://localhost:4000
```

### Production Deployment
```bash
# Build frontend
npm run build

# Deploy to Firebase
firebase deploy --project production

# Verify deployment
firebase hosting:channel:open live --project production
```

## 🏗️ Infrastructure Architecture

### Firebase Services
```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Hosting                         │
│                  (Static Site Hosting)                      │
├─────────────────────────────────────────────────────────────┤
│                  Firebase Functions                         │
│              (Python Cloud Functions)                       │
├─────────────────────────────────────────────────────────────┤
│                   Firestore Database                        │
│              (Document-based NoSQL)                         │
├─────────────────────────────────────────────────────────────┤
│                   Firebase Storage                          │
│                (File storage and CDN)                       │
├─────────────────────────────────────────────────────────────┤
│                  Firebase Authentication                    │
│              (User management and auth)                     │
└─────────────────────────────────────────────────────────────┘
```

### Regional Configuration
- **Primary Region**: Australia Southeast 1 (sydney)
- **Functions Region**: australia-southeast1
- **Firestore Region**: australia-southeast1
- **Storage Region**: australia-southeast1

## 🔧 Environment Configuration

### Development Environment
```yaml
# .env.development
VITE_FIREBASE_API_KEY=dev-api-key
VITE_FIREBASE_AUTH_DOMAIN=dev-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dev-project
VITE_FIREBASE_STORAGE_BUCKET=dev-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_ENVIRONMENT=development
```

### Production Environment
```yaml
# .env.production
VITE_FIREBASE_API_KEY=prod-api-key
VITE_FIREBASE_AUTH_DOMAIN=react-app-000730.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=react-app-000730
VITE_FIREBASE_STORAGE_BUCKET=react-app-000730.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
VITE_FIREBASE_APP_ID=1:987654321:web:fedcba
VITE_ENVIRONMENT=production
```

## 📊 Deployment Metrics

### Performance Targets
- **Build Time**: <5 minutes
- **Deployment Time**: <10 minutes
- **Cold Start**: <2 seconds
- **Time to First Byte**: <500ms

### Availability Targets
- **Uptime**: 99.9%
- **Error Rate**: <0.1%
- **Response Time**: <1 second (95th percentile)

## 🔒 Security Configuration

### Firebase Security Rules
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /prompts/{promptId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.owner == request.auth.uid);
    }
  }
}

// Storage Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Environment Secrets
```bash
# Set Firebase environment variables
firebase functions:config:set \
  openai.api_key="your-openai-key" \
  anthropic.api_key="your-anthropic-key" \
  cohere.api_key="your-cohere-key"

# Deploy with secrets
firebase deploy --only functions
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: react-app-000730
```

### Deployment Stages
1. **Code Quality**: Linting, type checking, unit tests
2. **Build**: Frontend compilation and optimization
3. **Test**: Integration and E2E testing
4. **Deploy**: Firebase hosting and functions deployment
5. **Verify**: Health checks and smoke tests
6. **Monitor**: Performance and error monitoring

## 📈 Monitoring & Alerting

### Key Metrics
- **Application Performance**: Response times, error rates
- **Infrastructure Health**: Function execution, database performance
- **User Experience**: Core Web Vitals, user flows
- **Business Metrics**: User engagement, feature usage

### Alert Conditions
- **Error Rate**: >1% for 5 minutes
- **Response Time**: >2 seconds for 5 minutes
- **Function Failures**: >5 failures in 1 minute
- **Database Errors**: Any connection failures

## 🔧 Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Verify environment variables
npm run build -- --debug
```

#### Function Deployment Issues
```bash
# Check function logs
firebase functions:log

# Test function locally
firebase emulators:start --only functions
curl -X POST http://localhost:5001/project-id/region/function-name

# Verify dependencies
cd functions
pip install -r requirements.txt
```

#### Database Connection Issues
```bash
# Check Firestore rules
firebase firestore:rules:get

# Test database connection
firebase firestore:indexes

# Verify authentication
firebase auth:export users.json
```

## 📞 Support & Resources

### Documentation
- **Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com)
- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **GitHub Repository**: [github.com/your-org/prompt-library](https://github.com/your-org/prompt-library)

### Team Contacts
- **DevOps Lead**: devops@ragpromptlibrary.com
- **Platform Team**: platform@ragpromptlibrary.com
- **On-Call**: oncall@ragpromptlibrary.com

### Emergency Procedures
- **Incident Response**: [Incident Runbook](security-operations.md#incident-response)
- **Rollback Process**: [Rollback Guide](deployment-guide.md#rollback-procedures)
- **Status Page**: [status.ragpromptlibrary.com](https://status.ragpromptlibrary.com)

---

**Last Updated**: January 2025  
**Deployment Version**: v2.0  
**Next Review**: February 2025  
**Maintained by**: RAG Prompt Library DevOps Team
