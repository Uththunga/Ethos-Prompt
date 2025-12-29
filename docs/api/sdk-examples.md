# SDK Examples and Code Samples

Complete code examples for integrating the RAG Prompt Library API into your applications using various programming languages and frameworks.

## JavaScript/Node.js SDK

### Installation

```bash
npm install @rag-prompt-library/sdk
# or
yarn add @rag-prompt-library/sdk
```

### Basic Setup

```javascript
import { RAGPromptLibrary } from '@rag-prompt-library/sdk';

const client = new RAGPromptLibrary({
  apiKey: process.env.RAG_API_KEY,
  baseURL: 'https://api.ragpromptlibrary.com/v1'
});
```

### Creating and Executing Prompts

```javascript
// Create a new prompt
async function createPrompt() {
  try {
    const prompt = await client.prompts.create({
      title: 'Product Description Generator',
      content: `Create a compelling product description for {{product_name}}.
      
      Key features: {{features}}
      Target audience: {{audience}}
      Tone: {{tone}}
      
      Make it engaging and highlight the main benefits.`,
      category: 'marketing',
      tags: ['product', 'description', 'marketing'],
      variables: [
        {
          name: 'product_name',
          type: 'text',
          required: true,
          description: 'Name of the product'
        },
        {
          name: 'features',
          type: 'textarea',
          required: true,
          description: 'Key product features'
        },
        {
          name: 'audience',
          type: 'text',
          required: true,
          description: 'Target audience'
        },
        {
          name: 'tone',
          type: 'select',
          options: ['professional', 'casual', 'enthusiastic', 'technical'],
          required: true,
          description: 'Tone of voice'
        }
      ],
      modelConfig: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 300
      }
    });
    
    console.log('Prompt created:', prompt.id);
    return prompt;
  } catch (error) {
    console.error('Error creating prompt:', error);
    throw error;
  }
}

// Execute a prompt
async function executePrompt(promptId, variables) {
  try {
    const execution = await client.prompts.execute(promptId, {
      variables,
      stream: false
    });
    
    console.log('Execution result:', execution.result);
    console.log('Usage:', execution.usage);
    console.log('Cost:', execution.cost);
    
    return execution;
  } catch (error) {
    console.error('Error executing prompt:', error);
    throw error;
  }
}

// Example usage
async function main() {
  const prompt = await createPrompt();
  
  const result = await executePrompt(prompt.id, {
    product_name: 'Smart Fitness Tracker',
    features: 'Heart rate monitoring, GPS tracking, 7-day battery life, waterproof design',
    audience: 'fitness enthusiasts and health-conscious individuals',
    tone: 'enthusiastic'
  });
  
  console.log('Generated description:', result.result);
}

main().catch(console.error);
```

### Streaming Responses

```javascript
async function executeWithStreaming(promptId, variables) {
  try {
    const stream = await client.prompts.executeStream(promptId, {
      variables,
      onToken: (token) => {
        process.stdout.write(token);
      },
      onComplete: (result) => {
        console.log('\n\nExecution completed:', result.usage);
      },
      onError: (error) => {
        console.error('Streaming error:', error);
      }
    });
    
    return stream;
  } catch (error) {
    console.error('Error with streaming:', error);
    throw error;
  }
}
```

### Document Management

```javascript
// Upload and process document
async function uploadDocument(filePath, metadata = {}) {
  try {
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);
    
    const document = await client.documents.upload({
      file: fileBuffer,
      filename: metadata.filename || 'document.pdf',
      name: metadata.name || 'Uploaded Document',
      description: metadata.description,
      tags: metadata.tags || [],
      folder: metadata.folder
    });
    
    console.log('Document uploaded:', document.id);
    
    // Wait for processing to complete
    const processedDoc = await client.documents.waitForProcessing(document.id, {
      timeout: 300000, // 5 minutes
      pollInterval: 5000 // Check every 5 seconds
    });
    
    console.log('Document processed:', processedDoc.status);
    return processedDoc;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

// Search documents
async function searchDocuments(query, options = {}) {
  try {
    const results = await client.documents.search({
      query,
      documentIds: options.documentIds,
      limit: options.limit || 10,
      threshold: options.threshold || 0.7
    });
    
    console.log(`Found ${results.totalResults} results:`);
    results.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.documentName} (Score: ${result.similarityScore})`);
      console.log(`   Content: ${result.content.substring(0, 100)}...`);
    });
    
    return results;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}
