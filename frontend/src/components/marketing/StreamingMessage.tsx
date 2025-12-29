import React from 'react';
import { MessageContent } from './MessageContent';

interface StreamingMessageProps {
  text: string;
  /** Show cursor indicator (default: true) */
  showCursor?: boolean;
}

/**
 * StreamingMessage - Displays AI response text as it streams in
 * Features a blinking cursor at the end for visual feedback
 *
 * Layout notes:
 * - Keyframe animation defined in index.css (no inline <style> tag)
 * - Simple fade-in animation (no translation to avoid overflow)
 */
export const StreamingMessage = React.memo(function StreamingMessage({
  text,
  showCursor = true,
}: StreamingMessageProps) {
  return (
    <div
      className="flex justify-start animate-in fade-in duration-150"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="molē is responding"
    >
      <div className="bg-white border border-gray-200/80 rounded-2xl px-5 py-3.5 shadow-md hover:shadow-lg transition-shadow duration-200 max-w-[90%] md:max-w-[88%] min-h-[48px]">
        <div className="relative">
          <MessageContent content={text} className="text-xs md:text-sm" />
          {/* Blinking cursor indicator - uses cursor-blink keyframe from index.css */}
          {showCursor && (
            <span
              className="inline-block w-0.5 h-4 bg-ethos-purple ml-0.5 align-middle motion-reduce:animate-none"
              style={{ animation: 'cursor-blink 1s ease-in-out infinite' }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
});
