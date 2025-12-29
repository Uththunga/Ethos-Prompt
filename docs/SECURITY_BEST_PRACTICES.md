# Security Best Practices

## Overview

This document outlines security best practices for the RAG Prompt Library application, covering authentication, authorization, data protection, API security, and operational security.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [API Security](#api-security)
4. [Firestore Security Rules](#firestore-security-rules)
5. [Secrets Management](#secrets-management)
6. [Input Validation](#input-validation)
7. [Rate Limiting](#rate-limiting)
8. [Monitoring & Incident Response](#monitoring--incident-response)
9. [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### Firebase Authentication

**Implementation**:
- Use Firebase Auth for user management
- Support email/password and OAuth providers (Google, GitHub)
- Implement secure session management with ID tokens
- Token refresh handled automatically by Firebase SDK

**Best Practices**:
```typescript
// ✅ Good: Validate auth state before API calls
const user = auth.currentUser;
if (!user) {
  throw new Error('User not authenticated');
}
const idToken = await user.getIdToken();
```

```typescript
// ❌ Bad: Assume user is authenticated
const idToken = await auth.currentUser.getIdToken(); // May throw
```

### Role-Based Access Control (RBAC)

**Custom Claims**:
```typescript
// Set custom claims (admin only)
await admin.auth().setCustomUserClaims(uid, { role: 'admin' });

// Verify in Cloud Functions
if (context.auth.token.role !== 'admin') {
  throw new functions.https.HttpsError('permission-denied', 'Admin access required');
}
```

**Firestore Rules**:
```javascript
function isAdmin() {
  return request.auth.token.role == 'admin';
}

match /admin/{document=**} {
  allow read, write: if isAdmin();
}
```

---

## Data Protection

### Encryption

**At Rest**:
- Firestore: Encrypted by default (AES-256)
- Cloud Storage: Encrypted by default
- Secrets: Use Firebase environment config or Secret Manager

**In Transit**:
- HTTPS enforced for all connections
- TLS 1.2+ required
- Certificate pinning for mobile apps (future)

### Sensitive Data Handling

**PII (Personally Identifiable Information)**:
```typescript
// ✅ Good: Hash sensitive data
import { createHash } from 'crypto';
const hashedEmail = createHash('sha256').update(email).digest('hex');

// ❌ Bad: Store plain text PII in logs
console.log('User email:', user.email); // Never log PII
```

**API Keys**:
```typescript
// ✅ Good: Store in environment config
const apiKey = functions.config().openrouter.api_key;

// ❌ Bad: Hardcode in source
const apiKey = 'sk-xxx'; // Never commit secrets
```

---

## API Security

### Input Validation

**Always validate and sanitize inputs**:
```typescript
function validatePromptInput(data: any): void {
  if (!data.promptId || typeof data.promptId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid prompt ID');
  }
  
  if (data.promptId.length > 100) {
    throw new functions.https.HttpsError('invalid-argument', 'Prompt ID too long');
  }
  
  // Sanitize HTML/script tags
  const sanitized = data.content.replace(/<script[^>]*>.*?<\/script>/gi, '');
}
```

### CORS Configuration

```typescript
// ✅ Good: Whitelist specific origins
const allowedOrigins = [
  'https://react-app-000730.web.app',
  'https://react-app-000730.firebaseapp.com'
];

if (allowedOrigins.includes(request.headers.origin)) {
  response.set('Access-Control-Allow-Origin', request.headers.origin);
}

// ❌ Bad: Allow all origins
response.set('Access-Control-Allow-Origin', '*');
```

### CSRF Protection

Firebase Auth tokens provide built-in CSRF protection:
```typescript
// Token includes origin and is validated server-side
const idToken = await user.getIdToken();
// Token is cryptographically signed and cannot be forged
```

---

## Firestore Security Rules

### Principle of Least Privilege

```javascript
// ✅ Good: Explicit permissions
match /prompts/{promptId} {
  allow read: if isAuthenticated() && (isOwner() || isPublic());
  allow create: if isAuthenticated() && isOwnerOnCreate();
  allow update, delete: if isAuthenticated() && isOwner();
}

// ❌ Bad: Overly permissive
match /prompts/{promptId} {
  allow read, write: if request.auth != null; // Too broad
}
```

### Data Validation in Rules

```javascript
function hasValidRating() {
  return request.resource.data.rating is int 
    && request.resource.data.rating >= 1 
    && request.resource.data.rating <= 5;
}

function hasRequiredFields() {
  return request.resource.data.keys().hasAll(['userId', 'executionId', 'rating', 'timestamp']);
}

match /execution_ratings/{ratingId} {
  allow create: if isOwnerOnCreate() && hasRequiredFields() && hasValidRating();
}
```

### Testing Security Rules

```bash
# Use Firebase Emulator
firebase emulators:start --only firestore

# Run security rules tests
firebase emulators:exec "npm run test:rules"
```

---

## Secrets Management

### Firebase Environment Config

```bash
# Set secrets
firebase functions:config:set openrouter.api_key="sk-xxx"
firebase functions:config:set app.secret_key="xxx"

# Get config
firebase functions:config:get

# Use in functions
const config = functions.config();
const apiKey = config.openrouter.api_key;
```

### Google Secret Manager (Recommended for Production)

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/PROJECT_ID/secrets/${name}/versions/latest`,
  });
  return version.payload.data.toString();
}
```

### Never Commit Secrets

```gitignore
# .gitignore
.env
.env.local
.env.*.local
*.key
*.pem
serviceAccountKey.json
```

---

## Input Validation

### Server-Side Validation

```typescript
// Validate all inputs
function validateExecutionRequest(data: any): void {
  // Required fields
  if (!data.promptId) throw new Error('promptId required');
  if (!data.variables) throw new Error('variables required');
  
  // Type validation
  if (typeof data.promptId !== 'string') throw new Error('promptId must be string');
  if (typeof data.variables !== 'object') throw new Error('variables must be object');
  
  // Length limits
  if (data.promptId.length > 100) throw new Error('promptId too long');
  if (JSON.stringify(data.variables).length > 10000) throw new Error('variables too large');
  
  // Pattern validation
  if (!/^[a-zA-Z0-9_-]+$/.test(data.promptId)) throw new Error('Invalid promptId format');
}
```

### XSS Prevention

```typescript
// Sanitize user-generated content
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
});
```

---

## Rate Limiting

### Implementation

```typescript
// Rate limit: 10 requests per minute per user
const RATE_LIMIT = 10;
const WINDOW_MS = 60000;

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const now = Date.now();
  
  const doc = await db.collection('rate_limits').doc(key).get();
  const data = doc.data();
  
  if (!data || now - data.windowStart > WINDOW_MS) {
    // New window
    await db.collection('rate_limits').doc(key).set({
      count: 1,
      windowStart: now
    });
    return true;
  }
  
  if (data.count >= RATE_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  // Increment count
  await db.collection('rate_limits').doc(key).update({
    count: admin.firestore.FieldValue.increment(1)
  });
  return true;
}
```

---

## Monitoring & Incident Response

### Security Monitoring

**Log Security Events**:
```typescript
logger.warn('Failed authentication attempt', {
  userId: request.auth?.uid,
  ip: request.ip,
  timestamp: new Date().toISOString()
});
```

**Set Up Alerts**:
- Failed authentication attempts (> 10/min)
- Unusual API usage patterns
- Firestore rule violations
- High error rates

### Incident Response Plan

1. **Detection**: Monitor logs and alerts
2. **Containment**: Disable compromised accounts, revoke tokens
3. **Investigation**: Analyze logs, identify root cause
4. **Remediation**: Patch vulnerabilities, update rules
5. **Recovery**: Restore services, notify users
6. **Post-Mortem**: Document incident, improve processes

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets stored in environment config or Secret Manager
- [ ] Firestore security rules tested and validated
- [ ] Input validation implemented for all endpoints
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] CORS configured with whitelist
- [ ] Authentication required for all protected endpoints
- [ ] Sensitive data encrypted
- [ ] Logging configured (no PII in logs)
- [ ] Error messages don't leak sensitive information

### Post-Deployment

- [ ] Security monitoring enabled
- [ ] Alerts configured
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated
- [ ] Backup and recovery tested

### Ongoing

- [ ] Review security logs weekly
- [ ] Update dependencies monthly
- [ ] Conduct security audit quarterly
- [ ] Review and update security rules quarterly
- [ ] Test incident response plan annually

---

## Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [Firebase Security Checklist](https://firebase.google.com/support/guides/security-checklist)

---

**Last Updated**: 2025-10-05  
**Next Review**: 2026-01-05

