import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChat } from '../AIChat';

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AIChat Component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders chat interface correctly', () => {
    render(<AIChat />);
    
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders RAG-enabled chat interface', () => {
    render(<AIChat useRAG={true} />);
    
    expect(screen.getByText('RAG Enabled')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask about your documents...')).toBeInTheDocument();
  });

  it('displays conversation ID when provided', () => {
    const conversationId = 'conv_123456789';
    render(<AIChat conversationId={conversationId} />);
    
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  it('sends message on button click', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        response: 'AI response',
        metadata: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          tokens_used: 100,
          cost: 0.001,
        },
      }),
    });

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');
    
    await user.type(input, 'Hello AI');
    await user.click(sendButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Hello AI',
          conversation_id: undefined,
          use_rag: false,
        }),
      });
    });
  });

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        response: 'AI response',
        metadata: {},
      }),
    });

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    
    await user.type(input, 'Hello AI{enter}');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('displays user and AI messages', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        response: 'Hello! How can I help you?',
        metadata: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          tokens_used: 50,
          cost: 0.0005,
        },
      }),
    });

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Hello AI{enter}');

    // Check user message appears
    await waitFor(() => {
      expect(screen.getByText('Hello AI')).toBeInTheDocument();
    });

    // Check AI response appears
    await waitFor(() => {
      expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
    });
  });

  it('displays loading state during API call', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    (fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          success: true,
          response: 'Delayed response',
          metadata: {},
        }),
      }), 100))
    );

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Test message{enter}');

    // Check loading state appears
    expect(screen.getByText('Thinking...')).toBeInTheDocument();

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Delayed response')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('displays metadata for AI responses', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        response: 'Response with metadata',
        metadata: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          tokens_used: 150,
          cost: 0.002,
        },
      }),
    });

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Test{enter}');

    await waitFor(() => {
      expect(screen.getByText('anthropic')).toBeInTheDocument();
      expect(screen.getByText('claude-3-5-sonnet-20241022')).toBeInTheDocument();
      expect(screen.getByText('150 tokens')).toBeInTheDocument();
      expect(screen.getByText('$0.002000')).toBeInTheDocument();
    });
  });

  it('displays sources for RAG responses', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        response: 'RAG response with sources',
        sources: [
          {
            document: 'test-document.pdf',
            relevance_score: 0.95,
            content_preview: 'This is a preview of the source content...',
          },
        ],
        metadata: {},
      }),
    });

    render(<AIChat useRAG={true} />);
    
    const input = screen.getByPlaceholderText('Ask about your documents...');
    await user.type(input, 'What is in the document?{enter}');

    await waitFor(() => {
      expect(screen.getByText('Sources:')).toBeInTheDocument();
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      expect(screen.getByText('95% match')).toBeInTheDocument();
      expect(screen.getByText('This is a preview of the source content...')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    const mockToast = jest.fn();
    
    // Mock the toast hook to capture error calls
    jest.mocked(require('@/components/ui/use-toast').useToast).mockReturnValue({
      toast: mockToast,
    });
    
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Test message{enter}');

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'API Error',
        variant: 'destructive',
      });
    });
  });

  it('handles empty messages correctly', async () => {
    const user = userEvent.setup();
    
    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');
    
    // Try to send empty message
    await user.click(sendButton);
    
    // Should not make API call
    expect(fetch).not.toHaveBeenCalled();
    
    // Try to send whitespace-only message
    await user.type(input, '   ');
    await user.click(sendButton);
    
    // Should still not make API call
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls onConversationStart when conversation is created', async () => {
    const user = userEvent.setup();
    const mockOnConversationStart = jest.fn();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        response: 'New conversation response',
        conversation_id: 'new_conv_123',
        metadata: {},
      }),
    });

    render(<AIChat onConversationStart={mockOnConversationStart} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Start new conversation{enter}');

    await waitFor(() => {
      expect(mockOnConversationStart).toHaveBeenCalledWith('new_conv_123');
    });
  });

  it('disables input and button during loading', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    (fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          success: true,
          response: 'Delayed response',
          metadata: {},
        }),
      }), 100))
    );

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');
    
    await user.type(input, 'Test message{enter}');

    // Check that input and button are disabled during loading
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();

    // Wait for response and check they're enabled again
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(sendButton).not.toBeDisabled();
    }, { timeout: 2000 });
  });

  it('formats timestamps correctly', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        response: 'Timestamped response',
        metadata: {},
      }),
    });

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Test timestamp{enter}');

    await waitFor(() => {
      // Check that timestamp is displayed (format may vary by locale)
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });
});
