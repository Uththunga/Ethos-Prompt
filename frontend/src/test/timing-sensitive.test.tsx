 

/**
 * Timing-Sensitive Tests
 * Tests for debounce/throttle patterns, animations, and real-time synchronization
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock debounce utility
const createDebouncedFunction = (fn: (...args: unknown[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Mock throttle utility
const createThrottledFunction = (fn: (...args: unknown[]) => void, delay: number) => {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

describe('Timing-Sensitive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Debounce Patterns', () => {
    it('should debounce search input correctly', async () => {
    try {
      const mockSearch = vi.fn();
      const debouncedSearch = createDebouncedFunction(mockSearch, 300);

      const SearchComponent = () => {
        const [query, setQuery] = React.useState('');

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setQuery(value);
          debouncedSearch(value);
        };

        return (
          <div>
            <input
              data-testid="search-input"
              value={query}
              onChange={handleInputChange}
              placeholder="Search..."
            />
            <div data-testid="search-query">{query}</div>
          </div>
        );
      };

      render(<SearchComponent />);

      const input = screen.getByTestId('search-input');

      // Rapid typing simulation
      fireEvent.change(input, { target: { value: 'h' } });
      fireEvent.change(input, { target: { value: 'he' } });
      fireEvent.change(input, { target: { value: 'hel' } });
      fireEvent.change(input, { target: { value: 'hell' } });
      fireEvent.change(input, { target: { value: 'hello' } });

      // Should not have called search yet
      expect(mockSearch).not.toHaveBeenCalled();

      // Fast-forward time by 299ms (just before debounce delay)
      act(() => {
        vi.advanceTimersByTime(299);
      });

      expect(mockSearch).not.toHaveBeenCalled();

      // Fast-forward past debounce delay
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(mockSearch).toHaveBeenCalledTimes(1);
      expect(mockSearch).toHaveBeenCalledWith('hello');
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
    });

    it('should reset debounce timer on new input', async () => {
      const mockSearch = vi.fn();
      const debouncedSearch = createDebouncedFunction(mockSearch, 300);

      const SearchComponent = () => {
        const handleSearch = (query: string) => debouncedSearch(query);

        return (
          <button
            data-testid="search-button"
            onClick={() => handleSearch('test')}
          >
            Search
          </button>
        );
      };

      render(<SearchComponent />);

      const button = screen.getByTestId('search-button');

      // First click
      fireEvent.click(button);

      // Wait 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Second click (should reset timer)
      fireEvent.click(button);

      // Wait another 200ms (total 400ms from first click, 200ms from second)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should not have been called yet
      expect(mockSearch).not.toHaveBeenCalled();

      // Wait final 100ms to complete second debounce
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should be called only once (from second click)
      expect(mockSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Throttle Patterns', () => {
    it('should throttle scroll events correctly', async () => {
      const mockScrollHandler = vi.fn();
      const throttledScroll = createThrottledFunction(mockScrollHandler, 100);

      const ScrollComponent = () => {
        React.useEffect(() => {
          const handleScroll = () => throttledScroll(window.scrollY);
          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        return <div data-testid="scroll-container">Scroll content</div>;
      };

      render(<ScrollComponent />);

      // Simulate rapid scroll events
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(window, { target: { scrollY: i * 10 } });
        act(() => {
          vi.advanceTimersByTime(10); // 10ms between each scroll
        });
      }

      // Should have been called only once (at the beginning)
      expect(mockScrollHandler).toHaveBeenCalledTimes(1);

      // Advance time to allow next throttled call
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Trigger another scroll
      fireEvent.scroll(window, { target: { scrollY: 200 } });

      // Should now be called a second time
      expect(mockScrollHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Animation and Transition Testing', () => {
    it('should handle CSS transition states', async () => {
      const AnimatedComponent = () => {
        const [isVisible, setIsVisible] = React.useState(false);
        const [animationState, setAnimationState] = React.useState('idle');

        const handleToggle = () => {
          setAnimationState('animating');
          setIsVisible(!isVisible);

          // Simulate animation completion
          setTimeout(() => {
            setAnimationState('idle');
          }, 300);
        };

        return (
          <div>
            <button data-testid="toggle-button" onClick={handleToggle}>
              Toggle
            </button>
            <div
              data-testid="animated-element"
              data-visible={isVisible}
              data-animation-state={animationState}
              style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 300ms ease-in-out'
              }}
            >
              Animated content
            </div>
          </div>
        );
      };

      render(<AnimatedComponent />);

      const button = screen.getByTestId('toggle-button');
      const element = screen.getByTestId('animated-element');

      // Initial state
      expect(element).toHaveAttribute('data-visible', 'false');
      expect(element).toHaveAttribute('data-animation-state', 'idle');

      // Trigger animation
      fireEvent.click(button);

      // Should be in animating state
      expect(element).toHaveAttribute('data-visible', 'true');
      expect(element).toHaveAttribute('data-animation-state', 'animating');

      // Fast-forward through animation
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should be back to idle state
      expect(element).toHaveAttribute('data-animation-state', 'idle');
    });

    it.skip('should handle loading states with timeouts', async () => {
      const LoadingComponent = () => {
        const [loading, setLoading] = React.useState(false);
        const [data, setData] = React.useState<string | null>(null);
        const [error, setError] = React.useState<string | null>(null);

        const fetchData = React.useCallback(() => {
          setLoading(true);
          setError(null);

          // Use a simple timeout without promises to avoid timing issues
          setTimeout(() => {
            setData('Mock data');
            setLoading(false);
          }, 100); // Shorter timeout for testing
        }, []);

        return (
          <div>
            <button data-testid="fetch-button" onClick={fetchData}>
              Fetch Data
            </button>
            {loading && <div data-testid="loading">Loading...</div>}
            {data && <div data-testid="data">{data}</div>}
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      render(<LoadingComponent />);

      const button = screen.getByTestId('fetch-button');

      // Start fetch
      fireEvent.click(button);

      // Should show loading state immediately
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for the data to load
      await waitFor(() => {
        expect(screen.getByTestId('data')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Loading should be gone
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Data Synchronization', () => {
    it('should handle real-time updates with proper timing', async () => {
      // Use fake timers for this test
      vi.useFakeTimers();

      const RealtimeComponent = () => {
        const [messages, setMessages] = React.useState<string[]>([]);
        const [connected, setConnected] = React.useState(false);

        React.useEffect(() => {
          // Simulate connection
          const connectTimer = setTimeout(() => {
            setConnected(true);
          }, 100);

          // Simulate incoming messages
          const messageInterval = setInterval(() => {
            if (connected) {
              setMessages(prev => [...prev, `Message ${prev.length + 1}`]);
            }
          }, 500);

          return () => {
            clearTimeout(connectTimer);
            clearInterval(messageInterval);
          };
        }, [connected]);

        return (
          <div>
            <div data-testid="connection-status">
              {connected ? 'Connected' : 'Connecting...'}
            </div>
            <div data-testid="message-count">{messages.length}</div>
            <div data-testid="messages">
              {messages.map((msg, index) => (
                <div key={index} data-testid={`message-${index}`}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<RealtimeComponent />);

      // Initially should be connecting
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connecting...');
      expect(screen.getByTestId('message-count')).toHaveTextContent('0');

      // Fast-forward to connection
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');

      // Fast-forward to first message
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      expect(screen.getByTestId('message-0')).toHaveTextContent('Message 1');

      // Fast-forward to second message
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
      expect(screen.getByTestId('message-1')).toHaveTextContent('Message 2');

      // Restore real timers
      vi.useRealTimers();
    });

    it('should handle connection retry logic', async () => {
      // Use fake timers for this test
      vi.useFakeTimers();

      const RetryComponent = () => {
        const [connectionAttempts, setConnectionAttempts] = React.useState(0);
        const [connected, setConnected] = React.useState(false);
        const [error, setError] = React.useState<string | null>(null);

        const attemptConnection = React.useCallback(() => {
          setConnectionAttempts(prev => {
            const newAttempts = prev + 1;
            setError(null);

            // Simulate connection attempt
            setTimeout(() => {
              if (newAttempts < 3) {
                // Fail first two attempts
                setError('Connection failed');
                // Retry after delay
                setTimeout(attemptConnection, 1000);
              } else {
                // Succeed on third attempt
                setConnected(true);
              }
            }, 500);

            return newAttempts;
          });
        }, []);

        React.useEffect(() => {
          attemptConnection();
        }, [attemptConnection]);

        return (
          <div>
            <div data-testid="attempts">{connectionAttempts}</div>
            <div data-testid="status">
              {connected ? 'Connected' : error ? 'Failed' : 'Connecting'}
            </div>
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      render(<RetryComponent />);

      // First attempt
      expect(screen.getByTestId('attempts')).toHaveTextContent('1');
      expect(screen.getByTestId('status')).toHaveTextContent('Connecting');

      // First attempt fails
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByTestId('status')).toHaveTextContent('Failed');
      expect(screen.getByTestId('error')).toHaveTextContent('Connection failed');

      // Retry delay
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Second attempt
      expect(screen.getByTestId('attempts')).toHaveTextContent('2');

      // Second attempt fails
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByTestId('status')).toHaveTextContent('Failed');

      // Second retry delay
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Third attempt
      expect(screen.getByTestId('attempts')).toHaveTextContent('3');

      // Third attempt succeeds
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByTestId('status')).toHaveTextContent('Connected');
      expect(screen.queryByTestId('error')).not.toBeInTheDocument();

      // Restore real timers
      vi.useRealTimers();
    });
  });
});
