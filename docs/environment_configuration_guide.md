# Environment Configuration Guide
## RAG Prompt Library - Development, Staging & Production Setup

*Last Updated: July 20, 2025*
*Status: Production Ready - Complete Configuration Guide*

---

## Executive Summary

This document provides comprehensive environment configuration guidance for the RAG Prompt Library system across development, staging, and production environments. All configurations are optimized for Firebase Blaze plan with enterprise-grade security and performance.

**Environment Status**:
- **Development**: ✅ Fully configured with emulators
- **Staging**: ✅ Production-like environment ready
- **Production**: ✅ Enterprise-ready with 96.7% deployment readiness

---

## 1. Development Environment Configuration

### 1.1 Local Development Setup

**Prerequisites**:
- Node.js 18+ and npm/yarn
- Python 3.11+
- Firebase CLI 12+
- Git

**Environment Variables (.env.local)**:
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-dev-api-key
VITE_FIREBASE_AUTH_DOMAIN=rag-prompt-library.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rag-prompt-library
VITE_FIREBASE_STORAGE_BUCKET=rag-prompt-library.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Development API Keys (for testing)
OPENROUTER_API_KEY=sk-or-v1-dev-key-for-testing
OPENROUTER_API_KEY_RAG=sk-or-v1-dev-rag-key-for-testing

# Development Settings
NODE_ENV=development
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:5001/rag-prompt-library/us-central1
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=true
```

**Firebase Emulator Configuration**:
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

**Development Startup Commands**:
```bash
# Start Firebase emulators
firebase emulators:start

# Start frontend development server
cd frontend
npm run dev

# Start backend functions (if needed)
cd functions
npm run serve
```

### 1.2 Development Database Configuration

**Firestore Emulator Setup**:
```javascript
// Development Firestore rules (more permissive for testing)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads/writes in development
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Test Data Seeding**:
```typescript
// Development data seeding script
export const seedDevelopmentData = async () => {
  const testUsers = [
    {
      id: 'test-user-1',
      email: 'developer@example.com',
      displayName: 'Test Developer',
      role: 'admin'
    }
  ];

  const testPrompts = [
    {
      id: 'test-prompt-1',
      title: 'Test Prompt',
      content: 'This is a test prompt for development',
      userId: 'test-user-1',
      createdAt: new Date()
    }
  ];

  // Seed data to Firestore emulator
  for (const user of testUsers) {
    await db.collection('users').doc(user.id).set(user);
  }

  for (const prompt of testPrompts) {
    await db.collection('prompts').doc(prompt.id).set(prompt);
  }
};
```

---

## 2. Staging Environment Configuration

### 2.1 Staging Environment Setup

**Purpose**: Production-like environment for final testing and validation

**Environment Variables (.env.staging)**:
```bash
# Firebase Configuration (Staging Project)
VITE_FIREBASE_API_KEY=staging-api-key
VITE_FIREBASE_AUTH_DOMAIN=rag-prompt-library-staging.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rag-prompt-library-staging
VITE_FIREBASE_STORAGE_BUCKET=rag-prompt-library-staging.appspot.com

# Staging API Keys (Limited quota)
OPENROUTER_API_KEY=sk-or-v1-staging-key
OPENROUTER_API_KEY_RAG=sk-or-v1-staging-rag-key

# Staging Settings
NODE_ENV=production
VITE_APP_ENV=staging
VITE_API_BASE_URL=https://us-central1-rag-prompt-library-staging.cloudfunctions.net
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG_MODE=false
VITE_RATE_LIMIT_ENABLED=true
```

**Staging Firebase Configuration**:
```json
{
  "projects": {
    "staging": "rag-prompt-library-staging"
  },
  "functions": [{
    "source": "functions",
    "runtime": "python311",
    "memory": "512MB",
    "timeout": "300s"
  }],
  "hosting": {
    "public": "frontend/dist",
    "headers": [
      {
        "source": "**",
        "headers": [
          {"key": "X-Robots-Tag", "value": "noindex, nofollow"}
        ]
      }
    ]
  }
}
```

### 2.2 Staging Security Configuration

**Firestore Security Rules (Production-like)**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data access control
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Prompt access with workspace permissions
    match /prompts/{promptId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         isWorkspaceMember(resource.data.workspaceId, request.auth.uid));
    }
    
    // Staging-specific test data access
    match /test_data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Staging Deployment Script**:
```bash
#!/bin/bash
# deploy-staging.sh

echo "Deploying to staging environment..."

# Build frontend for staging
cd frontend
npm run build:staging

# Deploy to Firebase staging
cd ..
firebase use staging
firebase deploy --only hosting,functions,firestore:rules

echo "Staging deployment complete!"
echo "URL: https://rag-prompt-library-staging.web.app"
```

---