```

## Python SDK

### Installation

```bash
pip install rag-prompt-library
```

### Basic Setup

```python
from rag_prompt_library import RAGPromptLibrary
import os

client = RAGPromptLibrary(
    api_key=os.getenv('RAG_API_KEY'),
    base_url='https://api.ragpromptlibrary.com/v1'
)
```

### Creating and Executing Prompts

```python
import asyncio

async def create_and_execute_prompt():
    # Create prompt
    prompt = await client.prompts.create({
        'title': 'Code Review Assistant',
        'content': '''Review the following {{language}} code and provide feedback:

```{{language}}
{{code}}
```

Focus on:
- Code quality and best practices
- Potential bugs or issues
- Performance improvements
- Security considerations

Provide specific, actionable feedback.''',
        'category': 'development',
        'tags': ['code-review', 'development', 'quality'],
        'variables': [
            {
                'name': 'language',
                'type': 'select',
                'options': ['python', 'javascript', 'java', 'go', 'rust'],
                'required': True,
                'description': 'Programming language'
            },
            {
                'name': 'code',
                'type': 'textarea',
                'required': True,
                'description': 'Code to review'
            }
        ],
        'model_config': {
            'model': 'gpt-4',
            'temperature': 0.3,
            'max_tokens': 800
        }
    })
    
    print(f"Prompt created: {prompt['id']}")
    
    # Execute prompt
    result = await client.prompts.execute(prompt['id'], {
        'variables': {
            'language': 'python',
            'code': '''
def calculate_total(items):
    total = 0
    for item in items:
        total = total + item['price'] * item['quantity']
    return total
'''
        }
    })
    
    print("Code review result:")
    print(result['result'])
    print(f"Cost: ${result['cost']:.4f}")
    
    return result

# Run the example
asyncio.run(create_and_execute_prompt())
```

### Document Processing with RAG

```python
async def rag_workflow_example():
    # Upload document
    with open('technical_documentation.pdf', 'rb') as file:
        document = await client.documents.upload(
            file=file,
            name='Technical Documentation',
            description='API and system documentation',
            tags=['documentation', 'api', 'technical']
        )
    
    print(f"Document uploaded: {document['id']}")
    
    # Wait for processing
    processed_doc = await client.documents.wait_for_processing(
        document['id'],
        timeout=300
    )
    
    print(f"Document processed with {processed_doc['chunks_created']} chunks")
    
    # Create RAG-enabled prompt
    rag_prompt = await client.prompts.create({
        'title': 'Documentation Q&A Assistant',
        'content': '''Based on the uploaded technical documentation, answer the following question:

Question: {{question}}

Instructions:
- Use only information from the provided documentation
- Quote relevant sections when possible
- If the information isn't available, clearly state this
- Provide page numbers or section references when available

Answer:''',
        'category': 'documentation',
        'tags': ['rag', 'documentation', 'qa'],
        'variables': [
            {
                'name': 'question',
                'type': 'textarea',
                'required': True,
                'description': 'Question about the documentation'
            }
        ],
        'document_ids': [document['id']],  # Link to uploaded document
        'model_config': {
            'model': 'gpt-4',
            'temperature': 0.1,
            'max_tokens': 500
        }
    })
    
    # Execute RAG query
    result = await client.prompts.execute(rag_prompt['id'], {
        'variables': {
            'question': 'What are the authentication requirements for the API?'
        }
    })
    
    print("RAG Answer:")
    print(result['result'])
    
    return result

asyncio.run(rag_workflow_example())
```

## React/Frontend Integration

### Installation

```bash
npm install @rag-prompt-library/react-sdk
```

### React Hook Example

```jsx
import React, { useState } from 'react';
import { useRAGPromptLibrary } from '@rag-prompt-library/react-sdk';

