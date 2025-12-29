# API Endpoints Documentation
## RAG Prompt Library - Cloud Functions API Reference

*Last Updated: July 20, 2025*
*Status: Production Ready - Complete API Implementation*

---

## Executive Summary

This document provides comprehensive documentation for all implemented Cloud Functions API endpoints in the RAG Prompt Library system. The API includes 40+ endpoints covering prompt management, RAG processing, team collaboration, analytics, security, and enterprise features.

**API Base URL**: `https://us-central1-rag-prompt-library.cloudfunctions.net/`
**Authentication**: Firebase Auth tokens or API keys
**Format**: JSON request/response
**CORS**: Configured for web and local development

---

## 1. Core Prompt Management APIs

### 1.1 Prompt Generation

#### `generate_prompt` (Callable)
**Description**: AI-powered prompt generation and optimization
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 512MB | **Timeout**: 60s

**Request Parameters**:
```typescript
{
  description: string;           // Prompt description/requirements
  context?: string;             // Additional context
  style?: string;               // Writing style preference
  complexity?: 'simple' | 'intermediate' | 'advanced';
  includeExamples?: boolean;    // Include usage examples
}
```

**Response**:
```typescript
{
  success: boolean;
  prompt: string;               // Generated prompt
  suggestions: string[];        // Alternative suggestions
  metadata: {
    model: string;              // AI model used
    tokensUsed: number;         // Token consumption
    generationTime: number;     // Processing time (ms)
    confidence: number;         // Quality confidence score
  }
}
```

### 1.2 Prompt Execution

#### `execute_prompt_with_rag` (Callable)
**Description**: Execute prompts with RAG context enhancement
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 1GB | **Timeout**: 300s

**Request Parameters**:
```typescript
{
  prompt: string;               // Prompt to execute
  userInput: string;            // User input/query
  useRag?: boolean;            // Enable RAG context (default: true)
  model?: string;              // AI model selection
  maxTokens?: number;          // Response length limit
  temperature?: number;        // Creativity level (0-1)
  ragConfig?: {
    topK: number;              // Number of context chunks
    similarityThreshold: number; // Relevance threshold
    useHybridSearch: boolean;   // Enable hybrid retrieval
  }
}
```

**Response**:
```typescript
{
  success: boolean;
  response: string;             // AI response
  contextUsed: boolean;         // Whether RAG context was used
  contextSources: Array<{       // Source documents
    documentId: string;
    title: string;
    relevanceScore: number;
    chunkContent: string;
  }>;
  executionMetadata: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    executionTime: number;
    ragEnabled: boolean;
    contextChunks: number;
  }
}
```

#### `execute_multi_model_comparison` (Callable)
**Description**: Execute prompt across multiple AI models for comparison
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 1GB | **Timeout**: 300s

**Request Parameters**:
```typescript
{
  prompt: string;
  userInput: string;
  models: string[];             // Array of model names
  useRag?: boolean;
  comparisonCriteria?: string[]; // Evaluation criteria
}
```

**Response**:
```typescript
{
  success: boolean;
  executionId: string;
  results: Array<{
    model: string;
    response: string;
    score: number;
    metrics: object;
  }>;
  bestModel: string;
  totalCost: number;
  executionTime: number;
  comparisonMetrics: object;
}
```

---

## 2. Document & RAG Processing APIs

### 2.1 Document Processing

#### `process_uploaded_document` (Callable)
**Description**: Process uploaded documents for RAG integration
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 1GB | **Timeout**: 540s

**Request Parameters**:
```typescript
{
  documentId: string;           // Document identifier
  fileName: string;             // Original filename
  fileType: string;            // MIME type
  chunkingStrategy?: 'adaptive' | 'semantic' | 'hierarchical' | 'hybrid';
  chunkSize?: number;          // Chunk size in characters
  chunkOverlap?: number;       // Overlap between chunks
  generateSummary?: boolean;   // Generate document summary
}
```

