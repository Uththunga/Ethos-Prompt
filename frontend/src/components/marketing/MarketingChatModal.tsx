/**
 * Marketing Chat Panel Component
 * Right-side sliding panel for molē marketing assistant
 *
 * Features:
 * - Claude-inspired professional UX
 * - Smart scroll behavior (auto-scroll only when at bottom)
 * - Keyboard navigation (ESC to close, Enter to send, Shift+Enter for newline)
 * - Focus trap for accessibility
 * - Smooth animations with reduced motion support
 * - ARIA live regions for screen readers
 */
import React, { useState, useRef, useEffect, lazy } from 'react';
import { Send, X, Loader2, RotateCcw, Maximize2, PanelRight } from '@/components/icons';
import { useMarketingChat } from '@/contexts/MarketingChatContext';

import { Button } from '@/components/marketing/ui/button';
import { ScrollArea } from '@/components/marketing/ui/scroll-area';
import { marketingChatService, type MarketingChatMessage } from '@/services/marketingChatService';

// Lazy load Moleicon for header
const Moleicon = lazy(() => import('@/components/marketing/ui/Moleicon'));

import { useMarketingChatStream } from '@/hooks/useMarketingChatStream';
import { useBrowserCache } from '@/hooks/useBrowserCache';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { useSmartScroll } from '@/hooks/useSmartScroll';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { StreamingMessage } from '@/components/marketing/StreamingMessage';
import { TypingIndicator } from '@/components/marketing/TypingIndicator';
import { MessageContent } from '@/components/marketing/MessageContent';
import { conversationService } from '@/services/conversationService';
// ConversationHistorySidebar removed - requires auth, not suitable for public marketing chat
import ErrorBoundary from '@/components/ErrorBoundary';
import {
    ROICalculatorForm,
    ConsultationRequestForm,
    type ChatFormType,
    type ROICalculationResult,
} from '@/components/marketing/forms';

interface MarketingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext?: string;
}

/**
 * Memoized message content renderer - defined OUTSIDE component to avoid
 * recreating the component type on every render (DD-001 performance fix)
 */
const MemoizedMessageContent = React.memo(function MemoizedContent({
  content,
}: {
  content: string;
}) {
  const normalizedContent = React.useMemo(
    () => content.replaceAll('\\r\\n', '\n').replaceAll('\\n', '\n').replaceAll('\\t', '\t'),
    [content]
  );
  return <MessageContent content={normalizedContent} />;
});

