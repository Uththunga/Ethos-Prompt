# SDK Best Practices and Advanced Examples

## Performance Optimization

### Connection Pooling (Node.js)

```javascript
import { RAGPromptLibrary } from '@rag-prompt-library/sdk';
import { Agent } from 'https';

const client = new RAGPromptLibrary({
  apiKey: process.env.RAG_API_KEY,
  httpAgent: new Agent({
    keepAlive: true,
    maxSockets: 10,
    timeout: 30000
  })
});
```

### Batch Operations

```javascript
// Batch prompt executions
async function batchExecutePrompts(executions) {
  const promises = executions.map(({ promptId, variables }) =>
    client.prompts.execute(promptId, { variables })
      .catch(error => ({ error, promptId }))
  );
  
  const results = await Promise.allSettled(promises);
  return results.map((result, index) => ({
    ...executions[index],
    result: result.status === 'fulfilled' ? result.value : result.reason
  }));
}
```

### Caching Strategy

```javascript
import NodeCache from 'node-cache';

class CachedRAGClient {
  constructor(options) {
    this.client = new RAGPromptLibrary(options);
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes
  }
  
  async executePrompt(promptId, variables, useCache = true) {
    const cacheKey = `${promptId}:${JSON.stringify(variables)}`;
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }
    
    const result = await this.client.prompts.execute(promptId, { variables });
    
    if (useCache && result.cost < 0.01) { // Cache cheap executions
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }
}
```

## Error Handling Patterns

### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const circuitBreaker = new CircuitBreaker();

async function safeExecutePrompt(promptId, variables) {
  return circuitBreaker.execute(() =>
    client.prompts.execute(promptId, { variables })
  );
}
```

### Retry with Exponential Backoff

```javascript
async function executeWithRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error; // Don't retry non-retryable errors
    }
  }
}
```

## Advanced RAG Patterns

### Multi-Document RAG with Ranking

```javascript
async function intelligentRAGSearch(query, documentIds, options = {}) {
  // Search across multiple documents
  const searchResults = await client.documents.search({
    query,
    documentIds,
    limit: options.maxChunks || 20,
    threshold: options.threshold || 0.7
  });
  
  // Rank and filter results
  const rankedResults = searchResults.results
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, options.topK || 5);
  
  // Group by document for context
  const contextByDocument = rankedResults.reduce((acc, result) => {
    if (!acc[result.documentId]) {
      acc[result.documentId] = [];
    }
    acc[result.documentId].push(result);
    return acc;
  }, {});
  
  return {
    results: rankedResults,
    contextByDocument,
    totalDocuments: Object.keys(contextByDocument).length
  };
}
```

### Streaming with Progress Tracking

```javascript
class StreamingExecutor {
  constructor(client) {
    this.client = client;
    this.activeStreams = new Map();
  }
  
  async executeWithProgress(promptId, variables, callbacks = {}) {
    const executionId = `exec_${Date.now()}_${Math.random()}`;
    let tokenCount = 0;
    let startTime = Date.now();
    
    const progressTracker = {
      executionId,
      startTime,
      tokenCount: 0,
      estimatedCompletion: null
    };
    
    this.activeStreams.set(executionId, progressTracker);
    
    try {
      const result = await this.client.prompts.executeStream(promptId, {
        variables,
        onToken: (token) => {
          tokenCount++;
          progressTracker.tokenCount = tokenCount;
          
          // Estimate completion based on token rate
          const elapsed = Date.now() - startTime;
          const tokensPerMs = tokenCount / elapsed;
          const estimatedTotal = tokenCount / 0.7; // Assume 70% complete
          const remainingTokens = estimatedTotal - tokenCount;
          progressTracker.estimatedCompletion = Date.now() + (remainingTokens / tokensPerMs);
          
          callbacks.onToken?.(token);
          callbacks.onProgress?.(progressTracker);
        },
        onComplete: (result) => {
          this.activeStreams.delete(executionId);
          callbacks.onComplete?.(result);
        },
        onError: (error) => {
          this.activeStreams.delete(executionId);
          callbacks.onError?.(error);
        }
      });
      
      return result;
    } catch (error) {
      this.activeStreams.delete(executionId);
      throw error;
    }
  }
  
  getActiveStreams() {
    return Array.from(this.activeStreams.values());
  }
  
  cancelStream(executionId) {
    this.activeStreams.delete(executionId);
    // Implementation would depend on SDK support for cancellation
  }
}
```

## Python Advanced Patterns

### Async Context Manager

```python
import asyncio
import aiohttp
from contextlib import asynccontextmanager

