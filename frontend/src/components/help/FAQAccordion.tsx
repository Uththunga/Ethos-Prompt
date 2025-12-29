/**
 * FAQAccordion Component
 *
 * Accessible accordion for FAQs using Radix UI Accordion.
 * Supports category grouping and search filtering.
 */

import React, { useState, useMemo } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { FAQ } from '@/hooks/useHelpArticles';

export interface FAQAccordionProps {
  faqs: FAQ[];
  searchable?: boolean;
  defaultOpen?: string[]; // Array of FAQ IDs to open by default
  className?: string;
  'data-testid'?: string;
}

/**
 * Filter FAQs by search query
 */
function filterFAQs(faqs: FAQ[], query: string): FAQ[] {
  if (!query || !query.trim()) {
    return faqs;
  }

  const lowerQuery = query.toLowerCase();
  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery)
  );
}

/**
 * FAQAccordion Component
 *
 * Displays FAQs in an accessible accordion format.
 */
export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  faqs,
  searchable = true,
  defaultOpen = [],
  className,
  'data-testid': testId = 'faq-accordion',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQs based on search
  const filteredFAQs = useMemo(() => filterFAQs(faqs, searchQuery), [faqs, searchQuery]);

  if (faqs.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} data-testid={testId}>
      {/* Search Input */}
      {searchable && faqs.length > 3 && (
        <div className="relative">
          <label htmlFor="faq-search" className="sr-only">
            Search FAQs
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <input
            id="faq-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className={cn(
              'block w-full pl-10 pr-3 py-2 text-sm',
              'border border-input rounded-lg',
              'bg-background text-foreground placeholder:text-muted-foreground',
              'focus:ring-2 focus:ring-ring focus:border-primary',
              'transition-colors duration-200'
            )}
          />
        </div>
      )}

      {/* Accordion */}
      {filteredFAQs.length > 0 ? (
        <Accordion.Root type="multiple" defaultValue={defaultOpen}>
          {filteredFAQs.map((faq) => (
            <Accordion.Item
              key={faq.id}
              value={faq.id}
              className={cn(
                'bg-card border border-border rounded-lg',
                'overflow-hidden',
                'transition-colors duration-200',
                'hover:border-primary/50'
              )}
              data-testid="faq-item"
            >
              {/* Question (Trigger) */}
              <Accordion.Header>
                <Accordion.Trigger
                  className={cn(
                    'group flex w-full items-center justify-between',
                    'px-4 py-3 sm:px-6 sm:py-4',
                    'text-left text-base font-medium text-foreground',
                    'hover:bg-accent',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
                    'transition-colors duration-200'
                  )}
                >
                  <span className="flex-1 pr-4">{faq.question}</span>
                  <ChevronDownIcon
                    className={cn(
                      'h-5 w-5 text-muted-foreground flex-shrink-0',
                      'transition-transform duration-200',
                      'group-data-[state=open]:rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </Accordion.Trigger>
              </Accordion.Header>

              {/* Answer (Content) */}
              <Accordion.Content
                className={cn(
                  'overflow-hidden',
                  'data-[state=open]:animate-accordion-down',
                  'data-[state=closed]:animate-accordion-up'
                )}
              >
                <div className="px-4 pb-3 sm:px-6 sm:pb-4 pt-0">
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      ) : (
        <div className="text-center py-8 px-4 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No FAQs found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

/**
 * FAQSection Component
 *
 * Wrapper for FAQ section with heading.
 */
export interface FAQSectionProps {
  title?: string;
  description?: string;
  faqs: FAQ[];
  searchable?: boolean;
  className?: string;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  title = 'Frequently Asked Questions',
  description,
  faqs,
  searchable = true,
  className,
}) => {
  return (
    <section className={cn('flex flex-col gap-6', className)}>
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <FAQAccordion faqs={faqs} searchable={searchable} />
    </section>
  );
};

export default FAQAccordion;
