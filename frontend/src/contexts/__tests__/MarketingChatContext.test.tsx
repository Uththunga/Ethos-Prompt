import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MarketingChatProvider, useMarketingChat } from '../MarketingChatContext';
import React from 'react';

describe('MarketingChatContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MarketingChatProvider>{children}</MarketingChatProvider>
  );

  it('should initialize with chat closed', () => {
    const { result } = renderHook(() => useMarketingChat(), { wrapper });
    expect(result.current.isOpen).toBe(false);
  });

  it('should open chat when openChat is called', () => {
    const { result } = renderHook(() => useMarketingChat(), { wrapper });

    act(() => {
      result.current.openChat();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close chat when closeChat is called', () => {
    const { result } = renderHook(() => useMarketingChat(), { wrapper });

    act(() => {
      result.current.openChat();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeChat();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle chat state when toggleChat is called', () => {
    const { result } = renderHook(() => useMarketingChat(), { wrapper });

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.toggleChat();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggleChat();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should maintain state across multiple operations', () => {
    const { result } = renderHook(() => useMarketingChat(), { wrapper });

    // Open
    act(() => {
      result.current.openChat();
    });
    expect(result.current.isOpen).toBe(true);

    // Open again (should stay open)
    act(() => {
      result.current.openChat();
    });
    expect(result.current.isOpen).toBe(true);

    // Close
    act(() => {
      result.current.closeChat();
    });
    expect(result.current.isOpen).toBe(false);

    // Close again (should stay closed)
    act(() => {
      result.current.closeChat();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      renderHook(() => useMarketingChat());
    }).toThrow('useMarketingChat must be used within MarketingChatProvider');

    console.error = originalError;
  });
});

describe('SessionStorage Persistence', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MarketingChatProvider>{children}</MarketingChatProvider>
  );

  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  it('should initialize from sessionStorage when available', () => {
    sessionStorage.setItem('marketing-chat-open', 'true');

    const { result } = renderHook(() => useMarketingChat(), { wrapper });

    expect(result.current.isOpen).toBe(true);
  });

  it('should persist state to sessionStorage when opened', () => {
    const { result } = renderHook(() => useMarketingChat(), { wrapper });

    act(() => {
      result.current.openChat();
    });

    expect(sessionStorage.getItem('marketing-chat-open')).toBe('true');
  });

  it('should persist state to sessionStorage when closed', () => {
    const { result } = renderHook(() => useMarketingChat(), { wrapper });

    act(() => {
      result.current.openChat();
    });
    expect(sessionStorage.getItem('marketing-chat-open')).toBe('true');

    act(() => {
      result.current.closeChat();
    });
    expect(sessionStorage.getItem('marketing-chat-open')).toBe('false');
  });

  it('should handle sessionStorage errors gracefully', () => {
    // Mock sessionStorage to throw error
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    const { result } = renderHook(() => useMarketingChat(), { wrapper });

    // Should not throw error
    expect(() => {
      act(() => {
        result.current.openChat();
      });
    }).not.toThrow();

    // Restore original
    Storage.prototype.setItem = originalSetItem;
  });
});
