/**
 * Task 1.2.1: Custom Streaming Hook for Prompt Execution
 *
 * This hook provides EventSource-based streaming for prompt execution with:
 * - Real-time SSE (Server-Sent Events) streaming
 * - Automatic reconnection (max 3 attempts)
 * - Error handling and fallback
 * - Stream cancellation
 * - Cleanup on unmount
 *
 * Usage:
 * ```typescript
 * const { execute, cancel, isStreaming, streamedContent, error } = useStreamingExecution({
 *   onChunk: (chunk) => console.log('Received:', chunk),
 *   onComplete: (fullText) => console.log('Complete:', fullText),
 *   onError: (error) => console.error('Error:', error)
 * });
 *
 * await execute(promptId, variables);
 * ```
 */

import { useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useRef, useState } from 'react';
import { functions as fbFunctions } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

// =============================================================================
// TYPES
// =============================================================================

export interface StreamChunk {
  content: string;
  index: number;
  finish_reason?: string | null;
  model?: string;
}

export interface StreamingExecutionOptions {
  /** Callback when a chunk is received */
  onChunk?: (chunk: StreamChunk) => void;
  /** Callback when streaming completes */
  onComplete?: (fullContent: string, metadata?: Record<string, any>) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Maximum reconnection attempts (default: 3) */
  maxReconnectAttempts?: number;
  /** Timeout in milliseconds (default: 60000 = 60s) */
  timeout?: number;
  /** Enable automatic reconnection (default: true) */
  autoReconnect?: boolean;
}

export interface StreamingExecutionResult {
  /** Execute a prompt with streaming */
  execute: (
    promptId: string,
    variables: Record<string, any>,
    options?: ExecuteOptions
  ) => Promise<void>;
  /** Cancel the current stream */
  cancel: () => void;
  /** Whether streaming is in progress */
  isStreaming: boolean;
  /** Accumulated streamed content */
  streamedContent: string;
  /** Current error if any */
  error: Error | null;
  /** Whether the stream was cancelled */
  isCancelled: boolean;
  /** Current reconnection attempt */
  reconnectAttempt: number;
}

