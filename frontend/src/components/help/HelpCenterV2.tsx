/**
 * HelpCenter V2 Component
 *
 * Simplified, text-based help center with visual consistency to Dashboard.
 * Features: search, categories, article view, no video content.
 *
 * This is the redesigned version behind the VITE_HELP_CENTER_V2 feature flag.
 */

import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import type { HelpArticle } from '@/hooks/useHelpArticles';
import { createBreadcrumbs } from '@/components/common/Breadcrumbs';
import HelpSearchBar, { type SearchSuggestion } from './HelpSearchBar';
import HelpCategoryList, { getCategoryInfo } from './HelpCategoryList';
import HelpResultsList from './HelpResultsList';
import HelpArticleView from './HelpArticleView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import {
    QuestionMarkCircleIcon,
    SparklesIcon,
    DocumentPlusIcon,
    PlayIcon,
    CodeBracketIcon,
    ClockIcon,
    ChartBarIcon,
} from '@/components/icons';

/**
 * Popular searches - common queries users search for
 */
const POPULAR_SEARCHES = [
  'How to create a prompt',
  'Upload documents',
  'RAG execution',
  'Variable syntax',
  'Execution history',
  'Analytics dashboard',
  'Workspaces setup',
  'Webhooks integration',
  'Token costs',
  'Model selection',
  'API integration',
  'Best practices',
];

/**
 * Quick actions - common tasks users want to perform
 */
const QUICK_ACTIONS = [
  {
    title: 'Create Your First Prompt',
    description: 'Learn how to create and execute prompts',
    icon: SparklesIcon,
    articleSlug: 'creating-first-prompt',
    category: 'core-features',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    title: 'Upload Documents for RAG',
    description: 'Upload and process documents for retrieval',
    icon: DocumentPlusIcon,
    articleSlug: 'document-upload-guide',
    category: 'core-features',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    title: 'Execute RAG-Enabled Prompts',
    description: 'Run prompts with document context',
    icon: PlayIcon,
    articleSlug: 'rag-execution-basics',
    category: 'core-features',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    title: 'Use Prompt Variables',
    description: 'Learn variable syntax and patterns',
    icon: CodeBracketIcon,
    articleSlug: 'variables-syntax',
    category: 'core-features',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    title: 'View Execution History',
    description: 'Track and analyze prompt executions',
    icon: ClockIcon,
    articleSlug: 'execution-history',
    category: 'core-features',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Monitor performance and metrics',
    icon: ChartBarIcon,
    articleSlug: 'analytics-overview',
    category: 'core-features',
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
];

/**
 * Filter articles by search query
 */
function filterArticlesBySearch(articles: HelpArticle[], query: string): HelpArticle[] {
  if (!query || !query.trim()) {
    return articles;
  }

  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(/\s+/).filter((k) => k.length > 1);

  return articles.filter((article) => {
    const searchableText = [
      article.title,
      article.excerpt,
      article.content,
      article.category,
      article.subcategory || '',
      ...article.tags,
    ]
      .join(' ')
      .toLowerCase();

    return keywords.every((keyword) => searchableText.includes(keyword));
  });
}

/**
 * Generate search suggestions from articles
 */
function generateSuggestions(articles: HelpArticle[], query: string): SearchSuggestion[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  // Title matches
  articles.forEach((article) => {
    if (article.title.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        text: article.title,
        category: getCategoryInfo(article.category).name,
      });
    }
  });

  // Tag matches
  const uniqueTags = new Set<string>();
  articles.forEach((article) => {
    article.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(lowerQuery) && !uniqueTags.has(tag)) {
        uniqueTags.add(tag);
        suggestions.push({
          text: tag,
        });
      }
    });
  });

  // Limit to 5 suggestions
  return suggestions.slice(0, 5);
}

/**
 * HelpCenter V2 Component
 */
