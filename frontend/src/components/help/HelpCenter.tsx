/**
 * Enhanced Help Center Component
 * Comprehensive help center with advanced search, multimedia content, accessibility features,
 * and user analytics. Provides intuitive navigation and progressive content disclosure.
 */

import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  VideoCameraIcon,
  XMarkIcon,
  StarIconSolid,
} from '@/components/icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { HelpCenterSkeleton } from './HelpCenterSkeleton';
import { HelpCenterError } from './HelpCenterError';

// Enhanced interfaces for the new Help Center
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
  views: number;
  helpful: number;
  rating: number;
  estimatedReadTime: number;
  type: 'article' | 'video' | 'tutorial' | 'faq' | 'guide' | 'troubleshooting';
  featured: boolean;
  prerequisites?: string[];
  relatedArticles?: string[];
  videoUrl?: string;
  steps?: ArticleStep[];
  faqs?: FAQ[];
}

interface ArticleStep {
  id: string;
  title: string;
  content: string;
  image?: string;
  code?: string;
  tips?: string[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  helpful: number;
}

interface SearchFilters {
  difficulty: string[];
  type: string[];
  category: string[];
  tags: string[];
  dateRange: string;
  sortBy: 'relevance' | 'date' | 'popularity' | 'rating';
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  articleCount: number;
  subcategories?: HelpSubcategory[];
  featured: boolean;
  color: string;
}

interface HelpSubcategory {
  id: string;
  name: string;
  description: string;
  articleCount: number;
}

interface Breadcrumb {
  label: string;
  href?: string;
  current: boolean;
}

// Enhanced categories with subcategories and better organization
const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics and get up and running quickly',
    icon: BookOpenIcon,
    articleCount: 12,
    featured: true,
    color: 'blue',
    subcategories: [
      {
        id: 'quick-start',
        name: 'Quick Start Guide',
        description: '5-minute setup',
        articleCount: 3,
      },
      { id: 'first-steps', name: 'First Steps', description: 'Essential tasks', articleCount: 4 },
      { id: 'onboarding', name: 'Onboarding', description: 'Guided tours', articleCount: 5 },
    ],
  },
  {
    id: 'prompts',
    name: 'Creating Prompts',
    description: 'Master the art of prompt engineering',
    icon: LightBulbIcon,
    articleCount: 18,
    featured: true,
    color: 'green',
    subcategories: [
      { id: 'basics', name: 'Prompt Basics', description: 'Fundamentals', articleCount: 6 },
      {
        id: 'advanced',
        name: 'Advanced Techniques',
        description: 'Expert strategies',
        articleCount: 7,
      },
      { id: 'templates', name: 'Templates', description: 'Ready-to-use prompts', articleCount: 5 },
    ],
  },
  {
    id: 'documents',
    name: 'Document Management',
    description: 'Upload and manage documents for RAG',
    icon: DocumentTextIcon,
    articleCount: 10,
    featured: false,
    color: 'purple',
    subcategories: [
      { id: 'upload', name: 'Uploading', description: 'File management', articleCount: 4 },
      { id: 'processing', name: 'Processing', description: 'Document analysis', articleCount: 3 },
      { id: 'search', name: 'Search & Retrieval', description: 'Finding content', articleCount: 3 },
    ],
  },
  {
    id: 'api',
    name: 'API & Integrations',
    description: 'Integrate with your existing workflows',
    icon: ChatBubbleLeftRightIcon,
    articleCount: 15,
    featured: false,
    color: 'orange',
    subcategories: [
      {
        id: 'authentication',
        name: 'Authentication',
        description: 'API keys & auth',
        articleCount: 3,
      },
      { id: 'endpoints', name: 'Endpoints', description: 'API reference', articleCount: 8 },
      { id: 'sdks', name: 'SDKs', description: 'Client libraries', articleCount: 4 },
    ],
  },
  {
    id: 'executions',
    name: 'Execution & Testing',
    description: 'Run and test your prompts',
    icon: PlayIcon,
    articleCount: 10,
    featured: false,
    color: 'teal',
    subcategories: [
      {
        id: 'running-prompts',
        name: 'Running Prompts',
        description: 'Execute prompts',
        articleCount: 4,
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test and validate',
        articleCount: 3,
      },
      {
        id: 'debugging',
        name: 'Debugging',
        description: 'Debug executions',
        articleCount: 3,
      },
    ],
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Solve common issues and problems',
    icon: ExclamationTriangleIcon,
    articleCount: 8,
    featured: false,
    color: 'red',
    subcategories: [
      {
        id: 'common-issues',
        name: 'Common Issues',
        description: 'Frequent problems',
        articleCount: 5,
      },
      {
        id: 'error-codes',
        name: 'Error Codes',
        description: 'Error explanations',
        articleCount: 3,
      },
    ],
  },
  {
    id: 'tutorials',
    name: 'Video Tutorials',
    description: 'Step-by-step video guides',
    icon: VideoCameraIcon,
    articleCount: 6,
    featured: true,
    color: 'indigo',
  },
  {
    id: 'contact',
    name: 'Contact Support',
    description: 'Get help from our support team',
    icon: ChatBubbleLeftRightIcon,
    articleCount: 0,
    featured: false,
    color: 'gray',
  },
];