export interface ExecuteOptions {
  useRAG?: boolean;
  ragQuery?: string;
  documentIds?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useStreamingExecution(
  options: StreamingExecutionOptions = {}
): StreamingExecutionResult {
  const {
    onChunk,
    onComplete,
    onError,
    maxReconnectAttempts = 3,
    timeout = 60000,
    autoReconnect = true,
  } = options;

  // Feature flag: disable streaming in staging until backend endpoints exist
  const STREAMING_ENABLED = import.meta.env.VITE_STREAMING_ENABLED === 'true';

  // Use consistent timeout across all environments
  // Backend streaming timeout is 120s, so frontend should be 150s (with buffer)
  const STREAMING_TIMEOUT_MS = 150000; // 150 seconds (2.5 minutes)
  const effectiveTimeout = timeout || STREAMING_TIMEOUT_MS;

  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedContentRef = useRef<string>('');
  const chunkIndexRef = useRef<number>(0);
  // Polling mode state
  const pollIntervalRef = useRef<NodeJS.Timer | null>(null);
  const executionIdRef = useRef<string | null>(null);
  const promptIdRef = useRef<string | null>(null);
  const fromIndexRef = useRef<number>(0);
  const modeRef = useRef<'sse' | 'poll' | null>(null);
  // Error/fallback helpers
  const pollErrorCountRef = useRef(0);
  const nonStreamingFallbackTriedRef = useRef(false);
  const captureError = useCallback((err: unknown, context?: Record<string, any>) => {
    try {
      // Optional Sentry capture if available without importing SDK here
      const Sentry = (window as any)?.Sentry;
      if (Sentry?.captureException) {
        Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
          extra: context || {},
        });
      }
    } catch {
      // Silently fail if Sentry is not available (e.g., in tests or development)
    }
  }, []);

  /**
   * Cleanup function to close connections and clear timeouts
   */
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current as any);
      pollIntervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  /**
   * Cancel the current stream
   */
  const cancel = useCallback(async () => {
    setIsCancelled(true);
    setIsStreaming(false);

    // If we're in polling mode and have an execution to cancel, notify backend
    if (modeRef.current === 'poll' && executionIdRef.current && promptIdRef.current) {
      try {
        const cancelFn = httpsCallable(fbFunctions, 'cancel_streaming_execution');
        await cancelFn({ executionId: executionIdRef.current, promptId: promptIdRef.current });
      } catch (e) {
        // Non-fatal; still perform local cleanup
        // console.warn('Cancel request failed', e);
      }
    }

    cleanup();
  }, [cleanup]);

  // Start polling-based streaming using callable functions
  const startPollingExecution = useCallback(
    async (promptId: string, variables: Record<string, any>, executeOptions: ExecuteOptions) => {
      try {
        modeRef.current = 'poll';
        promptIdRef.current = promptId;
        fromIndexRef.current = 0;
        pollErrorCountRef.current = 0;

        // 1) Start a polling-based streaming execution
        const startFn = httpsCallable(fbFunctions, 'execute_prompt_streaming');
        const startRes: any = await startFn({
          promptId,
          inputs: variables,
          useRag: !!executeOptions.useRAG,
          ragQuery: executeOptions.ragQuery || '',
          documentIds: executeOptions.documentIds || [],
          model: executeOptions.model,
          temperature: executeOptions.temperature,
          maxTokens: executeOptions.maxTokens,
        });

        const executionId: string = startRes?.data?.execution_id || startRes?.data?.id;
        executionIdRef.current = executionId;

        // 2) Begin polling for chunks
        const getChunksFn = httpsCallable(fbFunctions, 'get_execution_chunks');
        pollIntervalRef.current = setInterval(async () => {
          try {
            const res: any = await getChunksFn({
              executionId,
              fromIndex: fromIndexRef.current,
            });

            const chunks: Array<{ index: number; content: string }> = res?.data?.chunks || [];
            if (chunks.length) {
              for (const ch of chunks) {
                // Update fromIndex and accumulate
                fromIndexRef.current = Math.max(
                  fromIndexRef.current,
                  (ch.index ?? fromIndexRef.current) + 1
                );
                const content = ch.content ?? '';
                accumulatedContentRef.current += content;
                setStreamedContent(accumulatedContentRef.current);
                onChunk?.({ content, index: chunkIndexRef.current++ });
              }
            }

            if (res?.data?.completed) {
              onComplete?.(accumulatedContentRef.current, res?.data?.metadata || {});

              // Invalidate React Query caches after streaming execution completes
              if (currentUser) {
                console.log('🔄 Invalidating caches after streaming execution...');
                queryClient.invalidateQueries({ queryKey: ['executionHistory'] });
                queryClient.invalidateQueries({ queryKey: ['executions'] });
                queryClient.invalidateQueries({ queryKey: ['executionStats'] });
                queryClient.invalidateQueries({ queryKey: ['analytics'] });
                queryClient.invalidateQueries({ queryKey: ['prompts'] });
              }

              setIsStreaming(false);
              cleanup();
            }
          } catch (err) {
            pollErrorCountRef.current += 1;
            if (pollErrorCountRef.current >= 3) {
              const e = err instanceof Error ? err : new Error('Polling failed');
              setError(e);
              onError?.(e);
              setIsStreaming(false);
              cleanup();
            }
          }
        }, 50) as any;
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Execution failed');
        setError(err);
        onError?.(err);
        setIsStreaming(false);
        cleanup();
      }
    },
    [cleanup, onComplete, onError, onChunk, currentUser, queryClient]
  );

  /**
   * Execute prompt with streaming
   */
  const execute = useCallback(
    async (
      promptId: string,
      variables: Record<string, any>,
      executeOptions: ExecuteOptions = {}
    ): Promise<void> => {
      // Allow streaming in E2E/staging/dev without requiring an authenticated user
      const isRuntimeE2E = (() => {
        try {
          return (
            localStorage.getItem('e2eAuth') === 'true' ||
            import.meta.env.VITE_E2E_MODE === 'true' ||
            import.meta.env.DEV ||
            import.meta.env.VITE_APP_ENVIRONMENT === 'staging'
          );
        } catch {
          return false;
        }
      })();

      if (!currentUser && !isRuntimeE2E) {
        const authError = new Error('User not authenticated');
        setError(authError);
        onError?.(authError);
        return;
      }

      // Reset state
      setIsStreaming(true);
      setStreamedContent('');
      setError(null);
      setIsCancelled(false);
      setReconnectAttempt(0);
      accumulatedContentRef.current = '';
      chunkIndexRef.current = 0;

      try {
        // If SSE base URL is missing or EventSource unsupported, fallback to polling
        const functionsBase = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
        const canUseSSE = typeof EventSource !== 'undefined' && !!functionsBase && !!currentUser;

        if (!canUseSSE || !STREAMING_ENABLED) {
          await startPollingExecution(promptId, variables, executeOptions);
          return;
        }

        // Get Firebase ID token for authentication
        const idToken = await currentUser.getIdToken();

        // Build query parameters for SSE endpoint (if available)
        const params = new URLSearchParams({
          promptId,
          variables: JSON.stringify(variables),
          useRAG: String(executeOptions.useRAG || false),
          ...(executeOptions.ragQuery && { ragQuery: executeOptions.ragQuery }),
          ...(executeOptions.documentIds && {
            documentIds: JSON.stringify(executeOptions.documentIds),
          }),
          ...(executeOptions.model && { model: executeOptions.model }),
          ...(executeOptions.temperature !== undefined && {
            temperature: String(executeOptions.temperature),
          }),
          ...(executeOptions.maxTokens && { maxTokens: String(executeOptions.maxTokens) }),
        });

        // Create EventSource connection
        // Note: EventSource doesn't support custom headers, so we pass token as query param
        const streamUrl = `${functionsBase}/stream_prompt?${params.toString()}&token=${idToken}`;

        const eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        // Set timeout (staging uses a shorter deterministic timeout)
        timeoutRef.current = setTimeout(() => {
          const timeoutError = new Error('Stream timeout exceeded');
          setError(timeoutError);
          onError?.(timeoutError);
          cancel();
        }, effectiveTimeout);

        // Handle incoming messages
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'chunk') {
              modeRef.current = 'sse'; // connection confirmed
              const chunk: StreamChunk = {
                content: data.content,
                index: chunkIndexRef.current++,
                finish_reason: data.finish_reason,
                model: data.model,
              };

              // Accumulate content
              accumulatedContentRef.current += data.content;
              setStreamedContent(accumulatedContentRef.current);

              // Call chunk callback
              onChunk?.(chunk);
            } else if (data.type === 'complete') {
              // Stream completed successfully
              const fullContent = accumulatedContentRef.current;
              const metadata = data.metadata || {};

              onComplete?.(fullContent, metadata);

              // Invalidate React Query caches after SSE streaming completes
              if (currentUser) {
                console.log('🔄 Invalidating caches after SSE streaming execution...');
                queryClient.invalidateQueries({ queryKey: ['executionHistory'] });
                queryClient.invalidateQueries({ queryKey: ['executions'] });
                queryClient.invalidateQueries({ queryKey: ['executionStats'] });
                queryClient.invalidateQueries({ queryKey: ['analytics'] });
                queryClient.invalidateQueries({ queryKey: ['prompts'] });
              }

              // Cleanup
              setIsStreaming(false);
              cleanup();
            } else if (data.type === 'error') {
              // Server-side error
              const serverError = new Error(data.message || 'Stream error');
              setError(serverError);
              onError?.(serverError);

              // Attempt reconnection if enabled
              if (autoReconnect && reconnectAttempt < maxReconnectAttempts) {
                setReconnectAttempt((prev) => prev + 1);

                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, reconnectAttempt) * 1000;

                reconnectTimeoutRef.current = setTimeout(() => {
                  execute(promptId, variables, executeOptions);
                }, delay);
              } else {
                setIsStreaming(false);
                cleanup();
              }
            }
          } catch (parseError) {
            console.error('Failed to parse stream data:', parseError);
          }
        };

        // Handle connection errors
        eventSource.onerror = async () => {
          // If we never established SSE (no onmessage yet), fallback to polling
          if (modeRef.current !== 'sse') {
            cleanup();
            await startPollingExecution(promptId, variables, executeOptions);
            return;
          }

          const connectionError = new Error('Stream connection error');
          setError(connectionError);
          onError?.(connectionError);

          // Attempt reconnection if enabled
          if (autoReconnect && reconnectAttempt < maxReconnectAttempts) {
            setReconnectAttempt((prev) => prev + 1);

            // Exponential backoff
            const delay = Math.pow(2, reconnectAttempt) * 1000;

            reconnectTimeoutRef.current = setTimeout(() => {
              execute(promptId, variables, executeOptions);
            }, delay);
          } else {
            setIsStreaming(false);
            cleanup();
          }
        };

        // Handle connection open
        eventSource.onopen = () => {
          // Reset reconnection attempt on successful connection
          setReconnectAttempt(0);
        };
      } catch (err) {
        const executionError = err instanceof Error ? err : new Error('Execution failed');
        setError(executionError);
        onError?.(executionError);
        setIsStreaming(false);
        cleanup();
      }
    },
    [
      currentUser,
      onChunk,
      onComplete,
      onError,
      autoReconnect,
      maxReconnectAttempts,
      reconnectAttempt,
      cancel,
      cleanup,
      startPollingExecution,
      STREAMING_ENABLED,
      effectiveTimeout,
      queryClient,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    execute,
    cancel,
    isStreaming,
    streamedContent,
    error,
    isCancelled,
    reconnectAttempt,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for simulated streaming (fallback when SSE is not available)
 * Displays text with typewriter effect
 */
export function useTypingAnimation(text: string, speed: number = 50) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isTyping };
}
