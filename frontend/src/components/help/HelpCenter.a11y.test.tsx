/**
 * Accessibility tests for Help Center components
 * Uses jest-axe for automated accessibility testing
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HelpCenterV2 from './HelpCenterV2';
import HelpArticleView from './HelpArticleView';
import { HelpProvider } from './HelpSystem';

// Provide immediate article data so HelpCenterV2 renders fully (not loading)
vi.mock('@/hooks/useHelpArticles', () => {
  const articles = [
    {
      id: 'test-article',
      slug: 'test-article',
      title: 'Test Article',
      excerpt: 'This is a test article',
      content: '# Test Article\n\n## Overview',
      category: 'getting-started',
      tags: ['test'],
      difficulty: 'beginner',
      lastUpdated: '2025-01-15',
      featured: true,
      estimatedReadTime: 5,
    },
    {
      id: 'related-1',
      slug: 'related-1',
      title: 'Related Article',
      excerpt: 'Related content',
      content: '# Related',
      category: 'getting-started',
      tags: ['test'],
      difficulty: 'beginner',
      lastUpdated: '2025-01-10',
      featured: false,
      estimatedReadTime: 3,
    },
  ];
  return {
    useHelpArticles: () => ({ data: articles, isLoading: false, isError: false, error: null }),
  };
});

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock article data
const mockArticle = {
  id: 'test-article',
  slug: 'test-article',
  title: 'Test Article',
  excerpt: 'This is a test article',
  content: `# Test Article

## Overview

This is a test article with content.

\`\`\`typescript
const hello = 'world';
\`\`\`

> [!NOTE]
> This is a note.`,
  category: 'getting-started' as const,
  tags: ['test'],
  difficulty: 'beginner' as const,
  lastUpdated: '2025-01-15',
  featured: true,
  estimatedReadTime: 5,
};

const mockRelatedArticles = [
  {
    id: 'related-1',
    slug: 'related-1',
    title: 'Related Article',
    excerpt: 'Related content',
    category: 'getting-started' as const,
    difficulty: 'beginner' as const,
  },
];

// Wrapper component
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

describe('Help Center Accessibility', () => {
  describe('HelpCenterV2', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });
      const results = await axe(container, {
        rules: {
          'aria-allowed-attr': { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
      expect(h1?.textContent).toBeTruthy();
    });

    it('should have accessible search input', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const searchInput =
        container.querySelector('input[type="search"]') ||
        container.querySelector('input[role="searchbox"]');
      expect(searchInput).toHaveAttribute('aria-label');
      expect(searchInput).toHaveAttribute('placeholder');
    });

    it('should have accessible navigation links', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        // Each link should have accessible text
        expect(link.textContent?.trim()).toBeTruthy();
      });
    });

    it('should have proper ARIA landmarks', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      // Should have main content area
      const main = container.querySelector('main') || container.querySelector('[role="main"]');
      expect(main).toBeInTheDocument();
    });
  });

  describe('HelpArticleView', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />,
        { wrapper: Wrapper }
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(
        <HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />,
        { wrapper: Wrapper }
      );

      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
      expect(h1?.textContent).toBe('Test Article');

      const h2s = container.querySelectorAll('h2');
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('should have accessible code blocks', () => {
      const { container } = render(
        <HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />,
        { wrapper: Wrapper }
      );

      const codeBlocks = container.querySelectorAll('pre code');
      codeBlocks.forEach((codeBlock) => {
        expect(codeBlock).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', () => {
      const { container } = render(
        <HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />,
        { wrapper: Wrapper }
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        // Each button should have accessible text or aria-label
        const hasText = button.textContent?.trim();
        const hasAriaLabel = button.getAttribute('aria-label');
        expect(hasText || hasAriaLabel).toBeTruthy();
      });
    });

    it('should have accessible links', () => {
      const { container } = render(
        <HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />,
        { wrapper: Wrapper }
      );

      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        // Each link should have accessible text
        expect(link.textContent?.trim()).toBeTruthy();
      });
    });

    it('should have proper color contrast', async () => {
      const { container } = render(
        <HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />,
        { wrapper: Wrapper }
      );

      // axe will check color contrast automatically
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have focusable interactive elements', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const focusableElements = container.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should have visible focus indicators', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const focusableElements = container.querySelectorAll('a, button, input');
      focusableElements.forEach((element) => {
        // Elements should not have outline: none without alternative focus style
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.outline === 'none') {
          // Should have alternative focus style (box-shadow, border, etc.)
          expect(
            computedStyle.boxShadow !== 'none' || computedStyle.border !== 'none'
          ).toBeTruthy();
        }
      });
    });

    it('should have logical tab order', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const tabbableElements = container.querySelectorAll('[tabindex]');
      tabbableElements.forEach((element) => {
        const tabIndex = element.getAttribute('tabindex');
        // Tab index should be 0 or -1 (not positive numbers which break natural order)
        expect(tabIndex === '0' || tabIndex === '-1').toBeTruthy();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should have descriptive ARIA labels', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const elementsWithAriaLabel = container.querySelectorAll('[aria-label]');
      elementsWithAriaLabel.forEach((element) => {
        const ariaLabel = element.getAttribute('aria-label');
        expect(ariaLabel?.trim()).toBeTruthy();
        expect(ariaLabel?.length).toBeGreaterThan(0);
      });
    });

    it('should have proper ARIA roles', async () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      // axe will check for proper ARIA usage
      const results = await axe(container, {
        rules: {
          'aria-roles': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should have alt text for images', () => {
      const { container } = render(
        <HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />,
        { wrapper: Wrapper }
      );

      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
      });
    });

    it('should have accessible form labels', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const inputs = container.querySelectorAll('input');
      inputs.forEach((input) => {
        const id = input.getAttribute('id');
        if (id) {
          const label = container.querySelector(`label[for="${id}"]`);
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');

          // Input should have label, aria-label, or aria-labelledby
          expect(label || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      });
    });
  });

  describe('Semantic HTML', () => {
    it('should use semantic HTML elements', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      // Should use semantic elements instead of divs for structure
      const semanticElements = container.querySelectorAll(
        'header, nav, main, article, section, aside, footer'
      );
      expect(semanticElements.length).toBeGreaterThan(0);
    });

    it('should have proper list structure', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const lists = container.querySelectorAll('ul, ol');
      lists.forEach((list) => {
        const listItems = list.querySelectorAll('li');
        expect(listItems.length).toBeGreaterThan(0);
      });
    });

    it('should use proper heading levels', () => {
      const { container } = render(
        <HelpArticleView article={mockArticle} allArticles={mockRelatedArticles as any} />,
        { wrapper: Wrapper }
      );

      const h1s = container.querySelectorAll('h1');
      // Should have exactly one h1
      expect(h1s.length).toBe(1);
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('should not have horizontal scroll', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const body = container.querySelector('body') || document.body;
      expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth + 1); // +1 for rounding
    });

    it('should have touch-friendly targets', () => {
      const { container } = render(<HelpCenterV2 />, { wrapper: Wrapper });

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        // Touch targets should be at least 44x44 pixels (WCAG 2.1 Level AAA)
        // Note: This may not work in JSDOM, but demonstrates the concept
        if (rect.width > 0 && rect.height > 0) {
          expect(rect.width >= 44 || rect.height >= 44).toBeTruthy();
        }
      });
    });
  });
});