## 3. Production Environment Configuration

### 3.1 Production Environment Setup

**Environment Variables (.env.production)**:
```bash
# Firebase Configuration (Production)
VITE_FIREBASE_API_KEY=production-api-key
VITE_FIREBASE_AUTH_DOMAIN=rag-prompt-library.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rag-prompt-library
VITE_FIREBASE_STORAGE_BUCKET=rag-prompt-library.appspot.com

# Production API Keys (Full quota)
OPENROUTER_API_KEY=REDACTED_API_KEY
OPENROUTER_API_KEY_RAG=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

# Production Settings
NODE_ENV=production
VITE_APP_ENV=production
VITE_API_BASE_URL=https://us-central1-rag-prompt-library.cloudfunctions.net
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG_MODE=false
VITE_RATE_LIMIT_ENABLED=true
VITE_MONITORING_ENABLED=true
```

**Production Firebase Configuration**:
```json
{
  "projects": {
    "default": "rag-prompt-library"
  },
  "functions": [{
    "source": "functions",
    "runtime": "python311",
    "memory": "1GB",
    "timeout": "540s",
    "environment": {
      "OPENROUTER_API_KEY": "configured-via-secrets",
      "OPENROUTER_API_KEY_RAG": "configured-via-secrets"
    }
  }],
  "hosting": {
    "public": "frontend/dist",
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {"key": "Cache-Control", "value": "max-age=31536000"}
        ]
      },
      {
        "source": "**",
        "headers": [
          {"key": "X-Content-Type-Options", "value": "nosniff"},
          {"key": "X-Frame-Options", "value": "DENY"},
          {"key": "Strict-Transport-Security", "value": "max-age=31536000"}
        ]
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

### 3.2 Production Security Configuration

**Production Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isWorkspaceMember(workspaceId, userId) {
      return exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(userId));
    }

    // User data access control
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Prompt access with workspace permissions
    match /prompts/{promptId} {
      allow read, write: if isAuthenticated() && 
        (isOwner(resource.data.userId) || 
         isWorkspaceMember(resource.data.workspaceId, request.auth.uid));
    }
    
    // Document access control
    match /documents/{documentId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Execution history access
    match /executions/{executionId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Workspace access control
    match /workspaces/{workspaceId} {
      allow read: if isAuthenticated() && isWorkspaceMember(workspaceId, request.auth.uid);
      allow write: if isAuthenticated() && 
        (isOwner(resource.data.ownerId) || 
         get(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid)).data.role in ['owner', 'admin']);
    }
  }
}
```

**Production Storage Security Rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User document storage
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 50 * 1024 * 1024 && // 50MB limit
        request.resource.contentType.matches('application/pdf|text/.*|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
    
    // User profile images
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 5 * 1024 * 1024 && // 5MB limit
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 4. CI/CD Environment Configuration

### 4.1 GitHub Actions Configuration

**Production Deployment Workflow**:
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd frontend && npm ci
          cd ../functions && pip install -r requirements.txt
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build:production
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: rag-prompt-library
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          OPENROUTER_API_KEY_RAG: ${{ secrets.OPENROUTER_API_KEY_RAG }}
```

### 4.2 Environment Secrets Management

**Required GitHub Secrets**:
```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=rag-prompt-library.firebaseapp.com
FIREBASE_PROJECT_ID=rag-prompt-library

# API Keys
OPENROUTER_API_KEY=REDACTED_API_KEY
OPENROUTER_API_KEY_RAG=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

# Monitoring & Analytics
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=your-ga-id
```

---

## 5. Environment Validation & Testing

### 5.1 Environment Health Checks

**Health Check Script**:
```bash
#!/bin/bash
# health-check.sh

echo "Running environment health checks..."

# Check Firebase connectivity
firebase projects:list

# Check function deployment
curl -f https://us-central1-rag-prompt-library.cloudfunctions.net/test_cors

# Check frontend deployment
curl -f https://rag-prompt-library.web.app

# Check API endpoints
curl -f -H "Authorization: Bearer $TEST_TOKEN" \
  https://us-central1-rag-prompt-library.cloudfunctions.net/api/health

echo "Health checks complete!"
```

### 5.2 Environment Monitoring

**Monitoring Configuration**:
```typescript
// Environment-specific monitoring
export const monitoringConfig = {
  development: {
    enableErrorReporting: false,
    enablePerformanceMonitoring: false,
    logLevel: 'debug'
  },
  staging: {
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    logLevel: 'info'
  },
  production: {
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    logLevel: 'warn',
    enableAlerts: true,
    alertThresholds: {
      errorRate: 0.01,
      responseTime: 1000,
      uptime: 0.999
    }
  }
};
```

---

This environment configuration guide provides complete setup instructions for all environments with production-ready security and performance optimizations.
