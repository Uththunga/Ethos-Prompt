# SDK Guide

Complete guide for using the RAG Prompt Library SDK in JavaScript and Python.

## JavaScript SDK

### Installation

```bash
npm install firebase
# or
yarn add firebase
```

### Setup

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "react-app-000730.firebaseapp.com",
  projectId: "react-app-000730",
  storageBucket: "react-app-000730.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'australia-southeast1');
```

### Authentication

```javascript
// Email/Password Authentication
async function authenticate(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User authenticated:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw error;
  }
}

// Check authentication status
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
  } else {
    console.log('User is signed out');
  }
});
```

### Core Functions

#### Execute Prompt

```javascript
const executePrompt = httpsCallable(functions, 'execute_prompt');

async function runPrompt(promptId, variables = {}, settings = {}) {
  try {
    const result = await executePrompt({
      prompt_id: promptId,
      variables: variables,
      settings: {
        temperature: 0.7,
        max_tokens: 1000,
        ...settings
      },
      use_rag: true,
      document_ids: []
    });
    
    return result.data;
  } catch (error) {
    console.error('Prompt execution failed:', error);
    throw error;
  }
}

// Usage
const response = await runPrompt('prompt_123', {
  name: 'John',
  topic: 'AI development'
});
```

#### Upload Document

```javascript
const uploadDocument = httpsCallable(functions, 'upload_document');

async function uploadFile(fileData, filename, metadata = {}) {
  try {
    const result = await uploadDocument({
      file_data: fileData, // Base64 encoded file
      filename: filename,
      metadata: {
        category: 'research',
        tags: ['ai', 'ml'],
        ...metadata
      }
    });
    
    return result.data;
  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

// Usage
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];
const base64Data = await fileToBase64(file);
const uploadResult = await uploadFile(base64Data, file.name);
```

#### Search Documents

```javascript
const searchDocuments = httpsCallable(functions, 'search_documents');

async function searchDocs(query, filters = {}) {
  try {
    const result = await searchDocuments({
      query: query,
      filters: filters,
      limit: 10
    });
    
    return result.data;
  } catch (error) {
    console.error('Document search failed:', error);
    throw error;
  }
}

// Usage
const searchResults = await searchDocs('machine learning algorithms', {
  category: 'research',
  date_range: { start: '2024-01-01', end: '2024-12-31' }
});
```

### Error Handling

```javascript
class RAGPromptLibraryError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'RAGPromptLibraryError';
    this.code = code;
    this.details = details;
  }
}

function handleAPIError(error) {
  if (error.code === 'functions/unauthenticated') {
    throw new RAGPromptLibraryError('User not authenticated', 'AUTH_ERROR', error);
  } else if (error.code === 'functions/permission-denied') {
    throw new RAGPromptLibraryError('Permission denied', 'PERMISSION_ERROR', error);
  } else if (error.code === 'functions/not-found') {
    throw new RAGPromptLibraryError('Resource not found', 'NOT_FOUND', error);
  } else {
    throw new RAGPromptLibraryError('API call failed', 'API_ERROR', error);
  }
}
```

## Python SDK

### Installation

```bash
pip install firebase-admin google-cloud-functions
```

### Setup

```python
import firebase_admin
from firebase_admin import credentials, auth, functions
from google.cloud import functions_v1
import requests
import json
import base64

# Initialize Firebase Admin SDK
cred = credentials.Certificate('path/to/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

# Function endpoint base URL
BASE_URL = 'https://australia-southeast1-react-app-000730.cloudfunctions.net'
```

### Authentication

```python
class RAGPromptLibraryClient:
    def __init__(self, service_account_path=None, api_key=None):
        self.session = requests.Session()
        
        if service_account_path:
            # Service account authentication
            cred = credentials.Certificate(service_account_path)
            self.app = firebase_admin.initialize_app(cred)
        elif api_key:
            # API key authentication
            self.session.headers.update({
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            })
        else:
            raise ValueError("Either service_account_path or api_key must be provided")
    
    def _get_auth_token(self):
        """Get Firebase Auth token for service account"""
        if hasattr(self, 'app'):
            # Create custom token for service account
            custom_token = auth.create_custom_token('service-account-uid')
            return custom_token.decode('utf-8')
        return None
```

### Core Functions

```python
def execute_prompt(self, prompt_id, variables=None, settings=None, use_rag=True, document_ids=None):
    """Execute a prompt with the AI model"""
    payload = {
        'prompt_id': prompt_id,
        'variables': variables or {},
        'settings': {
            'temperature': 0.7,
            'max_tokens': 1000,
            **(settings or {})
        },
        'use_rag': use_rag,
        'document_ids': document_ids or []
    }
    
    response = self.session.post(
        f'{BASE_URL}/execute_prompt',
        json=payload
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API call failed: {response.status_code} - {response.text}")

def upload_document(self, file_path, filename=None, metadata=None):
    """Upload a document for RAG processing"""
    with open(file_path, 'rb') as file:
        file_data = base64.b64encode(file.read()).decode('utf-8')
    
    payload = {
        'file_data': file_data,
        'filename': filename or file_path.split('/')[-1],
        'metadata': metadata or {}
    }
    
    response = self.session.post(
        f'{BASE_URL}/upload_document',
        json=payload
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Upload failed: {response.status_code} - {response.text}")

def search_documents(self, query, filters=None, limit=10):
    """Search through uploaded documents"""
    payload = {
        'query': query,
        'filters': filters or {},
        'limit': limit
    }
    
    response = self.session.post(
        f'{BASE_URL}/search_documents',
        json=payload
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Search failed: {response.status_code} - {response.text}")
```

### Usage Examples

```python
# Initialize client
client = RAGPromptLibraryClient(api_key='your_api_key_here')

# Execute a prompt
result = client.execute_prompt(
    prompt_id='prompt_123',
    variables={'name': 'John', 'topic': 'AI'},
    settings={'temperature': 0.8}
)
print(result['data']['response'])

# Upload a document
upload_result = client.upload_document(
    file_path='./research_paper.pdf',
    metadata={'category': 'research', 'tags': ['ai', 'ml']}
)
print(f"Document uploaded: {upload_result['data']['document_id']}")

# Search documents
search_results = client.search_documents(
    query='machine learning algorithms',
    filters={'category': 'research'}
)
for doc in search_results['data']['documents']:
    print(f"Found: {doc['filename']} - Score: {doc['score']}")
```

## Best Practices

### Rate Limiting

```javascript
// JavaScript rate limiting
class RateLimiter {
  constructor(maxRequests = 100, timeWindow = 3600000) { // 100 requests per hour
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }
  
  async checkLimit() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter();
await rateLimiter.checkLimit();
```

### Caching

```javascript
// Simple response caching
class ResponseCache {
  constructor(ttl = 300000) { // 5 minutes TTL
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }
}

const cache = new ResponseCache();
```

### Error Retry Logic

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const result = await retryWithBackoff(() => executePrompt('prompt_123'));
```

## Support

- **SDK Issues**: [Report SDK bugs](https://github.com/your-repo/issues)
- **Documentation**: [Improve SDK docs](https://github.com/your-repo/pulls)
- **Examples**: [More code examples](../examples/)

---

**Last Updated**: January 2025  
**SDK Version**: v1.0  
**Maintained by**: RAG Prompt Library Team
