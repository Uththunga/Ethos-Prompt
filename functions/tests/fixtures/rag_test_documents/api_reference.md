# API Reference - RAG Prompt Library

## Base URL

```
https://australia-southeast1-react-app-000730.cloudfunctions.net
```

## Authentication

All API requests require authentication using Firebase ID tokens.

### Getting an ID Token

```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
const idToken = await user.getIdToken();
```

### Using the Token

Include the token in the Authorization header:

```
Authorization: Bearer <your-id-token>
```

## Endpoints

### Prompts

#### Create Prompt

**Endpoint**: `POST /createPrompt`

**Request Body**:
```json
{
  "title": "Content Generator",
  "content": "Generate a {{type}} about {{topic}}",
  "description": "Generates various types of content",
  "tags": ["content", "generation"],
  "category": "writing",
  "isPublic": false
}
```

**Response**:
```json
{
  "success": true,
  "promptId": "prompt_abc123",
  "message": "Prompt created successfully"
}
```

#### Get Prompt

**Endpoint**: `POST /getPrompt`

**Request Body**:
```json
{
  "promptId": "prompt_abc123"
}
```

**Response**:
```json
{
  "success": true,
  "prompt": {
    "id": "prompt_abc123",
    "title": "Content Generator",
    "content": "Generate a {{type}} about {{topic}}",
    "description": "Generates various types of content",
    "tags": ["content", "generation"],
    "category": "writing",
    "userId": "user_xyz789",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### List Prompts

**Endpoint**: `POST /listPrompts`

**Request Body**:
```json
{
  "limit": 20,
  "offset": 0,
  "category": "writing",
  "tags": ["content"]
}
```

**Response**:
```json
{
  "success": true,
  "prompts": [
    {
      "id": "prompt_abc123",
      "title": "Content Generator",
      "description": "Generates various types of content",
      "tags": ["content", "generation"],
      "category": "writing"
    }
  ],
  "total": 45,
  "hasMore": true
}
```

#### Update Prompt

**Endpoint**: `POST /updatePrompt`

**Request Body**:
```json
{
  "promptId": "prompt_abc123",
  "updates": {
    "title": "Advanced Content Generator",
    "tags": ["content", "generation", "ai"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Prompt updated successfully"
}
```

#### Delete Prompt

**Endpoint**: `POST /deletePrompt`

**Request Body**:
```json
{
  "promptId": "prompt_abc123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Prompt deleted successfully"
}
```

### Execution

#### Execute Prompt

**Endpoint**: `POST /executePrompt`

**Request Body**:
```json
{
  "promptId": "prompt_abc123",
  "variables": {
    "type": "blog post",
    "topic": "artificial intelligence"
  },
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 1000,
  "ragEnabled": true,
  "documentIds": ["doc_123", "doc_456"],
  "ragConfig": {
    "topK": 5,
    "similarityThreshold": 0.7,
    "searchMode": "hybrid"
  }
}
```

**Response**:
```json
{
  "success": true,
  "executionId": "exec_xyz789",
  "output": "Artificial Intelligence (AI) is transforming...",
  "metadata": {
    "model": "gpt-4",
    "tokensUsed": 856,
    "cost": 0.0428,
    "latency": 3.2,
    "ragEnabled": true,
    "retrievedChunks": 5,
    "contextTokens": 1200
  },
  "sources": [
    {
      "documentId": "doc_123",
      "documentName": "AI Overview.pdf",
      "relevanceScore": 0.89
    }
  ]
}
```

#### Execute Prompt (Streaming)

**Endpoint**: `POST /executePromptStream`

**Request Body**: Same as Execute Prompt

**Response**: Server-Sent Events (SSE) stream

```
event: start
data: {"executionId": "exec_xyz789"}

event: chunk
data: {"content": "Artificial "}

event: chunk
data: {"content": "Intelligence "}

event: complete
data: {"tokensUsed": 856, "cost": 0.0428}
```

#### Get Execution

**Endpoint**: `POST /getExecution`

**Request Body**:
```json
{
  "executionId": "exec_xyz789"
}
```

**Response**:
```json
{
  "success": true,
  "execution": {
    "id": "exec_xyz789",
    "promptId": "prompt_abc123",
    "userId": "user_xyz789",
    "input": {
      "type": "blog post",
      "topic": "artificial intelligence"
    },
    "output": "Artificial Intelligence (AI) is transforming...",
    "model": "gpt-4",
    "tokensUsed": 856,
    "cost": 0.0428,
    "latency": 3.2,
    "status": "completed",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

### Documents

#### Upload Document

**Endpoint**: `POST /uploadDocument`

**Request**: Multipart form data

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'AI Research Paper');
formData.append('description', 'Latest research on transformers');
formData.append('tags', JSON.stringify(['ai', 'research']));

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`
  },
  body: formData
});
```

**Response**:
```json
{
  "success": true,
  "documentId": "doc_abc123",
  "message": "Document uploaded successfully",
  "processingStatus": "pending"
}
```

#### Get Document

**Endpoint**: `POST /getDocument`

**Request Body**:
```json
{
  "documentId": "doc_abc123"
}
```

**Response**:
```json
{
  "success": true,
  "document": {
    "id": "doc_abc123",
    "title": "AI Research Paper",
    "description": "Latest research on transformers",
    "fileName": "transformer_paper.pdf",
    "fileSize": 2458624,
    "mimeType": "application/pdf",
    "tags": ["ai", "research"],
    "userId": "user_xyz789",
    "processingStatus": "completed",
    "chunkCount": 45,
    "createdAt": "2024-01-15T09:00:00Z"
  }
}
```

#### List Documents

**Endpoint**: `POST /listDocuments`

**Request Body**:
```json
{
  "limit": 20,
  "offset": 0,
  "tags": ["ai"]
}
```

**Response**:
```json
{
  "success": true,
  "documents": [
    {
      "id": "doc_abc123",
      "title": "AI Research Paper",
      "fileName": "transformer_paper.pdf",
      "fileSize": 2458624,
      "processingStatus": "completed",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ],
  "total": 12,
  "hasMore": false
}
```

#### Delete Document

**Endpoint**: `POST /deleteDocument`

**Request Body**:
```json
{
  "documentId": "doc_abc123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "Prompt ID is required",
    "details": {
      "field": "promptId",
      "reason": "missing"
    }
  }
}
```

### Error Codes

- `UNAUTHENTICATED`: Missing or invalid authentication token
- `PERMISSION_DENIED`: User doesn't have permission for this operation
- `NOT_FOUND`: Requested resource not found
- `INVALID_ARGUMENT`: Invalid request parameters
- `RESOURCE_EXHAUSTED`: Rate limit exceeded
- `INTERNAL`: Internal server error

## Rate Limits

- **Free Tier**: 100 requests per hour
- **Pro Tier**: 1000 requests per hour
- **Enterprise**: Custom limits

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642248000
```

## Webhooks

Configure webhooks to receive notifications for events.

### Events

- `document.processing.completed`
- `document.processing.failed`
- `execution.completed`
- `execution.failed`

### Webhook Payload

```json
{
  "event": "document.processing.completed",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "documentId": "doc_abc123",
    "userId": "user_xyz789",
    "chunkCount": 45
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { RAGPromptLibrary } from '@rag-prompt-library/sdk';

const client = new RAGPromptLibrary({
  apiKey: process.env.API_KEY
});

// Execute prompt
const result = await client.prompts.execute('prompt_abc123', {
  variables: { topic: 'AI' },
  model: 'gpt-4',
  ragEnabled: true
});
```

### Python

```python
from rag_prompt_library import RAGPromptLibrary

client = RAGPromptLibrary(api_key=os.getenv('API_KEY'))

# Execute prompt
result = client.prompts.execute(
    prompt_id='prompt_abc123',
    variables={'topic': 'AI'},
    model='gpt-4',
    rag_enabled=True
)
```

## Support

For API support, contact: api-support@example.com

