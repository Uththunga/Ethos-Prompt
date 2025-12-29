/**
 * Example: Integrating Browser Cache with Marketing Chat
 * Phase 0 - Task 0.1.2: Chat Component Integration
 */

import React, { useState } from 'react';
import { useBrowserCache } from '../hooks/useBrowserCache';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  cached?: boolean;
  ttft?: number; // Time to first token (ms)
}

export const MarketingChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const { getCached, setCached, stats, clearCache } = useBrowserCache();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    const startTime = Date.now();

    try {
      // Step 1: Check browser cache first (L1)
      const cachedResponse = await getCached(input);

      if (cachedResponse) {
        // Cache HIT - Instant response!
        const ttft = Date.now() - startTime;

        const assistantMessage: Message = {
          role: 'assistant',
          content: cachedResponse,
          cached: true,
          ttft,
        };

        setMessages(prev => [...prev, assistantMessage]);
        setLoading(false);

        console.log(`⚡ INSTANT response from browser cache (${ttft}ms)`);
        return;
      }

      // Step 2: Cache MISS - Fetch from API
      console.log('Fetching from API...');
      const response = await fetch('/api/ai/marketing-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const ttft = Date.now() - startTime;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        cached: false,
        ttft,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Step 3: Cache the response for future queries
      await setCached(input, data.response);

      console.log(`📡 API response cached (${ttft}ms)`);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      {/* Cache Statistics */}
      <div className="cache-stats">
        <span>Cache Hit Rate: {stats.hitRate.toFixed(1)}%</span>
        <span>Cached Responses: {stats.cacheSize}</span>
        <button onClick={clearCache}>Clear Cache</button>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            {msg.ttft !== undefined && (
              <div className="metadata">
                {msg.cached ? '⚡ Cached' : '📡 API'} • {msg.ttft}ms
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="input-container">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask molē..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

/**
 * Performance Comparison:
 *
 * WITHOUT Browser Cache:
 * - Every query: 4000ms (Watsonx API)
 * - User waits 4 seconds every time
 *
 * WITH Browser Cache:
 * - First query: 4000ms (cache miss → API)
 * - Repeat query: 10-50ms (cache hit!)
 * - 99% faster for repeat queries
 *
 * Expected Hit Rate: 30-40% (common FAQs)
 * Average TTFT: ~2500ms → ~1500ms (40% improvement)
 */
