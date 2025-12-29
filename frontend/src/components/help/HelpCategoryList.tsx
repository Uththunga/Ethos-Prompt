/**
 * HelpCategoryList Component
 *
 * Displays help article categories with icons, counts, and responsive grid layout.
 * Uses Dashboard design tokens for visual consistency.
 */

import {
  AcademicCapIcon,
  BookOpenIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  WrenchScrewdriverIcon,
} from '@/components/icons';
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { HelpArticle } from '@/hooks/useHelpArticles';

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // Tailwind color class
  count: number;
}

export interface HelpCategoryListProps {
  articles: HelpArticle[];
  onCategoryClick?: (categoryId: string) => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * Get category metadata including icons and colors
 */
export function getCategoryInfo(categoryId: string, articleCount: number = 0): CategoryInfo {
  const categories: Record<string, Omit<CategoryInfo, 'id' | 'count'>> = {
    'getting-started': {
      name: 'Getting Started',
      description: 'Quick start guides and onboarding tutorials',
      icon: RocketLaunchIcon,
      color: 'text-green-600 bg-green-50 border-green-200',
    },
    'core-features': {
      name: 'Core Features',
      description: 'Learn about prompts, documents, and RAG execution',
      icon: BookOpenIcon,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    'account-settings': {
      name: 'Account & Settings',
      description: 'Manage your profile, workspace, and preferences',
      icon: Cog6ToothIcon,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    troubleshooting: {
      name: 'Troubleshooting',
      description: 'Solutions to common issues and error messages',
      icon: WrenchScrewdriverIcon,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
    },
    api: {
      name: 'API & Integration',
      description: 'API documentation and integration guides',
      icon: CodeBracketIcon,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    'best-practices': {
      name: 'Best Practices',
      description: 'Advanced techniques and optimization strategies',
      icon: LightBulbIcon,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    },
  };

  const categoryData = categories[categoryId] || {
    name: categoryId,
    description: 'Help articles',
    icon: AcademicCapIcon,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  return {
    id: categoryId,
    count: articleCount,
    ...categoryData,
  };
}

/**
 * HelpCategoryList Component
 *
 * Displays categories in a responsive grid with article counts.
 */
export const HelpCategoryList: React.FC<HelpCategoryListProps> = ({
  articles,
  onCategoryClick,
  className,
  'data-testid': testId = 'help-category-list',
}) => {
  // Count articles per category
  const categoryCounts = articles.reduce((acc, article) => {
    acc[article.category] = (acc[article.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get all categories with counts
  const categories = Object.keys(categoryCounts).map((categoryId) =>
    getCategoryInfo(categoryId, categoryCounts[categoryId])
  );

  // Sort categories by predefined order
  const categoryOrder = [
    'getting-started',
    'core-features',
    'account-settings',
    'troubleshooting',
    'api',
    'best-practices',
  ];

  const sortedCategories = categories.sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.id);
    const indexB = categoryOrder.indexOf(b.id);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
  };

  return (
    <div
      className={cn('grid gap-4 sm:gap-6', className)}
      data-testid={testId}
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      }}
    >
      {sortedCategories.map((category) => {
        const Icon = category.icon;

        return (
          <Link
            key={category.id}
            to={`/dashboard/help/${category.id}`}
            onClick={(e) => {
              if (onCategoryClick) {
                e.preventDefault();
                handleCategoryClick(category.id);
              }
            }}
            className={cn(
              'group relative',
              'bg-card border border-border rounded-lg',
              'p-6',
              'hover:border-primary hover:shadow-md',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'transition-all duration-200',
              'cursor-pointer'
            )}
            aria-label={`${category.name} - ${category.count} articles`}
            data-testid="category-card"
          >
            {/* Icon */}
            <div
              className={cn(
                'inline-flex items-center justify-center',
                'w-12 h-12 rounded-lg border',
                'mb-4',
                'transition-transform duration-200 group-hover:scale-110',
                category.color
              )}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center justify-center',
                    'min-w-[2rem] h-6 px-2 rounded-full',
                    'text-xs font-medium',
                    'bg-muted text-muted-foreground'
                  )}
                  aria-label={`${category.count} articles`}
                >
                  {category.count}
                </span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
            </div>

            {/* Hover Arrow */}
            <div
              className={cn(
                'absolute bottom-6 right-6',
                'text-muted-foreground group-hover:text-primary',
                'transform translate-x-0 group-hover:translate-x-1',
                'transition-all duration-200',
                'opacity-0 group-hover:opacity-100'
              )}
              aria-hidden="true"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default HelpCategoryList;
