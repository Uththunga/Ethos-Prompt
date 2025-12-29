/**
 * HelpArticleView Component
 *
 * Displays full article content with markdown rendering, breadcrumbs,
 * metadata, and feedback widget placeholder.
 */

import { ClockIcon, TagIcon, CalendarIcon, PlayIcon } from '@/components/icons';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { HelpArticle } from '@/hooks/useHelpArticles';
import Breadcrumbs, { type BreadcrumbItem } from '@/components/common/Breadcrumbs';
import { getDifficultyColor, calculateReadTime } from './HelpResultsList';
import { getCategoryInfo } from './HelpCategoryList';
import TableOfContents, { useHeadingIds } from './TableOfContents';
import { useTrackArticleView } from './RecentlyViewed';
import FeedbackWidget from './FeedbackWidget';
import RelatedArticles from './RelatedArticles';
import { FAQSection } from './FAQAccordion';

import { useHelp } from './HelpSystem';
import { Button } from '../marketing/ui/button';
import CodeBlock from '../ui/CodeBlock';
import Callout, { type CalloutType } from '../ui/Callout';

/**
 * Mapping of article slugs to HelpSystem tour IDs
 * Enables "Start Guided Tour" CTA for articles with corresponding tours
 */
const ARTICLE_TOUR_MAPPING: Record<string, { tourId: string; stepCount: number }> = {
  'quick-start-guide': { tourId: 'first-time-user', stepCount: 5 },
  'document-upload-guide': { tourId: 'document-upload', stepCount: 3 },
  'creating-first-prompt': { tourId: 'prompt-creation', stepCount: 4 },
};