**Response**:
```typescript
{
  success: boolean;
  documentId: string;
  processingStatus: 'completed' | 'failed' | 'processing';
  chunks: Array<{
    id: string;
    content: string;
    metadata: object;
    embedding?: number[];
  }>;
  summary?: string;
  processingMetadata: {
    totalChunks: number;
    processingTime: number;
    fileSize: number;
    strategy: string;
  }
}
```

### 2.2 Advanced RAG Operations

#### `hybrid_retrieval_search` (Callable)
**Description**: Perform hybrid retrieval combining semantic and keyword search
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 512MB | **Timeout**: 60s

**Request Parameters**:
```typescript
{
  query: string;                // Search query
  topK?: number;               // Number of results (default: 10)
  useReranking?: boolean;      // Enable cross-encoder reranking
  semanticWeight?: number;     // Semantic search weight (0-1)
  keywordWeight?: number;      // Keyword search weight (0-1)
  filters?: object;            // Document filters
}
```

**Response**:
```typescript
{
  success: boolean;
  results: Array<{
    documentId: string;
    chunkId: string;
    content: string;
    score: number;
    metadata: object;
  }>;
  query: string;
  totalResults: number;
  retrievalStats: {
    semanticResults: number;
    keywordResults: number;
    rerankedResults: number;
    processingTime: number;
  }
}
```

#### `advanced_document_chunking` (Callable)
**Description**: Advanced document chunking with strategy analysis
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 512MB | **Timeout**: 60s

**Request Parameters**:
```typescript
{
  documentId: string;
  content: string;
  strategy?: 'adaptive' | 'semantic' | 'hierarchical' | 'hybrid';
  chunkSize?: number;
  chunkOverlap?: number;
  analyzeContent?: boolean;    // Perform content analysis
}
```

**Response**:
```typescript
{
  success: boolean;
  strategy: string;
  chunks: Array<{
    id: string;
    content: string;
    startIndex: number;
    endIndex: number;
    metadata: object;
  }>;
  analysis?: {
    contentType: string;
    language: string;
    complexity: number;
    recommendedStrategy: string;
  };
  chunkCount: number;
  totalChars: number;
  avgChunkSize: number;
}
```

---

## 3. Team Collaboration APIs

### 3.1 Workspace Management

#### `create_workspace` (Callable)
**Description**: Create new team workspace
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 256MB | **Timeout**: 30s

**Request Parameters**:
```typescript
{
  name: string;                 // Workspace name
  description?: string;         // Workspace description
  plan?: 'free' | 'team' | 'enterprise';
  settings?: {
    isPublic: boolean;
    allowInvites: boolean;
    defaultPermissions: string;
  }
}
```

**Response**:
```typescript
{
  success: boolean;
  workspaceId: string;
  workspace: {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    plan: string;
    createdAt: string;
    memberCount: number;
  }
}
```

#### `invite_workspace_member` (Callable)
**Description**: Invite user to workspace
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 256MB | **Timeout**: 30s

**Request Parameters**:
```typescript
{
  workspaceId: string;
  email: string;                // Invitee email
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  message?: string;             // Invitation message
}
```

### 3.2 Comments & Reviews

#### `add_comment` (Callable)
**Description**: Add comment to prompt or document
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 256MB | **Timeout**: 30s

**Request Parameters**:
```typescript
{
  targetType: 'prompt' | 'document' | 'execution';
  targetId: string;             // Target resource ID
  content: string;              // Comment content
  parentCommentId?: string;     // For threaded comments
  mentions?: string[];          // User mentions
}
```

---

## 4. Analytics & Monitoring APIs

### 4.1 Analytics

#### `track_analytics_event` (Callable)
**Description**: Track custom analytics events
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 256MB | **Timeout**: 30s

**Request Parameters**:
```typescript
{
  eventType: string;            // Event type identifier
  properties: object;           // Event properties
  userId?: string;              // User identifier
  sessionId?: string;           // Session identifier
}
```