// Wrap component with ErrorBoundary
const MarketingChatModalInner = React.memo(function MarketingChatModal({
  isOpen,
  onClose,
  pageContext,
}: MarketingChatModalProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  // showHistory state removed - History feature requires auth
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Inline form state
  const [activeForm, setActiveForm] = useState<ChatFormType | null>(null);
  const [lastROIResult, setLastROIResult] = useState<ROICalculationResult | null>(null);

  // Display mode from context (enables co-browsing navigation from message links)
  const { displayMode, setDisplayMode } = useMarketingChat();

  // Network status for offline indicator
  const isOnline = useNetworkStatus();

  // Use chat messages hook (fixes memory leak)
  const { messages, setMessages, clearMessages } = useChatMessages({
    conversationId,
    isOpen,
  });

  // Browser Cache Integration
  const { getCached, setCached, clearCache } = useBrowserCache();
  const currentQueryRef = useRef<string>('');

  // Initialize streaming hook FIRST (before useSmartScroll needs it)
  const {
    startStream,
    cancel,
    isStreaming,
    streamedContent,
    error: streamError,
  } = useMarketingChatStream({
    onComplete: async (fullText, metadata) => {
      const fallbackMeta =
        !metadata || Object.keys(metadata).length === 0
          ? {
              suggested_questions: [
                'Can you expand on that with an example?',
                'How does this apply to my use case?',
                'What are the next steps?',
              ],
              sources: [
                { title: 'EthosPrompt Marketing KB (Mock)', url: '#', score: 0.92 },
                { title: 'Website: Solutions Page (Mock)', url: '/solutions', score: 0.81 },
              ],
            }
          : metadata;

      const assistantMessage: MarketingChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullText,
        timestamp: new Date(),
        sources: (fallbackMeta as any)?.sources,
        suggested_questions: (fallbackMeta as any)?.suggested_questions,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Save to browser cache
      if (currentQueryRef.current) {
        try {
          await setCached(currentQueryRef.current, fullText, fallbackMeta);
          console.log('💾 Saved response to browser cache');
        } catch (e) {
          console.error('Failed to save to cache:', e);
        }
      }

      try {
        if (conversationId) {
          await conversationService.addMessage(conversationId, {
            role: 'assistant',
            content: fullText,
            metadata: fallbackMeta || {},
          });
        }
      } catch {
        // Silently ignore message save errors
      }
    },
    // DD-005: Improved error messages with context-specific user-friendly text
    onError: (err) => {
      const msg = err.message?.toLowerCase() || '';
      const userFriendlyMessage = msg.includes('timeout') || msg.includes('timed out')
        ? 'Response took too long. Please try again.'
        : msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')
        ? 'Connection issue. Please check your internet and try again.'
        : msg.includes('abort')
        ? 'Request was cancelled.'
        : 'Something went wrong. Please try again or refresh the page.';
      setError(userFriendlyMessage);
    },
  });

  // Use modal scroll lock hook (fixes iOS Safari)
  // Only lock scroll in center-modal mode; side-panel allows page interaction
  useModalScrollLock(isOpen && displayMode === 'center-modal');

  // Use smart scroll hook (consolidates 4 effects into 1)
  const { showScrollButton, scrollToBottom, handleScroll } = useSmartScroll({
    scrollRef: scrollAreaRef,
    messagesLength: messages.length,
    streamedContent,
  });

  // Screen reader announcements state
  const [srAnnouncement, setSrAnnouncement] = useState('');

  // Focus textarea when modal opens with slight delay for animation
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Announce streaming status for screen readers
  useEffect(() => {
    if (isStreaming) {
      setSrAnnouncement('Loading response...');
    }
  }, [isStreaming]);

  // Announce new messages for screen readers
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setSrAnnouncement(`molē responded: ${lastMessage.content.substring(0, 100)}...`);
      }
    }
  }, [messages.length]);

  // DD-006: Announce errors for screen readers
  useEffect(() => {
    if (error) {
      setSrAnnouncement(`Error: ${error}`);
    }
  }, [error]);

  // DD-007: Announce suggested questions for screen readers
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.suggested_questions?.length) {
        const questionCount = lastMsg.suggested_questions.length;
        // Delay to avoid overlap with message announcement
        const timer = setTimeout(() => {
          setSrAnnouncement(`${questionCount} follow-up suggestions available`);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [messages]);

  // Mark initial load complete after first render with messages
  useEffect(() => {
    if (messages.length > 0 && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [messages.length, initialLoadComplete]);

  // Cancel streaming on close
  useEffect(() => {
    if (!isOpen) {
      cancel();
    }
  }, [isOpen, cancel]);

  // Auto-scroll when form opens
  useEffect(() => {
    if (activeForm) {
      // Small delay to let form render first
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeForm, scrollToBottom]);

  // ESC key to close modal and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap: Tab navigation within modal
      if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Surface streaming hook errors in the UI
  useEffect(() => {
    if (streamError) {
      setError(streamError.message || 'Stream error');
    }
  }, [streamError]);

  // Firestore subscription is now handled by useChatMessages hook

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const query = input.trim();
    const userMessage: MarketingChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);

    // Check browser cache first
    try {
      const cached = await getCached(query);
      if (cached) {
        console.log('🚀 Cache HIT! Serving instant response.');
        const cachedMessage: MarketingChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: cached.response,
          timestamp: new Date(),
          sources: cached.metadata?.sources,
          suggested_questions: cached.metadata?.suggested_questions,
        };
        setMessages((prev) => [...prev, cachedMessage]);

        // Optional: Persist to conversation history even if cached
        if (conversationId) {
          // We can do this in background
          conversationService
            .addMessage(conversationId, {
              role: 'user',
              content: query,
            })
            .then(() => {
              conversationService.addMessage(conversationId, {
                role: 'assistant',
                content: cached.response,
                metadata: cached.metadata || {},
              });
            })
            .catch(() => {});
        }
        return; // Skip API call
      }
    } catch (e) {
      console.error('Cache lookup failed:', e);
    }

    // Cache Miss - Proceed to API
    currentQueryRef.current = query;

    try {
      // Try to persist conversation for authenticated users (optional - won't block anonymous users)
      let ensuredId = conversationId;
      try {
        ensuredId = await conversationService.ensureConversation(conversationId ?? undefined, {
          pageContext,
        });
        if (!conversationId) setConversationId(ensuredId);

        // Persist user's message (only for authenticated users)
        await conversationService.addMessage(ensuredId, {
          role: 'user',
          content: userMessage.content,
        });
      } catch (authError) {
        // User is not authenticated - conversation won't be persisted, but chat still works
        console.log('💬 [MARKETING_CHAT] Anonymous user - conversation not persisted');
      }

      // Start streaming with conversation context (works for both authenticated and anonymous users)
      await startStream(userMessage.content, pageContext, ensuredId ?? undefined);
    } catch (error) {
      console.error('Stream start error:', error);
      setError('Failed to start streaming. Please try again.');
      setLastFailedMessage(query); // Store failed message for retry
    }
  };

  // Handle keyboard input: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea based on content (max 5 lines)
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInput(textarea.value);

    // Reset height to auto to get proper scrollHeight
    textarea.style.height = 'auto';
    // Calculate max height (5 lines at ~20px per line + padding)
    const maxHeight = 120; // ~5 lines
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleReset = async () => {
    clearMessages();
    setError(null);
    marketingChatService.resetConversation();
    setConversationId(null);

    // Clear browser cache (fixes C4) but preserve display mode preference
    try {
      const savedDisplayMode = localStorage.getItem('marketing_chat_display_mode');
      await clearCache();
      localStorage.removeItem('marketing_chat_history');
      // Restore display mode preference if it was saved
      if (savedDisplayMode) {
        localStorage.setItem('marketing_chat_display_mode', savedDisplayMode);
      }
      console.log('🗑️ Cache and history cleared (display mode preserved)');
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }
  };

  // MemoizedMessageContent is now defined outside the component (DD-001 fix)

  return (
    <>
      {/* Backdrop Overlay - only shown in center-modal mode (focused conversation) */}
      {/* Side-panel mode has NO overlay so users can interact with the website */}
      {isOpen && displayMode === 'center-modal' && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300 animate-in fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Chat Panel - Conditional positioning based on display mode */}
      <div
        ref={panelRef}
        className={
          displayMode === 'center-modal'
            ? `fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none ${
                isOpen ? '' : 'opacity-0'
              }`
            : `fixed top-0 right-0 h-full z-[9999] pointer-events-auto motion-safe:transition-transform motion-safe:duration-300 motion-reduce:transition-none ease-out ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
              } w-full md:w-96 md:max-w-96`
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-panel-title"
        data-display-mode={displayMode}
      >
        {/* Inner container for center-modal styling - captures clicks */}
        <div
          className={
            displayMode === 'center-modal'
              ? `pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-[600px] h-[80vh] flex flex-col overflow-hidden ${
                  isOpen ? 'center-modal-enter' : ''
                }`
              : 'h-full w-full bg-white md:bg-ethos-offwhite md:border-l border-gray-200 shadow-2xl flex flex-col'
          }
        >
        {/* Header - Clean, professional design */}
        <div className="px-4 md:px-5 py-3 md:py-4 border-b border-gray-200/60 bg-white flex-shrink-0">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            {/* Left: Icon and title */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 h-7 w-7 md:h-8 md:w-8">
                <React.Suspense
                  fallback={
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-gray-100 animate-pulse" />
                  }
                >
                  <Moleicon hoverIntensity={0.1} rotateOnHover={false} />
                </React.Suspense>
              </div>
              <div className="min-w-0 flex flex-col">
                <h2
                  id="chat-panel-title"
                  className="text-sm md:text-base font-medium text-gray-900 leading-tight"
                >
                  molē
                </h2>
                <p className="text-xs font-normal text-gray-500 leading-tight mt-0.5">
                  AI Assistant
                </p>
              </div>
            </div>

            {/* Right: Action controls */}
            <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
              {/* Display mode toggle: Side Panel ↔ Center Modal */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setDisplayMode(displayMode === 'side-panel' ? 'center-modal' : 'side-panel');
                }}
                title={displayMode === 'side-panel' ? 'Switch to focused mode (center)' : 'Switch to co-browse mode (side panel)'}
                aria-label={`Display mode: ${displayMode}. Click to switch.`}
                className="h-10 w-10 md:h-9 md:w-9 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition-colors touch-target"
              >
                {displayMode === 'side-panel' ? (
                  <Maximize2 className="h-5 w-5 md:h-[18px] md:w-[18px]" />
                ) : (
                  <PanelRight className="h-5 w-5 md:h-[18px] md:w-[18px]" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                title="Reset conversation"
                disabled={messages.length === 0}
                aria-label="Reset conversation"
                className="h-10 w-10 md:h-9 md:w-9 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-target"
              >
                <RotateCcw className="h-5 w-5 md:h-[18px] md:w-[18px]" />
              </Button>
              <div className="w-px h-5 bg-gray-200 mx-1 md:mx-1.5" />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close chat"
                className="h-10 w-10 md:h-9 md:w-9 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition-colors touch-target"
              >
                <X className="h-5 w-5 md:h-[18px] md:w-[18px]" />
              </Button>
            </div>
          </div>
        </div>

        {/* History sidebar removed - requires auth, not suitable for public marketing chat */}

        {/* Offline indicator */}
        {!isOnline && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-center gap-2 flex-shrink-0">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-xs text-yellow-800 font-medium">
              You're offline. Messages will be sent when you reconnect.
            </span>
          </div>
        )}

        {/* Messages Area with smart scroll tracking - min-h-0 enables flex child to shrink below content size */}
        <ScrollArea
          className="flex-1 min-h-0 px-4 md:px-6 pt-3 md:pt-4 pb-4 bg-white md:bg-ethos-offwhite"
          ref={scrollAreaRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-ethos-purple to-ethos-purple-light flex items-center justify-center shadow-lg mb-3 md:mb-4">
                <span className="text-white text-2xl md:text-3xl">👋</span>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                Welcome to molē!
              </h3>
              <p className="text-xs md:text-sm text-gray-600 max-w-sm mb-4 md:mb-6">
                I'm here to help you learn about EthosPrompt's services, features, and pricing. Ask
                me anything!
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                <button
                  onClick={() => setInput('What is EthosPrompt?')}
                  className="text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg border border-gray-200 bg-white hover:border-ethos-purple hover:bg-ethos-purple/5 transition-all duration-200 text-xs md:text-sm text-gray-700 hover:text-ethos-purple touch-target"
                >
                  What is EthosPrompt?
                </button>
                <button
                  onClick={() => setInput('How much does the Professional Platform cost?')}
                  className="text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg border border-gray-200 bg-white hover:border-ethos-purple hover:bg-ethos-purple/5 transition-all duration-200 text-xs md:text-sm text-gray-700 hover:text-ethos-purple touch-target"
                >
                  How much does the Professional Platform cost?
                </button>
                <button
                  onClick={() => setInput('How do I get started?')}
                  className="text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg border border-gray-200 bg-white hover:border-ethos-purple hover:bg-ethos-purple/5 transition-all duration-200 text-xs md:text-sm text-gray-700 hover:text-ethos-purple touch-target"
                >
                  How do I get started?
                </button>
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1 && !isStreaming && !error;
            return (
              <div
                key={message.id}
                className={`${isLastMessage ? 'mb-3 md:mb-4' : 'mb-3 md:mb-5'} flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: initialLoadComplete ? '0ms' : `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[90%] md:max-w-[88%] transition-all duration-200 ${
                    message.role === 'user'
                      ? 'rounded-2xl rounded-br-sm px-4 md:px-5 py-3 md:py-3.5 shadow-lg hover:shadow-xl chat-message-user-text'
                      : 'rounded-2xl rounded-bl-sm px-4 md:px-5 py-3 md:py-3.5 shadow-md hover:shadow-lg chat-message-assistant-text'
                  }`}
                  style={
                    message.role === 'user'
                      ? {
                          background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)',
                          boxShadow: '0 10px 15px -3px rgba(156, 67, 254, 0.25)',
                        }
                      : {
                          background: 'linear-gradient(135deg, rgba(156, 67, 254, 0.12) 0%, rgba(76, 194, 233, 0.15) 100%)',
                          border: '1px solid rgba(156, 67, 254, 0.25)',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (message.role === 'user') {
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(156, 67, 254, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (message.role === 'user') {
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(156, 67, 254, 0.25)';
                    }
                  }}
                >
                  <MemoizedMessageContent content={message.content} />
                  {message.sources && message.sources.length > 0 && (
                    <div
                      className={`mt-3 pt-3 border-t ${
                        message.role === 'user' ? 'border-white/25' : 'border-gray-200'
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
                          message.role === 'user' ? 'text-white/95' : 'text-gray-700'
                        }`}
                      >
                        Sources:
                      </p>
                      <div className="flex flex-col gap-1">
                        {message.sources.map((source, idx) => (
                          <p
                            key={`${message.id}-source-${idx}`}
                            className={`text-xs leading-relaxed ${
                              message.role === 'user' ? 'text-white/85' : 'text-gray-600'
                            }`}
                          >
                            • {source.title}
                            {source.score && (
                              <span
                                className={`ml-1 font-medium ${
                                  message.role === 'user' ? 'text-white/90' : 'text-gray-700'
                                }`}
                              >
                                ({(source.score * 100).toFixed(0)}% match)
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Follow-up Questions (Assistant messages only) */}
                  {message.role === 'assistant' &&
                    message.suggested_questions &&
                    message.suggested_questions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold mb-2 text-gray-700">
                          You might also want to know:
                        </p>
                        <div className="flex flex-col gap-2">
                          {message.suggested_questions.map((question, idx) => (
                            <button
                              key={`${message.id}-question-${idx}`}
                              onClick={() => {
                                setInput(question);
                                textareaRef.current?.focus();
                              }}
                              className="w-full text-left text-xs px-3 py-2 rounded-lg bg-ethos-purple/5 hover:bg-ethos-purple/10 text-ethos-purple border border-ethos-purple/20 hover:border-ethos-purple/40 transition-all duration-200 hover:shadow-sm"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  {/* Context-aware action buttons - only show when relevant */}
                  {message.role === 'assistant' && (() => {
                    const contentLower = message.content.toLowerCase();
                    const showROI = /\b(roi|return on investment|savings|calculate|cost reduction)\b/.test(contentLower);
                    const showConsultation = /\b(consultation|schedule|meeting|demo|talk to|speak with|contact us)\b/.test(contentLower);

                    if (!showROI && !showConsultation) return null;

                    return (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                        {showROI && (
                          <button
                            onClick={() => setActiveForm('roi-calculator')}
                            className="text-xs px-3 py-1.5 rounded-md bg-white text-gray-700 border border-gray-300 hover:border-gray-400 transition-colors font-medium shadow-sm hover:shadow"
                          >
                            Calculate ROI
                          </button>
                        )}
                        {showConsultation && (
                          <button
                            onClick={() => setActiveForm('consultation-request')}
                            className="text-xs px-3 py-1.5 rounded-md bg-white text-gray-700 border border-gray-300 hover:border-gray-400 transition-colors font-medium shadow-sm hover:shadow"
                          >
                            Request Consultation
                          </button>
                        )}
                      </div>
                    );
                  })()}
                  <p
                    className={`text-xs mt-2 font-medium ${
                      message.role === 'user' ? 'text-white/65' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}

          {/* ARIA live region for screen readers - improved announcements */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {srAnnouncement}
          </div>

          {/* Streaming content or typing indicator - reduced bottom margin when last element */}
          {isStreaming && (
            <div className={error ? 'mb-3 md:mb-5' : 'mb-3 md:mb-4'}>
              {streamedContent ? <StreamingMessage text={streamedContent} /> : <TypingIndicator />}
            </div>
          )}

          {error && (
            <div className="mb-3 md:mb-4 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div
                className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-3.5 shadow-md w-full"
                role="alert"
              >
                <p className="text-sm leading-relaxed">{error}</p>
              </div>
              {lastFailedMessage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setInput(lastFailedMessage);
                    setLastFailedMessage(null);
                  }}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry Message
                </Button>
              )}
            </div>
          )}

          {/* Inline Form Rendering - centered in chat flow */}
          {activeForm === 'roi-calculator' && (
            <div className="flex justify-center items-start mb-4 px-2">
              <div className="w-full max-w-sm">
                <ROICalculatorForm
                  onClose={() => setActiveForm(null)}
                  onCalculate={(result) => setLastROIResult(result)}
                  onRequestConsultation={() => setActiveForm('consultation-request')}
                />
              </div>
            </div>
          )}
          {activeForm === 'consultation-request' && (
            <div className="flex justify-center items-start mb-4 px-2">
              <div className="w-full max-w-sm">
                <ConsultationRequestForm
                  onClose={() => setActiveForm(null)}
                  pageContext={pageContext as 'intelligent-applications' | 'solutions' | 'smart-assistant' | 'system-integration'}
                  prefillData={lastROIResult ? {
                    company: '',
                    notes: `ROI Calculator Results:\n• Annual Savings: $${lastROIResult.annualSavings.toLocaleString()}\n• Monthly Time Savings: ${lastROIResult.monthlyTimeSavings} hours\n• Calculated on: ${lastROIResult.calculatedAt.toLocaleDateString()}\n\nI'd like to discuss implementing this solution.`
                  } : undefined}
                />
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Scroll to bottom button - appears when not at bottom */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-32 right-6 md:right-8 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-ethos-purple hover:border-ethos-purple/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
            aria-label="Scroll to bottom"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        {/* Input Section - Auto-expanding textarea with safe area padding */}
        <div
          className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 bg-white md:bg-ethos-offwhite flex-shrink-0"
          style={{
            // Add safe area padding for mobile devices with notches/home indicators
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isStreaming}
              rows={1}
              className="flex-1 min-w-0 w-auto border border-gray-300 focus:border-ethos-purple focus:ring-2 focus:ring-ethos-purple/20 focus:outline-none rounded-xl text-gray-900 text-sm md:text-base min-h-[44px] max-h-[120px] py-2.5 px-4 resize-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Chat message input. Press Enter to send, Shift+Enter for new line"
              style={{
                fontSize: '16px', // Prevents zoom on iOS
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isStreaming || !input.trim()}
              aria-label="Send message"
              className="shrink-0 bg-gradient-to-br from-ethos-purple to-ethos-purple-light hover:shadow-lg transition-all duration-200 rounded-lg touch-target disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background:
                  isStreaming || !input.trim()
                    ? '#9ca3af'
                    : 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)',
                color: '#ffffff',
              }}
            >
              {isStreaming ? (
                <Loader2
                  className="h-5 w-5 md:h-4 md:w-4 animate-spin"
                  style={{ color: '#ffffff' }}
                />
              ) : (
                <Send className="h-5 w-5 md:h-4 md:w-4" style={{ color: '#ffffff' }} />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center leading-tight">
            Powered by AI • Information may not always be accurate
          </p>
        </div>
        {/* End of inner container for center-modal styling */}
        </div>
      </div>
    </>
  );
});

// Export with ErrorBoundary wrapper
export const MarketingChatModal: React.FC<MarketingChatModalProps> = (props) => (
  <ErrorBoundary>
    <MarketingChatModalInner {...props} />
  </ErrorBoundary>
);
