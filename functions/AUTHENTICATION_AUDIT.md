# Firebase Cloud Functions - Authentication & Authorization Audit

**Date**: 2025-10-04  
**Audit Scope**: All Cloud Functions authentication and authorization mechanisms  
**Purpose**: Verify Firebase ID token validation, user context extraction, and proper access control  

---

## Executive Summary

**Overall Status**: ⚠️ **NEEDS IMPROVEMENT**

- ✅ **Strengths**: Most functions validate authentication, Firebase Auth integration works correctly
- ⚠️ **Inconsistencies**: Some functions lack authentication, no role-based access control (RBAC)
- ❌ **Critical Issues**: `fix_document_statuses` has no authentication (security vulnerability)

**Recommendation**: Add authentication to all admin functions and implement RBAC for sensitive operations.

---

## Authentication Mechanisms

### Firebase Authentication

**Implementation**: ✅ **WORKING**

Firebase Auth is properly integrated:
- Frontend uses Firebase Auth SDK
- Backend validates Firebase ID tokens automatically for `onCall` functions
- User context available via `request.auth` object

**User Context Structure**:
```javascript
request.auth = {
  uid: string,           // User ID
  token: {
    email: string,       // User email
    email_verified: boolean,
    // ... other token claims
  }
}
```

---

## Function-by-Function Authentication Review

### 1. `api` - Main API Endpoint

**Authentication**: ⚠️ **VARIES BY ENDPOINT**

**Endpoints**:
- `health`: ❌ No authentication required
- `execute_prompt`: ✅ Requires authentication
- `test_openrouter_connection`: ❌ No authentication required
- `get_available_models`: ❌ No authentication required
- `generate_prompt`: ✅ Requires authentication

**Code**:
```javascript
// No top-level authentication check
exports.api = onCall({ region: 'australia-southeast1', secrets: [OPENROUTER_API_KEY] }, async (request) => {
  const data = request.data || {};
  const endpoint = data.endpoint || 'health';
  
  switch (endpoint) {
    case 'health':
      return { status: 'success', ... }; // No auth check
    
    case 'execute_prompt':
      return await executePrompt(request); // Auth checked inside
    
    // ...
  }
});
```

**Issues**:
- ⚠️ No consistent authentication policy
- ⚠️ Public endpoints mixed with protected endpoints
- ⚠️ No rate limiting on public endpoints

**Recommendations**:
1. Add authentication check at top level for all endpoints except health
2. Or split into separate functions (public vs. protected)
3. Add rate limiting for public endpoints

**Security Rating**: ⚠️ **MEDIUM RISK**

---

### 2. `execute_multi_model_prompt`

**Authentication**: ✅ **REQUIRED**

**Code**:
```javascript
exports.execute_multi_model_prompt = onCall({ ... }, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }
    
    // ... rest of function
  } catch (error) {
    // ...
  }
});
```

**Validation**:
- ✅ Checks `request.auth` presence
- ✅ Throws error if not authenticated
- ✅ User context available for logging/tracking

**Test Results** (from emulator testing):
- ✅ Authenticated request: SUCCESS
- ✅ Unauthenticated request: REJECTED with "User must be authenticated"

**Security Rating**: ✅ **SECURE**

---

### 3. `executePrompt()` (Internal function)

**Authentication**: ✅ **REQUIRED**

**Code**:
```javascript
async function executePrompt(request) {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }
    
    // Get prompt from user's collection
    const promptRef = db
      .collection('users')
      .doc(request.auth.uid)  // User isolation
      .collection('prompts')
      .doc(promptId);
    
    // ...
  } catch (error) {
    // ...
  }
}
```

**Validation**:
- ✅ Checks `request.auth` presence
- ✅ Uses `request.auth.uid` for user isolation
- ✅ Accesses user-specific Firestore collections

**Security Rating**: ✅ **SECURE**

---

### 4. `get_available_models`

**Authentication**: ❌ **NOT REQUIRED**

**Code**:
```javascript
exports.get_available_models = onCall({ region: 'australia-southeast1' }, (request) => {
  return getAvailableModels();
});
```

