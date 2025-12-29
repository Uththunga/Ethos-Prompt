# RAG Prompt Library SDK - Complete Developer Guide

## Overview

The RAG Prompt Library SDK provides comprehensive programmatic access to all platform features across multiple programming languages. This guide covers installation, authentication, and usage examples for all supported SDKs.

## Supported Languages

- **JavaScript/TypeScript** - Full-featured SDK for Node.js and browsers
- **Python** - Complete SDK with async support
- **CLI Tool** - Command-line interface for all operations

---

## JavaScript/TypeScript SDK

### Installation

```bash
npm install @rag-prompt-library/sdk
# or
yarn add @rag-prompt-library/sdk
```

### Quick Start

```typescript
import { RAGPromptLibrary } from '@rag-prompt-library/sdk';

const client = new RAGPromptLibrary({
  apiKey: process.env.RAG_API_KEY,
  baseURL: 'https://api.ragpromptlibrary.com/v1'
});

// Create a prompt
const prompt = await client.prompts.create({
  title: 'Content Generator',
  content: 'Generate engaging content about {{topic}}',
  tags: ['content', 'marketing']
});

// Execute with RAG
const result = await client.prompts.execute(prompt.data.id, {
  input: { topic: 'AI technology' },
  model: 'gpt-4',
  rag_config: {
    document_ids: ['doc_123', 'doc_456'],
    search_mode: 'hybrid'
  }
});

console.log(result.data.output);
```

### Advanced Features

```typescript
// Streaming execution
const stream = await client.prompts.executeStream(promptId, {
  input: { topic: 'Machine Learning' },
  model: 'gpt-4'
});

for await (const chunk of stream) {
  process.stdout.write(chunk.data.content);
}

// Batch operations
const results = await client.prompts.executeBatch([
  { prompt_id: 'prompt_1', input: { topic: 'AI' } },
  { prompt_id: 'prompt_2', input: { topic: 'ML' } }
]);

// Workspace management
const workspace = await client.workspaces.create({
  name: 'Marketing Team',
  description: 'Collaborative space for marketing prompts'
});

await client.workspaces.inviteMember(workspace.data.id, {
  email: 'colleague@company.com',
  role: 'editor'
});
```

---

## Python SDK

### Installation

```bash
pip install rag-prompt-library
```

### Quick Start

```python
from rag_prompt_library import RAGPromptLibrary
import asyncio

client = RAGPromptLibrary(
    api_key="your-api-key",
    base_url="https://api.ragpromptlibrary.com/v1"
)

async def main():
    # Create a prompt
    prompt = await client.prompts.create({
        "title": "Code Generator",
        "content": "Generate {{language}} code for {{task}}",
        "tags": ["coding", "development"]
    })
    
    # Execute with RAG
    result = await client.prompts.execute(prompt.data.id, {
        "input": {"language": "Python", "task": "web scraping"},
        "model": "gpt-4",
        "rag_config": {
            "document_ids": ["doc_789"],
            "search_mode": "semantic"
        }
    })
    
    print(result.data.output)

# Run async function
asyncio.run(main())
```

### Synchronous Usage

```python
# For synchronous operations
from rag_prompt_library.sync import RAGPromptLibrary

client = RAGPromptLibrary(api_key="your-api-key")

# All methods work synchronously
prompts = client.prompts.list()
result = client.prompts.execute(prompt_id, execution_data)
```

---

## CLI Tool

### Installation

```bash
npm install -g @rag-prompt-library/cli
```

### Authentication

```bash
# Login with API key
rag auth login --api-key your-api-key

# Interactive login
rag auth login

# Check status
rag auth status
```

### Managing Prompts

```bash
# List prompts
rag prompts list --limit 20

# Get specific prompt
rag prompts get prompt_123

# Create prompt interactively
rag prompts create

# Create from file
rag prompts create --file prompt.json

# Execute prompt
rag prompts execute prompt_123 --input "Generate content about AI"
```

### Document Management

```bash
# List documents
rag docs list

# Upload document
rag docs upload ./document.pdf

# Upload with metadata
rag docs upload ./research.pdf --tags "research,ai" --description "AI research paper"
```

### Workspace Operations

```bash
# List workspaces
rag workspaces list

# Create workspace
rag workspaces create --name "Dev Team" --description "Development workspace"

# Invite member
rag workspaces invite workspace_123 --email user@company.com --role editor
```

---

## Authentication Methods

### API Key Authentication

```javascript
const client = new RAGPromptLibrary({
  apiKey: 'rag_key_...',
  baseURL: 'https://api.ragpromptlibrary.com/v1'
});
```

### Firebase Auth Token

```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
const token = await user.getIdToken();

const client = new RAGPromptLibrary({
  accessToken: token,
  baseURL: 'https://api.ragpromptlibrary.com/v1'
});
```

### Environment Variables

