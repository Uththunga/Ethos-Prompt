# Firebase Setup Guide
## RAG-Enabled Prompt Library System

*Setup Date: July 2025*
*Version: 1.0*

---

## Overview

This guide provides step-by-step instructions for setting up Firebase services for the RAG-enabled prompt library system. Firebase will handle authentication, database, storage, hosting, and serverless functions.

---

## 1. Firebase Project Setup

### 1.1 Create Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new project (or use existing)
firebase projects:create prompt-library-dev
firebase projects:create prompt-library-prod

# Initialize Firebase in your project
cd your-project-directory
firebase init
```

### 1.2 Select Firebase Services

When running `firebase init`, select:
- ✅ **Firestore**: Database for storing prompts and metadata
- ✅ **Functions**: Cloud Functions for RAG processing
- ✅ **Hosting**: Static hosting for React app
- ✅ **Storage**: File storage for documents
- ✅ **Emulators**: Local development environment

### 1.3 Project Structure After Init

```
your-project/
├── frontend/                 # React application
├── functions/               # Cloud Functions
│   ├── src/
│   ├── requirements.txt
│   └── main.py
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
├── storage.rules          # Cloud Storage rules
├── firebase.json          # Firebase configuration
└── .firebaserc           # Project aliases
```

---

## 2. Authentication Setup

### 2.1 Enable Authentication Methods

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable the following providers:
   - ✅ **Email/Password**: Primary authentication
   - ✅ **Google**: OAuth provider
   - ✅ **GitHub**: For developers
   - ⚠️ **Anonymous**: For demo/testing (optional)

### 2.2 Configure Authentication Settings

```javascript
// frontend/src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
```

---

## 3. Firestore Database Setup

### 3.1 Data Model Design

```javascript
// Firestore Collections Structure
/users/{userId}
  - email: string
  - displayName: string
  - createdAt: timestamp
  - settings: object

/users/{userId}/prompts/{promptId}
  - title: string
  - content: string
  - tags: array
  - createdAt: timestamp
  - updatedAt: timestamp
  - isPublic: boolean

/users/{userId}/prompts/{promptId}/executions/{executionId}
  - inputs: object
  - outputs: object
  - timestamp: timestamp
  - duration: number
  - cost: number

/rag_documents/{documentId}
  - filename: string
  - uploadedBy: string
  - processedAt: timestamp
  - status: string
  - chunks: array
```

### 3.2 Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User's prompts
      match /prompts/{promptId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Prompt executions
        match /executions/{executionId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    
    // RAG documents - users can only access their own
    match /rag_documents/{documentId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.uploadedBy;
    }
    
    // Public prompts (read-only for others)
    match /public_prompts/{promptId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
  }
}
```

### 3.3 Firestore Indexes

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 4. Cloud Functions Setup

### 4.1 Python Environment

```python
# functions/requirements.txt
firebase-functions>=0.1.0
firebase-admin>=6.0.0
langchain>=0.1.0
openai>=1.0.0
faiss-cpu>=1.7.0
numpy>=1.24.0
requests>=2.31.0
```

### 4.2 Main Functions File

