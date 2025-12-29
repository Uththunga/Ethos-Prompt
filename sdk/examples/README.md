# RAG Prompt Library SDK Examples

This directory contains examples for using the RAG Prompt Library SDKs in various programming languages.

## JavaScript/TypeScript Examples

### Basic Usage

```typescript
import { RAGPromptLibraryClient } from '@rag-prompt-library/sdk';

// Initialize client with API key
const client = new RAGPromptLibraryClient({
  apiKey: 'rag_your_api_key_here'
});

// Test connection
const testResult = await client.test();
console.log('Connection test:', testResult);

// Get all prompts
const prompts = await client.getPrompts();
console.log('Prompts:', prompts.data);

// Get prompts with filtering
const filteredPrompts = await client.getPrompts({
  search: 'customer service',
  category: 'support',
  tags: ['email', 'response'],
  page: 1,
  limit: 10
});

// Create a new prompt
const newPrompt = await client.createPrompt({
  title: 'Customer Email Response',
  content: 'Dear {{customer_name}}, Thank you for contacting us about {{issue_type}}...',
  description: 'Template for customer service email responses',
  category: 'support',
  tags: ['email', 'customer-service'],
  variables: [
    {
      name: 'customer_name',
      type: 'text',
      description: 'Customer name',
      required: true
    },
    {
      name: 'issue_type',
      type: 'select',
      description: 'Type of issue',
      required: true,
      options: ['billing', 'technical', 'general']
    }
  ],
  is_public: false
});

console.log('Created prompt:', newPrompt.data);

// Update a prompt
const updatedPrompt = await client.updatePrompt('prompt_id', {
  title: 'Updated Customer Email Response',
  tags: ['email', 'customer-service', 'updated']
});

// Delete a prompt
await client.deletePrompt('prompt_id');
```

### Error Handling

```typescript
import { RAGPromptLibraryClient, RAGPromptLibraryError } from '@rag-prompt-library/sdk';

const client = new RAGPromptLibraryClient({
  apiKey: 'rag_your_api_key_here'
});

try {
  const prompt = await client.getPrompt('non_existent_id');
} catch (error) {
  if (error instanceof RAGPromptLibraryError) {
    console.error('API Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Working with Documents

```typescript
// Get all documents
const documents = await client.getDocuments();

// Filter by status
const processingDocs = await client.getDocuments({
  status: 'processing'
});

// Get specific document
const document = await client.getDocument('document_id');

// Delete document
await client.deleteDocument('document_id');
```

## Python Examples

### Basic Usage

```python
from rag_prompt_library import RAGPromptLibraryClient, Variable, VariableType

# Initialize client with API key
client = RAGPromptLibraryClient(api_key="rag_your_api_key_here")

# Test connection
test_result = client.test_connection()
print("Connection test:", test_result)

# Get all prompts
prompts = client.get_prompts()
print(f"Found {len(prompts)} prompts")

# Get prompts with filtering
filtered_prompts = client.get_prompts(
    search="customer service",
    category="support",
    tags=["email", "response"],
    page=1,
    limit=10
)

# Create a new prompt with variables
variables = [
    Variable(
        name="customer_name",
        type=VariableType.TEXT,
        description="Customer name",
        required=True
    ),
    Variable(
        name="issue_type",
        type=VariableType.SELECT,
        description="Type of issue",
        required=True,
        options=["billing", "technical", "general"]
    )
]

new_prompt = client.create_prompt(
    title="Customer Email Response",
    content="Dear {{customer_name}}, Thank you for contacting us about {{issue_type}}...",
    description="Template for customer service email responses",
    category="support",
    tags=["email", "customer-service"],
    variables=variables,
    is_public=False
)

print(f"Created prompt: {new_prompt.id}")

# Update a prompt
updated_prompt = client.update_prompt(
    prompt_id=new_prompt.id,
    title="Updated Customer Email Response",
    tags=["email", "customer-service", "updated"]
)

# Delete a prompt
success = client.delete_prompt(new_prompt.id)
print(f"Prompt deleted: {success}")
```

### Context Manager Usage

```python
from rag_prompt_library import RAGPromptLibraryClient

# Use context manager for automatic cleanup
with RAGPromptLibraryClient(api_key="rag_your_api_key_here") as client:
    prompts = client.get_prompts()
    print(f"Found {len(prompts)} prompts")
    
    for prompt in prompts[:5]:  # Show first 5 prompts
        print(f"- {prompt.title} (ID: {prompt.id})")
```

### Error Handling

```python
from rag_prompt_library import (
    RAGPromptLibraryClient,
    RAGPromptLibraryError,
    AuthenticationError,
    NotFoundError,
    RateLimitError
)

client = RAGPromptLibraryClient(api_key="rag_your_api_key_here")

try:
    prompt = client.get_prompt("non_existent_id")
except NotFoundError as e:
    print(f"Prompt not found: {e.message}")
except AuthenticationError as e:
    print(f"Authentication failed: {e.message}")
except RateLimitError as e:
    print(f"Rate limit exceeded: {e.message}")
    print(f"Retry after: {e.details.get('retry_after')} seconds")
except RAGPromptLibraryError as e:
    print(f"API error: {e.message} (Code: {e.code})")
