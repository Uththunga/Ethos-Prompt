/**
 * Request Batching Utility
 * Batches multiple API requests to improve performance and reduce server load
 */

interface BatchRequest {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

interface BatchConfig {
  maxBatchSize: number;
  batchTimeout: number;
  endpoints: string[];
}

class RequestBatcher {
  private pendingRequests: Map<string, BatchRequest[]> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private config: BatchConfig;

  constructor(config: BatchConfig) {
    this.config = config;
  }

  /**
   * Add a request to the batch queue
   */
  async batchRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: unknown
  ): Promise<T> {
    // Check if this endpoint supports batching
    if (!this.config.endpoints.includes(endpoint)) {
      // Execute immediately if batching not supported
      return this.executeRequest(endpoint, method, data);
    }

    return new Promise<T>((resolve, reject) => {
      const requestId = this.generateRequestId(endpoint, method, data);
      const batchKey = `${endpoint}:${method}`;

      const request: BatchRequest = {
        id: requestId,
        endpoint,
        method,
        data,
        resolve,
        reject
      };

      // Add to pending requests
      if (!this.pendingRequests.has(batchKey)) {
        this.pendingRequests.set(batchKey, []);
      }

      const batch = this.pendingRequests.get(batchKey)!;
      batch.push(request);

      // Check if we should execute the batch
      if (batch.length >= this.config.maxBatchSize) {
        this.executeBatch(batchKey);
      } else {
        // Set timeout if not already set
        if (!this.timeouts.has(batchKey)) {
          const timeout = setTimeout(() => {
            this.executeBatch(batchKey);
          }, this.config.batchTimeout);
          this.timeouts.set(batchKey, timeout);
        }
      }
    });
  }

  /**
   * Execute a batch of requests
   */
  private async executeBatch(batchKey: string) {
    const batch = this.pendingRequests.get(batchKey);
    if (!batch || batch.length === 0) return;

    // Clear timeout
    const timeout = this.timeouts.get(batchKey);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(batchKey);
    }

    // Remove from pending
    this.pendingRequests.delete(batchKey);

    try {
      const [, method] = batchKey.split(':');

      if (method === 'GET') {
        // For GET requests, we can batch by making multiple parallel requests
        await this.executeBatchGet(batch);
      } else {
        // For other methods, send as a batch request
        await this.executeBatchMutation(batch);
      }
    } catch {
      // Reject all requests in the batch
      batch.forEach(request => request.reject(error));
    }
  }

  /**
   * Execute batch GET requests in parallel
   */
  private async executeBatchGet(batch: BatchRequest[]) {
    const promises = batch.map(async (request) => {
      try {
        const result = await this.executeRequest(request.endpoint, request.method, request.data);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Execute batch mutation requests
   */
  private async executeBatchMutation(batch: BatchRequest[]) {
    const batchEndpoint = `${batch[0].endpoint}/batch`;
    const batchData = {
      requests: batch.map(req => ({
        id: req.id,
        method: req.method,
        data: req.data
      }))
    };

    try {
      const response = await this.executeRequest(batchEndpoint, 'POST', batchData);

      // Resolve individual requests based on response
      const typed = response as { results?: Array<{ id: string; success: boolean; data?: unknown; error?: string }> };
      if (typed.results) {
        typed.results.forEach((result) => {
          const request = batch.find(req => req.id === result.id);
          if (request) {
            if (result.success) {
              request.resolve(result.data);
            } else {
              request.reject(new Error(result.error));
            }
          }
        });
      }
    } catch {
      // If batch request fails, try individual requests
      await this.executeBatchGet(batch);
    }
  }

  /**
   * Execute a single request
   */
  private async executeRequest<T = unknown>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: unknown): Promise<T> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(endpoint: string, method: string, data?: unknown): string {
    const dataHash = data ? btoa(JSON.stringify(data)).slice(0, 8) : '';
    return `${method}:${endpoint}:${dataHash}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Clear all pending requests
   */
  clearPending() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();

    this.pendingRequests.forEach(batch => {
      batch.forEach(request => {
        request.reject(new Error('Request cancelled'));
      });
    });
    this.pendingRequests.clear();
  }
}

// Request deduplication utility
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();

  /**
   * Deduplicate requests by caching in-flight requests
   */
  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5000 // 5 seconds default TTL
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Check if request is already in flight
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Execute request
    const promise = requestFn().then(data => {
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });

      // Remove from pending
      this.pendingRequests.delete(key);

      return data;
    }).catch(error => {
      // Remove from pending on error
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Clear cache and pending requests
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global instances
export const requestBatcher = new RequestBatcher({
  maxBatchSize: 10,
  batchTimeout: 100, // 100ms
  endpoints: [
    '/prompts',
    '/documents',
    '/executions',
    '/analytics'
  ]
});

export const requestDeduplicator = new RequestDeduplicator();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    requestBatcher.clearPending();
    requestDeduplicator.clear();
  });

  // Periodic cleanup of expired cache entries
  setInterval(() => {
    requestDeduplicator.clearExpired();
  }, 60000); // Every minute
}
