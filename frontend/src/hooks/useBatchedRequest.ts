import { useCallback, useEffect, useRef } from 'react';
import { requestBatcher, requestDeduplicator } from '../utils/requestBatcher';

interface UseBatchedRequestOptions {
  enableBatching?: boolean;
  enableDeduplication?: boolean;
  deduplicationTTL?: number;
}

/**
 * Hook for making batched and deduplicated API requests
 */
export function useBatchedRequest(options: UseBatchedRequestOptions = {}) {
  const {
    enableBatching = true,
    enableDeduplication = true,
    deduplicationTTL = 5000
  } = options;

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const makeRequest = useCallback(async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: unknown,
    requestOptions?: {
      skipBatching?: boolean;
      skipDeduplication?: boolean;
      ttl?: number;
    }
  ): Promise<T> => {
    const {
      skipBatching = false,
      skipDeduplication = false,
      ttl = deduplicationTTL
    } = requestOptions || {};

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    const requestKey = `${method}:${endpoint}:${JSON.stringify(data)}`;

    // Function to execute the actual request
    const executeRequest = async (): Promise<T> => {
      if (enableBatching && !skipBatching) {
        return requestBatcher.batchRequest<T>(endpoint, method, data);
      } else {
        // Direct request without batching
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        const url = endpoint.startsWith('http')
          ? endpoint
          : `${baseUrl}${endpoint}`;

        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortControllerRef.current?.signal,
        };

        if (data && method !== 'GET') {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      }
    };

    // Use deduplication if enabled
    if (enableDeduplication && !skipDeduplication && method === 'GET') {
      return requestDeduplicator.deduplicateRequest(
        requestKey,
        executeRequest,
        ttl
      );
    } else {
      return executeRequest();
    }
  }, [enableBatching, enableDeduplication, deduplicationTTL]);

  return { makeRequest };
}

/**
 * Hook for making multiple requests in parallel with batching
 */
export function useBatchedRequests() {
  const { makeRequest } = useBatchedRequest();

  const makeParallelRequests = useCallback(async <T>(
    requests: Array<{
      endpoint: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: unknown;
    }>
  ): Promise<T[]> => {
    const promises = requests.map(req =>
      makeRequest<T>(req.endpoint, req.method || 'GET', req.data)
    );

    return Promise.all(promises);
  }, [makeRequest]);

  const makeSequentialRequests = useCallback(async <T>(
    requests: Array<{
      endpoint: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: unknown;
    }>
  ): Promise<T[]> => {
    const results: T[] = [];

    for (const req of requests) {
      const result = await makeRequest<T>(req.endpoint, req.method || 'GET', req.data);
      results.push(result);
    }

    return results;
  }, [makeRequest]);

  return {
    makeRequest,
    makeParallelRequests,
    makeSequentialRequests
  };
}

/**
 * Hook for optimized data fetching with caching and batching
 */
export function useOptimizedFetch<T>(
  endpoint: string,
  dependencies: unknown[] = [],
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: unknown;
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {}
) {
  const {
    method = 'GET',
    data,
    enabled = true,
    refetchInterval,
    staleTime = 5000
  } = options;

  const { makeRequest } = useBatchedRequest({
    deduplicationTTL: staleTime
  });

  const [state, setState] = React.useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await makeRequest<T>(endpoint, method, data);
      setState({ data: result, loading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      }));
    }
  }, [endpoint, method, data, enabled, makeRequest]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData, dependencies]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval, enabled]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch
  };
}

// Re-export React for the useOptimizedFetch hook
import React from 'react';
