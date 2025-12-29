/**
 * RelatedArticles Component
 *
 * Displays related articles based on tags and category matching.
 * Uses a scoring algorithm to find the most relevant articles.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { HelpArticle } from '@/hooks/useHelpArticles';
import { getDifficultyColor } from './HelpResultsList';
import { getCategoryInfo } from './HelpCategoryList';

export interface RelatedArticlesProps {
  currentArticle: HelpArticle;
  allArticles: HelpArticle[];
  maxResults?: number;
  className?: string;
  'data-testid'?: string;
}

/**
 * Calculate relevance score between two articles
 */
function calculateRelevanceScore(article1: HelpArticle, article2: HelpArticle): number {
  let score = 0;

  // Same category: +10 points
  if (article1.category === article2.category) {
    score += 10;
  }

  // Same subcategory: +5 points
  if (article1.subcategory && article1.subcategory === article2.subcategory) {
    score += 5;
  }

  // Same difficulty: +3 points
  if (article1.difficulty === article2.difficulty) {
    score += 3;
  }

  // Shared tags: +2 points per tag (guard against missing tags)
  const sharedTags = (article1.tags || []).filter((tag) => (article2.tags || []).includes(tag));
  score += sharedTags.length * 2;

  // Featured articles: +1 point
  if (article2.featured) {
    score += 1;
  }

  return score;
}

/**
 * Find related articles based on relevance score
 */
function findRelatedArticles(
  currentArticle: HelpArticle,
  allArticles: HelpArticle[],
  maxResults: number = 3
): HelpArticle[] {
  // Filter out current article
  const otherArticles = allArticles.filter((a) => a.id !== currentArticle.id);

  // Calculate scores and sort
  const scoredArticles = otherArticles
    .map((article) => ({
      article,
      score: calculateRelevanceScore(currentArticle, article),
    }))
    .filter((item) => item.score > 0) // Only include articles with some relevance
    .sort((a, b) => b.score - a.score);

  // Return top N articles
  return scoredArticles.slice(0, maxResults).map((item) => item.article);
}

/**
 * RelatedArticles Component
 *
 * Displays a list of related articles.
 */
export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  currentArticle,
  allArticles,
  maxResults = 3,
  className,
  'data-testid': testId = 'related-articles',
}) => {
  // Find related articles
  const relatedArticles = useMemo(
    () => findRelatedArticles(currentArticle, allArticles, maxResults),
    [currentArticle, allArticles, maxResults]
  );

  // Don't render if no related articles
  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <section
      className={cn('flex flex-col gap-6', className)}
      data-testid={testId}
      aria-labelledby="related-articles-heading"
    >
      <h2 id="related-articles-heading" className="text-2xl font-semibold text-foreground">
        Related Articles
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatedArticles.map((article) => {
          const categoryInfo = getCategoryInfo(article.category);
          const CategoryIcon = categoryInfo.icon;

          return (
            <Link
              key={article.id}
              to={`/dashboard/help/${article.category}/${article.slug}`}
              className={cn(
                'group block',
                'bg-card border border-border rounded-lg',
                'p-4',
                'hover:border-primary hover:shadow-md',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'transition-all duration-200'
              )}
            >
              {/* Category & Difficulty */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CategoryIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{categoryInfo.name}</span>
                </div>

                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full',
                    'text-xs font-medium border',
                    getDifficultyColor(article.difficulty)
                  )}
                  aria-label={`Difficulty: ${article.difficulty}`}
                >
                  {article.difficulty}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                {article.title}
              </h3>

              {/* Excerpt */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.excerpt}</p>

              {/* Read More Link */}
              <div className="flex items-center gap-1.5 text-sm text-primary group-hover:gap-2 transition-all duration-200">
                <span>Read more</span>
                <ArrowRightIcon className="w-4 h-4" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default RelatedArticles;
