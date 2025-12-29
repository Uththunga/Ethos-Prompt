/**
 * Unit tests for HelpArticleView component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import HelpArticleView from './HelpArticleView';
import { HelpProvider } from './HelpSystem';

// Mock article data
const mockArticle = {
  id: 'test-article',
  slug: 'test-article',
  title: 'Test Article',
  excerpt: 'This is a test article',
  content: `# Test Article

## Overview

This is a test article with **bold** and *italic* text.

> [!NOTE]
> This is a note callout.

> [!TIP]
> This is a tip callout.

\`\`\`typescript
const hello = 'world';
console.log(hello);
\`\`\`

## Section 2

More content here.`,
  category: 'getting-started' as const,
  tags: ['test', 'example'],
  difficulty: 'beginner' as const,
  lastUpdated: '2025-01-15',
  featured: true,
  estimatedReadTime: 5,
  prerequisites: ['prerequisite-article'],
  relatedArticles: ['related-article-1', 'related-article-2'],
  faqs: [
    {
      id: 'faq-1',
      question: 'What is this?',
      answer: 'This is a test FAQ.',
    },
  ],
};

const mockRelatedArticles = [
  {
    id: 'related-article-1',
    slug: 'related-article-1',
    title: 'Related Article 1',
    excerpt: 'First related article',
    category: 'getting-started' as const,
    difficulty: 'beginner' as const,
    tags: ['test'],
    featured: false,
  },
  {
    id: 'related-article-2',
    slug: 'related-article-2',
    title: 'Related Article 2',
    excerpt: 'Second related article',
    category: 'core-features' as const,
    difficulty: 'intermediate' as const,
    tags: ['example'],
    featured: false,
  },
];

// Wrapper component with providers
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <HelpProvider>{children}</HelpProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

afterEach(() => {
  vi.restoreAllMocks();
  try {
    // @ts-expect-error test cleanup
    delete (navigator as any).clipboard;
  } catch {
    /* noop */
  }
});

describe('HelpArticleView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render article title', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Test Article' })).toBeInTheDocument();
    });

    it('should render article metadata', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText(/5 min read/i)).toBeInTheDocument();
      expect(screen.getAllByLabelText('Difficulty: beginner')[0]).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2025/i)).toBeInTheDocument();
    });

    it('should render article content', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText(/This is a test article with/i)).toBeInTheDocument();
    });

    it('should render tags', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('example')).toBeInTheDocument();
    });

    it('should render breadcrumbs', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      const crumbs = screen.getByTestId('breadcrumbs');
      expect(within(crumbs).getByText('Help Center')).toBeInTheDocument();
      expect(within(crumbs).getByText('Getting Started')).toBeInTheDocument();
    });
  });

  describe('Code Blocks', () => {
    it('should render code blocks with copy button', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      const codeBlocks = screen.getAllByTestId('code-block');
      expect(codeBlocks.length).toBeGreaterThan(0);

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    it('should copy code to clipboard when copy button clicked', async () => {
      // Mock clipboard API
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      });

      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      const copyButton = screen.getAllByRole('button', { name: /copy/i })[0];
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("const hello = 'world';")
        );
      });
    });
  });

  describe('Callouts', () => {
    it('should render note callout', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText(/This is a note callout/i)).toBeInTheDocument();
    });

    it('should render tip callout', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText(/This is a tip callout/i)).toBeInTheDocument();
    });

    it('should render callouts with correct styling', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      const noteText = screen.getByText(/This is a note callout/i);
      const tipText = screen.getByText(/This is a tip callout/i);
      const noteQuote = noteText.closest('blockquote');
      const tipQuote = tipText.closest('blockquote');
      expect(noteQuote).toBeInTheDocument();
      expect(tipQuote).toBeInTheDocument();
      expect(noteQuote).toHaveClass('border-l-4');
      expect(tipQuote).toHaveClass('border-l-4');
    });
  });

  describe('Related Articles', () => {
    it('should render related articles section', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText(/related articles/i)).toBeInTheDocument();
    });

    it('should render related article titles', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('Related Article 1')).toBeInTheDocument();
      expect(screen.getByText('Related Article 2')).toBeInTheDocument();
    });
  });

  describe('FAQs', () => {
    it('should render FAQ section', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
    });

    it('should render FAQ question', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText('What is this?')).toBeInTheDocument();
    });

    it('should expand FAQ on click', async () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      const faqButton = screen.getByText('What is this?');
      fireEvent.click(faqButton);

      await waitFor(() => {
        expect(screen.getByText('This is a test FAQ.')).toBeVisible();
      });
    });
  });

  describe('Feedback Widget', () => {
    it('should render feedback widget', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText(/was this helpful/i)).toBeInTheDocument();
    });

    it('should have thumbs up and thumbs down buttons', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      const thumbsUpButton = screen.getByRole('button', { name: /yes/i });
      const thumbsDownButton = screen.getByRole('button', { name: /no/i });

      expect(thumbsUpButton).toBeInTheDocument();
      expect(thumbsDownButton).toBeInTheDocument();
    });
  });

  describe('Table of Contents', () => {
    it('should render table of contents', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByText(/on this page/i)).toBeInTheDocument();
    });

    it('should list article sections', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      // 'Overview' and 'Section 2' may appear in both content and TOC, so use getAllByText
      expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Section 2').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      const h1 = screen.getByRole('heading', { level: 1, name: 'Test Article' });
      expect(h1).toBeInTheDocument();
    });

    it('should have accessible links', () => {
      render(<HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />, {
        wrapper: Wrapper,
      });

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });
  });
});
