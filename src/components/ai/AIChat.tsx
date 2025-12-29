import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { aiService, type ChatResponse } from '@/services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    provider?: string;
    model?: string;
    tokens_used?: number;
    cost?: number;
    response_time?: number;
    sources?: Array<{
      document: string;
      relevance_score: number;
      content_preview: string;
    }>;
  };
  isStreaming?: boolean;
  error?: string;
  retryCount?: number;
}

interface AIChatProps {
  conversationId?: string;
  useRAG?: boolean;
  onConversationStart?: (conversationId: string) => void;
  onMessageSent?: (message: Message) => void;
  onMessageReceived?: (message: Message) => void;
  className?: string;
  maxRetries?: number;
  enableStreaming?: boolean;
  showMetadata?: boolean;
  autoSave?: boolean;
}

export const AIChat: React.FC<AIChatProps> = ({
  conversationId,
  useRAG = false,
  onConversationStart,
  onMessageSent,
  onMessageReceived,
  className = '',
  maxRetries = 3,
  enableStreaming = false,
  showMetadata = true,
  autoSave = true
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async (retryCount = 0) => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setTypingIndicator(true);

    // Call onMessageSent callback
    onMessageSent?.(userMessage);

    try {
      setConnectionStatus('connecting');

      let response: ChatResponse;

      if (useRAG) {
        response = await aiService.ragChat({
          query: userMessage.content,
          conversation_id: currentConversationId,
          max_context_tokens: 4000
        });
      } else {
        response = await aiService.chat({
          query: userMessage.content,
          conversation_id: currentConversationId
        });
      }

      setConnectionStatus('connected');

      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          metadata: {
            provider: response.metadata?.provider,
            model: response.metadata?.model,
            tokens_used: response.metadata?.tokens_used,
            cost: response.metadata?.cost,
            response_time: response.metadata?.response_time,
            sources: response.sources
          }
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Call onMessageReceived callback
        onMessageReceived?.(assistantMessage);

        // Set conversation ID if this is the first message
        if (response.conversation_id && !currentConversationId) {
          setCurrentConversationId(response.conversation_id);
          onConversationStart?.(response.conversation_id);
        }

        // Auto-save conversation if enabled
        if (autoSave && currentConversationId) {
          localStorage.setItem(`conversation_${currentConversationId}`, JSON.stringify([...messages, userMessage, assistantMessage]));
        }
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('disconnected');

      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      // Retry logic
      if (retryCount < maxRetries && !aiService.isAuthError(error as Error)) {
        toast({
          title: 'Retrying...',
          description: `Attempt ${retryCount + 1} of ${maxRetries}`,
        });

        setTimeout(() => {
          sendMessage(retryCount + 1);
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff

        return;
      }

      // Add error message to chat
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
        error: errorMessage,
        retryCount
      };

      setMessages(prev => [...prev, errorMsg]);

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setTypingIndicator(false);
    }
  }, [input, isLoading, currentConversationId, useRAG, maxRetries, onMessageSent, onMessageReceived, onConversationStart, autoSave, messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        )}

        <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          <Card className={`${isUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
            <CardContent className="p-4">
              <div className="prose prose-sm max-w-none">
                {message.content.split('\n').map((line, index) => (
                  <p key={index} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>

              {/* Message metadata */}
              {message.metadata && !isUser && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {message.metadata.provider && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.provider}
                      </Badge>
                    )}
                    {message.metadata.model && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.model}
                      </Badge>
                    )}
                    {message.metadata.tokens_used && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.tokens_used} tokens
                      </Badge>
                    )}
                    {message.metadata.cost && (
                      <Badge variant="outline" className="text-xs">
                        {formatCost(message.metadata.cost)}
                      </Badge>
                    )}
                  </div>

                  {/* Sources */}
                  {message.metadata.sources && message.metadata.sources.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-600 mb-1">Sources:</div>
                      <div className="flex flex-col gap-1">
                        {message.metadata.sources.map((source, index) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border">
                            <div className="flex items-center gap-1 mb-1">
                              <FileText className="w-3 h-3" />
                              <span className="font-medium">{source.document}</span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                {(source.relevance_score * 100).toFixed(0)}% match
                              </Badge>
                            </div>
                            <div className="text-gray-600">{source.content_preview}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-gray-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">AI Assistant</h2>
          {useRAG && (
            <Badge variant="secondary" className="ml-auto">
              <Search className="w-3 h-3 mr-1" />
              RAG Enabled
            </Badge>
          )}
        </div>
        {currentConversationId && (
          <div className="text-xs text-gray-500 mt-1">
            Conversation: {currentConversationId.slice(-8)}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Start a conversation</p>
            <p className="text-sm">
              {useRAG
                ? "Ask questions about your documents or any topic"
                : "Ask me anything and I'll help you out"
              }
            </p>
          </div>
        )}

        {messages.map(renderMessage)}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={useRAG ? "Ask about your documents..." : "Type your message..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
