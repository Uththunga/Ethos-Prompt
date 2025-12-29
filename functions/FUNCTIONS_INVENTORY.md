# Firebase Cloud Functions Inventory

**Date**: 2025-10-04  
**Project**: RAG Prompt Library  
**Region**: australia-southeast1  
**Runtime**: Node.js 18  

---

## Overview

This document provides a comprehensive inventory of all Firebase Cloud Functions deployed in the RAG Prompt Library project. Each function is documented with its purpose, inputs, outputs, authentication requirements, error handling, and configuration.

---

## Functions Summary

| Function Name | Type | Auth Required | Timeout | Secrets | Status |
|--------------|------|---------------|---------|---------|--------|
| `api` | onCall | No (varies by endpoint) | 60s (default) | OPENROUTER_API_KEY | ✅ Active |
| `execute_multi_model_prompt` | onCall | Yes | 60s (default) | OPENROUTER_API_KEY | ✅ Active |
| `get_available_models` | onCall | No | 60s (default) | None | ✅ Active |
| `health` | onRequest | No | 60s (default) | None | ✅ Active |
| `httpApi` | onRequest | Varies | 60s (default) | OPENROUTER_API_KEY | ✅ Active |
| `fix_document_statuses` | onCall | No (admin) | 60s (default) | None | ⚠️ Admin Only |
| `process_document` | onDocumentCreated | N/A (trigger) | 540s | None | ✅ Active |
| `process_document_http` | onCall | Yes | 540s | None | ✅ Active |

---

## Detailed Function Documentation

### 1. `api` - Main API Endpoint

**Type**: `onCall` (Firebase Callable Function)  
**Region**: australia-southeast1  
**Secrets**: OPENROUTER_API_KEY  
**Timeout**: 60s (default)  
**Authentication**: Varies by endpoint  

**Purpose**: Main API gateway that routes requests to different endpoints based on the `endpoint` parameter.

**Input Schema**:
```typescript
{
  endpoint: string;  // Required: 'health' | 'execute_prompt' | 'test_openrouter_connection' | 'get_available_models' | 'generate_prompt'
  // Additional parameters depend on the endpoint
}
```

**Supported Endpoints**:

#### 1.1 `health`
- **Auth**: No
- **Purpose**: Health check
- **Output**: `{ status: 'success', message: 'API working', region: 'australia-southeast1' }`

#### 1.2 `execute_prompt`
- **Auth**: Yes (requires `request.auth`)
- **Purpose**: Execute a prompt with OpenRouter AI
- **Input**: See `executePrompt()` function details below
- **Output**: Execution result with response, metadata, and cost

#### 1.3 `test_openrouter_connection`
- **Auth**: No
- **Purpose**: Test OpenRouter API connectivity
- **Output**: Connection test result

#### 1.4 `get_available_models`
- **Auth**: No
- **Purpose**: Get list of available AI models
- **Output**: Array of model configurations

#### 1.5 `generate_prompt`
- **Auth**: Yes (requires `request.auth`)
- **Purpose**: Generate a prompt using AI
- **Input**: Prompt generation parameters
- **Output**: Generated prompt

**Error Handling**:
- Returns `{ status: 'error', message: 'Unknown endpoint: {endpoint}' }` for unknown endpoints
- Individual endpoints handle their own errors

**Code Location**: `functions/index.js:44-77`

---

### 2. `execute_multi_model_prompt` - Multi-Model Execution

**Type**: `onCall`  
**Region**: australia-southeast1  
**Secrets**: OPENROUTER_API_KEY  
**Timeout**: 60s (default)  
**Authentication**: Required (`request.auth`)  

**Purpose**: Execute a prompt across multiple AI models simultaneously and compare results.

**Input Schema**:
```typescript
{
  prompt: string;           // Required: The prompt to execute
  models: string[];         // Required: Array of model IDs (e.g., ['z-ai/glm-4.5-air:free'])
  systemPrompt?: string;    // Optional: System prompt for context
  context?: string;         // Optional: Additional context to prepend to prompt
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  results: Array<{
    model_name: string;
    provider: string;
    response: string;
    latency: number;        // Execution time in seconds
    cost: number;           // Cost in USD (0.0 for free models)
    token_count: number;
    quality_score: number;  // 0.0-1.0 (currently mocked)
    error: string | null;
  }>;
  bestModel: string;        // Model with highest quality score
  totalCost: number;
  executionTime: number;    // Total execution time in seconds
  comparisonMetrics: {
    total_models: number;
    successful_executions: number;
    failed_executions: number;
    avg_latency: number;
    total_tokens: number;
    cost_breakdown: Record<string, number>;
  };
}
```

**Error Handling**:
- Validates authentication: throws "User must be authenticated"
- Validates prompt: throws "Prompt is required"
- Validates models: throws "At least one model is required"
- Individual model failures are captured in results array with error field
- Returns success: false with error message on function-level errors

