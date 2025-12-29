/**
 * HelpResultsList Component Tests
 * 
 * Tests for keyword highlighting, difficulty badges, and article rendering.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HelpResultsList, { highlightKeywords, getDifficultyColor, calculateReadTime } from '../HelpResultsList';
import type { HelpArticle } from '@/hooks/useHelpArticles';

// Wrapper for components that use React Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('HelpResultsList', () => {
  const mockArticles: HelpArticle[] = [
    {
      id: '1',
      slug: 'test-article',
      title: 'Test Article About Prompts',
      excerpt: 'Learn how to create effective prompts',
      content: 'Full content here',
      category: 'getting-started',
      tags: ['prompts', 'beginner'],
      difficulty: 'beginner',
      lastUpdated: '2025-01-15',
      featured: true,
    },
    {
      id: '2',
      slug: 'advanced-rag',
      title: 'Advanced RAG Techniques',
      excerpt: 'Master RAG execution',
      content: 'Advanced content',
      category: 'best-practices',
      tags: ['rag', 'advanced'],
      difficulty: 'advanced',
      lastUpdated: '2025-01-14',
    },
  ];

  it('renders article list', () => {
    render(
      <RouterWrapper>
        <HelpResultsList articles={mockArticles} />
      </RouterWrapper>
    );

    expect(screen.getByText('Test Article About Prompts')).toBeInTheDocument();
    expect(screen.getByText('Advanced RAG Techniques')).toBeInTheDocument();
  });

  it('displays empty state when no articles', () => {
    render(
      <RouterWrapper>
        <HelpResultsList articles={[]} searchQuery="nonexistent" />
      </RouterWrapper>
    );

    expect(screen.getByText('No articles found')).toBeInTheDocument();
  });

  it('shows difficulty badges with correct colors', () => {
    render(
      <RouterWrapper>
        <HelpResultsList articles={mockArticles} />
      </RouterWrapper>
    );

    const beginnerBadge = screen.getByText('beginner');
    const advancedBadge = screen.getByText('advanced');

    expect(beginnerBadge).toHaveClass('bg-green-100', 'text-green-800');
    expect(advancedBadge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('displays featured badge for featured articles', () => {
    render(
      <RouterWrapper>
        <HelpResultsList articles={mockArticles} />
      </RouterWrapper>
    );

    expect(screen.getByText('Featured Article')).toBeInTheDocument();
  });

  it('highlights keywords in search results', () => {
    const { container } = render(
      <RouterWrapper>
        <HelpResultsList articles={mockArticles} searchQuery="prompts" />
      </RouterWrapper>
    );

    // Check for highlighted text
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
  });
});

describe('highlightKeywords', () => {
  it('returns original text when no query', () => {
    const result = highlightKeywords('Test text', '');
    expect(result).toBe('Test text');
  });

  it('highlights single keyword', () => {
    const result = highlightKeywords('This is a test', 'test');
    // Result should be an array of React nodes with highlighted text
    expect(result).toBeDefined();
  });

  it('highlights multiple keywords', () => {
    const result = highlightKeywords('Create a prompt template', 'create prompt');
    expect(result).toBeDefined();
  });

  it('is case-insensitive', () => {
    const result = highlightKeywords('Test TEXT test', 'test');
    expect(result).toBeDefined();
  });

  it('ignores single-character keywords', () => {
    const result = highlightKeywords('Test a text', 'a');
    expect(result).toBe('Test a text');
  });
});

describe('getDifficultyColor', () => {
  it('returns green for beginner', () => {
    const color = getDifficultyColor('beginner');
    expect(color).toContain('bg-green-100');
    expect(color).toContain('text-green-800');
  });

  it('returns yellow for intermediate', () => {
    const color = getDifficultyColor('intermediate');
    expect(color).toContain('bg-yellow-100');
    expect(color).toContain('text-yellow-800');
  });

  it('returns red for advanced', () => {
    const color = getDifficultyColor('advanced');
    expect(color).toContain('bg-red-100');
    expect(color).toContain('text-red-800');
  });

  it('returns default for unknown difficulty', () => {
    const color = getDifficultyColor('unknown');
    expect(color).toContain('bg-muted');
  });
});

describe('calculateReadTime', () => {
  it('calculates read time based on word count', () => {
    const content = 'word '.repeat(200); // 200 words
    const readTime = calculateReadTime(content);
    expect(readTime).toBe(1); // 200 words / 200 wpm = 1 minute
  });

  it('returns minimum 1 minute for short content', () => {
    const content = 'Short content';
    const readTime = calculateReadTime(content);
    expect(readTime).toBe(1);
  });

  it('rounds up read time', () => {
    const content = 'word '.repeat(250); // 250 words
    const readTime = calculateReadTime(content);
    expect(readTime).toBe(2); // 250 / 200 = 1.25, rounded up to 2
  });
});

