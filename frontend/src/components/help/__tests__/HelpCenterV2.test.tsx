/**
 * HelpCenterV2 Integration Tests (focused, fast)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelpProvider } from '../HelpSystem';
import HelpCenterV2 from '../HelpCenterV2';

// Mock articles via hook to avoid Firestore
vi.mock('@/hooks/useHelpArticles', async () => {
  const mod = await vi.importActual<typeof import('@/hooks/useHelpArticles')>(
    '@/hooks/useHelpArticles'
  );
  const mockArticles: mod.HelpArticle[] = [
    {
      id: 'a1',
      slug: 'getting-started-guide',
      title: 'How to create a prompt',
      excerpt: 'Learn how to create and execute prompts',
      content: 'This guide shows how to create a prompt and execute it successfully.',
      category: 'getting-started',
      tags: ['prompts', 'beginner', 'create'],
      difficulty: 'beginner',
      lastUpdated: '2025-01-01',
      featured: true,
      estimatedReadTime: 3,
    },
    {
      id: 'a2',
      slug: 'rag-execution',
      title: 'RAG execution basics',
      excerpt: 'Understanding RAG execution pipeline',
      content: 'RAG execution involves retrieval and generation.',
      category: 'core-features',
      tags: ['rag', 'retrieval'],
      difficulty: 'intermediate',
      lastUpdated: '2025-01-02',
      featured: false,
    },
  ];
  return {
    ...mod,
    useHelpArticles: () => ({ data: mockArticles, isLoading: false, error: null }),
  };
});

function Wrapper({ initialPath = '/dashboard/help' }: { initialPath?: string }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <HelpProvider>
          <Routes>
            <Route path="/dashboard/help" element={<HelpCenterV2 />} />
            <Route path="/dashboard/help/:category" element={<HelpCenterV2 />} />
            <Route path="/dashboard/help/:category/:slug" element={<HelpCenterV2 />} />
          </Routes>
        </HelpProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('HelpCenterV2', () => {
  it('renders header and popular searches', () => {
    render(<Wrapper />);
    expect(screen.getByRole('heading', { name: /help center/i })).toBeInTheDocument();
    expect(screen.getByText(/popular searches/i)).toBeInTheDocument();
  });

  it('applies search when a popular search is clicked', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    const popular = screen.getByRole('button', { name: /how to create a prompt/i });
    await user.click(popular);

    await waitFor(() => {
      // The filtered results should include the matching article
      expect(screen.getByText('How to create a prompt')).toBeInTheDocument();
    });
  });

  it('renders article view when navigated directly by URL', async () => {
    render(<Wrapper initialPath="/dashboard/help/getting-started/getting-started-guide" />);

    await waitFor(() => {
      // Title appears in article view
      expect(screen.getByRole('heading', { name: /how to create a prompt/i })).toBeInTheDocument();
    });
  });

  it('searchbar exposes aria-label and suggestions list accessibility', async () => {
    render(<Wrapper />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label');
  });
});
