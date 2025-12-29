import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface UseSmartScrollOptions {
  scrollRef: RefObject<HTMLElement | null>;
  messagesLength: number;
  streamedContent: string;
}

const SCROLL_THRESHOLD = 100; // px from bottom to trigger auto-scroll

/**
 * Consolidates scroll behavior logic
 * Scrolls to show the TOP of new responses so users can read from the beginning
 */
export function useSmartScroll({
  scrollRef,
  messagesLength,
  streamedContent,
}: UseSmartScrollOptions) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessagesLength = useRef(messagesLength);
  const prevStreamedContent = useRef(streamedContent);
  const hasScrolledForCurrentStream = useRef(false);

  const checkIfAtBottom = useCallback(() => {
    if (!scrollRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
  }, [scrollRef]);

  // Scroll to show the TOP of the streaming/typing indicator area
  const scrollToStreamingTop = useCallback(() => {
    if (!scrollRef.current) return;

    // Find message containers
    const messageContainers = scrollRef.current.querySelectorAll('[class*="animate-in"]');

    let targetElement: HTMLElement | null = null;

    if (messageContainers.length > 0) {
      // Scroll to show the top of the last message (which is user's question)
      // The streaming response appears after this
      targetElement = messageContainers[messageContainers.length - 1] as HTMLElement;
    }

    if (targetElement) {
      // Calculate scroll position to show the target element at the top with padding
      const elementTop = targetElement.offsetTop - 16;
      scrollRef.current.scrollTo({
        top: Math.max(0, elementTop),
        behavior: 'smooth',
      });
    }
  }, [scrollRef]);

  // Keep the original scrollToBottom for manual "scroll to bottom" button
  const scrollToBottom = useCallback(
    (smooth = true) => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
        setIsAtBottom(true);
        setShowScrollButton(false);
      }
    },
    [scrollRef]
  );

  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom);
  }, [checkIfAtBottom]);

  // Effect: When streaming STARTS (content goes from empty to non-empty),
  // scroll to show the top of the response area
  useEffect(() => {
    const wasEmpty = !prevStreamedContent.current || prevStreamedContent.current.length === 0;
    const hasContent = streamedContent && streamedContent.length > 0;

    if (wasEmpty && hasContent && !hasScrolledForCurrentStream.current) {
      // Streaming just started - scroll to show top of response
      hasScrolledForCurrentStream.current = true;
      requestAnimationFrame(() => {
        scrollToStreamingTop();
      });
    }

    // Reset flag when streaming ends (content becomes empty)
    if (!hasContent && prevStreamedContent.current) {
      hasScrolledForCurrentStream.current = false;
    }

    prevStreamedContent.current = streamedContent;
  }, [streamedContent, scrollToStreamingTop]);

  // Effect: When a new message is added (after streaming completes),
  // scroll to show the TOP of that message
  useEffect(() => {
    if (messagesLength > prevMessagesLength.current) {
      // New message added - scroll to show its top
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;

        const messageContainers = scrollRef.current.querySelectorAll('[class*="animate-in"]');
        if (messageContainers.length === 0) return;

        // Get the last message container (the newly added one)
        const lastMessage = messageContainers[messageContainers.length - 1] as HTMLElement;
        if (!lastMessage) return;

        // Calculate scroll position to show the TOP of the last message
        const messageTop = lastMessage.offsetTop - 16;

        scrollRef.current.scrollTo({
          top: Math.max(0, messageTop),
          behavior: 'smooth',
        });
      });
    }
    prevMessagesLength.current = messagesLength;
  }, [messagesLength, scrollRef]);

  return {
    isAtBottom,
    showScrollButton,
    scrollToBottom,
    scrollToStreamingTop,
    handleScroll,
  };
}
