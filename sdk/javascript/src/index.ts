/**
 * RAG Prompt Library JavaScript/TypeScript SDK
 * 
 * A comprehensive SDK for interacting with the RAG Prompt Library API.
 * Supports both Node.js and browser environments with TypeScript support.
 */

export interface APIConfig {
  baseURL?: string;
  apiKey?: string;
  accessToken?: string;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
  meta?: any;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: number;
    details?: any;
  };
  timestamp: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  variables?: Variable[];
  user_id: string;
  workspace_id?: string;
  is_public: boolean;
  is_shared: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  execution_count: number;
  like_count: number;
  comments_count: number;
}

export interface Variable {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  description?: string;
  required: boolean;
  default_value?: string;
  options?: string[];
}

export interface Document {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  uploadedBy: string;
  uploadedAt: string;
  processedAt?: string;
  chunks_count?: number;
  metadata?: any;
}

export interface Execution {
  id: string;
  prompt_id: string;
  user_id: string;
  variables: Record<string, any>;
  model: string;
  response: string;
  tokens_used: number;
  cost: number;
  execution_time: number;
  created_at: string;
  rag_context?: string[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PromptFilters extends PaginationOptions {
  search?: string;
  category?: string;
  tags?: string[];
  workspace_id?: string;
}

export interface CreatePromptData {
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  variables?: Variable[];
  workspace_id?: string;
  is_public?: boolean;
}

export interface UpdatePromptData {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
  variables?: Variable[];
  is_public?: boolean;
}

export class RAGPromptLibraryError extends Error {
  public code: number;
  public details?: any;

  constructor(message: string, code: number, details?: any) {
    super(message);
    this.name = 'RAGPromptLibraryError';
    this.code = code;
    this.details = details;
  }
}

export class RAGPromptLibraryClient {
  private config: Required<APIConfig>;

  constructor(config: APIConfig = {}) {
    this.config = {
      baseURL: config.baseURL || 'https://us-central1-rag-prompt-library.cloudfunctions.net/api',
      apiKey: config.apiKey || '',
      accessToken: config.accessToken || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 3
    };
  }

  /**
   * Set API key for authentication
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Set access token for authentication
   */
  setAccessToken(accessToken: string): void {
    this.config.accessToken = accessToken;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RAG-Prompt-Library-SDK/1.0.0',
      ...options.headers as Record<string, string>
    };

    // Add authentication
    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    } else if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      ...options
    };

    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const responseData = await response.json();
        
        if (!response.ok) {
          if (responseData.error) {
            throw new RAGPromptLibraryError(
              responseData.error.message,
              responseData.error.code,
              responseData.error.details
            );
          } else {
            throw new RAGPromptLibraryError(
              `HTTP ${response.status}: ${response.statusText}`,
              response.status
            );
          }
        }
        
        return responseData;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof RAGPromptLibraryError && error.code >= 400 && error.code < 500) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError!;
  }

  // HEALTH CHECK

  /**
   * Check API health status
   */
  async health(): Promise<APIResponse<{ status: string; version: string }>> {
    return this.request('GET', '/v1/health');
  }

  // PROMPTS

  /**
   * Get a list of prompts with optional filtering
   */
  async getPrompts(filters: PromptFilters = {}): Promise<APIResponse<Prompt[]>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.workspace_id) params.append('workspace_id', filters.workspace_id);
    if (filters.tags) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    
    const queryString = params.toString();
    const endpoint = `/v1/prompts${queryString ? `?${queryString}` : ''}`;
    
    return this.request('GET', endpoint);
  }

  /**
   * Get a specific prompt by ID
   */
  async getPrompt(promptId: string): Promise<APIResponse<Prompt>> {
    return this.request('GET', `/v1/prompts/${promptId}`);
  }

  /**
   * Create a new prompt
   */
  async createPrompt(data: CreatePromptData): Promise<APIResponse<Prompt>> {
    return this.request('POST', '/v1/prompts', data);
  }

  /**
   * Update an existing prompt
   */
  async updatePrompt(promptId: string, data: UpdatePromptData): Promise<APIResponse<Prompt>> {
    return this.request('PUT', `/v1/prompts/${promptId}`, data);
  }

  /**
   * Delete a prompt
   */
  async deletePrompt(promptId: string): Promise<APIResponse<void>> {
    return this.request('DELETE', `/v1/prompts/${promptId}`);
  }

  // DOCUMENTS

  /**
   * Get a list of documents
   */
  async getDocuments(options: PaginationOptions & { status?: string } = {}): Promise<APIResponse<Document[]>> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);
    
    const queryString = params.toString();
    const endpoint = `/v1/documents${queryString ? `?${queryString}` : ''}`;
    
    return this.request('GET', endpoint);
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<APIResponse<Document>> {
    return this.request('GET', `/v1/documents/${documentId}`);
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<APIResponse<void>> {
    return this.request('DELETE', `/v1/documents/${documentId}`);
  }

  // UTILITY METHODS

  /**
   * Get OpenAPI specification
   */
  async getOpenAPISpec(format: 'json' | 'yaml' = 'json'): Promise<any> {
    const endpoint = format === 'yaml' ? '/v1/openapi.yaml' : '/v1/openapi.json';
    const response = await fetch(`${this.config.baseURL}${endpoint}`);
    
    if (!response.ok) {
      throw new RAGPromptLibraryError(
        `Failed to fetch OpenAPI spec: ${response.statusText}`,
        response.status
      );
    }
    
    return format === 'yaml' ? response.text() : response.json();
  }

  /**
   * Test API connectivity and authentication
   */
  async test(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const response = await this.health();
      return {
        success: true,
        message: 'API connection successful',
        details: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof RAGPromptLibraryError ? error.details : undefined
      };
    }
  }
}

// Default export
export default RAGPromptLibraryClient;

// Named exports for convenience
export { RAGPromptLibraryClient as Client };

/**
 * Create a new client instance
 */
export function createClient(config?: APIConfig): RAGPromptLibraryClient {
  return new RAGPromptLibraryClient(config);
}
