/**
 * Hybrid Search Types and Interfaces
 */

export type SearchType = 'semantic' | 'keyword' | 'hybrid';

export interface HybridSearchOptions {
  searchType: SearchType;
  alpha?: number; // Weight for semantic vs keyword (0-1)
  enableSpellCorrection?: boolean;
  enableQueryExpansion?: boolean;
  useAdaptiveFusion?: boolean;
  fusionAlgorithm?: 'rrf' | 'combsum' | 'borda' | 'adaptive';
  maxResults?: number;
}

export interface SearchMetrics {
  totalTime: number;
  semanticTime: number;
  keywordTime: number;
  fusionTime: number;
  enhancementTime: number;
  totalResults: number;
  semanticResults: number;
  keywordResults: number;
  fusionAlgorithm: string;
  queryEnhanced: boolean;
}

export interface QueryEnhancement {
  originalQuery: string;
  correctedQuery: string;
  intent: string;
  intentConfidence: number;
  expansionScore: number;
  correctionsMade: Record<string, string>;
  synonymsAdded: string[];
  processingTime: number;
}

export interface HybridSearchResult {
  documentId: string;
  content: string;
  score: number;
  semanticScore: number;
  keywordScore: number;
  fusedScore: number;
  metadata: Record<string, any>;
  searchMethods: string[];
  highlights: string[];
  confidence: number;
  rank: number;
  searchType: string;
}

export interface HybridSearchResponse {
  success: boolean;
  results: HybridSearchResult[];
  queryInfo: {
    originalQuery: string;
    searchType: string;
    enhanced: boolean;
    correctedQuery?: string;
    intent?: string;
    intentConfidence?: number;
    expansionScore?: number;
  };
  metrics: SearchMetrics;
  enhancement?: QueryEnhancement;
  totalResults: number;
  fusionAlgorithm: string;
  error?: string;
}

export interface SearchTypeConfig {
  label: string;
  description: string;
  icon: string;
  color: string;
  recommended?: boolean;
}

export const SEARCH_TYPE_CONFIGS: Record<SearchType, SearchTypeConfig> = {
  semantic: {
    label: 'Semantic',
    description: 'AI-powered contextual search',
    icon: '🧠',
    color: 'blue',
  },
  keyword: {
    label: 'Keyword',
    description: 'Traditional keyword matching',
    icon: '🔍',
    color: 'green',
  },
  hybrid: {
    label: 'Hybrid',
    description: 'Best of both semantic and keyword',
    icon: '⚡',
    color: 'purple',
    recommended: true,
  },
};

export interface SearchPerformanceMetrics {
  averageResponseTime: number;
  totalSearches: number;
  searchTypeDistribution: Record<SearchType, number>;
  averageResultsCount: number;
  cacheHitRate: number;
  errorRate: number;
  topQueries: Array<{
    query: string;
    count: number;
    avgResponseTime: number;
  }>;
}

export interface SearchAnalytics {
  performance: SearchPerformanceMetrics;
  queryPatterns: {
    intentDistribution: Record<string, number>;
    averageQueryLength: number;
    commonTerms: string[];
    spellingCorrections: number;
    queryExpansions: number;
  };
  resultQuality: {
    averageRelevanceScore: number;
    clickThroughRate: number;
    userSatisfactionScore: number;
  };
}

export interface SearchSuggestion {
  query: string;
  type: 'completion' | 'correction' | 'related';
  confidence: number;
  metadata?: Record<string, any>;
}

export interface SearchHistory {
  id: string;
  query: string;
  searchType: SearchType;
  timestamp: Date;
  resultsCount: number;
  responseTime: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'range';
  value: any;
  label?: string;
}

export interface AdvancedSearchOptions extends HybridSearchOptions {
  filters?: SearchFilter[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  fileTypes?: string[];
  minRelevanceScore?: number;
  includeMetadata?: boolean;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Event types for search analytics
export interface SearchEvent {
  type: 'search_performed' | 'result_clicked' | 'query_modified' | 'filter_applied';
  timestamp: Date;
  data: Record<string, any>;
  sessionId: string;
  userId?: string;
}

// Search state management
export interface SearchState {
  query: string;
  searchType: SearchType;
  options: HybridSearchOptions;
  results: HybridSearchResult[];
  isLoading: boolean;
  error: string | null;
  metrics: SearchMetrics | null;
  history: SearchHistory[];
  suggestions: SearchSuggestion[];
  analytics: SearchAnalytics | null;
}

export interface SearchAction {
  type: 'SET_QUERY' | 'SET_SEARCH_TYPE' | 'SET_OPTIONS' | 'SET_RESULTS' | 
        'SET_LOADING' | 'SET_ERROR' | 'ADD_TO_HISTORY' | 'SET_SUGGESTIONS' |
        'SET_ANALYTICS' | 'CLEAR_RESULTS' | 'RESET_STATE';
  payload?: any;
}

// Utility types
export type SearchResultWithActions = HybridSearchResult & {
  onSelect?: () => void;
  onPreview?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
};

export type SearchConfigPreset = {
  name: string;
  description: string;
  options: HybridSearchOptions;
  recommended?: boolean;
};

export const DEFAULT_SEARCH_PRESETS: SearchConfigPreset[] = [
  {
    name: 'Balanced',
    description: 'Optimal balance of semantic and keyword search',
    options: {
      searchType: 'hybrid',
      alpha: 0.7,
      enableSpellCorrection: true,
      enableQueryExpansion: true,
      useAdaptiveFusion: true,
      fusionAlgorithm: 'adaptive',
      maxResults: 10,
    },
    recommended: true,
  },
  {
    name: 'Semantic Focus',
    description: 'Prioritize contextual understanding',
    options: {
      searchType: 'hybrid',
      alpha: 0.9,
      enableSpellCorrection: true,
      enableQueryExpansion: true,
      useAdaptiveFusion: true,
      fusionAlgorithm: 'rrf',
      maxResults: 10,
    },
  },
  {
    name: 'Keyword Focus',
    description: 'Prioritize exact term matching',
    options: {
      searchType: 'hybrid',
      alpha: 0.3,
      enableSpellCorrection: true,
      enableQueryExpansion: false,
      useAdaptiveFusion: false,
      fusionAlgorithm: 'combsum',
      maxResults: 15,
    },
  },
  {
    name: 'Fast Search',
    description: 'Quick results with minimal processing',
    options: {
      searchType: 'keyword',
      enableSpellCorrection: false,
      enableQueryExpansion: false,
      maxResults: 20,
    },
  },
];
