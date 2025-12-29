/**
 * ChatInput Component
 * Textarea with send button for chat input
 */
import React, { useRef, useEffect } from 'react';
import { Send } from '@/components/icons';
import { Button } from '@/components/marketing/ui/button';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  isOnline?: boolean;
  autoFocus?: boolean;
}

export const ChatInput = React.memo(function ChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled = false,
  placeholder = 'Ask molē anything...',
  isOnline = true,
  autoFocus = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }

    // Default: Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (!disabled && value.trim()) {
      onSend();
    }
  };

  return (
    <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You're offline. Messages will be sent when connection is restored.
          </p>
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          style={{
            minHeight: '44px',
            maxHeight: '200px',
          }}
          aria-label="Chat input"
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          size="icon"
          variant="ghost"
          className="absolute right-2 bottom-2 h-8 w-8 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </Button>
      </div>

      {/* Helper text */}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
});