// Enhanced articles with rich content and multimedia support
const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'quick-start-guide',
    title: 'Quick Start Guide',
    excerpt: 'Get up and running with RAG Prompt Library in just 5 minutes',
    content: `# Quick Start Guide

Welcome to RAG Prompt Library! This guide will get you started in just 5 minutes.

## What You'll Learn
- How to create your first account
- Setting up your workspace
- Creating your first prompt with variables
- Uploading documents for RAG
- Running your first AI-powered prompt execution

## Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- Email address for account creation
- Optional: Documents you want to use with RAG (PDF, DOCX, TXT, MD)`,
    category: 'getting-started',
    subcategory: 'quick-start',
    tags: ['beginner', 'setup', 'tutorial', 'onboarding', 'rag'],
    difficulty: 'beginner',
    lastUpdated: '2025-01-15',
    views: 1250,
    helpful: 98,
    rating: 4.8,
    estimatedReadTime: 5,
    type: 'tutorial',
    featured: true,
    relatedArticles: ['creating-first-prompt', 'document-upload-guide', 'rag-execution-basics'],
    steps: [
      {
        id: 'step-1',
        title: 'Create Your Account',
        content:
          'Sign up using your email or Google account. Navigate to the authentication page and choose your preferred sign-in method.',
        tips: [
          'Use a business email for team features',
          'Enable 2FA for enhanced security',
          'Verify your email to unlock all features',
        ],
      },
      {
        id: 'step-2',
        title: 'Set Up Your Workspace',
        content:
          'Create your first workspace to organize your prompts and documents. Workspaces help you separate different projects or teams.',
        tips: [
          'Give your workspace a descriptive name',
          'You can create multiple workspaces',
          'Invite team members later from workspace settings',
        ],
      },
      {
        id: 'step-3',
        title: 'Create Your First Prompt',
        content:
          'Navigate to the Prompts page and click "Create Prompt". Add a title, description, and your prompt content with variables using {{variable_name}} syntax.',
        tips: [
          'Use clear variable names like {{customer_name}} or {{product_description}}',
          'Test your prompt with sample data',
          'Save frequently to avoid losing work',
        ],
      },
      {
        id: 'step-4',
        title: 'Upload Documents (Optional)',
        content:
          'If you want to use RAG, upload your knowledge base documents from the Documents page. Supported formats: PDF, DOCX, TXT, MD.',
        tips: [
          'Organize documents by topic or project',
          'Larger documents may take longer to process',
          'You can upload multiple files at once',
        ],
      },
      {
        id: 'step-5',
        title: 'Execute Your Prompt',
        content:
          'Click "Execute" on your prompt, fill in the variable values, optionally enable RAG to search your documents, and run the AI generation.',
        tips: [
          'Start with a simple prompt to test',
          'Review the execution history',
          'Adjust model parameters for better results',
        ],
      },
    ],
  },
  {
    id: 'creating-first-prompt',
    title: 'Creating Your First Prompt',
    excerpt: 'Learn the fundamentals of prompt creation with variables and best practices',
    content: `# Creating Your First Prompt

Master the art of prompt creation with this comprehensive guide.

## Understanding Prompts
Prompts are reusable templates that generate dynamic content using AI.

## Key Concepts
- Variables: Use {{variable_name}} syntax
- Context: Provide clear instructions
- Examples: Include sample outputs`,
    category: 'prompts',
    subcategory: 'basics',
    tags: ['prompts', 'creation', 'variables', 'templates'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-14',
    views: 890,
    helpful: 87,
    rating: 4.6,
    estimatedReadTime: 8,
    type: 'tutorial',
    featured: true,
    prerequisites: ['quick-start-guide'],
    relatedArticles: ['advanced-prompting', 'prompt-variables'],
    videoUrl: 'https://example.com/video/creating-prompts',
    faqs: [
      {
        id: 'faq-1',
        question: 'What are prompt variables?',
        answer:
          'Variables are placeholders in your prompts that get replaced with actual values when executed.',
        helpful: 95,
      },
    ],
  },
  {
    id: 'advanced-prompt-engineering',
    title: 'Advanced Prompt Engineering Techniques',
    excerpt: 'Master sophisticated prompting strategies for complex AI tasks',
    content: `# Advanced Prompt Engineering Techniques

## Chain-of-Thought Prompting
Guide the AI through step-by-step reasoning to improve accuracy and transparency.

### Example:
\`\`\`
Question: What is 15% of 240?
Let me think step by step:
1. First, I need to convert 15% to a decimal: 15% = 0.15
2. Then multiply: 240 × 0.15 = 36
Therefore, 15% of 240 is 36.
\`\`\`

## Few-Shot Learning
Provide multiple examples to help the model understand patterns.

## Prompt Chaining
Break complex tasks into smaller, manageable steps.

## Context Window Optimization
Efficiently use available context space for better results.`,
    category: 'prompts',
    subcategory: 'advanced',
    tags: ['advanced', 'techniques', 'chain-of-thought', 'few-shot'],
    difficulty: 'advanced',
    lastUpdated: '2024-01-14',
    views: 756,
    helpful: 88,
    rating: 4.6,
    estimatedReadTime: 15,
    type: 'article',
    featured: false,
    prerequisites: ['quick-start-guide', 'creating-first-prompt'],
    relatedArticles: ['creating-first-prompt', 'api-integration-guide'],
  },
  {
    id: 'api-integration-guide',
    title: 'API Integration Guide',
    excerpt: 'Complete guide to integrating RAG Prompt Library with your applications',
    content: `# API Integration Guide

## Authentication
All API requests require authentication using your API key.

\`\`\`javascript
const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
};
\`\`\`

## Core Endpoints

### POST /api/prompts/execute
Execute a prompt with given parameters.

### GET /api/prompts
List all available prompts.

### POST /api/documents/upload
Upload documents to your knowledge base.

## Error Handling
Implement proper error handling for robust applications.

## Rate Limiting
Understand and respect API rate limits.`,
    category: 'api',
    subcategory: 'endpoints',
    tags: ['api', 'integration', 'authentication', 'endpoints'],
    difficulty: 'intermediate',
    lastUpdated: '2024-01-13',
    views: 1100,
    helpful: 94,
    rating: 4.8,
    estimatedReadTime: 12,
    type: 'guide',
    featured: true,
    prerequisites: ['quick-start-guide'],
    relatedArticles: ['troubleshooting-guide', 'security-best-practices'],
  },
  {
    id: 'document-upload-guide',
    title: 'Document Upload & Management Guide',
    excerpt: 'Learn how to upload, organize, and manage documents for RAG-powered prompts',
    content: `# Document Upload & Management Guide

## Overview
Upload your knowledge base documents to enable RAG (Retrieval-Augmented Generation) in your prompts. The system will automatically process, chunk, and index your documents for semantic search.

## Supported File Formats
- **PDF**: Portable Document Format (.pdf)
- **Word Documents**: Microsoft Word (.docx)
- **Text Files**: Plain text (.txt)
- **Markdown**: Markdown files (.md)

## Upload Process
1. Navigate to the Documents page from the dashboard
2. Click "Upload Documents" button
3. Select one or more files (max 10MB per file)
4. Wait for processing to complete
5. Documents are now available for RAG queries

## Document Processing
- **Chunking**: Documents are split into semantic chunks (512-1024 tokens)
- **Embedding**: Each chunk is converted to vector embeddings
- **Indexing**: Embeddings are stored for fast semantic search
- **Processing Time**: Typically 10-30 seconds per document

## Best Practices
- Use descriptive file names
- Organize documents by topic or project
- Keep documents focused on specific subjects
- Update documents when information changes
- Remove outdated documents to improve search quality`,
    category: 'documents',
    subcategory: 'upload',
    tags: ['documents', 'upload', 'rag', 'knowledge-base', 'pdf', 'processing'],
    difficulty: 'beginner',
    lastUpdated: '2025-01-15',
    views: 1100,
    helpful: 94,
    rating: 4.7,
    estimatedReadTime: 6,
    type: 'guide',
    featured: true,
    prerequisites: ['quick-start-guide'],
    relatedArticles: ['rag-execution-basics', 'troubleshooting-guide'],
    faqs: [
      {
        id: 'file-size-limit',
        question: 'What is the maximum file size for uploads?',
        answer:
          'The maximum file size is 10MB per file. For larger documents, consider splitting them into smaller files or compressing them.',
        helpful: 85,
      },
      {
        id: 'processing-time',
        question: 'How long does document processing take?',
        answer:
          'Processing typically takes 10-30 seconds per document, depending on size and complexity. You can continue working while documents process in the background.',
        helpful: 78,
      },
    ],
  },
  {
    id: 'rag-execution-basics',
    title: 'RAG-Enabled Prompt Execution',
    excerpt: 'Master RAG execution to enhance your prompts with document knowledge',
    content: `# RAG-Enabled Prompt Execution

## What is RAG?
Retrieval-Augmented Generation (RAG) combines your uploaded documents with AI generation to provide accurate, context-aware responses based on your knowledge base.

## How RAG Works
1. **Query**: Your prompt variables are used to search your documents
2. **Retrieval**: The system finds the most relevant document chunks
3. **Augmentation**: Retrieved context is added to your prompt
4. **Generation**: The AI generates a response using both the prompt and retrieved context

## Enabling RAG
1. Create or select a prompt
2. Click "Execute"
3. Toggle "Enable RAG" option
4. Select which documents to search (or search all)
5. Fill in prompt variables
6. Click "Run"

## RAG Parameters
- **Top K Results**: Number of document chunks to retrieve (default: 5)
- **Similarity Threshold**: Minimum relevance score (0-1, default: 0.7)
- **Search Mode**: Semantic, keyword, or hybrid search

## Best Practices
- Use specific, focused queries for better retrieval
- Review retrieved chunks to verify relevance
- Adjust Top K and threshold based on results
- Combine RAG with well-crafted prompts for best results`,
    category: 'executions',
    subcategory: 'running-prompts',
    tags: ['rag', 'execution', 'retrieval', 'semantic-search', 'ai', 'generation'],
    difficulty: 'intermediate',
    lastUpdated: '2025-01-15',
    views: 950,
    helpful: 91,
    rating: 4.8,
    estimatedReadTime: 8,
    type: 'guide',
    featured: true,
    prerequisites: ['quick-start-guide', 'document-upload-guide'],
    relatedArticles: ['creating-first-prompt', 'advanced-prompt-engineering'],
  },
  {
    id: 'troubleshooting-guide',
    title: 'Troubleshooting Common Issues',
    excerpt: 'Solutions to frequently encountered problems and error messages',
    content: `# Troubleshooting Common Issues

## Authentication Errors

### Error: "Invalid API Key"
**Cause**: Your API key is incorrect or expired.
**Solution**:
1. Check your API key in the dashboard settings
2. Regenerate if necessary
3. Update your environment variables

## Performance Issues

### Slow Response Times
**Causes**: Large documents, complex prompts, or network issues.
**Solutions**:
- Optimize document chunking (use smaller documents)
- Simplify prompts and reduce variable complexity
- Check network connectivity
- Try a different AI model (some are faster)

## Document Upload Problems

### Error: "File format not supported"
**Supported formats**: PDF, DOCX, TXT, MD
**Solution**: Convert your file to a supported format using online converters or document software.

### Error: "File too large"
**Cause**: File exceeds 10MB limit
**Solution**: Split large documents into smaller files or compress PDFs

## RAG Execution Issues

### No relevant results found
**Causes**: Documents not indexed, poor query, or low similarity threshold
**Solutions**:
- Verify documents are uploaded and processed
- Rephrase your query to be more specific
- Lower the similarity threshold
- Check that documents contain relevant information

## Getting Additional Help
- Check our FAQ section below
- Review the documentation
- Contact support team at support@ragpromptlibrary.com`,
    category: 'troubleshooting',
    subcategory: 'common-issues',
    tags: ['troubleshooting', 'errors', 'debugging', 'support', 'rag', 'documents'],
    difficulty: 'beginner',
    lastUpdated: '2025-01-15',
    views: 890,
    helpful: 87,
    rating: 4.4,
    estimatedReadTime: 8,
    type: 'troubleshooting',
    featured: false,
    prerequisites: [],
    relatedArticles: ['document-upload-guide', 'rag-execution-basics'],
    faqs: [
      {
        id: 'auth-error',
        question: 'Why am I getting authentication errors?',
        answer:
          'Check that you are logged in and your session has not expired. Try logging out and logging back in. If the issue persists, clear your browser cache and cookies.',
        helpful: 78,
      },
      {
        id: 'slow-performance',
        question: 'Why are my prompts running slowly?',
        answer:
          'Large documents or complex prompts can slow performance. Try optimizing your content by using smaller documents, simplifying prompts, or selecting a faster AI model.',
        helpful: 65,
      },
      {
        id: 'rag-not-working',
        question: 'Why is RAG not finding relevant information?',
        answer:
          'Ensure your documents are fully processed (check the Documents page for status). Try lowering the similarity threshold or using more specific search terms in your prompt variables.',
        helpful: 82,
      },
    ],
  },
];