except Exception as e:
    print(f"Unexpected error: {e}")
```

### Working with Documents

```python
# Get all documents
documents = client.get_documents()

# Filter by status
processing_docs = client.get_documents(status="processing")

# Get specific document
document = client.get_document("document_id")
print(f"Document: {document.filename} ({document.status.value})")

# Delete document
success = client.delete_document("document_id")
```

### Async Usage (Python)

```python
import asyncio
from rag_prompt_library import AsyncRAGPromptLibraryClient

async def main():
    async with AsyncRAGPromptLibraryClient(api_key="rag_your_api_key_here") as client:
        # Test connection
        test_result = await client.test_connection()
        print("Connection test:", test_result)
        
        # Get prompts
        prompts = await client.get_prompts()
        print(f"Found {len(prompts)} prompts")
        
        # Create multiple prompts concurrently
        tasks = []
        for i in range(3):
            task = client.create_prompt(
                title=f"Test Prompt {i+1}",
                content=f"This is test prompt number {i+1}",
                category="test"
            )
            tasks.append(task)
        
        created_prompts = await asyncio.gather(*tasks)
        print(f"Created {len(created_prompts)} prompts")

# Run async example
asyncio.run(main())
```

## Configuration Examples

### Environment Variables

```bash
# Set environment variables
export RAG_PROMPT_LIBRARY_API_KEY="rag_your_api_key_here"
export RAG_PROMPT_LIBRARY_BASE_URL="https://your-custom-endpoint.com/api"
```

```python
import os
from rag_prompt_library import RAGPromptLibraryClient

# Client will automatically use environment variables
client = RAGPromptLibraryClient(
    api_key=os.getenv("RAG_PROMPT_LIBRARY_API_KEY"),
    base_url=os.getenv("RAG_PROMPT_LIBRARY_BASE_URL", "https://us-central1-rag-prompt-library.cloudfunctions.net/api")
)
```

### Custom Configuration

```typescript
const client = new RAGPromptLibraryClient({
  baseURL: 'https://your-custom-endpoint.com/api',
  apiKey: 'rag_your_api_key_here',
  timeout: 60000,  // 60 seconds
  retries: 5       // Retry failed requests 5 times
});
```

```python
client = RAGPromptLibraryClient(
    base_url="https://your-custom-endpoint.com/api",
    api_key="rag_your_api_key_here",
    timeout=60.0,  # 60 seconds
    retries=5      # Retry failed requests 5 times
)
```

## Best Practices

### 1. Use Environment Variables for API Keys

Never hardcode API keys in your source code. Use environment variables or secure configuration management.

### 2. Handle Rate Limits Gracefully

```python
import time
from rag_prompt_library import RateLimitError

def get_prompts_with_retry(client, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client.get_prompts()
        except RateLimitError as e:
            if attempt < max_retries - 1:
                retry_after = e.details.get('retry_after', 60)
                print(f"Rate limited. Waiting {retry_after} seconds...")
                time.sleep(retry_after)
            else:
                raise
```

### 3. Use Context Managers

Always use context managers (Python) or proper cleanup (JavaScript) to ensure resources are released.

### 4. Implement Proper Error Handling

Handle different types of errors appropriately and provide meaningful feedback to users.

### 5. Paginate Large Results

When fetching large datasets, use pagination to avoid memory issues and improve performance.

```python
def get_all_prompts(client):
    all_prompts = []
    page = 1
    limit = 50
    
    while True:
        prompts = client.get_prompts(page=page, limit=limit)
        if not prompts:
            break
        
        all_prompts.extend(prompts)
        page += 1
        
        # Break if we got fewer results than requested (last page)
        if len(prompts) < limit:
            break
    
    return all_prompts
```

## Testing

### Unit Tests

```python
import pytest
from unittest.mock import Mock, patch
from rag_prompt_library import RAGPromptLibraryClient

def test_get_prompts():
    with patch('httpx.Client') as mock_client:
        # Mock response
        mock_response = Mock()
        mock_response.is_success = True
        mock_response.json.return_value = {
            'success': True,
            'data': [
                {
                    'id': 'test_id',
                    'title': 'Test Prompt',
                    'content': 'Test content',
                    'user_id': 'user_123'
                }
            ]
        }
        mock_client.return_value.request.return_value = mock_response
        
        client = RAGPromptLibraryClient(api_key="test_key")
        prompts = client.get_prompts()
        
        assert len(prompts) == 1
        assert prompts[0].title == 'Test Prompt'
```

### Integration Tests

```python
import pytest
from rag_prompt_library import RAGPromptLibraryClient

@pytest.fixture
def client():
    return RAGPromptLibraryClient(api_key="test_api_key")

def test_health_check(client):
    """Test that health check works"""
    health = client.health()
    assert health['status'] == 'healthy'

def test_create_and_delete_prompt(client):
    """Test creating and deleting a prompt"""
    # Create prompt
    prompt = client.create_prompt(
        title="Test Prompt",
        content="Test content"
    )
    assert prompt.title == "Test Prompt"
    
    # Delete prompt
    success = client.delete_prompt(prompt.id)
    assert success is True
```

For more examples and detailed documentation, visit [https://docs.rag-prompt-library.com](https://docs.rag-prompt-library.com).
