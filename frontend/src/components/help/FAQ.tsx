/**
 * FAQ Component
 * Frequently Asked Questions with search and categories
 */

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-rag',
    question: 'What is RAG (Retrieval Augmented Generation)?',
    answer: 'RAG is a technique that enhances AI responses by retrieving relevant information from your documents before generating an answer. This allows the AI to provide more accurate, contextual responses based on your specific data rather than just its training knowledge.',
    category: 'Getting Started',
    tags: ['rag', 'basics', 'ai']
  },
  {
    id: 'how-to-create-prompt',
    question: 'How do I create my first prompt?',
    answer: 'Navigate to the Prompts section, click "Create from Scratch" or "AI-Assisted Creation", fill in your prompt details including title, description, and content. Use {{variable_name}} syntax for dynamic variables. Save your prompt and you can start executing it immediately.',
    category: 'Prompts',
    tags: ['prompts', 'creation', 'variables']
  },
  {
    id: 'supported-file-formats',
    question: 'What file formats are supported for document upload?',
    answer: 'We support PDF (.pdf), Text files (.txt), Word documents (.doc, .docx), and Markdown files (.md). Maximum file size is 10MB for PDF and Word documents, 5MB for text and markdown files.',
    category: 'Documents',
    tags: ['documents', 'upload', 'formats']
  },
  {
    id: 'how-rag-works',
    question: 'How does RAG enhance my prompts?',
    answer: 'When you enable RAG for a prompt execution, the system searches your uploaded documents for relevant content based on your input. This relevant context is then provided to the AI along with your prompt, resulting in more accurate and informed responses.',
    category: 'RAG',
    tags: ['rag', 'enhancement', 'context']
  },
  {
    id: 'prompt-variables',
    question: 'How do I use variables in prompts?',
    answer: 'Use double curly braces syntax: {{variable_name}}. For example: "Hello {{customer_name}}, thank you for your inquiry about {{product_name}}." When executing the prompt, you\'ll be asked to provide values for these variables.',
    category: 'Prompts',
    tags: ['prompts', 'variables', 'syntax']
  },
  {
    id: 'document-processing-time',
    question: 'How long does document processing take?',
    answer: 'Processing time depends on document size and complexity. Small text files process in seconds, while large PDFs may take a few minutes. You can monitor processing status in the Documents section.',
    category: 'Documents',
    tags: ['documents', 'processing', 'time']
  },
  {
    id: 'execution-limits',
    question: 'Are there limits on prompt executions?',
    answer: 'Execution limits depend on your subscription plan. Free tier includes 100 executions per month, while paid plans offer higher limits. Check your usage in the Analytics section.',
    category: 'Billing',
    tags: ['limits', 'billing', 'executions']
  },
  {
    id: 'team-collaboration',
    question: 'Can I collaborate with my team?',
    answer: 'Yes! Create workspaces to collaborate with team members. You can share prompts, documents, and execution results. Invite team members via email and assign different permission levels.',
    category: 'Collaboration',
    tags: ['team', 'collaboration', 'workspaces']
  },
  {
    id: 'api-access',
    question: 'Is there an API for integration?',
    answer: 'Yes, we provide a comprehensive REST API for all platform features. Generate API keys in your settings, and use our SDKs for JavaScript, Python, or direct HTTP calls. Full documentation is available in the API section.',
    category: 'API',
    tags: ['api', 'integration', 'sdk']
  },
  {
    id: 'data-security',
    question: 'How secure is my data?',
    answer: 'We use enterprise-grade security including AES-256 encryption, secure data centers, and SOC 2 compliance. Your documents and prompts are private to your account and never used to train AI models.',
    category: 'Security',
    tags: ['security', 'privacy', 'encryption']
  },
  {
    id: 'export-data',
    question: 'Can I export my data?',
    answer: 'Yes, you can export your prompts, execution history, and documents at any time. Go to Settings > Data Export to download your data in JSON or CSV format.',
    category: 'Data Management',
    tags: ['export', 'data', 'backup']
  },
  {
    id: 'troubleshooting-errors',
    question: 'What should I do if I encounter errors?',
    answer: 'First, check the system status page. For prompt execution errors, verify all variables are filled correctly. For document upload issues, check file format and size. If problems persist, contact support with error details.',
    category: 'Troubleshooting',
    tags: ['errors', 'troubleshooting', 'support']
  }
];

const CATEGORIES = Array.from(new Set(FAQ_ITEMS.map(item => item.category)));

export const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredItems = FAQ_ITEMS.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-ethos-navy mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-body-base text-ethos-gray">
          Find answers to common questions about the RAG Prompt Library
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ethos-gray-light" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-ethos-gray-light rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent bg-white text-ethos-navy"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'All'
                ? 'bg-ethos-purple text-white'
                : 'bg-ethos-light text-ethos-gray hover:bg-ethos-purple/10'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-ethos-purple text-white'
                  : 'bg-ethos-light text-ethos-gray hover:bg-ethos-purple/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div >
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ethos-gray">
              No FAQs found matching your search criteria.
            </p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white border border-ethos-gray-light/20 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleExpanded(item.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-ethos-light transition-colors"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-ethos-navy">
                    {item.question}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-ethos-purple/10 text-ethos-purple rounded-full">
                      {item.category}
                    </span>
                  </div>
                </div>
                {expandedItems.has(item.id) ? (
                  <ChevronUpIcon className="h-5 w-5 text-ethos-gray-light" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-ethos-gray-light" />
                )}
              </button>
              
              {expandedItems.has(item.id) && (
                <div className="px-6 pb-4">
                  <div className="pt-2 border-t border-ethos-gray-light/20">
                    <p className="text-ethos-gray leading-relaxed">
                      {item.answer}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-ethos-light text-ethos-gray rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Contact Support */}
      <div className="mt-12 bg-ethos-purple/5 border border-ethos-purple/20 rounded-lg p-6">
        <h3 className="text-lg font-medium text-ethos-navy mb-2">
          Still need help?
        </h3>
        <p className="text-ethos-gray mb-4">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-ethos-purple text-white rounded-lg hover:bg-ethos-purple/90 transition-colors">
            Contact Support
          </button>
          <button className="px-4 py-2 border border-ethos-purple text-ethos-purple rounded-lg hover:bg-ethos-purple/10 transition-colors">
            Join Community
          </button>
        </div>
      </div>
    </div>
  );
};