**Rationale**: Public endpoint returning static model list

**Issues**:
- ⚠️ No rate limiting (potential for abuse)
- ⚠️ Could be used for reconnaissance

**Recommendations**:
1. Add rate limiting
2. Consider requiring authentication for consistency
3. Or implement Firebase App Check for bot protection

**Security Rating**: ⚠️ **LOW RISK** (but should add rate limiting)

---

### 5. `health`

**Authentication**: ❌ **NOT REQUIRED**

**Code**:
```javascript
exports.health = onRequest({ region: 'australia-southeast1' }, (req, res) => {
  res.json({
    status: 'healthy',
    region: 'australia-southeast1',
  });
});
```

**Rationale**: Public health check endpoint for monitoring

**Security Rating**: ✅ **ACCEPTABLE** (standard practice for health checks)

---

### 6. `httpApi`

**Authentication**: ⚠️ **VARIES BY ROUTE**

**Code**:
```javascript
exports.httpApi = onRequest({ region: 'australia-southeast1', cors: true }, async (req, res) => {
  try {
    const path = req.path || req.url;
    
    if (path === '/health') {
      // No authentication
      return res.json({ status: 'healthy', ... });
    }
    
    if (path === '/execute') {
      // No authentication check here!
      // Relies on internal function to check
      // ...
    }
    
    // ...
  } catch (error) {
    // ...
  }
});
```

**Issues**:
- ❌ No authentication middleware
- ⚠️ Relies on internal functions to check auth
- ⚠️ No consistent authentication policy
- ⚠️ No Firebase ID token validation for HTTP requests

**Recommendations**:
1. **CRITICAL**: Add authentication middleware for HTTP endpoints
2. Validate Firebase ID token from Authorization header
3. Extract user context and pass to internal functions

**Example Authentication Middleware**:
```javascript
async function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken;
}

// Usage
if (path === '/execute') {
  const user = await authenticateRequest(req);
  // ... use user.uid for authorization
}
```

**Security Rating**: ❌ **HIGH RISK** (no authentication for HTTP endpoints)

---

### 7. `fix_document_statuses`

**Authentication**: ❌ **NOT REQUIRED** (CRITICAL SECURITY ISSUE)

**Code**:
```javascript
exports.fix_document_statuses = onCall({
  region: 'australia-southeast1',
  cors: true,
}, async (request) => {
  try {
    // NO AUTHENTICATION CHECK!
    
    // Accesses all documents in rag_documents collection
    const docsSnapshot = await db.collection('rag_documents')
      .where('status', '==', 'uploaded')
      .get();
    
    // Can modify any document
    // ...
  } catch (error) {
    // ...
  }
});
```

**Issues**:
- ❌ **CRITICAL**: No authentication check
- ❌ **CRITICAL**: Anyone can call this function
- ❌ **CRITICAL**: Can access and modify all documents
- ❌ No admin role check
- ❌ No audit logging

**Impact**:
- Unauthorized users can view all document statuses
- Unauthorized users can modify document statuses
- Potential for data corruption or deletion
- No accountability (no user tracking)

**Recommendations**:
1. **IMMEDIATE**: Add authentication check
2. **IMMEDIATE**: Add admin role verification
3. Add audit logging for all operations
4. Consider removing this function entirely (use Firebase Console instead)

**Example Fix**:
```javascript
exports.fix_document_statuses = onCall({ ... }, async (request) => {
  // 1. Verify authentication
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }
  
  // 2. Verify admin role
  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || userData.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  // 3. Log operation
  console.log(`Admin operation: fix_document_statuses by ${request.auth.uid}`);
  
  // 4. Proceed with operation
  // ...
});
```

**Security Rating**: ❌ **CRITICAL VULNERABILITY**

---

### 8. `process_document` (Firestore Trigger)

**Authentication**: N/A (Automatic trigger)

**Authorization**: ⚠️ **RELIES ON FIRESTORE RULES**