```python
# functions/main.py
from firebase_functions import https_fn, firestore_fn
from firebase_admin import initialize_app, firestore, storage
import json
from typing import Any, Dict

# Initialize Firebase Admin
initialize_app()

@https_fn.on_call()
def execute_prompt(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Execute a prompt with optional RAG context"""
    # Verify authentication
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')
    
    try:
        prompt_id = req.data.get('promptId')
        inputs = req.data.get('inputs', {})
        use_rag = req.data.get('useRag', False)
        
        # Get prompt from Firestore
        db = firestore.client()
        prompt_ref = db.collection('users').document(req.auth.uid).collection('prompts').document(prompt_id)
        prompt_doc = prompt_ref.get()
        
        if not prompt_doc.exists:
            raise https_fn.HttpsError('not-found', 'Prompt not found')
        
        prompt_data = prompt_doc.to_dict()
        
        # Execute prompt logic here
        result = {
            'output': 'Generated response...',
            'executionTime': 1.5,
            'tokensUsed': 150
        }
        
        # Save execution to Firestore
        execution_ref = prompt_ref.collection('executions').document()
        execution_ref.set({
            'inputs': inputs,
            'outputs': result,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'useRag': use_rag
        })
        
        return result
        
    except Exception as e:
        raise https_fn.HttpsError('internal', str(e))

@firestore_fn.on_document_created(document="rag_documents/{doc_id}")
def process_document(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]):
    """Process uploaded documents for RAG"""
    try:
        doc_data = event.data.to_dict()
        doc_id = event.params['doc_id']
        
        # Document processing logic here
        # 1. Download file from Cloud Storage
        # 2. Extract text content
        # 3. Split into chunks
        # 4. Generate embeddings
        # 5. Store in vector database
        
        # Update document status
        db = firestore.client()
        doc_ref = db.collection('rag_documents').document(doc_id)
        doc_ref.update({
            'status': 'processed',
            'processedAt': firestore.SERVER_TIMESTAMP
        })
        
    except Exception as e:
        print(f"Error processing document: {e}")
```

---

## 5. Cloud Storage Setup

### 5.1 Storage Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Document uploads
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.metadata.sharedWith;
    }
  }
}
```

### 5.2 File Upload Configuration

```typescript
// frontend/src/services/storage.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export const uploadDocument = async (file: File, userId: string): Promise<string> => {
  const storageRef = ref(storage, `documents/${userId}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};
```

---

## 6. Development Environment

### 6.1 Firebase Emulators

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only firestore,functions,auth,storage
```

### 6.2 Environment Variables

```bash
# frontend/.env.local
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# For development with emulators
REACT_APP_USE_EMULATORS=true
```

---

## 7. Deployment

### 7.1 Deploy to Firebase

```bash
# Build React app
cd frontend
npm run build

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### 7.2 CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Build React app
        run: |
          cd frontend
          npm run build
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

---

## 8. Monitoring and Analytics

### 8.1 Enable Firebase Analytics

```typescript
// frontend/src/config/firebase.ts
import { getAnalytics } from 'firebase/analytics';

export const analytics = getAnalytics(app);
```

### 8.2 Performance Monitoring

```typescript
// frontend/src/config/firebase.ts
import { getPerformance } from 'firebase/performance';

export const performance = getPerformance(app);
```

---

## 9. Security Best Practices

### 9.1 API Key Security
- Use environment variables for all Firebase config
- Restrict API keys in Firebase Console
- Enable App Check for production

### 9.2 Firestore Security
- Always use security rules
- Test rules with Firebase Emulator
- Use custom claims for role-based access

### 9.3 Cloud Functions Security
- Validate all inputs
- Use Firebase Admin SDK for server operations
- Implement rate limiting

---

## 10. Cost Optimization

### 10.1 Firestore Optimization
- Use subcollections to avoid large documents
- Implement pagination for large queries
- Cache frequently accessed data

### 10.2 Cloud Functions Optimization
- Use appropriate memory allocation
- Implement connection pooling
- Cache expensive operations

### 10.3 Storage Optimization
- Compress files before upload
- Use appropriate storage classes
- Implement lifecycle policies

---

## Next Steps

1. **Complete Firebase Setup**: Follow this guide to set up all services
2. **Implement Authentication**: Start with email/password auth
3. **Create Data Models**: Implement Firestore collections
4. **Build Cloud Functions**: Start with basic prompt execution
5. **Test with Emulators**: Develop locally before deploying
6. **Deploy to Staging**: Test in Firebase staging environment
7. **Production Deployment**: Deploy to production Firebase project

This Firebase setup provides a solid foundation for building a scalable, real-time RAG-enabled prompt library system.
