/**
 * HelpSearchBar Component
 *
 * Debounced search input with suggestions, ARIA labels, and accessibility features.
 * Provides real-time search with autocomplete suggestions for help articles.
 */

import { MagnifyingGlassIcon, XMarkIcon } from '@/components/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SearchSuggestion {
  text: string;
  category?: string;
}

export interface HelpSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  suggestions?: SearchSuggestion[];
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

/**
 * HelpSearchBar Component
 *
 * Features:
 * - Debounced search input (300ms default)
 * - Autocomplete suggestions with keyboard navigation
 * - ARIA labels for accessibility
 * - Clear button
 * - Responsive design
 */
export const HelpSearchBar: React.FC<HelpSearchBarProps> = ({
  value,
  onChange,
  onSearch,
  suggestions = [],
  placeholder = 'Search for help articles, tutorials, and guides...',
  debounceMs = 300,
  className,
  'aria-label': ariaLabel = 'Search help articles',
  'data-testid': testId = 'help-search-bar',
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const handleInputChange = useCallback(
    (newValue: string) => {
      onChange(newValue);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        if (newValue.trim()) {
          onSearch(newValue);
        }
      }, debounceMs);
    },
    [onChange, onSearch, debounceMs]
  );

  // Show suggestions when value changes and there are suggestions
  useEffect(() => {
    if (value.trim().length > 1 && suggestions.length > 0) {
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
    }
  }, [value, suggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && value.trim()) {
        onSearch(value);
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const suggestion = suggestions[selectedSuggestionIndex];
          handleSuggestionClick(suggestion.text);
        } else if (value.trim()) {
          onSearch(value);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestionText: string) => {
    onChange(suggestionText);
    onSearch(suggestionText);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Handle clear button
  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative w-full', className)} data-testid={testId}>
      {/* Search Input */}
      <div className="relative">
        <label htmlFor="help-search-input" className="sr-only">
          {ariaLabel}
        </label>

        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>

        {/* Input Field */}
        <input
          id="help-search-input"
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn(
            'block w-full pl-10 pr-12 py-3 text-base',
            'border border-input rounded-lg',
            'bg-background text-foreground placeholder:text-muted-foreground',
            'focus:ring-2 focus:ring-ring focus:border-primary',
            'transition-colors duration-200',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label={ariaLabel}
          aria-describedby={showSuggestions ? 'search-suggestions' : undefined}
          aria-autocomplete="list"
          aria-controls={showSuggestions ? 'search-suggestions' : undefined}
          aria-activedescendant={
            selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined
          }
          autoComplete="off"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute inset-y-0 right-0 pr-3 flex items-center',
              'text-muted-foreground hover:text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring rounded-md',
              'transition-colors duration-200'
            )}
            aria-label="Clear search"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          ref={suggestionsRef}
          className={cn(
            'absolute z-10 w-full mt-1',
            'bg-card border border-border rounded-lg shadow-lg',
            'max-h-60 overflow-y-auto'
          )}
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              id={`suggestion-${index}`}
              onClick={() => handleSuggestionClick(suggestion.text)}
              className={cn(
                'w-full text-left px-4 py-3',
                'hover:bg-accent focus:bg-accent',
                'focus:outline-none',
                'first:rounded-t-lg last:rounded-b-lg',
                'transition-colors duration-150',
                selectedSuggestionIndex === index && 'bg-accent'
              )}
              role="option"
              aria-selected={selectedSuggestionIndex === index}
              tabIndex={-1}
            >
              <div className="flex items-center">
                <MagnifyingGlassIcon
                  className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-foreground text-sm sm:text-base flex-1">
                  {suggestion.text}
                </span>
                {suggestion.category && (
                  <span className="text-xs text-muted-foreground ml-2">
                    in {suggestion.category}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpSearchBar;