// Markdown code block renderer with copy button
const MDCodeBlock: React.FC<{
  inline?: boolean;
  language?: string;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}> = ({ inline, language, className, children, ...props }) => {
  // For inline code, use simple code tag
  if (inline) {
    return (
      <code
        className={cn(
          'px-1.5 py-0.5 rounded bg-slate-800 text-slate-100 text-sm font-mono',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  // For code blocks, use CodeBlock component with copy functionality
  const codeContent = String(children).replace(/\n$/, '');
  return <CodeBlock language={language}>{codeContent}</CodeBlock>;
};

export interface HelpArticleViewProps {
  article: HelpArticle;
  allArticles?: HelpArticle[]; // For related articles
  breadcrumbs?: BreadcrumbItem[];
  onFeedback?: (articleId: string, helpful: boolean) => void;
  showTableOfContents?: boolean;
  showRelatedArticles?: boolean;
  className?: string;

  'data-testid'?: string;
}

/**
 * HelpArticleView Component
 *
 * Full article view with markdown content, metadata, and interactive elements.
 */
export const HelpArticleView: React.FC<HelpArticleViewProps> = ({
  article,
  allArticles = [],
  breadcrumbs,
  onFeedback,
  showTableOfContents = true,
  showRelatedArticles = true,
  className,
  'data-testid': testId = 'help-article-view',
}) => {
  const categoryInfo = getCategoryInfo(article.category);
  // Syntax highlighting is handled per-code-block via MDCodeBlock

  const CategoryIcon = categoryInfo.icon;
  const readTime = article.estimatedReadTime || calculateReadTime(article.content);

  // Track article view (for recently viewed)
  useTrackArticleView(article.id);

  // Add IDs to headings for ToC navigation
  useHeadingIds(article.content);

  // Check if this article has a guided tour
  const tourMapping = ARTICLE_TOUR_MAPPING[article.slug];
  const { startTour } = useHelp();

  const handleStartTour = () => {
    if (tourMapping) {
      startTour(tourMapping.tourId);
    }
  };

  return (
    <div className={cn('lg:grid lg:grid-cols-12 lg:gap-8', className)}>
      {/* Table of Contents (Desktop Sidebar) */}
      {showTableOfContents && (
        <aside className="hidden lg:block lg:col-span-3">
          <TableOfContents content={article.content} sticky />
        </aside>
      )}

      {/* Main Article Content */}
      <article
        className={cn('lg:col-span-9', !showTableOfContents && 'lg:col-span-12 max-w-4xl mx-auto')}
        data-testid={testId}
      >
        {/* Breadcrumbs */}
        {(() => {
          const computed: BreadcrumbItem[] =
            breadcrumbs && breadcrumbs.length > 0
              ? breadcrumbs
              : [
                  { label: 'Help Center', href: '/dashboard/help' },
                  { label: categoryInfo.name, href: `/dashboard/help/${article.category}` },
                  { label: article.title },
                ];
          return (
            <div className="mb-6">
              <Breadcrumbs items={computed} />
            </div>
          );
        })()}

        {/* Article Header */}
        <header className="mb-8">
          {/* Category & Difficulty */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CategoryIcon className="w-4 h-4" aria-hidden="true" />
              <span>{categoryInfo.name}</span>
            </div>

            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full',
                'text-xs font-medium border',
                getDifficultyColor(article.difficulty)
              )}
              aria-label={`Difficulty: ${article.difficulty}`}
            >
              {article.difficulty}
            </span>

            {article.featured && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Featured
              </span>
            )}
          </div>

          {/* Title (page-level heading) */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{article.title}</h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-lg text-muted-foreground mb-6">{article.excerpt}</p>
          )}

          {/* Start Guided Tour CTA */}
          {tourMapping && (
            <div className="mb-6">
              <Button
                onClick={handleStartTour}
                variant="outline"
                size="default"
                className="inline-flex items-center gap-2"
                aria-label={`Start guided tour (${tourMapping.stepCount} steps)`}
              >
                <PlayIcon className="w-4 h-4" aria-hidden="true" />
                <span>Start Guided Tour ({tourMapping.stepCount} steps)</span>
              </Button>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t border-b border-border py-4">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4" aria-hidden="true" />
              <span>{readTime} min read</span>
            </div>

            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4" aria-hidden="true" />
              <span>
                Updated{' '}
                {new Date(article.lastUpdated).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <TagIcon className="w-4 h-4" aria-hidden="true" />
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Article Content */}
        <div
          className={cn(
            'prose prose-slate max-w-none',
            'prose-headings:font-semibold prose-headings:text-foreground prose-headings:leading-tight prose-headings:scroll-mt-32',
            'prose-h1:mt-0 prose-h1:mb-4',
            'prose-h2:mt-8 prose-h2:mb-3',
            'prose-h3:mt-6 prose-h3:mb-2',
            'prose-p:text-foreground prose-p:leading-relaxed prose-p:my-4',
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
            'prose-strong:text-foreground prose-strong:font-semibold',
            'prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
            'prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:my-4',
            'prose-ul:text-foreground prose-ul:my-4 prose-ol:text-foreground prose-ol:my-4',
            'prose-li:text-foreground prose-li:marker:text-muted-foreground prose-li:my-1.5',
            'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:my-4',
            'prose-hr:border-border prose-hr:my-8',
            'prose-img:rounded-lg prose-img:shadow-md prose-img:my-4',
            'mb-8'
          )}
        >
          <ReactMarkdown
            components={{
              // Ensure only one h1 on the page: map markdown h1 to h2
              h1({ node, children, ...props }) {
                return (
                  <h2
                    className="text-2xl sm:text-3xl font-semibold text-foreground mb-4"
                    {...props}
                  >
                    {children}
                  </h2>
                );
              },
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : undefined;
                return (
                  <MDCodeBlock inline={inline} language={language} className={className} {...props}>
                    {children}
                  </MDCodeBlock>
                );
              },
              blockquote({ node, children, ...props }) {
                // Parse callout syntax: > [!NOTE], > [!TIP], > [!WARNING], > [!DANGER]
                const childrenArray = React.Children.toArray(children);
                const firstChild = childrenArray[0];

                const extractText = (val: any): string => {
                  const collect = (v: any): string => {
                    if (typeof v === 'string') return v;
                    if (Array.isArray(v)) return v.map(collect).join('');
                    if (React.isValidElement(v) && (v as any).props)
                      return collect((v as any).props.children);
                    return '';
                  };
                  return collect(val);
                };

                // Check if first child is a paragraph with callout syntax
                if (firstChild && typeof firstChild === 'object' && 'props' in firstChild) {
                  const raw = (firstChild as any).props.children;
                  const text = extractText(raw);
                  let calloutMatch = text.match(/^\s*\[!(NOTE|TIP|WARNING|DANGER)\]\s*/i);

                  // Fallback: try reading from MDAST node when React children shape is unexpected
                  if (!calloutMatch && node && (node as any).children?.[0]) {
                    const gather = (n: any): string => {
                      if (!n) return '';
                      if (typeof n.value === 'string') return n.value;
                      if (Array.isArray(n.children)) return n.children.map(gather).join('');
                      return '';
                    };
                    const astText = gather((node as any).children[0]);
                    calloutMatch = astText.match(/^\s*\[!(NOTE|TIP|WARNING|DANGER)\]\s*/i);
                  }

                  if (calloutMatch) {
                    const type = calloutMatch[1].toLowerCase() as CalloutType;
                    return (
                      <Callout type={type} data-testid={`callout-${type}`}>
                        {childrenArray.slice(1)}
                      </Callout>
                    );
                  }
                }

                // Default blockquote rendering
                return (
                  <blockquote
                    className="border-l-4 border-border pl-4 italic text-muted-foreground my-4"
                    {...props}
                  >
                    {children}
                  </blockquote>
                );
              },
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Steps Section (if present) */}
        {article.steps && article.steps.length > 0 && (
          <div className="mb-8 bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Step-by-Step Guide</h2>
            <div>
              {article.steps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-2">{step.content}</p>
                    {step.tips && step.tips.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-primary/30">
                        <p className="text-sm font-medium text-foreground mb-1">Tips:</p>
                        <ul className="text-sm text-muted-foreground">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs Section (if present) */}
        {article.faqs && article.faqs.length > 0 && (
          <div className="mb-8">
            <FAQSection faqs={article.faqs} searchable={article.faqs.length > 3} />
          </div>
        )}

        {/* Feedback Widget */}
        <div className="mt-12 pt-8 border-t border-border">
          <FeedbackWidget articleId={article.id} onFeedbackSubmit={onFeedback} />
        </div>

        {/* Related Articles */}
        {showRelatedArticles && allArticles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <RelatedArticles currentArticle={article} allArticles={allArticles} maxResults={3} />
          </div>
        )}
      </article>
    </div>
  );
};

export default HelpArticleView;
