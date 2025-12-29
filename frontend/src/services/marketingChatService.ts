/**
 * Marketing Chat Service
 * Handles communication with the marketing agent backend API
 */

export interface MarketingChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; url?: string; score?: number }>;
  suggested_questions?: string[]; // Follow-up questions for assistant messages
}

export interface MarketingChatRequest {
  message: string;
  conversation_id?: string;
  page_context?: string;
}

export interface MarketingChatResponse {
  success: boolean;
  response: string;
  conversation_id: string;
  sources?: Array<{ title: string; url?: string; score?: number }>;
  suggested_questions?: string[]; // Follow-up questions to guide conversation
  metadata?: {
    model?: string;
    processing_time?: number;
    agent?: string;
    response_length?: number; // Word count for monitoring
  };
  error?: string;
}

class MarketingChatService {
  private apiBaseUrl: string;
  private conversationId: string | null = null;

  constructor() {
    // Priority: 1) VITE_API_BASE_URL if set (direct Cloud Run URL)
    //           2) Empty string = relative URL in production (uses Firebase Hosting rewrites)
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

    // Load conversation ID from localStorage
    this.conversationId = this.loadConversationId();
  }

  /**
   * Send a message to the marketing agent
   */
  async sendMessage(message: string, pageContext?: string): Promise<MarketingChatResponse> {
    try {
      const request: MarketingChatRequest = {
        message,
        conversation_id: this.conversationId || undefined,
        page_context: pageContext || this.detectPageContext(),
      };

      const response = await fetch(`${this.apiBaseUrl}/api/ai/marketing-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MarketingChatResponse = await response.json();

      // Save conversation ID
      if (data.conversation_id) {
        this.conversationId = data.conversation_id;
        this.saveConversationId(data.conversation_id);
      }

      return data;
    } catch (error) {
      console.error('Marketing chat error:', error);
      throw error;
    }
  }

  /**
   * Send a message with streaming response
   */
  async *sendMessageStream(
    message: string,
    pageContext?: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      const request: MarketingChatRequest = {
        message,
        conversation_id: this.conversationId || undefined,
        page_context: pageContext || this.detectPageContext(),
      };

      const response = await fetch(`${this.apiBaseUrl}/api/ai/marketing-chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                yield parsed.content;
              }
              if (parsed.conversation_id) {
                this.conversationId = parsed.conversation_id;
                this.saveConversationId(parsed.conversation_id);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Marketing chat stream error:', error);
      throw error;
    }
  }

  /**
   * Reset conversation (start new conversation)
   */
  resetConversation(): void {
    this.conversationId = null;
    localStorage.removeItem('marketing_conversation_id');
  }

  /**
   * Get current conversation ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * Detect current page context from URL
   */
  private detectPageContext(): string {
    const path = window.location.pathname;

    if (path === '/' || path === '') return 'homepage';
    if (path.startsWith('/solutions')) return 'solutions_page';
    if (path.startsWith('/services')) return 'services_page';
    if (path.startsWith('/pricing')) return 'pricing_page';
    if (path.startsWith('/about')) return 'about_page';
    if (path.startsWith('/contact')) return 'contact_page';

    return 'marketing_other';
  }

  /**
   * Load conversation ID from localStorage
   */
  private loadConversationId(): string | null {
    try {
      return localStorage.getItem('marketing_conversation_id');
    } catch {
      return null;
    }
  }

  /**
   * Save conversation ID to localStorage
   */
  private saveConversationId(conversationId: string): void {
    try {
      localStorage.setItem('marketing_conversation_id', conversationId);
    } catch (error) {
      console.warn('Failed to save conversation ID:', error);
    }
  }
}

// Export singleton instance
export const marketingChatService = new MarketingChatService();
