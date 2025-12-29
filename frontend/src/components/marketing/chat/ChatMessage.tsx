/**
 * ChatMessage Component
 * Individual message display for user and assistant messages
 */
import React from 'react';
import { MessageContent } from '@/components/marketing/MessageContent';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
}

export const ChatMessage = React.memo(function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming = false,
}: ChatMessageProps) {
  const normalizedContent = React.useMemo(
    () => content.replaceAll('\\r\\n', '\n').replaceAll('\\n', '\n').replaceAll('\\t', '\t'),
    [content]
  );

  return (
    <div
      className={`group flex gap-3 p-4 transition-all duration-200 ${
        role === 'user'
          ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl shadow-sm hover:shadow-md'
          : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
      }`}
      style={{
        boxShadow:
          role === 'user'
            ? '0 10px 15px -3px rgba(156, 67, 254, 0.25), 0 4px 6px -2px rgba(156, 67, 254, 0.15)'
            : undefined,
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {role === 'assistant' ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
            M
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-white font-semibold text-sm">
            U
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {role === 'assistant' ? 'molē' : 'You'}
          </span>
          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MessageContent content={normalizedContent} />
          {isStreaming && (
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="w-1 h-1 bg-purple-600 rounded-full animate-pulse" />
              <span
                className="w-1 h-1 bg-purple-600 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="w-1 h-1 bg-purple-600 rounded-full animate-pulse"
                style={{ animationDelay: '0.4s' }}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
