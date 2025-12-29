import React, { useEffect, useState } from 'react';

/**
 * TypingIndicator - Animated loading indicator with descriptive messages
 * Shows engaging status messages like "Thinking...", "Retrieving knowledge..."
 *
 * Features:
 * - Cycling status messages for better UX
 * - Animated dot indicator alongside text
 * - Fixed-width container to prevent layout shifts
 * - Smooth fade-in on mount
 * - Accessible with ARIA labels and screen reader support
 */

const STATUS_MESSAGES = [
  'Thinking...',
  'Retrieving knowledge...',
  'Preparing response...',
  'Almost there...',
];

export const TypingIndicator = React.memo(function TypingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex justify-start animate-in fade-in duration-200"
      role="status"
      aria-label="Loading response"
      aria-live="polite"
    >
      {/* Fixed-size container to prevent layout shifts - matches assistant message styling */}
      <div
        className="rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-md flex items-center gap-3"
        style={{
          minHeight: '48px',
          minWidth: '180px',
          background: 'linear-gradient(135deg, rgba(156, 67, 254, 0.12) 0%, rgba(76, 194, 233, 0.15) 100%)',
          border: '1px solid rgba(156, 67, 254, 0.25)',
        }}
      >
        <span className="sr-only">{STATUS_MESSAGES[messageIndex]}</span>

        {/* Animated dots with gradient colors */}
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#9C43FE', // Purple from gradient
              animation: 'typing-dot-bounce 1.4s ease-in-out infinite',
              animationDelay: '0s',
            }}
            aria-hidden="true"
          />
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#7083F4', // Blend of purple and teal
              animation: 'typing-dot-bounce 1.4s ease-in-out infinite',
              animationDelay: '0.2s',
            }}
            aria-hidden="true"
          />
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#4CC2E9', // Teal from gradient
              animation: 'typing-dot-bounce 1.4s ease-in-out infinite',
              animationDelay: '0.4s',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Status message text */}
        <span
          className="text-sm font-medium text-gray-700 transition-all duration-300"
          style={{
            animation: 'fade-in-out 2s ease-in-out infinite',
          }}
        >
          {STATUS_MESSAGES[messageIndex]}
        </span>
      </div>

      {/* CSS for fade animation */}
      <style>{`
        @keyframes fade-in-out {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
});