function PromptExecutor() {
  const { executePrompt, loading, error } = useRAGPromptLibrary({
    apiKey: process.env.REACT_APP_RAG_API_KEY
  });
  
  const [result, setResult] = useState('');
  const [variables, setVariables] = useState({
    topic: '',
    audience: '',
    tone: 'professional'
  });

  const handleExecute = async () => {
    try {
      const execution = await executePrompt('prompt_123', {
        variables,
        stream: false
      });
      setResult(execution.result);
    } catch (err) {
      console.error('Execution failed:', err);
    }
  };

  return (
    <div className="prompt-executor">
      <h2>Content Generator</h2>
      
      <div className="form-group">
        <label>Topic:</label>
        <input
          type="text"
          value={variables.topic}
          onChange={(e) => setVariables({...variables, topic: e.target.value})}
          placeholder="Enter topic..."
        />
      </div>
      
      <div className="form-group">
        <label>Audience:</label>
        <input
          type="text"
          value={variables.audience}
          onChange={(e) => setVariables({...variables, audience: e.target.value})}
          placeholder="Target audience..."
        />
      </div>
      
      <div className="form-group">
        <label>Tone:</label>
        <select
          value={variables.tone}
          onChange={(e) => setVariables({...variables, tone: e.target.value})}
        >
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="enthusiastic">Enthusiastic</option>
        </select>
      </div>
      
      <button 
        onClick={handleExecute} 
        disabled={loading || !variables.topic || !variables.audience}
      >
        {loading ? 'Generating...' : 'Generate Content'}
      </button>
      
      {error && (
        <div className="error">
          Error: {error.message}
        </div>
      )}
      
      {result && (
        <div className="result">
          <h3>Generated Content:</h3>
          <div className="content">{result}</div>
        </div>
      )}
    </div>
  );
}

export default PromptExecutor;
```

### Streaming Component

```jsx
import React, { useState, useCallback } from 'react';
import { useRAGPromptLibrary } from '@rag-prompt-library/react-sdk';

function StreamingPromptExecutor() {
  const { executePromptStream } = useRAGPromptLibrary();
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStreamExecute = useCallback(async () => {
    setContent('');
    setIsStreaming(true);
    
    try {
      await executePromptStream('prompt_456', {
        variables: { topic: 'AI in healthcare' },
        onToken: (token) => {
          setContent(prev => prev + token);
        },
        onComplete: (result) => {
          setIsStreaming(false);
          console.log('Streaming completed:', result.usage);
        },
        onError: (error) => {
          setIsStreaming(false);
          console.error('Streaming error:', error);
        }
      });
    } catch (error) {
      setIsStreaming(false);
      console.error('Failed to start streaming:', error);
    }
  }, [executePromptStream]);

  return (
    <div className="streaming-executor">
      <button onClick={handleStreamExecute} disabled={isStreaming}>
        {isStreaming ? 'Generating...' : 'Start Streaming'}
      </button>
      
      <div className="streaming-content">
        {content}
        {isStreaming && <span className="cursor">|</span>}
      </div>
    </div>
  );
}
```

## PHP Integration

```php
<?php
require_once 'vendor/autoload.php';

use RAGPromptLibrary\Client;

$client = new Client([
    'api_key' => $_ENV['RAG_API_KEY'],
    'base_url' => 'https://api.ragpromptlibrary.com/v1'
]);

