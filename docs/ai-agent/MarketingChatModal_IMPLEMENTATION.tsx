/**
 * Marketing Chat Modal Component - READY TO COPY
 * 
 * This file contains the complete implementation of MarketingChatModal.tsx
 * Copy this content to: frontend/src/components/marketing/MarketingChatModal.tsx
 * 
 * Features:
 * - Full-screen chat interface
 * - Message history with timestamps
 * - Loading states and error handling
 * - Conversation persistence (localStorage)
 * - Source citations display
 * - Suggested prompts for new conversations
 * - Conversation reset functionality
 * - Accessibility (ARIA labels, keyboard navigation)
 * - EthosPrompt branding
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  marketingChatService,
  type MarketingChatMessage,
  type MarketingChatResponse,
} from '@/services/marketingChatService';

interface MarketingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext?: string;
}

export function MarketingChatModal({ isOpen, onClose, pageContext }: MarketingChatModalProps) {
  const [messages, setMessages] = useState<MarketingChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load conversation history from localStorage
  useEffect(() => {
    if (isOpen) {
      loadConversationHistory();
    }
  }, [isOpen]);

  const loadConversationHistory = () => {
    try {
      const saved = localStorage.getItem('marketing_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(
          parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }
    } catch (error) {
      console.warn('Failed to load conversation history:', error);
    }
  };

  const saveConversationHistory = (newMessages: MarketingChatMessage[]) => {
    try {
      localStorage.setItem('marketing_chat_history', JSON.stringify(newMessages));
    } catch (error) {
      console.warn('Failed to save conversation history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: MarketingChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveConversationHistory(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response: MarketingChatResponse = await marketingChatService.sendMessage(
        userMessage.content,
        pageContext
      );

      if (response.success) {
        const assistantMessage: MarketingChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          sources: response.sources,
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        saveConversationHistory(updatedMessages);
      } else {
        setError(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setError(null);
    marketingChatService.resetConversation();
    localStorage.removeItem('marketing_chat_history');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Chat with molē</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                title="Reset conversation"
                disabled={messages.length === 0}
                aria-label="Reset conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI assistant for EthosPrompt information
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4" role="img" aria-label="Waving hand">
                👋
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome to molē!</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                I'm here to help you learn about EthosPrompt's services, features, and pricing.
                Ask me anything!
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-md">
                <Button
                  variant="outline"
                  className="text-left justify-start"
                  onClick={() => setInput('What is EthosPrompt?')}
                >
                  What is EthosPrompt?
                </Button>
                <Button
                  variant="outline"
                  className="text-left justify-start"
                  onClick={() => setInput('How much does the Professional Platform cost?')}
                >
                  How much does the Professional Platform cost?
                </Button>
                <Button
                  variant="outline"
                  className="text-left justify-start"
                  onClick={() => setInput('How do I get started?')}
                >
                  How do I get started?
                </Button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
                role="article"
                aria-label={`${message.role === 'user' ? 'Your' : 'Assistant'} message`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-semibold mb-1">Sources:</p>
                    {message.sources.map((source, idx) => (
                      <p key={idx} className="text-xs opacity-80">
                        • {source.title}
                        {source.score && ` (${(source.score * 100).toFixed(0)}% match)`}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">molē is thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div
              className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 mb-4"
              role="alert"
            >
              <p className="text-sm">{error}</p>
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about EthosPrompt..."
              disabled={isLoading}
              className="flex-1"
              aria-label="Chat message input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by AI • Information may not always be accurate
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