// Enhanced popular searches with categories
const POPULAR_SEARCHES = [
  { query: 'How to create a prompt', category: 'prompts' },
  { query: 'Upload documents for RAG', category: 'documents' },
  { query: 'Enable RAG in prompts', category: 'executions' },
  { query: 'Variable syntax', category: 'prompts' },
  { query: 'Document processing time', category: 'documents' },
  { query: 'Troubleshooting RAG', category: 'troubleshooting' },
  { query: 'Getting started guide', category: 'getting-started' },
  { query: 'Workspace setup', category: 'getting-started' },
];

// Search suggestions for autocomplete
const SEARCH_SUGGESTIONS = [
  'create prompt',
  'upload document',
  'API key',
  'variables',
  'troubleshoot',
  'getting started',
  'tutorial',
  'guide',
  'FAQ',
  'error',
  'authentication',
  'integration',
  'best practices',
  'examples',
  'templates',
];

export const HelpCenter: React.FC = () => {
  const location = useLocation();

  // Fetch help articles from Firestore with fallback to static data
  const { data: firestoreArticles, isLoading, isError, error, refetch } = useHelpArticles();

  // Use Firestore data if available, otherwise fall back to static data.
  // Memoize based on length to avoid infinite re-renders when data array identity changes across renders (e.g., in tests).
  const helpArticles = useMemo(
    () => (firestoreArticles && firestoreArticles.length > 0 ? firestoreArticles : HELP_ARTICLES),
    [firestoreArticles?.length]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>(helpArticles);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    difficulty: [],
    type: [],
    category: [],
    tags: [],
    dateRange: 'all',
    sortBy: 'relevance',
  });
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
    { label: 'Help Center', current: true },
  ]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Analytics and feedback state
  const [analytics, setAnalytics] = useState({
    sessionStartTime: Date.now(),
    searchQueries: [] as string[],
    articlesViewed: [] as string[],
    categoriesExplored: [] as string[],
    feedbackSubmitted: [] as { articleId: string; helpful: boolean; timestamp: number }[],
  });

  // Enhanced filtering with multiple criteria
  useEffect(() => {
    let filtered = helpArticles;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((article) => article.category === selectedCategory);
    }

    // Subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter((article) => article.subcategory === selectedSubcategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.excerpt?.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Advanced filters
    if (filters.difficulty.length > 0) {
      filtered = filtered.filter((article) => filters.difficulty.includes(article.difficulty));
    }

    if (filters.type.length > 0) {
      filtered = filtered.filter((article) => filters.type.includes(article.type));
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter((article) =>
        filters.tags.some((tag) => article.tags.includes(tag))
      );
    }

    // Sort results
    switch (filters.sortBy) {
      case 'date':
        filtered.sort(
          (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
        break;
      case 'popularity':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default: // relevance
        if (searchQuery.trim()) {
          // Simple relevance scoring based on title match
          filtered.sort((a, b) => {
            const aScore = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;
            const bScore = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;
            return bScore - aScore;
          });
        }
    }

    setFilteredArticles(filtered);
  }, [searchQuery, selectedCategory, selectedSubcategory, filters, helpArticles]);

  // Search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const suggestions = SEARCH_SUGGESTIONS.filter((suggestion) =>
        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Analytics tracking functions - MUST be defined before handlers that use them
  const trackEvent = useCallback((eventType: string, data: Record<string, unknown>) => {
    // In a real application, this would send data to an analytics service
    console.log('Analytics Event:', eventType, data);

    // Update local analytics state for demo purposes
    setAnalytics((prev) => {
      switch (eventType) {
        case 'search':
          return {
            ...prev,
            searchQueries: [...prev.searchQueries, data.query],
          };
        case 'article_view':
          return {
            ...prev,
            articlesViewed: [...prev.articlesViewed, data.articleId],
          };
        case 'category_explore':
          return {
            ...prev,
            categoriesExplored: [...prev.categoriesExplored, data.categoryId],
          };
        case 'feedback':
          return {
            ...prev,
            feedbackSubmitted: [
              ...prev.feedbackSubmitted,
              {
                articleId: data.articleId,
                helpful: data.helpful,
                timestamp: Date.now(),
              },
            ],
          };
        default:
          return prev;
      }
    });
  }, []);

  const trackSearchPerformance = useCallback(
    (query: string, resultCount: number) => {
      trackEvent('search_performance', {
        query,
        resultCount,
        timestamp: Date.now(),
        sessionDuration: Date.now() - analytics.sessionStartTime,
      });
    },
    [analytics.sessionStartTime, trackEvent]
  );

  const trackUserEngagement = useCallback(
    (action: string, context: Record<string, unknown>) => {
      trackEvent('user_engagement', {
        action,
        context,
        timestamp: Date.now(),
        sessionDuration: Date.now() - analytics.sessionStartTime,
      });
    },
    [analytics.sessionStartTime, trackEvent]
  );

  // Enhanced handlers
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedArticle(null);
      setShowSuggestions(false);

      // Track search analytics
      trackEvent('search', { query });

      // Track search performance after filtering
      setTimeout(() => {
        const results = helpArticles.filter(
          (article) =>
            article.title.toLowerCase().includes(query.toLowerCase()) ||
            article.content.toLowerCase().includes(query.toLowerCase()) ||
            article.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
        );
        trackSearchPerformance(query, results.length);
      }, 100);

      updateBreadcrumbs([
        { label: 'Help Center', current: false },
        { label: `Search: "${query}"`, current: true },
      ]);
    },
    [trackEvent, trackSearchPerformance, helpArticles]
  );

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      const category = HELP_CATEGORIES.find((cat) => cat.id === categoryId);
      setSelectedCategory(categoryId);
      setSelectedSubcategory(null);
      setSearchQuery('');
      setSelectedArticle(null);

      // Track category exploration
      trackEvent('category_explore', { categoryId, categoryName: category?.name });
      trackUserEngagement('category_select', { categoryId, categoryName: category?.name });

      updateBreadcrumbs([
        { label: 'Help Center', current: false },
        { label: category?.name || categoryId, current: true },
      ]);
    },
    [trackEvent, trackUserEngagement]
  );

  const handleSubcategorySelect = useCallback(
    (subcategoryId: string) => {
      const category = HELP_CATEGORIES.find((cat) => cat.id === selectedCategory);
      const subcategory = category?.subcategories?.find((sub) => sub.id === subcategoryId);
      setSelectedSubcategory(subcategoryId);
      setSelectedArticle(null);
      updateBreadcrumbs([
        { label: 'Help Center', current: false },
        { label: category?.name || '', current: false },
        { label: subcategory?.name || subcategoryId, current: true },
      ]);
    },
    [selectedCategory]
  );

  const handleArticleSelect = useCallback(
    (article: HelpArticle) => {
      setSelectedArticle(article);
      // Track article view (in real app, this would be an API call)
      article.views += 1;

      // Track article view analytics
      trackEvent('article_view', {
        articleId: article.id,
        articleTitle: article.title,
        category: article.category,
        subcategory: article.subcategory,
        type: article.type,
        difficulty: article.difficulty,
      });
      trackUserEngagement('article_open', {
        articleId: article.id,
        fromSearch: !!searchQuery,
        fromCategory: !!selectedCategory,
      });

      const category = HELP_CATEGORIES.find((cat) => cat.id === article.category);
      const subcategory = category?.subcategories?.find((sub) => sub.id === article.subcategory);

      const breadcrumbPath = [
        { label: 'Help Center', current: false },
        { label: category?.name || article.category, current: false },
      ];

      if (subcategory) {
        breadcrumbPath.push({ label: subcategory.name, current: false });
      }

      breadcrumbPath.push({ label: article.title, current: true });
      updateBreadcrumbs(breadcrumbPath);
    },
    [searchQuery, selectedCategory, trackEvent, trackUserEngagement]
  );

  const updateBreadcrumbs = (newBreadcrumbs: Breadcrumb[]) => {
    setBreadcrumbs(newBreadcrumbs);
  };

  const resetFilters = () => {
    setFilters({
      difficulty: [],
      type: [],
      category: [],
      tags: [],
      dateRange: 'all',
      sortBy: 'relevance',
    });
  };

  // Handle hash-based navigation from HelpPanel shortcuts
  // This must be after all function definitions to avoid TDZ errors
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      // Check if hash matches a category ID
      const category = HELP_CATEGORIES.find((cat) => cat.id === hash);
      if (category) {
        handleCategorySelect(hash);
      }
    }
  }, [location.hash, handleCategorySelect]);

  if (selectedArticle) {
    return (
      <EnhancedArticleView
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
        breadcrumbs={breadcrumbs}
        onFeedback={(articleId: string, helpful: boolean) => {
          trackEvent('feedback', { articleId, helpful });
          trackUserEngagement('feedback_submit', { articleId, helpful });
        }}
      />
    );
  }

  // Loading or error states (after all hooks to preserve hook order)
  if (isLoading) {
    return <HelpCenterSkeleton />;
  }
  if (isError && (!firestoreArticles || firestoreArticles.length === 0)) {
    return <HelpCenterError error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Breadcrumbs */}
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} />

      {/* Header */}
      <header className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Help Center</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
          Find answers to your questions, learn new features, and get the most out of RAG Prompt
          Library
        </p>
      </header>

      {/* Enhanced Search Bar with Accessibility and Mobile Optimization */}
      <div className="relative mb-6 sm:mb-8" role="search">
        <label htmlFor="help-search" className="sr-only">
          Search help articles
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <input
          id="help-search"
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim()) {
              setShowSuggestions(true);
            }
          }}
          onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              handleSearch(searchQuery);
            }
            if (e.key === 'Escape') {
              setShowSuggestions(false);
              searchInputRef.current?.blur();
            }
          }}
          placeholder="Search for help articles, tutorials, and guides..."
          className="block w-full pl-10 pr-12 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
          aria-describedby={showSuggestions ? 'search-suggestions' : undefined}
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          autoComplete="off"
        />

        {/* Accessible search suggestions dropdown */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div
            id="search-suggestions"
            className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
            aria-label="Search suggestions"
          >
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSearch(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-accent focus:bg-accent focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors"
                role="option"
                aria-selected="false"
                tabIndex={0}
              >
                <div className="flex items-center">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-foreground text-sm sm:text-base">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Advanced filters toggle with accessibility */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
          aria-label={showFilters ? 'Hide advanced filters' : 'Show advanced filters'}
          aria-expanded={showFilters}
          aria-controls="advanced-filters"
        >
          <AdjustmentsHorizontalIcon
            className={`h-6 w-6 transition-colors ${
              showFilters ? 'text-primary' : 'text-muted-foreground'
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <AdvancedFiltersPanel
          filters={filters}
          setFilters={setFilters}
          onReset={resetFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Popular Searches and Quick Actions */}
      {!searchQuery && !selectedCategory && (
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Popular Searches */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-foreground mb-3">Popular searches:</h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search.query)}
                    className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-full hover:bg-accent transition-colors flex items-center"
                  >
                    <span>{search.query}</span>
                    {search.category && (
                      <span className="ml-1 text-xs text-muted-foreground/70">
                        in {HELP_CATEGORIES.find((cat) => cat.id === search.category)?.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-foreground mb-3">Quick actions:</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCategorySelect('getting-started')}
                  className="p-3 text-left bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <BookOpenIcon className="h-6 w-6 text-primary mb-1" />
                  <div className="text-sm font-medium text-foreground">Getting Started</div>
                  <div className="text-xs text-muted-foreground">New to the platform?</div>
                </button>
                <button
                  onClick={() => handleCategorySelect('tutorials')}
                  className="p-3 text-left bg-accent border border-border rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <VideoCameraIcon className="h-6 w-6 text-primary mb-1" />
                  <div className="text-sm font-medium text-foreground">Video Tutorials</div>
                  <div className="text-xs text-muted-foreground">Learn by watching</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Articles */}
      {!searchQuery && !selectedCategory && (
        <FeaturedArticlesSection
          articles={helpArticles.filter((a) => a.featured)}
          onArticleSelect={handleArticleSelect}
        />
      )}

      {/* Main content area with improved mobile layout */}
      <main id="main-content" className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {/* Enhanced Categories Sidebar with Mobile Optimization */}
        <aside className="lg:col-span-1 order-2 lg:order-1" aria-label="Help categories">
          {/* Mobile category toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              aria-expanded={showFilters}
              aria-controls="mobile-categories"
            >
              <span className="font-medium text-foreground">Browse Categories</span>
              <ChevronDownIcon
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            id="mobile-categories"
            className={`${showFilters || 'lg:block'} ${showFilters ? 'block' : 'hidden lg:block'}`}
          >
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <nav role="navigation" aria-label="Help categories">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  setSearchQuery('');
                  updateBreadcrumbs([{ label: 'Help Center', current: true }]);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                  !selectedCategory
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'hover:bg-accent'
                }`}
                aria-current={!selectedCategory ? 'page' : undefined}
              >
                All Articles ({helpArticles.length})
              </button>
              {HELP_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <div key={category.id}>
                    <button
                      onClick={() => handleCategorySelect(category.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                        isSelected
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'hover:bg-accent'
                      }`}
                      aria-current={isSelected ? 'page' : undefined}
                      aria-expanded={
                        isSelected && category.subcategories && category.subcategories.length > 0
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <IconComponent className="h-6 w-6 mr-3" />
                          <div className="flex flex-col gap-1">
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {category.articleCount} articles
                            </div>
                          </div>
                        </div>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <ChevronDownIcon
                            className={`h-5 w-5 transition-transform ${
                              isSelected ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </div>
                    </button>

                    {/* Subcategories */}
                    {isSelected && category.subcategories && category.subcategories.length > 0 && (
                      <div className="ml-4 mt-2">
                        {category.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubcategorySelect(subcategory.id);
                            }}
                            className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                              selectedSubcategory === subcategory.id
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted-foreground hover:bg-accent'
                            }`}
                          >
                            <div className="font-medium">{subcategory.name}</div>
                            <div className="text-xs text-muted-foreground/70">
                              {subcategory.articleCount} articles
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Enhanced Articles List with Mobile Optimization */}
        <section className="lg:col-span-3 order-1 lg:order-2" aria-label="Help articles">
          {/* Search Results Header */}
          {searchQuery && (
            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-foreground font-medium">
                    Found {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''}{' '}
                    for "{searchQuery}"
                  </p>
                  {filteredArticles.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Sorted by {filters.sortBy === 'relevance' ? 'relevance' : filters.sortBy}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  Clear search
                </button>
              </div>
            </div>
          )}

          {/* Category/Subcategory Header */}
          {(selectedCategory || selectedSubcategory) && !searchQuery && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedSubcategory
                      ? HELP_CATEGORIES.find(
                          (cat) => cat.id === selectedCategory
                        )?.subcategories?.find((sub) => sub.id === selectedSubcategory)?.name
                      : HELP_CATEGORIES.find((cat) => cat.id === selectedCategory)?.name}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {selectedSubcategory
                      ? HELP_CATEGORIES.find(
                          (cat) => cat.id === selectedCategory
                        )?.subcategories?.find((sub) => sub.id === selectedSubcategory)?.description
                      : HELP_CATEGORIES.find((cat) => cat.id === selectedCategory)?.description}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {filteredArticles.length} articles
                </span>
              </div>
            </div>
          )}

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((article) => (
              <EnhancedArticleCard
                key={article.id}
                article={article}
                onSelect={handleArticleSelect}
                searchQuery={searchQuery}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredArticles.length === 0 && (
            <EmptyState
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              onClearSearch={() => setSearchQuery('')}
              onResetFilters={resetFilters}
            />
          )}

          {/* Load More (for future pagination) */}
          {filteredArticles.length > 0 && filteredArticles.length >= 10 && (
            <div className="text-center mt-8">
              <button className="px-6 py-2 border border-input rounded-md text-foreground hover:bg-accent transition-colors">
                Load more articles
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'advanced':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-muted text-foreground border border-border';
  }
}

// Enhanced Rich Content Components

// Breadcrumb Navigation Component
const BreadcrumbNavigation: React.FC<{ breadcrumbs: Breadcrumb[] }> = ({ breadcrumbs }) => {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRightIcon className="h-5 w-5 text-muted-foreground mx-2" />}
            {breadcrumb.current ? (
              <span className="text-muted-foreground text-sm">{breadcrumb.label}</span>
            ) : (
              <button
                onClick={() => {
                  // Navigate back to previous level
                  if (index === 0) {
                    window.location.reload(); // Reset to home
                  }
                }}
                className="text-primary hover:text-primary/80 text-sm"
              >
                {breadcrumb.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Advanced Filters Panel Component
const AdvancedFiltersPanel: React.FC<{
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  onReset: () => void;
  onClose: () => void;
}> = ({ filters, setFilters, onReset, onClose }) => {
  const updateFilter = (key: keyof SearchFilters, value: string | string[] | boolean) => {
    setFilters({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'difficulty' | 'type' | 'category' | 'tags', value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  return (
    <div className="bg-muted border border-border rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="text-sm text-muted-foreground hover:text-foreground">
            Reset
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Difficulty Filter */}
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-foreground mb-2">Difficulty</label>
          <div className="flex flex-col gap-2">
            {['beginner', 'intermediate', 'advanced'].map((difficulty) => (
              <label key={difficulty} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.difficulty.includes(difficulty)}
                  onChange={() => toggleArrayFilter('difficulty', difficulty)}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <span className="ml-2 text-sm text-foreground capitalize">{difficulty}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Content Type Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Content Type</label>
          <div>
            {['article', 'tutorial', 'video', 'guide', 'faq', 'troubleshooting'].map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.type.includes(type)}
                  onChange={() => toggleArrayFilter('type', type)}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <span className="ml-2 text-sm text-foreground capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-ring"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Most Recent</option>
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Updated</label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            className="block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-ring"
          >
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="quarter">Past 3 Months</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Featured Articles Section Component
const FeaturedArticlesSection: React.FC<{
  articles: HelpArticle[];
  onArticleSelect: (article: HelpArticle) => void;
}> = ({ articles, onArticleSelect }) => {
  if (articles.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">Featured Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 6).map((article) => (
          <div
            key={article.id}
            onClick={() => onArticleSelect(article)}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                {getTypeIcon(article.type)}
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs ${getDifficultyColor(
                    article.difficulty
                  )}`}
                >
                  {article.difficulty}
                </span>
              </div>
              {article.rating && (
                <div className="flex items-center">
                  <StarIconSolid className="h-4 w-4 text-primary" />
                  <span className="ml-1 text-sm text-muted-foreground">{article.rating}</span>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>

            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {article.excerpt || article.content.substring(0, 120) + '...'}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {article.estimatedReadTime}m read
                </span>
                <span className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {article.views}
                </span>
              </div>
              <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Article View Component with Rich Content and Analytics
const EnhancedArticleView: React.FC<{
  article: HelpArticle;
  onBack: () => void;
  breadcrumbs: Breadcrumb[];
  onFeedback?: (articleId: string, helpful: boolean) => void;
}> = ({ article, onBack, breadcrumbs, onFeedback }) => {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleFeedback = (helpful: boolean) => {
    setIsHelpful(helpful);
    setFeedbackSubmitted(true);

    // Track feedback
    if (onFeedback) {
      onFeedback(article.id, helpful);
    }

    // Update article helpful percentage (in real app, this would be an API call)
    if (helpful) {
      article.helpful = Math.min(100, article.helpful + 1);
    }
  };
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Breadcrumbs */}
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} />

      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-primary hover:text-primary/80 flex items-center"
      >
        ← Back to Help Center
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents (for longer articles) */}
        {article.steps && article.steps.length > 0 && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Table of Contents</h3>
              <nav>
                {article.steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className={`block w-full text-left text-sm px-3 py-2 rounded ${
                      currentStep === index
                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {index + 1}. {step.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className={`${
            article.steps && article.steps.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'
          }`}
        >
          <article className="bg-card rounded-lg border border-border p-8">
            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center mb-4">
                {getTypeIcon(article.type)}
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs ${getDifficultyColor(
                    article.difficulty
                  )}`}
                >
                  {article.difficulty}
                </span>
                {article.featured && (
                  <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-4">{article.title}</h1>

              {article.excerpt && (
                <p className="text-lg text-muted-foreground mb-4">{article.excerpt}</p>
              )}

              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                <span className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {article.estimatedReadTime} min read
                </span>
                <span className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {article.views} views
                </span>
                {article.rating && (
                  <span className="flex items-center">
                    <StarIconSolid className="h-4 w-4 text-primary mr-1" />
                    {article.rating} rating
                  </span>
                )}
                <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
              </div>

              {/* Prerequisites */}
              {article.prerequisites && article.prerequisites.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-primary mb-2">Prerequisites</h4>
                  <ul className="text-sm text-foreground">
                    {article.prerequisites.map((prereq, index) => (
                      <li key={index}>• {prereq}</li>
                    ))}
                  </ul>
                </div>
              )}
            </header>

            {/* Video Content */}
            {article.videoUrl && (
              <div className="mb-8">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PlayIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Video content would be embedded here</p>
                    <p className="text-sm text-muted-foreground mt-2">{article.videoUrl}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step-by-Step Content */}
            {article.steps && article.steps.length > 0 ? (
              <StepByStepGuide
                steps={article.steps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />
            ) : (
              /* Regular Content */
              <div className="prose max-w-none mb-8">
                <div className="whitespace-pre-wrap">{article.content}</div>
              </div>
            )}

            {/* FAQ Section */}
            {article.faqs && article.faqs.length > 0 && (
              <FAQSection faqs={article.faqs} expandedFAQ={expandedFAQ} toggleFAQ={toggleFAQ} />
            )}
          </article>

          {/* Related Articles */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <RelatedArticlesSection
              relatedIds={article.relatedArticles}
              currentArticleId={article.id}
              allArticles={helpArticles}
            />
          )}

          {/* Enhanced Feedback Section with Analytics */}
          <FeedbackSection
            article={article}
            isHelpful={isHelpful}
            onHelpfulVote={handleFeedback}
            feedbackSubmitted={feedbackSubmitted}
          />
        </div>
      </div>
    </div>
  );
};

// Step-by-Step Guide Component
const StepByStepGuide: React.FC<{
  steps: ArticleStep[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
}> = ({ steps, currentStep, setCurrentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="p-2 rounded-md border border-input disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
          <button
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1}
            className="p-2 rounded-md border border-input disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-muted/50 rounded-lg p-6">
        <div className="prose max-w-none mb-4">
          <div className="whitespace-pre-wrap">{steps[currentStep].content}</div>
        </div>

        {/* Code Block */}
        {steps[currentStep].code && (
          <div className="mb-4">
            <pre className="bg-foreground text-background p-4 rounded-lg overflow-x-auto">
              <code>{steps[currentStep].code}</code>
            </pre>
          </div>
        )}

        {/* Tips */}
        {steps[currentStep].tips && steps[currentStep].tips!.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2 flex items-center">
              <LightBulbIcon className="h-5 w-5 mr-2 text-primary" />
              Tips
            </h4>
            <ul className="text-sm text-muted-foreground">
              {steps[currentStep].tips!.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center px-4 py-2 border border-input rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-2" />
          Previous
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
        >
          Next
          <ChevronRightIcon className="h-5 w-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

// FAQ Section Component
const FAQSection: React.FC<{
  faqs: FAQ[];
  expandedFAQ: string | null;
  toggleFAQ: (faqId: string) => void;
}> = ({ faqs, expandedFAQ, toggleFAQ }) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
      <div>
        {faqs.map((faq) => (
          <div key={faq.id} className="border border-border rounded-lg">
            <button
              onClick={() => toggleFAQ(faq.id)}
              className="w-full text-left p-4 hover:bg-accent flex items-center justify-between"
            >
              <span className="font-medium text-foreground">{faq.question}</span>
              <ChevronDownIcon
                className={`h-6 w-6 text-muted-foreground transition-transform ${
                  expandedFAQ === faq.id ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedFAQ === faq.id && (
              <div className="px-4 pb-4">
                <div className="text-muted-foreground mb-3">{faq.answer}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Was this helpful?</span>
                  <button className="ml-2 text-primary hover:text-primary/80">
                    👍 {faq.helpful}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Related Articles Section Component
const RelatedArticlesSection: React.FC<{
  relatedIds: string[];
  currentArticleId: string;
  allArticles: HelpArticle[];
}> = ({ relatedIds, currentArticleId, allArticles }) => {
  const relatedArticles = allArticles.filter(
    (article) => relatedIds.includes(article.id) && article.id !== currentArticleId
  );

  if (relatedArticles.length === 0) return null;

  return (
    <div className="mt-8 bg-muted/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Related Articles</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedArticles.map((article) => (
          <div
            key={article.id}
            className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-2">
              {getTypeIcon(article.type)}
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${getDifficultyColor(
                  article.difficulty
                )}`}
              >
                {article.difficulty}
              </span>
            </div>
            <h4 className="font-medium text-foreground mb-2">{article.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.excerpt || article.content.substring(0, 100) + '...'}
            </p>
            <div className="flex items-center mt-3 text-xs text-muted-foreground">
              <ClockIcon className="h-4 w-4 mr-1" />
              {article.estimatedReadTime}m read
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Feedback Section Component with Analytics
const FeedbackSection: React.FC<{
  article: HelpArticle;
  isHelpful: boolean | null;
  onHelpfulVote: (helpful: boolean) => void;
}> = ({ article, isHelpful, onHelpfulVote }) => {
  return (
    <div className="mt-8 bg-muted/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Was this article helpful?</h3>
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => onHelpfulVote(true)}
          className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
            isHelpful === true
              ? 'bg-green-100 border-green-200 text-green-800'
              : 'border-input text-foreground hover:bg-accent'
          }`}
        >
          <HandThumbUpIcon className="h-5 w-5 mr-2" />
          Yes ({article.helpful})
        </button>
        <button
          onClick={() => onHelpfulVote(false)}
          className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
            isHelpful === false
              ? 'bg-red-100 border-red-200 text-red-800'
              : 'border-input text-foreground hover:bg-accent'
          }`}
        >
          <HandThumbDownIcon className="h-5 w-5 mr-2" />
          No
        </button>
      </div>

      {isHelpful !== null && (
        <div className={`text-sm ${isHelpful ? 'text-green-700' : 'text-red-700'}`}>
          {isHelpful
            ? '✓ Thank you for your feedback!'
            : "✗ We're sorry this wasn't helpful. Please let us know how we can improve."}
        </div>
      )}
    </div>
  );
};

// Utility Functions
const getTypeIcon = (type: string) => {
  const iconClass = 'h-5 w-5';
  switch (type) {
    case 'video':
      return <VideoCameraIcon className={`${iconClass} text-destructive`} />;
    case 'tutorial':
      return <AcademicCapIcon className={`${iconClass} text-primary`} />;
    case 'guide':
      return <BookOpenIcon className={`${iconClass} text-primary`} />;
    case 'faq':
      return <QuestionMarkCircleIcon className={`${iconClass} text-primary`} />;
    case 'troubleshooting':
      return <ExclamationTriangleIcon className={`${iconClass} text-destructive`} />;
    default:
      return <DocumentTextIcon className={`${iconClass} text-muted-foreground`} />;
  }
};

// duplicate helper removed (already defined above)

// Enhanced Article Card Component
const EnhancedArticleCard: React.FC<{
  article: HelpArticle;
  onSelect: (article: HelpArticle) => void;
  searchQuery?: string;
}> = ({ article, onSelect, searchQuery }) => {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-primary/20">$1</mark>');
  };

  return (
    <article
      onClick={() => onSelect(article)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(article);
        }
      }}
      className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer group"
      tabIndex={0}
      role="button"
      aria-label={`Read article: ${article.title}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-grow">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {getTypeIcon(article.type)}
            <span
              className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(article.difficulty)}`}
            >
              {article.difficulty}
            </span>
            {article.featured && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                Featured
              </span>
            )}
            {article.videoUrl && (
              <span className="px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs flex items-center">
                <PlayIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                Video
              </span>
            )}
          </div>

          <h3
            className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors"
            dangerouslySetInnerHTML={{
              __html: searchQuery ? highlightText(article.title, searchQuery) : article.title,
            }}
          />

          <p className="text-muted-foreground mb-4 line-clamp-2">
            {article.excerpt || article.content.substring(0, 150) + '...'}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                <span className="sr-only">Estimated read time:</span>
                {article.estimatedReadTime}m read
              </span>
              <span className="flex items-center">
                <EyeIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                <span className="sr-only">Views:</span>
                {article.views} views
              </span>
              {article.rating && (
                <span className="flex items-center">
                  <StarIconSolid className="h-4 w-4 text-primary mr-1" aria-hidden="true" />
                  <span className="sr-only">Rating:</span>
                  {article.rating}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="sr-only">Last updated:</span>
              Updated {new Date(article.lastUpdated).toLocaleDateString()}
            </span>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {article.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {article.tags.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{article.tags.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  searchQuery?: string;
  selectedCategory?: string | null;
  onClearSearch: () => void;
  onResetFilters: () => void;
}> = ({ searchQuery, selectedCategory, onClearSearch, onResetFilters }) => {
  return (
    <div className="text-center py-12">
      <QuestionMarkCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No articles found</h3>

      {searchQuery ? (
        <div>
          <p className="text-muted-foreground mb-4">
            No articles match your search for "{searchQuery}"
          </p>
          <div className="gap-3">
            <button onClick={onClearSearch} className="text-primary hover:text-primary/80">
              Clear search
            </button>
            <button onClick={onResetFilters} className="text-primary hover:text-primary/80">
              Reset filters
            </button>
          </div>
        </div>
      ) : selectedCategory ? (
        <div>
          <p className="text-muted-foreground mb-4">No articles available in this category yet</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:text-primary/80"
          >
            Browse all articles
          </button>
        </div>
      ) : (
        <div>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or browse by category
          </p>
          <button onClick={onResetFilters} className="text-primary hover:text-primary/80">
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default HelpCenter;