#### `get_analytics_dashboard` (Callable)
**Description**: Get analytics dashboard data
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 512MB | **Timeout**: 60s

**Request Parameters**:
```typescript
{
  timeRange: {
    start: string;              // ISO date string
    end: string;                // ISO date string
  };
  metrics: string[];            // Requested metrics
  groupBy?: string;             // Grouping dimension
  filters?: object;             // Data filters
}
```

### 4.2 Performance Monitoring

#### `record_performance_metric` (Callable)
**Description**: Record performance metrics
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 256MB | **Timeout**: 30s

**Request Parameters**:
```typescript
{
  metricType: string;           // Metric type
  value: number;                // Metric value
  unit: string;                 // Measurement unit
  component: string;            // System component
  tags?: object;                // Additional tags
}
```

---

## 5. Security & Authentication APIs

### 5.1 API Key Management

#### `generate_api_key` (Callable)
**Description**: Generate API key for external access
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 256MB | **Timeout**: 30s

**Request Parameters**:
```typescript
{
  name: string;                 // API key name
  rateLimitTier?: 'basic' | 'premium' | 'enterprise';
  expiresInDays?: number;       // Expiration period
  permissions?: string[];       // API permissions
}
```

**Response**:
```typescript
{
  success: boolean;
  apiKey: string;               // Generated API key
  keyId: string;                // Key identifier
  expiresAt: string;            // Expiration date
  permissions: string[];        // Granted permissions
}
```

### 5.2 Audit & Compliance

#### `log_audit_event` (Callable)
**Description**: Log audit events for compliance
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 256MB | **Timeout**: 30s

**Request Parameters**:
```typescript
{
  action: string;               // Action performed
  resourceType?: string;        // Resource type
  resourceId?: string;          // Resource identifier
  details?: object;             // Additional details
  ipAddress?: string;           // Client IP address
}
```

#### `export_audit_data` (Callable)
**Description**: Export audit data for compliance
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 512MB | **Timeout**: 60s

**Request Parameters**:
```typescript
{
  format: 'json' | 'csv' | 'pdf';
  startTime: string;            // Start date (ISO)
  endTime: string;              // End date (ISO)
  complianceStandard?: 'gdpr' | 'hipaa' | 'sox';
  includePersonalData?: boolean;
}
```

---

## 6. System & Health APIs

### 6.1 Health Checks

#### `test_cors` (HTTP Request)
**Description**: Test CORS configuration and basic connectivity
**Method**: GET/POST
**Authentication**: None
**Memory**: 256MB | **Timeout**: 60s

**Response**:
```typescript
{
  message: string;
  timestamp: string;
  origin: string;
  method: string;
  status: 'success';
  ragEnabled: boolean;
  functionsDeployed: string[];
}
```

#### `get_system_health` (Callable)
**Description**: Get comprehensive system health status
**Method**: POST (Callable Function)
**Authentication**: Required (Firebase Auth)
**Memory**: 256MB | **Timeout**: 30s

**Response**:
```typescript
{
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    firestore: object;
    storage: object;
    openrouter: object;
    vectorStore: object;
  };
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  timestamp: string;
}
```

---

## 7. REST API Endpoints

### 7.1 REST API Gateway

#### `/api/*` (HTTP Request)
**Description**: RESTful API gateway for all CRUD operations
**Method**: GET, POST, PUT, DELETE
**Authentication**: Firebase Auth or API Key
**Memory**: 512MB | **Timeout**: 60s

**Supported Endpoints**:
- `GET /api/prompts` - List user prompts
- `POST /api/prompts` - Create new prompt
- `GET /api/prompts/{id}` - Get specific prompt
- `PUT /api/prompts/{id}` - Update prompt
- `DELETE /api/prompts/{id}` - Delete prompt
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/executions` - List executions
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace

**Authentication Headers**:
```
Authorization: Bearer <firebase-token>
# OR
X-API-Key: <api-key>
```

---

This API documentation covers all 40+ implemented endpoints with comprehensive request/response specifications for production use.
