# API Integration Examples
## RAG Prompt Library - Code Examples & Integration Patterns

*Last Updated: July 20, 2025*
*Status: Production Ready - Complete Integration Guide*

---

## Executive Summary

This document provides comprehensive code examples and integration patterns for the RAG Prompt Library API. Examples cover frontend-backend communication, third-party integrations, authentication patterns, and common use cases for developers integrating with the system.

---

## 1. Frontend-Backend Integration

### 1.1 Firebase Auth Integration (React)

**Authentication Service**:
```typescript
// src/services/authService.ts
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  User 
} from 'firebase/auth';
import { auth } from '../config/firebase';

export class AuthService {
  private googleProvider = new GoogleAuthProvider();

  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async loginWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      return result.user;
    } catch (error) {
      throw new Error(`Google login failed: ${error.message}`);
    }
  }

  async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return await user.getIdToken();
  }
}
```

### 1.2 API Client Service

**Cloud Functions Client**:
```typescript
// src/services/apiClient.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AuthService } from './authService';

export class APIClient {
  private functions = getFunctions();
  private authService = new AuthService();

  async callFunction<T = any>(functionName: string, data: any = {}): Promise<T> {
    try {
      const callable = httpsCallable(this.functions, functionName);
      const result = await callable(data);
      return result.data as T;
    } catch (error) {
      console.error(`Function call failed: ${functionName}`, error);
      throw error;
    }
  }

  // Prompt Management
  async generatePrompt(description: string, options: any = {}): Promise<any> {
    return this.callFunction('generate_prompt', {
      description,
      ...options
    });
  }

  async executePrompt(prompt: string, userInput: string, options: any = {}): Promise<any> {
    return this.callFunction('execute_prompt_with_rag', {
      prompt,
      userInput,
      useRag: true,
      ...options
    });
  }

  // Document Management
  async processDocument(documentId: string, options: any = {}): Promise<any> {
    return this.callFunction('process_uploaded_document', {
      documentId,
      chunkingStrategy: 'adaptive',
      ...options
    });
  }

  // RAG Operations
  async hybridSearch(query: string, options: any = {}): Promise<any> {
    return this.callFunction('hybrid_retrieval_search', {
      query,
      topK: 10,
      useReranking: true,
      ...options
    });
  }
}
```

### 1.3 React Hook Integration

**Custom Hooks for API Integration**:
```typescript
// src/hooks/usePrompts.ts
import { useState, useEffect } from 'react';
import { APIClient } from '../services/apiClient';

export const usePrompts = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiClient = new APIClient();

  const generatePrompt = async (description: string, options: any = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.generatePrompt(description, options);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const executePrompt = async (prompt: string, userInput: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.executePrompt(prompt, userInput);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    prompts,
    loading,
    error,
    generatePrompt,
    executePrompt
  };
};
```

---

## 2. REST API Integration

### 2.1 REST Client Implementation

**HTTP Client with Authentication**:
```typescript
// src/services/restClient.ts
export class RESTClient {
  private baseURL = 'https://us-central1-rag-prompt-library.cloudfunctions.net/api';
  private authService = new AuthService();

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.authService.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: await this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Prompt operations
  async getPrompts(): Promise<any[]> {
    return this.get('/prompts');
  }

  async createPrompt(promptData: any): Promise<any> {
    return this.post('/prompts', promptData);
  }

  async updatePrompt(promptId: string, updates: any): Promise<any> {
    return this.post(`/prompts/${promptId}`, updates);
  }

  // Document operations
  async getDocuments(): Promise<any[]> {
    return this.get('/documents');
  }

  async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = await this.authService.getAuthToken();
    const response = await fetch(`${this.baseURL}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    return response.json();
  }
}
```

### 2.2 API Key Authentication

**External API Integration with API Keys**:
```typescript
// External service integration
export class ExternalAPIClient {
  private apiKey: string;
  private baseURL = 'https://us-central1-rag-prompt-library.cloudfunctions.net/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey
    };
  }

  async executePrompt(prompt: string, input: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        prompt,
        userInput: input,
        useRag: true
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async searchDocuments(query: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        query,
        topK: 10
      })
    });

    return response.json();
  }
}
```

---

## 3. Third-Party Integrations

### 3.1 OpenRouter Integration

**Multi-Model AI Integration**:
```python
# Backend integration with OpenRouter
import openai
from typing import Dict, List, Any

class OpenRouterClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1"
        
    async def execute_prompt(self, prompt: str, model: str = "nvidia/llama-3.1-nemotron-ultra-253b-v1:free") -> Dict[str, Any]:
        """Execute prompt using OpenRouter API"""
        
        client = openai.AsyncOpenAI(
            base_url=self.base_url,
            api_key=self.api_key
        )
        
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            return {
                'success': True,
                'response': response.choices[0].message.content,
                'model': model,
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
```

### 3.2 Webhook Integration

**Webhook Handler Implementation**:
```python
# Webhook integration for external services
from flask import Flask, request, jsonify
import hmac
import hashlib

class WebhookHandler:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        
    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature"""
        expected_signature = hmac.new(
            self.secret_key.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(f"sha256={expected_signature}", signature)
    
    def handle_webhook(self, request_data: dict) -> dict:
        """Process webhook payload"""
        event_type = request_data.get('event_type')
        
        if event_type == 'prompt_executed':
            return self.handle_prompt_execution(request_data)
        elif event_type == 'document_processed':
            return self.handle_document_processing(request_data)
        else:
            return {'status': 'ignored', 'reason': 'unknown_event_type'}
    
    def handle_prompt_execution(self, data: dict) -> dict:
        """Handle prompt execution webhook"""
        execution_id = data.get('execution_id')
        result = data.get('result')
        
        # Process the execution result
        # Update database, send notifications, etc.
        
        return {'status': 'processed', 'execution_id': execution_id}
```

---

## 4. Error Handling & Retry Logic

### 4.1 Robust Error Handling

**Error Handling Patterns**:
```typescript
// Frontend error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIClientWithRetry {
  private maxRetries = 3;
  private retryDelay = 1000;

  async callWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(this.retryDelay);
        return this.callWithRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, 5xx errors, rate limits
    return (
      error.code === 'NETWORK_ERROR' ||
      (error.status >= 500 && error.status < 600) ||
      error.status === 429
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executePromptWithRetry(prompt: string, input: string): Promise<any> {
    return this.callWithRetry(async () => {
      const apiClient = new APIClient();
      return apiClient.executePrompt(prompt, input);
    });
  }
}
```

### 4.2 Circuit Breaker Pattern

**Circuit Breaker Implementation**:
```typescript
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000,
    private monitoringPeriod = 10000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
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

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

---

## 5. Real-Time Integration

### 5.1 Firestore Real-Time Listeners

**Real-Time Data Synchronization**:
```typescript
// Real-time prompt updates
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export class RealTimeService {
  private unsubscribers: (() => void)[] = [];

  subscribeToUserPrompts(userId: string, callback: (prompts: any[]) => void): () => void {
    const q = query(
      collection(db, 'prompts'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prompts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(prompts);
    });

    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  subscribeToExecutions(promptId: string, callback: (executions: any[]) => void): () => void {
    const q = query(
      collection(db, 'executions'),
      where('promptId', '==', promptId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const executions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(executions);
    });

    return unsubscribe;
  }

  cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }
}
```

### 5.2 WebSocket Integration

**Real-Time Notifications**:
```typescript
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string): void {
    const wsUrl = `wss://your-websocket-endpoint.com?userId=${userId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(userId);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'execution_complete':
        this.onExecutionComplete(data.payload);
        break;
      case 'document_processed':
        this.onDocumentProcessed(data.payload);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private attemptReconnect(userId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect(userId);
      }, 1000 * this.reconnectAttempts);
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private onExecutionComplete(payload: any): void {
    // Handle execution completion
    console.log('Execution completed:', payload);
  }

  private onDocumentProcessed(payload: any): void {
    // Handle document processing completion
    console.log('Document processed:', payload);
  }
}
```

---

This comprehensive integration guide provides production-ready code examples for all major integration patterns with the RAG Prompt Library API.
