# RAG Prompt Library API Documentation

The RAG Prompt Library API provides programmatic access to all platform features, enabling seamless integration with your existing workflows and applications.

## Quick Start

### Authentication

All API requests require authentication using API keys:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.ragpromptlibrary.com/v1/prompts
```

### Base URL

```
Production: https://api.ragpromptlibrary.com/v1
Staging: https://staging-api.ragpromptlibrary.com/v1
```

### API Key Management

1. **Generate API Key**: Go to Settings > API Keys in your dashboard
2. **Key Types**:
   - **Read-only**: Access prompts and documents (read operations)
   - **Read-write**: Full access including create, update, delete
   - **Admin**: Full access plus user management (team accounts)

3. **Security Best Practices**:
   - Store keys securely (environment variables)
   - Rotate keys regularly
   - Use read-only keys when possible
   - Monitor key usage in dashboard

## Core Endpoints

### Prompts API

#### List Prompts
```http
GET /prompts
```

**Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `category` (string): Filter by category
- `tags` (array): Filter by tags
- `search` (string): Search in title and content

**Response:**
```json
{
  "data": [
    {
      "id": "prompt_123",
      "title": "Social Media Post Generator",
      "content": "Create an engaging post about {{topic}}...",
      "category": "marketing",
      "tags": ["social-media", "content"],
      "variables": [
        {
          "name": "topic",
          "type": "text",
          "required": true,
          "description": "Main topic of the post"
        }
      ],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "user_id": "user_456",
      "is_public": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Create Prompt
```http
POST /prompts
```

**Request Body:**
```json
{
  "title": "Email Subject Line Generator",
  "content": "Create a compelling email subject line for {{campaign_type}} targeting {{audience}}. The subject should be {{tone}} and include {{key_benefit}}.",
  "category": "marketing",
  "tags": ["email", "marketing", "subject-lines"],
  "variables": [
    {
      "name": "campaign_type",
      "type": "select",
      "options": ["newsletter", "promotion", "announcement"],
      "required": true,
      "description": "Type of email campaign"
    },
    {
      "name": "audience",
      "type": "text",
      "required": true,
      "description": "Target audience description"
    },
    {
      "name": "tone",
      "type": "select",
      "options": ["professional", "casual", "urgent", "friendly"],
      "required": true,
      "description": "Desired tone of the subject line"
    },
    {
      "name": "key_benefit",
      "type": "text",
      "required": false,
      "description": "Main benefit to highlight"
    }
  ],
  "model_config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 100
  },
  "is_public": false
}
```

**Response:**
```json
{
  "id": "prompt_789",
  "title": "Email Subject Line Generator",
  "content": "Create a compelling email subject line...",
  "category": "marketing",
  "tags": ["email", "marketing", "subject-lines"],
  "variables": [...],
  "model_config": {...},
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z",
  "user_id": "user_456",
  "is_public": false
}
```

#### Execute Prompt
```http
POST /prompts/{prompt_id}/execute
```

**Request Body:**
```json
{
  "variables": {
    "campaign_type": "promotion",
    "audience": "small business owners",
    "tone": "urgent",
    "key_benefit": "50% discount"
  },
  "model_config": {
    "temperature": 0.8
  },
  "stream": false
}
```

**Response:**
```json
{
  "execution_id": "exec_abc123",
  "result": "🚨 Last 24 Hours: 50% Off Everything for Small Business Owners!",
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 12,
    "total_tokens": 57
  },
  "model": "gpt-4",
  "cost": 0.00171,
  "execution_time": 1.2,
  "created_at": "2024-01-15T11:05:00Z"
}
```

### Documents API

#### Upload Document
```http
POST /documents
```

**Request (multipart/form-data):**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@document.pdf" \
  -F "name=Marketing Strategy 2024" \
  -F "description=Comprehensive marketing strategy document" \
  -F "tags=marketing,strategy,2024" \
  -F "folder=marketing-materials" \
  https://api.ragpromptlibrary.com/v1/documents
```

**Response:**
```json
{
  "id": "doc_xyz789",
  "name": "Marketing Strategy 2024",
  "filename": "document.pdf",
  "size": 2048576,
  "type": "application/pdf",
  "description": "Comprehensive marketing strategy document",
  "tags": ["marketing", "strategy", "2024"],
  "folder": "marketing-materials",
  "status": "processing",
  "upload_url": "https://storage.ragpromptlibrary.com/documents/doc_xyz789.pdf",
  "created_at": "2024-01-15T11:10:00Z",
  "user_id": "user_456"
}
```

#### Document Status
```http
GET /documents/{document_id}/status
```

**Response:**
```json
{
  "id": "doc_xyz789",
  "status": "ready",
  "processing_progress": 100,
  "chunks_created": 25,
  "processing_time": 45.2,
  "error": null,
  "metadata": {
    "pages": 12,
    "word_count": 3450,
    "language": "en",
    "content_type": "business_document"
  }
}
```

#### Search Documents
```http
GET /documents/search
```

**Parameters:**
- `query` (string): Search query
- `document_ids` (array): Specific documents to search
- `limit` (integer): Number of results (default: 10)
- `threshold` (float): Similarity threshold (0.0-1.0)

**Response:**
```json
{
  "query": "marketing strategy for small businesses",
  "results": [
    {
      "document_id": "doc_xyz789",
      "document_name": "Marketing Strategy 2024",
      "chunk_id": "chunk_123",
      "content": "Small businesses should focus on digital marketing channels that provide the highest ROI...",
      "similarity_score": 0.89,
      "page_number": 5,
      "section": "Digital Marketing Strategies"
    }
  ],
  "total_results": 15,
  "search_time": 0.045
}
```

### Executions API

#### List Executions
```http
GET /executions
```

**Parameters:**
- `prompt_id` (string): Filter by prompt
- `start_date` (string): ISO date string
- `end_date` (string): ISO date string
- `status` (string): success, error, pending

**Response:**
```json
{
  "data": [
    {
      "id": "exec_abc123",
      "prompt_id": "prompt_789",
      "prompt_title": "Email Subject Line Generator",
      "variables": {
        "campaign_type": "promotion",
        "audience": "small business owners"
      },
      "result": "🚨 Last 24 Hours: 50% Off Everything for Small Business Owners!",
      "status": "success",
      "usage": {
        "prompt_tokens": 45,
        "completion_tokens": 12,
        "total_tokens": 57
      },
      "cost": 0.00171,
      "execution_time": 1.2,
      "model": "gpt-4",
      "created_at": "2024-01-15T11:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

### Analytics API

#### Usage Statistics
```http
GET /analytics/usage
```

**Parameters:**
- `period` (string): day, week, month, year
- `start_date` (string): ISO date string
- `end_date` (string): ISO date string

**Response:**
```json
{
  "period": "month",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "summary": {
    "total_executions": 1250,
    "total_cost": 45.67,
    "total_tokens": 125000,
    "unique_prompts": 45,
    "avg_execution_time": 1.8
  },
  "daily_breakdown": [
    {
      "date": "2024-01-01",
      "executions": 42,
      "cost": 1.23,
      "tokens": 4200
    }
  ],
  "top_prompts": [
    {
      "prompt_id": "prompt_789",
      "title": "Email Subject Line Generator",
      "executions": 156,
      "cost": 8.45
    }
  ],
  "model_usage": {
    "gpt-4": {
      "executions": 800,
      "cost": 35.20,
      "tokens": 80000
    },
    "gpt-3.5-turbo": {
      "executions": 450,
      "cost": 10.47,
      "tokens": 45000
    }
  }
}
```

## Error Handling

### HTTP Status Codes

```
200 OK - Request successful
201 Created - Resource created successfully
400 Bad Request - Invalid request parameters
401 Unauthorized - Invalid or missing API key
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
429 Too Many Requests - Rate limit exceeded
500 Internal Server Error - Server error
503 Service Unavailable - Service temporarily unavailable
```

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "The request contains invalid parameters",
    "details": {
      "field": "variables.topic",
      "issue": "Required field is missing"
    },
    "request_id": "req_123456789"
  }
}
```

### Common Error Codes

```
INVALID_API_KEY - API key is invalid or expired
INSUFFICIENT_PERMISSIONS - API key lacks required permissions
RATE_LIMIT_EXCEEDED - Too many requests in time window
INVALID_PARAMETERS - Request parameters are invalid
RESOURCE_NOT_FOUND - Requested resource doesn't exist
PROCESSING_ERROR - Error during document processing
MODEL_UNAVAILABLE - Requested AI model is unavailable
QUOTA_EXCEEDED - Account quota or limits exceeded
```

## Rate Limiting

### Limits by Plan

```
Free Plan:
- 100 requests per hour
- 1,000 requests per day

Pro Plan:
- 1,000 requests per hour
- 10,000 requests per day

Enterprise Plan:
- 10,000 requests per hour
- 100,000 requests per day
```

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
X-RateLimit-Window: 3600
```

### Handling Rate Limits

```javascript
// Example: Exponential backoff
async function makeAPIRequest(url, options, retries = 3) {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const waitTime = Math.min(Math.pow(2, 4 - retries) * 1000, 60000);
      
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return makeAPIRequest(url, options, retries - 1);
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}
```

## Webhooks

### Event Types

```
prompt.created - New prompt created
prompt.updated - Prompt modified
prompt.executed - Prompt execution completed
document.uploaded - Document upload completed
document.processed - Document processing finished
execution.completed - Prompt execution finished
execution.failed - Prompt execution failed
```

### Webhook Configuration

```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/rag-prompt-library",
  "events": ["prompt.executed", "document.processed"],
  "secret": "your_webhook_secret",
  "active": true
}
```

### Webhook Payload Example

```json
{
  "event": "prompt.executed",
  "timestamp": "2024-01-15T11:05:00Z",
  "data": {
    "execution_id": "exec_abc123",
    "prompt_id": "prompt_789",
    "user_id": "user_456",
    "status": "success",
    "result": "Generated content...",
    "usage": {
      "total_tokens": 57,
      "cost": 0.00171
    }
  },
  "signature": "sha256=abc123..."
}
```

## Next Steps

- [SDK Examples and Code Samples](sdk-examples.md)
- [Integration Guides](integration-guides.md)
- [API Reference (OpenAPI Spec)](api-reference.yaml)
- [Postman Collection](postman-collection.json)

---

**Ready to integrate?** Start with our [SDK examples](sdk-examples.md) or explore the [interactive API explorer](https://api.ragpromptlibrary.com/docs).
