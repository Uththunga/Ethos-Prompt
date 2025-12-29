/**
 * RecentlyViewed Component
 *
 * Displays recently viewed help articles using localStorage.
 * Tracks up to 5 most recent articles.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { HelpArticle } from '@/hooks/useHelpArticles';
import { getDifficultyColor } from './HelpResultsList';

export interface RecentlyViewedProps {
  allArticles: HelpArticle[];
  currentArticleId?: string; // Exclude current article from list
  maxItems?: number;
  className?: string;
  'data-testid'?: string;
}

const STORAGE_KEY = 'help-recently-viewed';

/**
 * Get recently viewed article IDs from localStorage
 */
export function getRecentlyViewedIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to read recently viewed articles:', error);
    return [];
  }
}

/**
 * Add article to recently viewed list
 */
export function addToRecentlyViewed(articleId: string, maxItems: number = 5): void {
  try {
    const current = getRecentlyViewedIds();

    // Remove if already exists
    const filtered = current.filter((id) => id !== articleId);

    // Add to beginning
    const updated = [articleId, ...filtered].slice(0, maxItems);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recently viewed article:', error);
  }
}

/**
 * Clear recently viewed list
 */
export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear recently viewed articles:', error);
  }
}

/**
 * RecentlyViewed Component
 *
 * Displays a list of recently viewed articles.
 */
export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  allArticles,
  currentArticleId,
  maxItems = 5,
  className,
  'data-testid': testId = 'recently-viewed',
}) => {
  // Get recently viewed articles
  const recentArticles = useMemo(() => {
    const ids = getRecentlyViewedIds();

    // Filter out current article
    const filteredIds = currentArticleId ? ids.filter((id) => id !== currentArticleId) : ids;

    // Map IDs to articles
    const articles = filteredIds
      .map((id) => allArticles.find((article) => article.id === id))
      .filter((article): article is HelpArticle => article !== undefined)
      .slice(0, maxItems);

    return articles;
  }, [allArticles, currentArticleId, maxItems]);

  // Don't render if no recent articles
  if (recentArticles.length === 0) {
    return null;
  }

  return (
    <section
      className={cn('', className)}
      data-testid={testId}
      aria-labelledby="recently-viewed-heading"
    >
      <div className="flex items-center gap-2">
        <ClockIcon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        <h2 id="recently-viewed-heading" className="text-lg font-semibold text-foreground">
          Recently Viewed
        </h2>
      </div>

      <div>
        {recentArticles.map((article) => (
          <Link
            key={article.id}
            to={`/dashboard/help/${article.category}/${article.slug}`}
            className={cn(
              'group block',
              'bg-card border border-border rounded-lg',
              'p-3',
              'hover:border-primary hover:shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'transition-all duration-200'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{article.excerpt}</p>
              </div>

              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full',
                  'text-xs font-medium border flex-shrink-0',
                  getDifficultyColor(article.difficulty)
                )}
                aria-label={`Difficulty: ${article.difficulty}`}
              >
                {article.difficulty.charAt(0).toUpperCase()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

/**
 * Hook to track article views
 */
export function useTrackArticleView(articleId: string | undefined, maxItems: number = 5) {
  React.useEffect(() => {
    if (articleId) {
      addToRecentlyViewed(articleId, maxItems);
    }
  }, [articleId, maxItems]);
}

export default RecentlyViewed;
