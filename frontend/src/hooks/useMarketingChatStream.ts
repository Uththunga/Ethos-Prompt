import { useCallback, useRef, useState } from 'react';

interface UseMarketingChatStreamOptions {
  onMetadata?: (meta: Record<string, any>) => void;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string, metadata?: Record<string, any>) => void;
  onError?: (error: Error) => void;
}

export function useMarketingChatStream(options?: UseMarketingChatStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const metadataRef = useRef<Record<string, any>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Streaming configuration
  const STREAM_TIMEOUT_MS = 60000; // 60 seconds

  const bufferRef = useRef<string>('');
  const accumulatedRef = useRef<string>('');
  const rafIdRef = useRef<number | null>(null);

  const startFlushLoop = useCallback(() => {
    if (rafIdRef.current != null) return; // already running
    const flush = () => {
      if (bufferRef.current.length > 0) {
        // Move buffered content into accumulated text
        accumulatedRef.current += bufferRef.current;
        bufferRef.current = '';
        // Commit at most once per frame
        setStreamedContent((prev) =>
          prev !== accumulatedRef.current ? accumulatedRef.current : prev
        );
      }
      rafIdRef.current = requestAnimationFrame(flush);
    };
    rafIdRef.current = requestAnimationFrame(flush);
  }, []);

  const stopFlushLoop = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Normalize escaped sequences that may come through as literal "\\n" in some environments
  const normalizeChunk = useCallback((s: string) => {
    if (!s) return s;
    // Handle Windows CRLF and plain \n cases
    return s
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');
  }, []);

  const startStream = useCallback(
    async (message: string, pageContext?: string, conversationId?: string) => {
      if (!message) return;

      setIsStreaming(true);
      setStreamedContent('');
      setError(null);
      metadataRef.current = {};
      bufferRef.current = '';
      accumulatedRef.current = '';

      // Build SSE URL with query params (EventSource only supports GET)
      // Priority: 1) VITE_API_BASE_URL if set (direct Cloud Run URL)
      //           2) window.location.origin (uses Firebase Hosting rewrites)
      const configuredUrl = import.meta.env.VITE_API_BASE_URL;
      const apiBase = configuredUrl || window.location.origin;
      const url = new URL('/api/ai/marketing-chat/stream', apiBase);
      url.searchParams.set('message', message);
      if (pageContext) url.searchParams.set('page_context', pageContext);
      if (conversationId) url.searchParams.set('conversation_id', conversationId);

      // DEBUG: Log the constructed URL
      console.log('[STREAM_DEBUG] VITE_API_BASE_URL:', configuredUrl || '(not set)');
      console.log('[STREAM_DEBUG] apiBase:', apiBase);
      console.log('[STREAM_DEBUG] Final URL:', url.toString());

      const es = new EventSource(url.toString());
      eventSourceRef.current = es;

      // Set timeout to prevent infinite waiting
      timeoutRef.current = setTimeout(() => {
        if (eventSourceRef.current) {
          console.error('[STREAM_TIMEOUT] Stream exceeded 60s timeout');
          eventSourceRef.current.close();
          stopFlushLoop();
          setIsStreaming(false);
          const timeoutError = new Error('Stream timeout - the server took too long to respond. Please try again.');
          setError(timeoutError);
          options?.onError?.(timeoutError);
        }
      }, STREAM_TIMEOUT_MS);

      // Start rAF-based flush loop to minimize re-renders
      startFlushLoop();

      es.onmessage = (event: MessageEvent) => {
        if (event.data === '[DONE]') {
          // VERIFY COMPLETENESS BEFORE FINISHING
          stopFlushLoop();
          if (bufferRef.current.length > 0) {
            accumulatedRef.current += bufferRef.current;
            bufferRef.current = '';
          }
          const finalLength = accumulatedRef.current.length;
          if (finalLength < 1) {
            console.error('[STREAM_ERROR] Response empty');
            console.error('[STREAM_ERROR] Content:', accumulatedRef.current);

            es.close();
            setIsStreaming(false);
            // Clear timeout on error
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            const err = new Error('Response was empty. Please try again.');
            setError(err);
            options?.onError?.(err);
            return;
          }

          if (accumulatedRef.current.includes("TRANSITION: PROMPT_LIBRARY")) {
             // Handle client-side redirect signal
             // Remove the signal line from display
             const cleanContent = accumulatedRef.current.replace("TRANSITION: PROMPT_LIBRARY", "").trim();
             accumulatedRef.current = cleanContent;
             setStreamedContent(cleanContent);

             // Trigger redirect
             window.location.href = '/prompt-library';
             es.close();
             return;
          }

          setStreamedContent(accumulatedRef.current);
          es.close();
          setIsStreaming(false);
          // Clear timeout on successful completion
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          options?.onComplete?.(accumulatedRef.current, metadataRef.current);
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.type === 'metadata') {
            metadataRef.current = data;
            options?.onMetadata?.(data);
            return;
          }
          if (data.type === 'content') {
            const chunk: string = data.chunk ?? '';
            const normalized = normalizeChunk(chunk);
            bufferRef.current += normalized; // defer state update to rAF
            options?.onChunk?.(normalized);
            return;
          }
          if (data.type === 'error') {
            const message: string = data.message || 'Stream error';
            const err = new Error(message);
            (err as any).errorType = data.error_type ?? data.code;
            (err as any).traceId = data.trace_id;
            console.error('[STREAM_ERROR] Backend error event', data);

            stopFlushLoop();
            es.close();
            setIsStreaming(false);
            // Clear timeout on backend error
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            setError(err);
            options?.onError?.(err);
            return;
          }
          if (data.type === 'done') {
            // Received explicit completion event with metadata
            const tokenCount = data.token_count;
            const finishReason = data.finish_reason;

            // Verify completeness against token count if available
            if (typeof tokenCount === 'number' && accumulatedRef.current.length < tokenCount * 0.8) {
               console.warn(`[STREAM_WARNING] Content length (${accumulatedRef.current.length}) significantly less than token count (${tokenCount}). Reason: ${finishReason}`);
            }

            // Merge final metadata
            if (data.cached) {
               metadataRef.current.cached = true;
            }
            return;
          }
          // Ignore unknown types
        } catch {
          // Non-JSON line (keep-alives, comments) — ignore
        }
      };

      es.onerror = () => {
        stopFlushLoop();
        es.close();
        setIsStreaming(false);
        // Clear timeout on connection error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        const err = new Error('Stream error');
        setError(err);
        options?.onError?.(err);
      };
    },
    [options, startFlushLoop, stopFlushLoop]
  );

  const cancel = useCallback(() => {
    stopFlushLoop();
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setIsStreaming(false);
    // Clear timeout on manual cancel
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [stopFlushLoop]);

  return { startStream, cancel, isStreaming, streamedContent, error };
}