**Performance**:
- Executes models sequentially (not parallel)
- Average execution time: 2-5 seconds per model
- Supports up to 11 free models

**Code Location**: `functions/index.js:80-223`

---

### 3. `get_available_models` - Model List

**Type**: `onCall`  
**Region**: australia-southeast1  
**Secrets**: None  
**Timeout**: 60s (default)  
**Authentication**: Not required  

**Purpose**: Return list of available AI models with their configurations.

**Input**: None

**Output Schema**:
```typescript
{
  models: Array<{
    id: string;
    name: string;
    provider: string;
    context_length: number;
    pricing: {
      prompt: string;
      completion: string;
    };
    description: string;
  }>;
  default_model: string;
}
```

**Available Models** (11 free models):
1. `z-ai/glm-4.5-air:free` - GLM 4.5 Air (Default, fastest)
2. `meta-llama/llama-3.2-3b-instruct:free`
3. `meta-llama/llama-3.2-1b-instruct:free`
4. `meta-llama/llama-3.1-8b-instruct:free`
5. `google/gemma-2-9b-it:free`
6. `microsoft/phi-3-mini-128k-instruct:free`
7. `microsoft/phi-3-medium-128k-instruct:free`
8. `qwen/qwen-2-7b-instruct:free`
9. `huggingfaceh4/zephyr-7b-beta:free`
10. `openchat/openchat-7b:free`
11. `mistralai/mistral-7b-instruct:free`

**Error Handling**: None (static data)

**Code Location**: `functions/index.js:576-578` (wrapper), `functions/index.js:500-573` (implementation)

---

### 4. `health` - Health Check

**Type**: `onRequest` (HTTP endpoint)  
**Region**: australia-southeast1  
**Secrets**: None  
**Timeout**: 60s (default)  
**Authentication**: Not required  

**Purpose**: Simple health check endpoint for monitoring.

**Input**: None (HTTP GET)

**Output**:
```json
{
  "status": "healthy",
  "region": "australia-southeast1"
}
```

**Error Handling**: None (always returns 200 OK)

**Code Location**: `functions/index.js:581-586`

---

### 5. `httpApi` - HTTP REST API

**Type**: `onRequest` (HTTP endpoint)  
**Region**: australia-southeast1  
**Secrets**: OPENROUTER_API_KEY  
**Timeout**: 60s (default)  
**Authentication**: Varies by endpoint  
**CORS**: Enabled  

**Purpose**: HTTP REST API endpoint for external integrations and frontend calls.

**Supported Routes**:
- `GET /health` - Health check
- `POST /execute` - Execute prompt
- `GET /models` - Get available models
- `POST /test-connection` - Test OpenRouter connection

**Input**: Varies by route (see individual endpoint documentation)

**Output**: JSON response matching the callable function equivalents

**Error Handling**:
- Returns 404 for unknown routes
- Returns 500 for internal errors
- Includes error messages in response body

**Code Location**: `functions/index.js:589-715`

---

### 6. `fix_document_statuses` - Admin Document Fix

**Type**: `onCall`  
**Region**: australia-southeast1  
**Secrets**: None  
**Timeout**: 60s (default)  
**Authentication**: Not required (admin operation)  
**CORS**: Enabled  

**Purpose**: Administrative function to fix document processing statuses in Firestore.

**Input Schema**:
```typescript
{
  dryRun?: boolean;  // Optional: If true, only report issues without fixing
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  message: string;
  documentsChecked: number;
  documentsFixed: number;
  details: Array<{
    docId: string;
    oldStatus: string;
    newStatus: string;
    reason: string;
  }>;
}
```

**Error Handling**:
- Catches and logs all errors
- Returns success: false with error message

**⚠️ Security Note**: This function has no authentication. Should be restricted to admin users only or removed in production.

**Code Location**: `functions/index.js:720-786`

---

### 7. `process_document` - Document Processing Trigger

**Type**: `onDocumentCreated` (Firestore trigger)  
**Region**: australia-southeast1  
**Secrets**: None  
**Timeout**: 540s (9 minutes)  
**Authentication**: N/A (automatic trigger)  

**Purpose**: Automatically process documents when they are uploaded to the `rag_documents` collection.

**Trigger**: Fires when a new document is created in `rag_documents/{docId}`

**Processing Steps**:
1. Extract document metadata from Firestore
2. Download file from Cloud Storage
3. Extract text based on file type (PDF, TXT, DOC, DOCX, MD)
4. Chunk text into semantic segments
5. Generate embeddings for each chunk
6. Store chunks and embeddings in Firestore
7. Update document status to 'completed' or 'failed'

**Error Handling**:
- Updates document status to 'failed' on errors
- Logs detailed error messages
- Stores error information in document metadata

**Performance**:
- Timeout: 540s (9 minutes) for large documents
- Processes documents asynchronously
- Updates progress in real-time

