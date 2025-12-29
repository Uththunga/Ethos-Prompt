/**
 * TableOfContents Component
 *
 * Parses markdown headings and generates a navigable table of contents
 * with anchor links and smooth scrolling.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface TocHeading {
  id: string;
  text: string;
  level: number; // 1-6 for h1-h6
}

export interface TableOfContentsProps {
  content: string;
  className?: string;
  maxLevel?: number; // Maximum heading level to include (default: 3)
  sticky?: boolean;
  'data-testid'?: string;
}

/**
 * Parse markdown content to extract headings
 */
export function parseHeadings(markdown: string, maxLevel: number = 3): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = markdown.split('\n');

  lines.forEach((line) => {
    // Match markdown headings (# Heading)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();

      // Only include headings up to maxLevel
      if (level <= maxLevel) {
        // Generate ID from text (lowercase, replace spaces with hyphens, remove special chars)
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        headings.push({ id, text, level });
      }
    }
  });

  return headings;
}

/**
 * TableOfContents Component
 *
 * Displays a navigable table of contents with active section highlighting.
 */
export const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  className,
  maxLevel = 3,
  sticky = true,
  'data-testid': testId = 'table-of-contents',
}) => {
  const [activeId, setActiveId] = useState<string>('');

  // Parse headings from content
  const headings = useMemo(() => parseHeadings(content, maxLevel), [content, maxLevel]);

  // Track active section based on scroll position
  useEffect(() => {
    if (headings.length === 0) return;

    // Guard for environments without IntersectionObserver or incomplete mocks
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px', // Trigger when heading is near top
        threshold: 1.0,
      }
    );

    // Observe all heading elements
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      if (observer && typeof (observer as any).disconnect === 'function') {
        (observer as any).disconnect();
      }
    };
  }, [headings]);

  // Handle click on TOC item
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // Update URL hash without jumping
      window.history.pushState(null, '', `#${id}`);
      setActiveId(id);
    }
  };

  // Don't render if no headings
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn('hidden lg:block', sticky && 'sticky top-24', className)}
      aria-label="Table of contents"
      data-testid={testId}
    >
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          On This Page
        </h2>

        <ul className="text-sm">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            const indent = (heading.level - 1) * 12; // 12px per level

            return (
              <li key={heading.id} style={{ paddingLeft: `${indent}px` }}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleClick(e, heading.id)}
                  className={cn(
                    'block py-1 border-l-2 pl-3 -ml-px transition-colors duration-200',
                    isActive
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  )}
                  aria-current={isActive ? 'location' : undefined}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

/**
 * Hook to add IDs to heading elements in rendered markdown
 * Use this in conjunction with TableOfContents
 */
export function useHeadingIds(content: string, maxLevel: number = 3) {
  useEffect(() => {
    // Add IDs to heading elements for all levels (markdown h1 are rendered as h2 in DOM)
    const headings = parseHeadings(content, maxLevel);

    headings.forEach(({ id, text }) => {
      // Find corresponding heading by text content (search h2+ since markdown h1 maps to h2)
      const elements = Array.from(document.querySelectorAll('h2, h3, h4, h5, h6'));
      const element = elements.find((el) => el.textContent?.trim() === text);

      if (element && !element.id) {
        element.id = id;
        // Make heading a scroll target
        element.setAttribute('tabindex', '-1');
      }
    });
  }, [content, maxLevel]);
}

export default TableOfContents;
