
# EthosPrompt - API Documentation

## Overview
Complete API documentation for the EthosPrompt production deployment using Firebase Callable Functions.

**Frontend URL:** `https://ethosprompt.web.app`
**Functions Region:** `australia-southeast1`
**Authentication:** Firebase Auth tokens (automatic with Firebase SDK)
**API Type:** Firebase Callable Functions (not REST endpoints)

## Important Note
This API uses Firebase Callable Functions, not traditional REST endpoints. All functions are called through the Firebase SDK using `httpsCallable()`.

## Authentication
Authentication is handled automatically by the Firebase SDK when users are signed in. No manual token headers required.

## Available Functions

### 1. Main API Router Function
**Function Name:** `api`
**Region:** `australia-southeast1`

This is the primary function that routes requests to different endpoints based on the `endpoint` parameter.

**Usage (JavaScript/TypeScript):**
```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase-config';

const apiFunction = httpsCallable(functions, 'api');

// Call with endpoint parameter
const result = await apiFunction({
  endpoint: 'health',
  // additional parameters based on endpoint
});
```

### 2. Health Check
**Endpoint:** `health`
**Purpose:** Check API status and connectivity

**Request:**
```javascript
const result = await apiFunction({ endpoint: 'health' });
```

**Response:**
```json
{
  "status": "success",
  "message": "API working",
  "region": "australia-southeast1"
}
```

### 3. Execute Prompt
**Endpoint:** `execute_prompt`
**Purpose:** Execute a prompt (currently returns mock response)

**Request:**
```javascript
const result = await apiFunction({
  endpoint: 'execute_prompt',
  promptId: 'prompt_123',
  input: {
    productName: 'AI Assistant Pro',
    keyFeatures: ['Natural language processing', 'Real-time responses'],
    targetMarket: 'Enterprise customers'
  },
  settings: {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 500
  }
});
```

**Response:**
```json
{
  "status": "success",
  "message": "Mock execution",
  "region": "australia-southeast1",
  "response": "Test response from Australia"
}
```

**Note:** This endpoint currently returns a mock response. Full AI integration is planned for future releases.

### 4. Test OpenRouter Connection
**Endpoint:** `test_openrouter_connection`
**Purpose:** Test connectivity to OpenRouter AI service

**Request:**
```javascript
const result = await apiFunction({
  endpoint: 'test_openrouter_connection'
});
```

**Response:**
```json
{
  "status": "success",
  "message": "Mock connection",
  "region": "australia-southeast1"
}
```

### 5. Get Available Models
**Endpoint:** `get_available_models`
**Purpose:** Get list of available AI models

**Request:**
```javascript
const result = await apiFunction({
  endpoint: 'get_available_models'
});
```

**Response:**
```json
{
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai",
      "maxTokens": 8192
    },
    {
      "id": "claude-3-sonnet",
      "name": "Claude 3 Sonnet",
      "provider": "anthropic",
      "maxTokens": 200000
    }
  ]
}
```

## Planned Features (Not Yet Implemented)

The following features are documented in other files but are not yet implemented in the current deployment:

- Document upload and processing
- RAG-enhanced prompt execution
- Hybrid search capabilities
- Advanced analytics
- Cost optimization
- Real-time collaboration features

## Error Handling

Firebase Callable Functions automatically handle authentication and provide standardized error responses:

```javascript
try {
  const result = await apiFunction({ endpoint: 'health' });
  console.log(result.data);
} catch (error) {
  console.error('Function call failed:', error);
  // error.code - Firebase error code
  // error.message - Error message
  // error.details - Additional error details
}
```

### Common Error Codes
- `unauthenticated` - User not authenticated
- `permission-denied` - Insufficient permissions
- `invalid-argument` - Invalid request parameters
- `not-found` - Resource not found
- `internal` - Internal server error

## Frontend Integration

### Complete Example
```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app, 'australia-southeast1');

// api-service.js
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase-config';

export class ApiService {
  static apiFunction = httpsCallable(functions, 'api');

  static async healthCheck() {
    const result = await this.apiFunction({ endpoint: 'health' });
    return result.data;
  }

  static async executePrompt(promptData) {
    const result = await this.apiFunction({
      endpoint: 'execute_prompt',
      ...promptData
    });
    return result.data;
  }

  static async testConnection() {
    const result = await this.apiFunction({
      endpoint: 'test_openrouter_connection'
    });
    return result.data;
  }
}
```

## Development vs Production

- **Development**: Functions may return mock responses for testing
- **Production**: Full AI integration planned for future releases
- **Region**: All functions deployed to `australia-southeast1`

## Support
- **Firebase Console**: [https://console.firebase.google.com/project/ethosprompt](https://console.firebase.google.com/project/ethosprompt)
- **Live Application**: [https://ethosprompt.web.app](https://ethosprompt.web.app)
- **Documentation**: See `/docs` folder for additional guides