export const HelpCenterV2: React.FC = () => {
  const { category, slug } = useParams<{ category?: string; slug?: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Fetch articles
  const { data: articles = [], isLoading, error } = useHelpArticles();

  // Filter articles
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // Filter by category if specified
    if (category && !slug) {
      filtered = filtered.filter((article) => article.category === category);
    }

    // Filter by search query
    if (debouncedQuery) {
      filtered = filterArticlesBySearch(filtered, debouncedQuery);
    }

    return filtered;
  }, [articles, category, slug, debouncedQuery]);

  // Get current article if slug is specified
  const currentArticle = useMemo(() => {
    if (!slug) return null;
    return articles.find((article) => article.slug === slug);
  }, [articles, slug]);

  // Generate search suggestions
  const suggestions = useMemo(() => {
    return generateSuggestions(articles, searchQuery);
  }, [articles, searchQuery]);

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = createBreadcrumbs(['Help Center', '/dashboard/help']);

    if (category) {
      const categoryInfo = getCategoryInfo(category);
      crumbs.push({
        label: categoryInfo.name,
        href: slug ? `/dashboard/help/${category}` : undefined,
      });
    }

    if (currentArticle) {
      crumbs.push({
        label: currentArticle.title,
      });
    }

    return crumbs;
  }, [category, slug, currentArticle]);

  // Handle search
  const handleSearch = (query: string) => {
    setDebouncedQuery(query);

    // Clear category filter when searching
    if (query && category) {
      navigate('/dashboard/help');
    }
  };

  // Handle category click
  const handleCategoryClick = (categoryId: string) => {
    setSearchQuery('');
    setDebouncedQuery('');
    navigate(`/dashboard/help/${categoryId}`);
  };

  // Handle article click
  const handleArticleClick = (article: HelpArticle) => {
    navigate(`/dashboard/help/${article.category}/${article.slug}`);
  };

  // Handle feedback (delegated to FeedbackWidget component)
  const handleFeedback = (articleId: string, helpful: boolean) => {
    console.log('Article feedback received:', articleId, helpful);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <EmptyState
          icon={QuestionMarkCircleIcon}
          title="Failed to load help articles"
          description="We encountered an error loading the help center. Please try again later."
        />
      </div>
    );
  }

  // Article view
  if (currentArticle) {
    return (
      <main role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <HelpArticleView
          article={currentArticle}
          allArticles={articles}
          breadcrumbs={breadcrumbs}
          onFeedback={handleFeedback}
          showTableOfContents
          showRelatedArticles
        />
      </main>
    );
  }

  // Main view (search + categories or results)
  return (
    <main role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Help Center</h1>
        <p className="text-lg text-muted-foreground">
          Find answers, learn best practices, and get the most out of RAG Prompt Library
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <HelpSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          suggestions={suggestions}
        />
      </div>

      {/* Popular Searches & Quick Actions (only show on main view) */}
      {!debouncedQuery && !category && (
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Searches */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              Popular searches
            </h2>
            <div className="flex flex-wrap gap-2" data-testid="popular-searches">
              {POPULAR_SEARCHES.map((search) => (
                <button
                  key={search}
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch(search);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm',
                    'bg-muted text-muted-foreground rounded-full',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    'transition-colors duration-200'
                  )}
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Quick actions
            </h2>
            <div className="grid grid-cols-2 gap-3" data-testid="quick-actions">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    onClick={() =>
                      navigate(`/dashboard/help/${action.category}/${action.articleSlug}`)
                    }
                    className={cn(
                      'w-full text-left',
                      'flex items-start gap-3 p-3',
                      'bg-card border border-border rounded-lg',
                      'hover:border-primary hover:shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      'transition-all duration-200'
                    )}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0',
                        'w-8 h-8 rounded-lg border',
                        'flex items-center justify-center',
                        action.color
                      )}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    </div>
                    <svg
                      className="flex-shrink-0 w-4 h-4 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      {!debouncedQuery && !category && <div className="mb-8 border-t border-border" />}

      {/* Content */}
      {debouncedQuery || category ? (
        // Search results or category articles
        <div className="flex flex-col gap-6">
          {/* Results Header */}
          <div className="mb-6 pb-4 border-b border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {debouncedQuery
                ? `Search results for "${debouncedQuery}"`
                : `${getCategoryInfo(category!).name} Articles`}
            </h2>
            <p className="text-muted-foreground">
              {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}{' '}
              found
            </p>
          </div>

          {/* Results List */}
          <HelpResultsList
            articles={filteredArticles}
            searchQuery={debouncedQuery}
            onArticleClick={handleArticleClick}
          />

          {/* Back to Categories */}
          {(debouncedQuery || category) && (
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  navigate('/dashboard/help');
                }}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2',
                  'text-primary hover:text-primary/80',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md',
                  'transition-colors duration-200'
                )}
              >
                ← Browse all categories
              </button>
            </div>
          )}
        </div>
      ) : (
        // Category grid
        <div className="flex flex-col gap-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Browse by Category</h2>
            <p className="text-muted-foreground">
              Choose a category to explore articles and guides
            </p>
          </div>
          <HelpCategoryList articles={articles} onCategoryClick={handleCategoryClick} />
        </div>
      )}
    </main>
  );
};

export default HelpCenterV2;
