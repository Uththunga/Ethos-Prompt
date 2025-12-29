/* eslint-disable react-refresh/only-export-components */

import { Button } from '@/components/marketing/ui/button';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
}

interface InteractiveFAQProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  faqs: FAQItem[];
  categories?: string[];
  showSearch?: boolean;
  showCategories?: boolean;
  contactCTA?: {
    text: string;
    link: string;
  };
  className?: string;
  onContactClick?: () => void;
}

export const InteractiveFAQ: React.FC<InteractiveFAQProps> = ({
  title = "Frequently Asked Questions",
  description = "Find answers to common questions about our services",
  faqs,
  categories = [],
  showSearch = true,
  showCategories = true,
  contactCTA,
  className = "",
  onContactClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter FAQs based on search term and category
  const filteredFAQs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = searchTerm === '' ||
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchTerm, selectedCategory]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Auto-expand first result if searching
    if (e.target.value && filteredFAQs.length > 0) {
      setExpandedItems(new Set([filteredFAQs[0].id]));
    }
  };

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(title || description) && (
          <div className="text-center mb-4 px-4">
            {title && (
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">
                {typeof title === 'string' ? (
                  <span className="text-ethos-navy">{title}</span>
                ) : (
                  title
                )}
              </h2>
            )}
            {description && (
              <p className="text-base sm:text-lg md:text-xl text-ethos-gray max-w-3xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Search Bar */}
        {showSearch && (
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple text-gray-900"
            />
          </div>
        )}

        {/* Category Filter */}
        {showCategories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center px-2">
            <Button
              onClick={() => setSelectedCategory('all')}
              variant={selectedCategory === 'all' ? 'ethos' : 'outline'}
              size="sm"
              className="rounded-full text-xs sm:text-sm"
            >
              All Questions
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? 'ethos' : 'outline'}
                size="sm"
                className="rounded-full text-xs sm:text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        {/* FAQ Items */}
        <div >
          {filteredFAQs.length === 0 ? (
            <div className="p-6 sm:p-8 text-center bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:shadow-lg" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-ethos-navy mb-2">No questions found</h3>
              <p className="text-ethos-gray mb-4">
                Try adjusting your search terms or browse all categories.
              </p>
              {contactCTA && (
                <Button asChild variant="ethos" size="lg">
                  <a href={contactCTA.link}>
                    {contactCTA.text}
                  </a>
                </Button>
              )}
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div key={faq.id} className="overflow-hidden bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:shadow-lg mb-4" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full px-4 sm:px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:ring-inset"
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-semibold text-ethos-navy break-words flex-1">
                      {faq.question}
                    </h3>
                    {expandedItems.has(faq.id) ? (
                      <ChevronUp className="w-5 h-5 text-ethos-purple flex-shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-ethos-gray flex-shrink-0 mt-0.5 sm:mt-0" />
                    )}
                  </div>
                  {faq.category && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-ethos-purple/10 text-ethos-purple rounded-full">
                      {faq.category}
                    </span>
                  )}
                </button>
                {expandedItems.has(faq.id) && (
                  <div className="px-4 sm:px-6 pb-4 border-t border-gray-100">
                    <div className="pt-4 text-base sm:text-base text-ethos-gray leading-relaxed break-words">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        {contactCTA && filteredFAQs.length > 0 && (
          <div className="mt-12 text-center px-4">
            <div className="bg-gradient-to-r from-ethos-purple/10 to-ethos-navy/10 rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-ethos-navy mb-2">
                Still have questions?
              </h3>
              <p className="text-ethos-gray mb-6">
                Our team is here to help you find the perfect solution for your business.
              </p>
              {onContactClick ? (
                <Button onClick={onContactClick} variant="ethos" size="lg">
                  {contactCTA.text}
                </Button>
              ) : (
                <Button asChild variant="ethos" size="lg">
                  <a href={contactCTA.link}>
                    {contactCTA.text}
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Search Results Summary */}
        {searchTerm && (
          <div className="mt-6 text-center text-sm text-ethos-gray">
            Found {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </div>
        )}
      </div>
    </section>
  );
};

// Hook for FAQ analytics
export const useFAQAnalytics = () => {
  const trackFAQInteraction = (action: string, question: string, category?: string) => {
    if (typeof window !== 'undefined') {
      const g = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof g === 'function') {
        g('event', 'faq_interaction', {
          event_category: 'FAQ',
          event_label: question,
          custom_parameter_1: action,
          custom_parameter_2: category || 'uncategorized'
        });
      }
    }
  };

  const trackFAQSearch = (searchTerm: string, resultsCount: number) => {
    if (typeof window !== 'undefined') {
      const g = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof g === 'function') {
        g('event', 'faq_search', {
          event_category: 'FAQ',
          event_label: searchTerm,
          value: resultsCount
        });
      }
    }
  };

  return { trackFAQInteraction, trackFAQSearch };
};
