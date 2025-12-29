# API Documentation

Complete API documentation for the RAG Prompt Library.

## 📚 API Documentation Overview

The RAG Prompt Library provides a comprehensive API for managing prompts, documents, and AI executions. The API is built on Firebase Callable Functions and supports both Firebase SDK and REST-style access.

### Base Information
- **Base URL**: `https://australia-southeast1-react-app-000730.cloudfunctions.net`
- **Authentication**: Firebase Auth tokens (automatic with Firebase SDK)
- **Format**: JSON request/response
- **Region**: Australia Southeast 1

## 📖 Documentation Sections

### [API Reference](api-reference.md)
Complete API endpoint documentation with request/response examples.

### [SDK Guide](sdk-guide.md)
JavaScript and Python SDK usage examples and best practices.

### [Integration Examples](integration-examples.md)
Real-world integration examples and code samples.

### [OpenAPI Specification](openapi-spec.yaml)
Machine-readable API specification for automated tooling.

## 🚀 Quick Start

### Authentication
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'australia-southeast1');

// Authenticate user
await signInWithEmailAndPassword(auth, email, password);

// Call function
const executePrompt = httpsCallable(functions, 'execute_prompt');
const result = await executePrompt({ prompt_id: 'your-prompt-id' });
```

### Basic API Usage
```javascript
// Execute a prompt
const executePrompt = httpsCallable(functions, 'execute_prompt');
const result = await executePrompt({
  prompt_id: 'prompt_123',
  variables: { name: 'John', topic: 'AI' },
  settings: { temperature: 0.7, max_tokens: 1000 },
  use_rag: true,
  document_ids: ['doc_456']
});

// Upload a document
const uploadDocument = httpsCallable(functions, 'upload_document');
const uploadResult = await uploadDocument({
  file_data: base64FileData,
  filename: 'document.pdf',
  metadata: { category: 'research' }
});
```

## 🔧 Available Functions

### Core Functions
- `execute_prompt` - Execute prompts with AI models
- `upload_document` - Upload documents for RAG processing
- `search_documents` - Search through uploaded documents
- `get_usage_stats` - Get user usage statistics
- `get_system_status` - Check system health

### Prompt Management
- `create_prompt` - Create new prompts
- `update_prompt` - Update existing prompts
- `delete_prompt` - Delete prompts
- `list_prompts` - List user prompts

### Document Management
- `process_document` - Process documents for RAG
- `delete_document` - Remove documents
- `get_document_status` - Check processing status

### AI & RAG Functions
- `ai_chat` - AI chat functionality
- `rag_chat` - RAG-enhanced chat
- `test_provider` - Test AI provider connections

## 📊 Response Format

All API responses follow a consistent format:

```javascript
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2025-01-15T10:00:00Z",
    "execution_time": 1.23,
    "tokens_used": 150
  }
}
```

Error responses:
```javascript
{
  "success": false,
  "error": {
    "code": "INVALID_PROMPT",
    "message": "Prompt not found",
    "details": {}
  }
}
```

## 🔒 Authentication & Security

### Firebase Authentication
The API uses Firebase Authentication for user management. All function calls automatically include the user's authentication token when called through the Firebase SDK.

### API Keys
For server-to-server integration, API keys can be generated from the user dashboard:

```javascript
// Using API key (server-side only)
const response = await fetch('https://api.ragpromptlibrary.com/v1/prompts/execute', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer rag_your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt_id: 'prompt_123',
    variables: { name: 'John' }
  })
});
```

## 📈 Rate Limits

- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1,000 requests/hour  
- **Enterprise**: Custom limits

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## 🔗 Related Documentation

- [User Guide](../guides/user-guide.md) - End-user documentation
- [Getting Started](../user-guide/getting-started.md) - Quick start guide
- [Deployment Guide](../deployment/deployment-guide.md) - Production deployment
- [Troubleshooting](../troubleshooting/common-issues.md) - Common issues

## 📞 Support

- **API Issues**: [Report API bugs](https://github.com/your-repo/issues)
- **Feature Requests**: [Request API features](https://github.com/your-repo/issues)
- **Documentation**: [Improve API docs](https://github.com/your-repo/pulls)

---

**Last Updated**: January 2025  
**API Version**: v1  
**Maintained by**: RAG Prompt Library Team