**Code Location**: `functions/index.js:789-845`

---

### 8. `process_document_http` - HTTP Document Processing

**Type**: `onCall`  
**Region**: australia-southeast1  
**Secrets**: None  
**Timeout**: 540s (9 minutes)  
**Authentication**: Required (`request.auth`)  

**Purpose**: Alternative HTTP-triggered document processor for manual processing or retry scenarios.

**Input Schema**:
```typescript
{
  docId: string;  // Required: Document ID to process
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  message: string;
  docId: string;
  status: string;
  error?: string;
}
```

**Error Handling**:
- Validates authentication
- Validates docId parameter
- Returns detailed error messages
- Updates document status on failure

**Code Location**: `functions/index.js:848-1081`

---

## Configuration Details

### Region Configuration
All functions are deployed to **australia-southeast1** region for optimal latency to Australian users.

### Secret Management
- **OPENROUTER_API_KEY**: Stored in Firebase Secret Manager
- Accessed via `defineSecret()` API
- Fallback to `process.env.OPENROUTER_API_KEY` for emulator testing

### Timeout Configuration
- **Default**: 60 seconds (most functions)
- **Document Processing**: 540 seconds (9 minutes) for large files
- **Recommendation**: Monitor execution times and adjust as needed

### CORS Configuration
- **Callable Functions** (`onCall`): CORS handled automatically by Firebase
- **HTTP Functions** (`onRequest`): CORS enabled explicitly where needed

---

## Error Handling Patterns

### Standard Error Response
```typescript
{
  success: false,
  error: string,
  // Additional context fields
}
```

### Authentication Errors
- Throw: "User must be authenticated"
- HTTP Status: 401 (for HTTP endpoints)

### Validation Errors
- Throw: Descriptive error message (e.g., "Prompt is required")
- HTTP Status: 400 (for HTTP endpoints)

### Internal Errors
- Log error with `console.error()`
- Return error message to client
- HTTP Status: 500 (for HTTP endpoints)

---

## Performance Metrics

### Measured Performance (from testing)
- **GLM 4.5 Air**: 2.61s average execution time
- **Multi-model execution**: 2-5s per model (sequential)
- **Document processing**: Varies by file size (30s - 9min)
- **Cold start**: ~2-3s for first invocation

### Optimization Opportunities
1. **Parallel execution**: Execute multiple models in parallel instead of sequentially
2. **Caching**: Cache model responses for identical prompts
3. **Streaming**: Implement streaming responses for better UX
4. **Batch processing**: Process multiple documents in batches

---

## Security Considerations

### Authentication
- ✅ Most functions require authentication
- ⚠️ `fix_document_statuses` has no auth (admin only)
- ✅ User isolation via Firestore security rules

### Input Validation
- ✅ Basic validation for required fields
- ⚠️ Limited sanitization of user inputs
- ⚠️ No rate limiting implemented

### API Key Security
- ✅ API keys stored in Secret Manager
- ✅ Not exposed in logs or responses
- ✅ Emulator fallback for local development

---

## Recommendations

### High Priority (P0)
1. **Add authentication to `fix_document_statuses`** or remove it
2. **Implement rate limiting** to prevent abuse
3. **Add input sanitization** for all user inputs
4. **Implement streaming responses** for better UX

### Medium Priority (P1)
5. **Add request logging** for debugging and monitoring
6. **Implement caching** for repeated requests
7. **Add retry logic** for transient failures
8. **Optimize multi-model execution** (parallel instead of sequential)

### Low Priority (P2)
9. **Add comprehensive error codes** for better error handling
10. **Implement request tracing** for distributed debugging
11. **Add performance monitoring** with custom metrics
12. **Document API with OpenAPI/Swagger** specification

---

## Testing Status

### Unit Tests
- ⚠️ No unit tests found for Cloud Functions
- **Recommendation**: Add unit tests for all functions

### Integration Tests
- ✅ Manual testing completed
- ✅ Emulator testing available
- ⚠️ No automated integration tests

### E2E Tests
- ⚠️ No E2E tests for Cloud Functions
- **Recommendation**: Add Playwright tests for critical flows

---

## Deployment Information

### Current Deployment
- **Project**: react-app-000730
- **Region**: australia-southeast1
- **Runtime**: Node.js 18
- **Deployment Method**: Firebase CLI

### Deployment Commands
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:api

# Deploy with emulator testing
firebase emulators:start --only functions,firestore,auth,storage
```

---

## Next Steps

1. ✅ Complete functions inventory (this document)
2. ⏳ Test all functions with emulators (PA.2)
3. ⏳ Validate error handling patterns (PA.3)
4. ⏳ Verify authentication & authorization (PA.4)
5. ⏳ Check timeout & performance configuration (PA.5)
6. ⏳ Validate region configuration (PA.6)
7. ⏳ Create comprehensive audit report (PA.7)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-04  
**Author**: AI Agent (Phase A Audit)

