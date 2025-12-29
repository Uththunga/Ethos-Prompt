# RAG Prompt Library - Complete API Reference

## Base Information

**Base URL:** `https://api.ragpromptlibrary.com/v1`  
**Authentication:** Bearer token (API Key)  
**Content-Type:** `application/json`

## Authentication

### Generate API Key
```http
POST /auth/api-keys
Authorization: Bearer <user_token>
```

**Request Body:**
```json
{
  "name": "My Integration Key",
  "permissions": ["read", "write"],
  "expires_at": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "id": "key_123",
  "name": "My Integration Key",
  "key": "rag_sk_1234567890abcdef",
  "permissions": ["read", "write"],
  "created_at": "2024-01-15T10:00:00Z",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

## Prompts API

### List Prompts
```http
GET /prompts?page=1&limit=20&category=marketing&tags=social-media&search=content
```

### Get Prompt
```http
GET /prompts/{prompt_id}
```

### Create Prompt
```http
POST /prompts
```

### Update Prompt
```http
PUT /prompts/{prompt_id}
```

### Delete Prompt
```http
DELETE /prompts/{prompt_id}
```

### Execute Prompt
```http
POST /prompts/{prompt_id}/execute
```

**Request Body:**
```json
{
  "variables": {
    "topic": "AI technology",
    "audience": "developers"
  },
  "model_config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 500
  },
  "rag_config": {
    "document_ids": ["doc_123"],
    "search_mode": "hybrid",
    "max_chunks": 5
  },
  "stream": false
}
```

### Execute Prompt (Streaming)
```http
POST /prompts/{prompt_id}/execute-stream
```

## Documents API

### List Documents
```http
GET /documents?page=1&limit=20&folder=marketing&tags=strategy
```

### Upload Document
```http
POST /documents
Content-Type: multipart/form-data
```

### Get Document
```http
GET /documents/{document_id}
```

### Update Document
```http
PUT /documents/{document_id}
```

### Delete Document
```http
DELETE /documents/{document_id}
```

### Document Status
```http
GET /documents/{document_id}/status
```

### Search Documents
```http
GET /documents/search?query=marketing+strategy&limit=10&threshold=0.7
```

### Get Document Chunks
```http
GET /documents/{document_id}/chunks?page=1&limit=50
```

## Workspaces API

### List Workspaces
```http
GET /workspaces
```

### Create Workspace
```http
POST /workspaces
```

**Request Body:**
```json
{
  "name": "Marketing Team",
  "description": "Workspace for marketing content creation",
  "settings": {
    "default_model": "gpt-4",
    "allow_public_prompts": false,
    "require_approval": true
  }
}
```

### Get Workspace
```http
GET /workspaces/{workspace_id}
```

### Update Workspace
```http
PUT /workspaces/{workspace_id}
```

### Delete Workspace
```http
DELETE /workspaces/{workspace_id}
```

### List Workspace Members
```http
GET /workspaces/{workspace_id}/members
```

### Invite Member
```http
POST /workspaces/{workspace_id}/members
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "editor",
  "message": "Welcome to our marketing workspace!"
}
```

### Update Member Role
```http
PUT /workspaces/{workspace_id}/members/{user_id}
```

### Remove Member
```http
DELETE /workspaces/{workspace_id}/members/{user_id}
```

## Executions API

### List Executions
```http
GET /executions?prompt_id=prompt_123&start_date=2024-01-01&end_date=2024-01-31
```

### Get Execution
```http
GET /executions/{execution_id}
```

### Cancel Execution
```http
POST /executions/{execution_id}/cancel
```

## Analytics API

### Usage Statistics
```http
GET /analytics/usage?period=month&start_date=2024-01-01&end_date=2024-01-31
```

### Prompt Performance
```http
GET /analytics/prompts/{prompt_id}/performance
```

### Workspace Analytics
```http
GET /analytics/workspaces/{workspace_id}
```

### Cost Analysis
```http
GET /analytics/costs?period=month&group_by=model
```

## Folders API

### List Folders
```http
GET /folders?workspace_id=ws_123
```

### Create Folder
```http
POST /folders
```

### Update Folder
```http
PUT /folders/{folder_id}
```

### Delete Folder
```http
DELETE /folders/{folder_id}
```

## Templates API

### List Templates
```http
GET /templates?category=marketing&featured=true
```

### Get Template
```http
GET /templates/{template_id}
```

### Create Prompt from Template
```http
POST /templates/{template_id}/create-prompt
```

## Webhooks API

### List Webhooks
```http
GET /webhooks
```

### Create Webhook
```http
POST /webhooks
```

### Update Webhook
```http
PUT /webhooks/{webhook_id}
```

### Delete Webhook
```http
DELETE /webhooks/{webhook_id}
```

### Test Webhook
```http
POST /webhooks/{webhook_id}/test
```

## User Management API

### Get Current User
```http
GET /user
```

### Update User Profile
```http
PUT /user
```

### Get User Preferences
```http
GET /user/preferences
```

### Update User Preferences
```http
PUT /user/preferences
```

## Billing API

### Get Subscription
```http
GET /billing/subscription
```

### Get Usage
```http
GET /billing/usage?period=current
```

### Get Invoices
```http
GET /billing/invoices
```

## Status Codes

- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limits

- **Free Plan**: 100 requests/hour, 1,000 requests/day
- **Pro Plan**: 1,000 requests/hour, 10,000 requests/day
- **Enterprise Plan**: 10,000 requests/hour, 100,000 requests/day

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "variables.topic",
      "issue": "Required field is missing"
    },
    "request_id": "req_123456789"
  }
}
```