**Code**:
```javascript
exports.process_document = onDocumentCreated({
  document: 'rag_documents/{docId}',
  region: 'australia-southeast1',
}, async (event) => {
  // Triggered automatically when document created
  // No authentication check needed (trigger-based)
  
  const docId = event.params.docId;
  const docData = event.data.data();
  
  // Process document
  // ...
});
```

**Security Considerations**:
- ✅ Trigger only fires when document is created
- ⚠️ Relies on Firestore security rules to prevent unauthorized document creation
- ✅ No direct user access to this function

**Firestore Rules Check Required**:
```javascript
// firestore.rules
match /rag_documents/{docId} {
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
}
```

**Security Rating**: ✅ **SECURE** (if Firestore rules are correct)

---

### 9. `process_document_http`

**Authentication**: ✅ **REQUIRED**

**Code**:
```javascript
exports.process_document_http = onCall({ ... }, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }
    
    const { documentId } = request.data;
    
    // Get document
    const docSnap = await db.collection('rag_documents').doc(documentId).get();
    
    if (!docSnap.exists) {
      throw new Error('Document not found');
    }
    
    const docData = docSnap.data();
    
    // TODO: Verify user owns this document!
    // if (docData.userId !== request.auth.uid) {
    //   throw new Error('Unauthorized: You do not own this document');
    // }
    
    // Process document
    // ...
  } catch (error) {
    // ...
  }
});
```

**Issues**:
- ✅ Checks authentication
- ❌ **MISSING**: Does not verify user owns the document
- ⚠️ User can process any document by ID (authorization bypass)

**Recommendations**:
1. **CRITICAL**: Add ownership verification
2. Check `docData.userId === request.auth.uid`
3. Return 403 Forbidden if user doesn't own document

**Security Rating**: ❌ **HIGH RISK** (missing authorization check)

---

### 10. `generatePrompt()` (Internal function)

**Authentication**: ✅ **REQUIRED**

**Code**:
```javascript
async function generatePrompt(request) {
  try {
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }
    
    // ... generate prompt logic
  } catch (error) {
    // ...
  }
}
```

**Security Rating**: ✅ **SECURE**

---

## Authorization Patterns

### Current Implementation

**Pattern**: User Isolation via Firestore Collections

```javascript
// User-specific collection access
const promptRef = db
  .collection('users')
  .doc(request.auth.uid)  // User's UID
  .collection('prompts')
  .doc(promptId);
```

**Pros**:
- ✅ Simple and effective
- ✅ Enforces user isolation at database level
- ✅ Works well with Firestore security rules

**Cons**:
- ⚠️ No role-based access control (RBAC)
- ⚠️ No shared resources or collaboration
- ⚠️ No admin override capability

---

### Missing: Role-Based Access Control (RBAC)

**Current State**: ❌ **NOT IMPLEMENTED**

**Needed For**:
- Admin functions (fix_document_statuses, etc.)
- Shared prompts/documents
- Team collaboration features
- Support/debugging access

**Recommended Implementation**:

1. **Add roles to user documents**:
```javascript
// users/{userId}
{
  uid: string,
  email: string,
  role: 'user' | 'admin' | 'support',
  createdAt: timestamp,
}
```

2. **Create authorization helper**:
```javascript
async function authorizeUser(uid, requiredRole) {
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();
  
  if (!userData) {
    throw new Error('User not found');
  }
  
  const roleHierarchy = { user: 0, support: 1, admin: 2 };
  const userRoleLevel = roleHierarchy[userData.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
  
  if (userRoleLevel < requiredRoleLevel) {
    throw new Error(`Unauthorized: ${requiredRole} access required`);
  }
  
  return userData;
}
```

3. **Use in functions**:
```javascript
exports.adminFunction = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }
  
  await authorizeUser(request.auth.uid, 'admin');
  
  // Admin operation
  // ...
});
```

---

## Token Validation

### Firebase ID Token Validation

**onCall Functions**: ✅ **AUTOMATIC**

Firebase automatically validates ID tokens for `onCall` functions:
- ✅ Token signature verification
- ✅ Token expiration check
- ✅ Token revocation check
- ✅ User context extraction

**onRequest Functions**: ❌ **MANUAL REQUIRED**

