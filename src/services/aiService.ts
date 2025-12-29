/**
 * AI Service Integration - Comprehensive client for RAG AI backend
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    provider?: string;
    model?: string;
    tokens_used?: number;
    cost?: number;
    response_time?: number;
  };
}

export interface RAGChatMessage extends ChatMessage {
  sources?: DocumentSource[];
  context_chunks?: number;
  retrieval_time?: number;
}

export interface DocumentSource {
  document: string;
  relevance_score: number;
  content_preview: string;
  page_number?: number;
  section?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  conversation_id?: string;
  metadata: {
    provider: string;
    model: string;
    tokens_used: number;
    cost: number;
    response_time: number;
    context_chunks?: number;
    context_tokens?: number;
    retrieval_time?: number;
  };
  sources?: DocumentSource[];
  error?: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  job_id: string;
  document_id: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
  error?: string;
}

export interface DocumentProcessingStatus {
  success: boolean;
  job_id: string;
  status: 'processing' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'completed' | 'failed';
  document_id?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface SearchResult {
  chunk_id: string;
  content: string;
  score: number;
  semantic_score?: number;
  keyword_score?: number;
  fused_score?: number;
  metadata: {
    filename: string;
    file_type: string;
    chunk_index: number;
    document_id: string;
    created_at: string;
  };
  search_methods?: string[];
  highlights?: string[];
  confidence?: number;
  rank: number;
  search_type?: string;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  total_results: number;
  search_time: number;
  cached: boolean;
  metadata: {
    search_type: string;
    query_expansion?: {
      original: string;
      expanded: string;
      expansion_terms: string[];
    };
    embedding_time: number;
    vector_search_time: number;
    fusion_algorithm?: string;
    semantic_time?: number;
    keyword_time?: number;
    fusion_time?: number;
    enhancement_time?: number;
    semantic_results?: number;
    keyword_results?: number;
    intent?: string;
    intent_confidence?: number;
    corrected_query?: string;
    expansion_score?: number;
  };
  query_info?: {
    original_query: string;
    corrected_query?: string;
    intent?: string;
    intent_confidence?: number;
    enhanced: boolean;
  };
  error?: string;
}

export interface UsageStats {
  success: boolean;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  documents_processed: number;
  avg_response_time: number;
  period_days: number;
  breakdown: {
    by_provider: Record<string, { requests: number; cost: number }>;
    by_operation: Record<string, { requests: number; cost: number }>;
  };
}

export interface SystemStatus {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  providers: {
    available: string[];
    status: Record<string, { available: boolean; latency?: number; error?: string }>;
  };
  services: Record<string, boolean>;
  timestamp: string;
}

export interface ConversationSummary {
  conversation_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  total_tokens: number;
  last_message: string;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: ConversationSummary[];
}

class AIService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.REACT_APP_API_URL || 'http://localhost:8080';
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async makeFormRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Chat Methods
  async chat(params: {
    query: string;
    provider?: string;
    model?: string;
    max_tokens?: number;
    temperature?: number;
    conversation_id?: string;
  }): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async ragChat(params: {
    query: string;
    conversation_id?: string;
    max_context_tokens?: number;
    provider?: string;
    model?: string;
    use_cache?: boolean;
  }): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/api/ai/rag-chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Document Management
  async uploadDocument(file: File, filename?: string): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (filename) {
      formData.append('filename', filename);
    }

    return this.makeFormRequest<DocumentUploadResponse>('/api/ai/upload-document', formData);
  }

  async getDocumentStatus(jobId: string): Promise<DocumentProcessingStatus> {
    return this.makeRequest<DocumentProcessingStatus>(`/api/ai/document-status/${jobId}`);
  }

  async pollDocumentStatus(
    jobId: string,
    onProgress?: (status: DocumentProcessingStatus) => void,
    maxAttempts: number = 60,
    intervalMs: number = 2000
  ): Promise<DocumentProcessingStatus> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getDocumentStatus(jobId);
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    }

    throw new Error('Document processing timeout');
  }

  // Search Methods
  async searchDocuments(params: {
    query: string;
    search_type?: 'semantic' | 'keyword' | 'hybrid';
    top_k?: number;
    filters?: Record<string, any>;
    use_cache?: boolean;
  }): Promise<SearchResponse> {
    return this.makeRequest<SearchResponse>('/api/ai/search-documents', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Analytics and Monitoring
  async getUsageStats(days?: number): Promise<UsageStats> {
    const params = days ? `?days=${days}` : '';
    return this.makeRequest<UsageStats>(`/api/ai/usage-stats${params}`);
  }

  async getSystemStatus(): Promise<SystemStatus> {
    return this.makeRequest<SystemStatus>('/api/ai/system-status');
  }

  // Conversation Management
  async getConversations(limit?: number): Promise<ConversationsResponse> {
    const params = limit ? `?limit=${limit}` : '';
    return this.makeRequest<ConversationsResponse>(`/api/ai/conversations${params}`);
  }

  async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/api/ai/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string; services: Record<string, string> }> {
    return this.makeRequest('/health');
  }

  // Utility Methods
  formatCost(cost: number): string {
    return `$${cost.toFixed(6)}`;
  }

  formatTokens(tokens: number): string {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M tokens`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K tokens`;
    }
    return `${tokens} tokens`;
  }

  formatResponseTime(timeSeconds: number): string {
    if (timeSeconds >= 1) {
      return `${timeSeconds.toFixed(1)}s`;
    }
    return `${(timeSeconds * 1000).toFixed(0)}ms`;
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Error Handling Utilities
  isRateLimitError(error: Error): boolean {
    return error.message.includes('rate limit') || error.message.includes('429');
  }

  isAuthError(error: Error): boolean {
    return error.message.includes('401') || error.message.includes('unauthorized');
  }

  isServerError(error: Error): boolean {
    return error.message.includes('500') || error.message.includes('502') || error.message.includes('503');
  }

  // Retry Logic
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on auth errors or client errors
        if (this.isAuthError(lastError) || lastError.message.includes('400')) {
          throw lastError;
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError!;
  }
}

// Create and export singleton instance
export const aiService = new AIService();
export default aiService;
