/**
 * HelpSearchBar Component Tests
 *
 * Tests for debounced search, keyboard navigation, and accessibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HelpSearchBar, { type SearchSuggestion } from '../HelpSearchBar';

describe('HelpSearchBar', () => {
  const mockOnChange = vi.fn();
  const mockOnSearch = vi.fn();

  const mockSuggestions: SearchSuggestion[] = [
    { text: 'How to create a prompt', category: 'Getting Started' },
    { text: 'Document upload guide', category: 'Core Features' },
    { text: 'RAG execution basics', category: 'Core Features' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders search input with placeholder', () => {
    render(<HelpSearchBar value="" onChange={mockOnChange} onSearch={mockOnSearch} />);

    const input = screen.getByRole('searchbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', expect.stringContaining('Search'));
  });

  it('calls onChange when typing', async () => {
    render(<HelpSearchBar value="" onChange={mockOnChange} onSearch={mockOnSearch} />);

    const input = screen.getByRole('searchbox');

    // Simulate typing using fireEvent
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'tes' } });
    fireEvent.change(input, { target: { value: 'test' } });

    expect(mockOnChange).toHaveBeenCalledTimes(4); // Once per character
  });

  it('debounces search calls', async () => {
    vi.useFakeTimers();

    render(
      <HelpSearchBar value="" onChange={mockOnChange} onSearch={mockOnSearch} debounceMs={300} />
    );

    const input = screen.getByRole('searchbox');

    // Simulate typing using fireEvent
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not call onSearch immediately
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Fast-forward time and run all timers
    await vi.advanceTimersByTimeAsync(300);

    // Should call onSearch after debounce
    expect(mockOnSearch).toHaveBeenCalledWith('test');

    vi.useRealTimers();
  });

  it('displays suggestions when available', () => {
    render(
      <HelpSearchBar
        value="prompt"
        onChange={mockOnChange}
        onSearch={mockOnSearch}
        suggestions={mockSuggestions}
      />
    );

    // Suggestions should be visible
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it(
    'navigates suggestions with arrow keys',
    async () => {
      render(
        <HelpSearchBar
          value="prompt"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          suggestions={mockSuggestions}
        />
      );

      const input = screen.getByRole('searchbox');

      // Press down arrow using fireEvent instead of userEvent to avoid timing issues
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });

      // First suggestion should be selected
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveClass('bg-accent');
      });
    },
    { timeout: 5000 }
  );

  it(
    'selects suggestion on Enter key',
    async () => {
      render(
        <HelpSearchBar
          value="prompt"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          suggestions={mockSuggestions}
        />
      );

      const input = screen.getByRole('searchbox');

      // Navigate to first suggestion and press Enter using fireEvent
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Should call onChange with suggestion text
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(mockSuggestions[0].text);
        expect(mockOnSearch).toHaveBeenCalledWith(mockSuggestions[0].text);
      });
    },
    { timeout: 5000 }
  );

  it(
    'closes suggestions on Escape key',
    async () => {
      render(
        <HelpSearchBar
          value="prompt"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          suggestions={mockSuggestions}
        />
      );

      const input = screen.getByRole('searchbox');

      // Press Escape using fireEvent
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      // Suggestions should be hidden
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    },
    { timeout: 5000 }
  );

  it('clears input when clear button is clicked', async () => {
    render(<HelpSearchBar value="test query" onChange={mockOnChange} onSearch={mockOnSearch} />);

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('has proper ARIA attributes', () => {
    render(
      <HelpSearchBar
        value="prompt"
        onChange={mockOnChange}
        onSearch={mockOnSearch}
        suggestions={mockSuggestions}
        aria-label="Custom search label"
      />
    );

    const input = screen.getByRole('searchbox');

    // Check ARIA attributes
    expect(input).toHaveAttribute('aria-label', 'Custom search label');
    // aria-expanded is not valid on input[type="search"]; attribute intentionally omitted
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-controls', 'search-suggestions');
  });

  it('closes suggestions when clicking outside', async () => {
    render(
      <div>
        <HelpSearchBar
          value="prompt"
          onChange={mockOnChange}
          onSearch={mockOnSearch}
          suggestions={mockSuggestions}
        />
        <button>Outside button</button>
      </div>
    );

    // Suggestions should be visible
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Click outside
    const outsideButton = screen.getByText('Outside button');
    fireEvent.mouseDown(outsideButton);

    // Suggestions should be hidden
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