// Create and execute prompt
function createBlogPostPrompt($client) {
    $prompt = $client->prompts->create([
        'title' => 'Blog Post Generator',
        'content' => 'Write a {{word_count}}-word blog post about {{topic}} for {{audience}}. 
                     Use a {{tone}} tone and include {{key_points}}.',
        'category' => 'content',
        'tags' => ['blog', 'content', 'writing'],
        'variables' => [
            [
                'name' => 'topic',
                'type' => 'text',
                'required' => true,
                'description' => 'Blog post topic'
            ],
            [
                'name' => 'word_count',
                'type' => 'number',
                'required' => true,
                'description' => 'Target word count'
            ],
            [
                'name' => 'audience',
                'type' => 'text',
                'required' => true,
                'description' => 'Target audience'
            ],
            [
                'name' => 'tone',
                'type' => 'select',
                'options' => ['professional', 'casual', 'technical'],
                'required' => true,
                'description' => 'Writing tone'
            ],
            [
                'name' => 'key_points',
                'type' => 'textarea',
                'required' => false,
                'description' => 'Key points to cover'
            ]
        ]
    ]);
    
    return $prompt;
}

// Execute prompt
function executeBlogPrompt($client, $promptId) {
    $result = $client->prompts->execute($promptId, [
        'variables' => [
            'topic' => 'Sustainable Web Development',
            'word_count' => 800,
            'audience' => 'web developers and tech professionals',
            'tone' => 'professional',
            'key_points' => 'Green hosting, efficient code, performance optimization'
        ]
    ]);
    
    return $result;
}

try {
    $prompt = createBlogPostPrompt($client);
    echo "Prompt created: " . $prompt['id'] . "\n";
    
    $result = executeBlogPrompt($client, $prompt['id']);
    echo "Generated blog post:\n";
    echo $result['result'] . "\n";
    echo "Cost: $" . number_format($result['cost'], 4) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
```

## Error Handling Best Practices

### JavaScript/Node.js

```javascript
class RAGPromptLibraryError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'RAGPromptLibraryError';
    this.code = code;
    this.details = details;
  }
}

async function robustPromptExecution(promptId, variables, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await client.prompts.execute(promptId, { variables });
      return result;
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (error.code === 'MODEL_UNAVAILABLE') {
        console.log('Model unavailable, trying with different model...');
        // Fallback to different model
        const fallbackResult = await client.prompts.execute(promptId, {
          variables,
          modelConfig: { model: 'gpt-3.5-turbo' }
        });
        return fallbackResult;
      }
      
      if (attempt === retries) {
        throw new RAGPromptLibraryError(
          `Failed after ${retries} attempts: ${error.message}`,
          error.code,
          error.details
        );
      }
    }
  }
}
```

### Python

```python
import asyncio
import logging
from typing import Optional, Dict, Any

class RAGPromptLibraryError(Exception):
    def __init__(self, message: str, code: str, details: Optional[Dict] = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}

async def robust_prompt_execution(
    client,
    prompt_id: str,
    variables: Dict[str, Any],
    max_retries: int = 3
) -> Dict[str, Any]:
    """Execute prompt with retry logic and error handling."""
    
    for attempt in range(1, max_retries + 1):
        try:
            result = await client.prompts.execute(prompt_id, {
                'variables': variables
            })
            return result
            
        except Exception as error:
            logging.warning(f"Attempt {attempt} failed: {error}")
            
            if hasattr(error, 'code'):
                if error.code == 'RATE_LIMIT_EXCEEDED':
                    wait_time = 2 ** attempt  # Exponential backoff
                    logging.info(f"Rate limited. Waiting {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
                    
                elif error.code == 'MODEL_UNAVAILABLE':
                    logging.info("Model unavailable, trying fallback...")
                    result = await client.prompts.execute(prompt_id, {
                        'variables': variables,
                        'model_config': {'model': 'gpt-3.5-turbo'}
                    })
                    return result
            
            if attempt == max_retries:
                raise RAGPromptLibraryError(
                    f"Failed after {max_retries} attempts: {str(error)}",
                    getattr(error, 'code', 'UNKNOWN_ERROR'),
                    getattr(error, 'details', {})
                )
```

## Next Steps

- [Integration Guides for Popular Frameworks](integration-guides.md)
- [API Reference Documentation](api-reference.md)
- [Webhook Implementation Examples](webhooks.md)
- [Performance Optimization Tips](performance.md)

---

**Need help with integration?** Check our [community forum](https://community.ragpromptlibrary.com) or [contact support](mailto:support@ragpromptlibrary.com).
