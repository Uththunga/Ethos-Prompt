/**
 * HelpResultsList Component
 *
 * Displays search results or filtered articles with keyword highlighting,
 * difficulty badges using semantic colors, and ContentCard integration.
 */

import { ClockIcon, TagIcon } from '@/components/icons';
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { HelpArticle } from '@/hooks/useHelpArticles';
import { getCategoryInfo } from './HelpCategoryList';

export interface HelpResultsListProps {
  articles: HelpArticle[];
  searchQuery?: string;
  onArticleClick?: (article: HelpArticle) => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * Get difficulty badge color (semantic colors preserved)
 */
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'advanced':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Highlight keywords in text
 */
export function highlightKeywords(text: string, query: string): React.ReactNode {
  if (!query || !query.trim()) {
    return text;
  }

  const keywords = query
    .trim()
    .split(/\s+/)
    .filter((k) => k.length > 1); // Ignore single characters

  if (keywords.length === 0) {
    return text;
  }

  // Create regex pattern for all keywords
  const pattern = new RegExp(
    `(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  );

  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = keywords.some((keyword) => part.toLowerCase() === keyword.toLowerCase());

    if (isMatch) {
      return (
        <mark key={index} className="bg-yellow-200 text-yellow-900 font-medium px-0.5 rounded">
          {part}
        </mark>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

/**
 * Calculate estimated read time from content
 */
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * HelpResultsList Component
 *
 * Displays articles in a list format with highlighting and metadata.
 */
export const HelpResultsList: React.FC<HelpResultsListProps> = ({
  articles,
  searchQuery,
  onArticleClick,
  className,
  'data-testid': testId = 'help-results-list',
}) => {
  if (articles.length === 0) {
    return (
      <div
        className={cn(
          'text-center py-12 px-4',
          'bg-card border border-border rounded-lg',
          className
        )}
        data-testid={`${testId}-empty`}
      >
        <p className="text-muted-foreground text-lg">No articles found</p>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search terms or browse by category
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      data-testid={testId}
      role="list"
      aria-label="Help articles"
    >
      {articles.map((article) => {
        const categoryInfo = getCategoryInfo(article.category);
        const CategoryIcon = categoryInfo.icon;
        const readTime = article.estimatedReadTime || calculateReadTime(article.content);

        return (
          <Link
            key={article.id}
            to={`/dashboard/help/${article.category}/${article.slug}`}
            onClick={(e) => {
              if (onArticleClick) {
                e.preventDefault();
                onArticleClick(article);
              }
            }}
            className={cn(
              'block group',
              'bg-card border border-border rounded-lg',
              'p-6',
              'hover:border-primary hover:shadow-md',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'transition-all duration-200'
            )}
            role="listitem"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                  {searchQuery ? highlightKeywords(article.title, searchQuery) : article.title}
                </h3>

                {/* Category Badge */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CategoryIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>{categoryInfo.name}</span>
                  {article.subcategory && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="capitalize">{article.subcategory}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Difficulty Badge */}
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full',
                  'text-xs font-medium border',
                  'flex-shrink-0',
                  getDifficultyColor(article.difficulty)
                )}
                aria-label={`Difficulty: ${article.difficulty}`}
              >
                {article.difficulty}
              </span>
            </div>

            {/* Excerpt */}
            <p className="text-muted-foreground text-sm sm:text-base mb-4 line-clamp-2">
              {searchQuery ? highlightKeywords(article.excerpt, searchQuery) : article.excerpt}
            </p>

            {/* Footer Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              {/* Read Time */}
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" aria-hidden="true" />
                <span>{readTime} min read</span>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <TagIcon className="w-4 h-4" aria-hidden="true" />
                  <span className="line-clamp-1">
                    {article.tags.slice(0, 3).join(', ')}
                    {article.tags.length > 3 && ` +${article.tags.length - 3}`}
                  </span>
                </div>
              )}

              {/* Last Updated */}
              <div className="ml-auto">
                <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Featured Badge */}
            {article.featured && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured Article
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default HelpResultsList;