HTTP endpoints must manually validate tokens:
```javascript
const admin = require('firebase-admin');

async function validateToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization header');
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

**Current Status**: ❌ **NOT IMPLEMENTED** for httpApi

---

## Security Test Results

### Test Scenarios

#### 1. Authenticated Request (Valid Token)
- **Function**: execute_multi_model_prompt
- **Result**: ✅ SUCCESS
- **Response Time**: 5,574ms
- **User Context**: Available (`request.auth.uid`)

#### 2. Unauthenticated Request (No Token)
- **Function**: execute_multi_model_prompt
- **Result**: ✅ REJECTED
- **Error**: "User must be authenticated"
- **Response Time**: 6.7ms

#### 3. Public Endpoint (No Auth Required)
- **Function**: get_available_models
- **Result**: ✅ SUCCESS
- **Response Time**: 1,370ms

#### 4. Admin Function (No Auth Check)
- **Function**: fix_document_statuses
- **Result**: ❌ SUCCESS (should require auth)
- **Response Time**: 1,869ms
- **Issue**: Anyone can call this function

---

## Security Vulnerabilities Summary

### Critical (P0) - Immediate Action Required

1. ❌ **fix_document_statuses has no authentication**
   - **Impact**: Anyone can view and modify all document statuses
   - **Fix**: Add authentication and admin role check
   - **Effort**: 1 hour

2. ❌ **process_document_http missing authorization check**
   - **Impact**: Users can process documents they don't own
   - **Fix**: Add ownership verification
   - **Effort**: 30 minutes

3. ❌ **httpApi has no authentication for protected routes**
   - **Impact**: HTTP endpoints can be called without authentication
   - **Fix**: Add token validation middleware
   - **Effort**: 2 hours

### High Priority (P1)

4. ⚠️ **No role-based access control (RBAC)**
   - **Impact**: Cannot implement admin features securely
   - **Fix**: Implement RBAC system
   - **Effort**: 4 hours

5. ⚠️ **No rate limiting on public endpoints**
   - **Impact**: Potential for abuse/DoS
   - **Fix**: Implement rate limiting
   - **Effort**: 3 hours

### Medium Priority (P2)

6. ⚠️ **Inconsistent authentication patterns**
   - **Impact**: Confusing for developers, potential for mistakes
   - **Fix**: Standardize authentication across all functions
   - **Effort**: 2 hours

---

## Recommendations

### Immediate Actions (P0)

1. **Add authentication to fix_document_statuses**:
```javascript
if (!request.auth) {
  throw new Error('User must be authenticated');
}

await authorizeUser(request.auth.uid, 'admin');
```

2. **Add authorization to process_document_http**:
```javascript
const docData = docSnap.data();
if (docData.userId !== request.auth.uid) {
  throw new Error('Unauthorized: You do not own this document');
}
```

3. **Add authentication middleware to httpApi**:
```javascript
async function authenticateHttpRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization header');
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  return await admin.auth().verifyIdToken(idToken);
}
```

### Short-term (P1)

4. **Implement RBAC system** with user roles
5. **Add rate limiting** using Firebase App Check or custom middleware
6. **Standardize authentication** patterns across all functions

### Long-term (P2)

7. **Add audit logging** for all sensitive operations
8. **Implement token refresh** logic in frontend
9. **Add session management** for better security

---

## Conclusion

**Overall Security Posture**: ⚠️ **NEEDS IMPROVEMENT**

**Key Findings**:
- ✅ Most functions properly validate authentication
- ❌ Critical vulnerabilities in admin functions
- ❌ Missing authorization checks in some functions
- ❌ No RBAC implementation
- ⚠️ Inconsistent authentication patterns

**Priority Actions**:
1. Fix critical vulnerabilities (P0) - **IMMEDIATE**
2. Implement RBAC (P1) - **THIS WEEK**
3. Add rate limiting (P1) - **THIS WEEK**
4. Standardize patterns (P2) - **NEXT SPRINT**

---

**Audit Version**: 1.0  
**Completed**: 2025-10-04  
**Auditor**: AI Agent (Phase A Audit)