class AsyncRAGClient:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.session = None
    
    @asynccontextmanager
    async def session_context(self):
        if not self.session:
            self.session = aiohttp.ClientSession(
                headers={'Authorization': f'Bearer {self.api_key}'},
                timeout=aiohttp.ClientTimeout(total=30)
            )
        try:
            yield self.session
        finally:
            if self.session:
                await self.session.close()
                self.session = None

# Usage
async def main():
    client = AsyncRAGClient(api_key, base_url)
    
    async with client.session_context() as session:
        # Multiple operations using the same session
        tasks = [
            execute_prompt(session, 'prompt_1', {'topic': 'AI'}),
            execute_prompt(session, 'prompt_2', {'topic': 'ML'}),
            execute_prompt(session, 'prompt_3', {'topic': 'Data'})
        ]
        results = await asyncio.gather(*tasks)
```

### Dataclass Integration

```python
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from datetime import datetime

@dataclass
class PromptVariable:
    name: str
    type: str
    required: bool = True
    description: Optional[str] = None
    options: Optional[List[str]] = None

@dataclass
class PromptConfig:
    title: str
    content: str
    category: str
    tags: List[str]
    variables: List[PromptVariable]
    model_config: Optional[Dict[str, Any]] = None
    
    def to_api_format(self):
        data = asdict(self)
        data['variables'] = [asdict(var) for var in self.variables]
        return data

@dataclass
class ExecutionResult:
    execution_id: str
    result: str
    usage: Dict[str, int]
    cost: float
    execution_time: float
    created_at: datetime
    
    @classmethod
    def from_api_response(cls, response_data):
        return cls(
            execution_id=response_data['execution_id'],
            result=response_data['result'],
            usage=response_data['usage'],
            cost=response_data['cost'],
            execution_time=response_data['execution_time'],
            created_at=datetime.fromisoformat(response_data['created_at'].replace('Z', '+00:00'))
        )

# Usage
prompt_config = PromptConfig(
    title="Product Description Generator",
    content="Create a description for {{product_name}}",
    category="marketing",
    tags=["product", "description"],
    variables=[
        PromptVariable(name="product_name", type="text", description="Product name")
    ]
)

prompt = await client.prompts.create(prompt_config.to_api_format())
```

## Testing Strategies

### Mock Client for Testing

```javascript
class MockRAGClient {
  constructor(responses = {}) {
    this.responses = responses;
    this.calls = [];
  }
  
  prompts = {
    execute: async (promptId, options) => {
      this.calls.push({ method: 'execute', promptId, options });
      
      const response = this.responses[promptId] || {
        execution_id: 'mock_exec_123',
        result: 'Mock response',
        usage: { total_tokens: 50 },
        cost: 0.001
      };
      
      return response;
    }
  };
  
  getCalls() {
    return this.calls;
  }
  
  reset() {
    this.calls = [];
  }
}

// Test usage
describe('Prompt Service', () => {
  let mockClient;
  
  beforeEach(() => {
    mockClient = new MockRAGClient({
      'prompt_123': {
        execution_id: 'exec_123',
        result: 'Expected test result',
        usage: { total_tokens: 25 },
        cost: 0.0005
      }
    });
  });
  
  test('should execute prompt with correct parameters', async () => {
    const result = await mockClient.prompts.execute('prompt_123', {
      variables: { topic: 'testing' }
    });
    
    expect(result.result).toBe('Expected test result');
    expect(mockClient.getCalls()).toHaveLength(1);
  });
});
```

## Monitoring and Observability

### Request Logging

```javascript
class LoggingRAGClient {
  constructor(options) {
    this.client = new RAGPromptLibrary(options);
    this.logger = options.logger || console;
  }
  
  async executePrompt(promptId, variables) {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random()}`;
    
    this.logger.info('Prompt execution started', {
      requestId,
      promptId,
      variableCount: Object.keys(variables).length
    });
    
    try {
      const result = await this.client.prompts.execute(promptId, { variables });
      
      this.logger.info('Prompt execution completed', {
        requestId,
        promptId,
        executionTime: Date.now() - startTime,
        tokenCount: result.usage.total_tokens,
        cost: result.cost
      });
      
      return result;
    } catch (error) {
      this.logger.error('Prompt execution failed', {
        requestId,
        promptId,
        error: error.message,
        executionTime: Date.now() - startTime
      });
      
      throw error;
    }
  }
}
```