```bash
export RAG_API_KEY="your-api-key"
export RAG_BASE_URL="https://api.ragpromptlibrary.com/v1"
```

```javascript
// SDK will automatically use environment variables
const client = new RAGPromptLibrary();
```

---

## Error Handling

### JavaScript/TypeScript

```typescript
import { RAGPromptLibraryError } from '@rag-prompt-library/sdk';

try {
  const result = await client.prompts.execute(promptId, data);
} catch (error) {
  if (error instanceof RAGPromptLibraryError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Python

```python
from rag_prompt_library.exceptions import RAGPromptLibraryError

try:
    result = await client.prompts.execute(prompt_id, data)
except RAGPromptLibraryError as e:
    print(f"API Error: {e.message}")
    print(f"Status Code: {e.status_code}")
    print(f"Details: {e.details}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

---

## Configuration Options

### Client Configuration

```typescript
const client = new RAGPromptLibrary({
  apiKey: 'your-api-key',
  baseURL: 'https://api.ragpromptlibrary.com/v1',
  timeout: 30000,        // 30 seconds
  retries: 3,            // Retry failed requests 3 times
  retryDelay: 1000,      // Wait 1 second between retries
  userAgent: 'MyApp/1.0.0'
});
```

### Request Options

```typescript
// Per-request configuration
const result = await client.prompts.execute(promptId, data, {
  timeout: 60000,        // Override timeout for this request
  retries: 5,            // Override retry count
  headers: {             // Additional headers
    'X-Custom-Header': 'value'
  }
});
```

---

## Advanced Usage Examples

### Streaming Responses

```typescript
// Stream prompt execution
const stream = await client.prompts.executeStream(promptId, {
  input: { topic: 'AI trends' },
  model: 'gpt-4'
});

for await (const chunk of stream) {
  if (chunk.type === 'content') {
    process.stdout.write(chunk.data.content);
  } else if (chunk.type === 'usage') {
    console.log('\nTokens used:', chunk.data.total_tokens);
  }
}
```

### Batch Processing

```typescript
// Execute multiple prompts in parallel
const batch = [
  { prompt_id: 'prompt_1', input: { topic: 'AI' } },
  { prompt_id: 'prompt_2', input: { topic: 'ML' } },
  { prompt_id: 'prompt_3', input: { topic: 'DL' } }
];

const results = await client.prompts.executeBatch(batch, {
  max_concurrent: 3,     // Process 3 at a time
  timeout: 120000        // 2 minute timeout per execution
});

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Result ${index + 1}:`, result.data.output);
  } else {
    console.error(`Error ${index + 1}:`, result.error.message);
  }
});
```

### RAG Configuration

```typescript
// Advanced RAG configuration
const result = await client.prompts.execute(promptId, {
  input: { query: 'How does machine learning work?' },
  model: 'gpt-4',
  rag_config: {
    document_ids: ['doc_1', 'doc_2', 'doc_3'],
    search_mode: 'hybrid',           // semantic, keyword, or hybrid
    max_chunks: 10,                  // Maximum chunks to retrieve
    similarity_threshold: 0.7,       // Minimum similarity score
    rerank: true,                    // Enable result reranking
    include_metadata: true           // Include document metadata
  }
});
```

---

## Testing and Development

### Mock Client for Testing

```typescript
import { MockRAGPromptLibrary } from '@rag-prompt-library/sdk/testing';

const mockClient = new MockRAGPromptLibrary();

// Set up mock responses
mockClient.prompts.execute.mockResolvedValue({
  success: true,
  data: {
    execution_id: 'exec_123',
    output: 'Mocked response',
    usage: { total_tokens: 100, cost: 0.002 }
  }
});

// Use in tests
const result = await mockClient.prompts.execute('prompt_123', data);
expect(result.data.output).toBe('Mocked response');
```

### Development Environment

```bash
# Set up development environment
export RAG_BASE_URL="http://localhost:5001/rag-prompt-library/us-central1/api"
export RAG_API_KEY="dev-api-key"

# Enable debug logging
export RAG_DEBUG=true
```

---

## Support and Resources

- **Documentation**: https://docs.ragpromptlibrary.com
- **API Reference**: https://api.ragpromptlibrary.com/docs
- **GitHub**: https://github.com/rag-prompt-library/sdk
- **Support**: support@ragpromptlibrary.com
- **Community**: https://discord.gg/rag-prompt-library

---

## Migration Guide

### From v0.x to v1.0

```typescript
// Old API (v0.x)
const result = await client.executePrompt(promptId, input);

// New API (v1.0)
const result = await client.prompts.execute(promptId, { input });

// Old workspace API
const workspace = await client.createWorkspace(data);

// New workspace API
const workspace = await client.workspaces.create(data);
```

---

This completes the comprehensive SDK guide. All SDKs provide consistent APIs across languages with full TypeScript support, comprehensive error handling, and extensive configuration options.
