import React, { useState, useCallback } from 'react';
import { Search, Filter, FileText, Clock, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { aiService, type SearchResponse as AISearchResponse, type SearchResult as AISearchResult } from '@/services/aiService';
import { SearchTypeSelector } from './SearchTypeSelector';
import { SearchType, HybridSearchOptions, DEFAULT_SEARCH_PRESETS, SEARCH_TYPE_CONFIGS } from '@/types/hybridSearch';

// Use types from AI service
type SearchResult = AISearchResult;
type SearchResponse = AISearchResponse;

interface DocumentSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  onSearchPerformed?: (query: string, results: SearchResult[]) => void;
  className?: string;
  enableAutoComplete?: boolean;
  enableQuerySuggestions?: boolean;
  showSearchAnalytics?: boolean;
  maxResults?: number;
  enableRealTimeSearch?: boolean;
  searchDebounceMs?: number;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({
  onResultSelect,
  onSearchPerformed,
  className = '',
  enableAutoComplete = true,
  enableQuerySuggestions = true,
  showSearchAnalytics = true,
  maxResults = 20,
  enableRealTimeSearch = false,
  searchDebounceMs = 300
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('hybrid');
  const [hybridOptions, setHybridOptions] = useState<HybridSearchOptions>(DEFAULT_SEARCH_PRESETS[0].options);
  const [topK, setTopK] = useState(10);
  const [searchMetadata, setSearchMetadata] = useState<SearchResponse['metadata'] | null>(null);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [isCached, setIsCached] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const { toast } = useToast();

  const performSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);

    try {
      const response = await aiService.searchDocuments({
        query: query.trim(),
        search_type: searchType,
        top_k: Math.min(hybridOptions.maxResults || topK, maxResults),
        use_cache: true,
        // Add hybrid search options
        hybrid_options: searchType === 'hybrid' ? {
          alpha: hybridOptions.alpha,
          enable_spell_correction: hybridOptions.enableSpellCorrection,
          enable_query_expansion: hybridOptions.enableQueryExpansion,
          use_adaptive_fusion: hybridOptions.useAdaptiveFusion,
          fusion_algorithm: hybridOptions.fusionAlgorithm
        } : undefined
      });

      if (!response.success) {
        throw new Error(response.error || 'Search failed');
      }

      setResults(response.results);
      setSearchMetadata(response.metadata);
      setSearchTime(response.search_time);
      setIsCached(response.cached);

      // Call onSearchPerformed callback
      onSearchPerformed?.(query.trim(), response.results);

      if (response.results.length === 0) {
        toast({
          title: 'No results found',
          description: 'Try adjusting your search terms or using different keywords',
        });
      }

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'An error occurred during search',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [query, searchType, topK, maxResults, onSearchPerformed]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  const formatSearchTime = (time: number) => {
    return time < 1 ? `${(time * 1000).toFixed(0)}ms` : `${time.toFixed(2)}s`;
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const queryTerms = query.toLowerCase().split(/\s+/);
    let highlightedText = text;

    queryTerms.forEach(term => {
      if (term.length > 2) {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
      }
    });

    return highlightedText;
  };

  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Document Search
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search your documents..."
              className="flex-1"
            />
            <Button
              onClick={performSearch}
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Options */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Type:</span>
                  <Select value={searchType} onValueChange={(value: SearchType) => setSearchType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">
                        <div className="flex items-center gap-2">
                          <span>⚡</span>
                          Hybrid
                        </div>
                      </SelectItem>
                      <SelectItem value="semantic">
                        <div className="flex items-center gap-2">
                          <span>🧠</span>
                          Semantic
                        </div>
                      </SelectItem>
                      <SelectItem value="keyword">
                        <div className="flex items-center gap-2">
                          <span>🔍</span>
                          Keyword
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Results:</span>
                  <Select value={topK.toString()} onValueChange={(value) => setTopK(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            {/* Advanced Search Options */}
            {showAdvancedOptions && (
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <SearchTypeSelector
                  searchType={searchType}
                  options={hybridOptions}
                  onSearchTypeChange={setSearchType}
                  onOptionsChange={setHybridOptions}
                  disabled={isLoading}
                  showAdvanced={true}
                />
              </div>
            )}
          </div>

          {/* Search Metadata */}
          {searchMetadata && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <Badge variant="outline">
                  {SEARCH_TYPE_CONFIGS[searchType as SearchType]?.icon} {searchMetadata.search_type} search
                </Badge>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatSearchTime(searchTime)}
                </Badge>
                {isCached && (
                  <Badge variant="outline" className="text-green-600">
                    Cached
                  </Badge>
                )}
                {searchMetadata.fusion_algorithm && (
                  <Badge variant="outline" className="text-purple-600">
                    {searchMetadata.fusion_algorithm} fusion
                  </Badge>
                )}
                {searchMetadata.intent && (
                  <Badge variant="outline" className="text-orange-600">
                    {searchMetadata.intent} intent
                  </Badge>
                )}
                {searchMetadata.corrected_query && (
                  <Badge variant="outline" className="text-red-600">
                    Spell corrected
                  </Badge>
                )}
                {searchMetadata.query_expansion && (
                  <Badge variant="outline" className="text-blue-600">
                    Query expanded
                  </Badge>
                )}
              </div>

              {/* Hybrid Search Performance Breakdown */}
              {searchType === 'hybrid' && searchMetadata.semantic_time !== undefined && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {searchMetadata.semantic_time !== undefined && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <div className="font-medium text-blue-800 dark:text-blue-200">Semantic</div>
                      <div className="text-blue-600 dark:text-blue-300">
                        {formatSearchTime(searchMetadata.semantic_time)} • {searchMetadata.semantic_results || 0} results
                      </div>
                    </div>
                  )}
                  {searchMetadata.keyword_time !== undefined && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      <div className="font-medium text-green-800 dark:text-green-200">Keyword</div>
                      <div className="text-green-600 dark:text-green-300">
                        {formatSearchTime(searchMetadata.keyword_time)} • {searchMetadata.keyword_results || 0} results
                      </div>
                    </div>
                  )}
                  {searchMetadata.fusion_time !== undefined && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                      <div className="font-medium text-purple-800 dark:text-purple-200">Fusion</div>
                      <div className="text-purple-600 dark:text-purple-300">
                        {formatSearchTime(searchMetadata.fusion_time)}
                      </div>
                    </div>
                  )}
                  {searchMetadata.enhancement_time !== undefined && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                      <div className="font-medium text-orange-800 dark:text-orange-200">Enhancement</div>
                      <div className="text-orange-600 dark:text-orange-300">
                        {formatSearchTime(searchMetadata.enhancement_time)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Query Expansion Info */}
          {searchMetadata?.query_expansion && (
            <div className="text-sm bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-800 mb-1">Query Expansion:</div>
              <div className="text-blue-700">
                <span className="font-medium">Original:</span> {searchMetadata.query_expansion.original}
              </div>
              <div className="text-blue-700">
                <span className="font-medium">Expanded:</span> {searchMetadata.query_expansion.expanded}
              </div>
              {searchMetadata.query_expansion.expansion_terms.length > 0 && (
                <div className="text-blue-700 mt-1">
                  <span className="font-medium">Added terms:</span>{' '}
                  {searchMetadata.query_expansion.expansion_terms.map((term, index) => (
                    <Badge key={index} variant="outline" className="text-xs mr-1">
                      {term}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Results ({results.length})
            </h3>
          </div>

          {results.map((result, index) => (
            <Card
              key={result.chunk_id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onResultSelect?.(result)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">
                      {result.metadata.filename || 'Unknown Document'}
                    </span>
                    {result.metadata.file_type && (
                      <Badge variant="outline" className="text-xs">
                        {result.metadata.file_type.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{result.rank}
                    </Badge>
                    <Badge
                      variant={result.score > 0.8 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {formatScore(result.score)}%
                    </Badge>
                    {result.search_methods && result.search_methods.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {result.search_methods.includes('semantic') && result.search_methods.includes('keyword')
                          ? '🧠🔍'
                          : result.search_methods.includes('semantic')
                            ? '🧠'
                            : '🔍'
                        }
                      </Badge>
                    )}
                    {result.confidence !== undefined && (
                      <Badge variant="outline" className="text-xs text-blue-600">
                        {Math.round(result.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                </div>

                <div
                  className="text-sm text-gray-700 leading-relaxed mb-3"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(truncateContent(result.content), query)
                  }}
                />

                {/* Hybrid Search Score Breakdown */}
                {searchType === 'hybrid' && (result.semantic_score !== undefined || result.keyword_score !== undefined) && (
                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    <div className="font-medium mb-1">Score Breakdown:</div>
                    <div className="flex gap-4">
                      {result.semantic_score !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-600">🧠 Semantic:</span>
                          <span>{formatScore(result.semantic_score)}%</span>
                        </div>
                      )}
                      {result.keyword_score !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-green-600">🔍 Keyword:</span>
                          <span>{formatScore(result.keyword_score)}%</span>
                        </div>
                      )}
                      {result.fused_score !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-600">⚡ Fused:</span>
                          <span>{formatScore(result.fused_score)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {result.highlights && result.highlights.length > 0 && (
                  <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                    <div className="font-medium mb-1 text-yellow-800 dark:text-yellow-200">Key Highlights:</div>
                    <div className="flex flex-col gap-1">
                      {result.highlights.slice(0, 2).map((highlight, idx) => (
                        <div key={idx} className="text-yellow-700 dark:text-yellow-300">
                          "...{highlight}..."
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    {result.metadata.chunk_index !== undefined && (
                      <span>Chunk {result.metadata.chunk_index + 1}</span>
                    )}
                    {result.metadata.created_at && (
                      <span>
                        {new Date(result.metadata.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && results.length === 0 && query && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any documents matching your search.
            </p>
            <div className="text-sm text-gray-500">
              <p>Try:</p>
              <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
                <li>Using different keywords</li>
                <li>Checking your spelling</li>
                <li>Using more general terms</li>
                <li>Switching to a different search type</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!query && results.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Search Your Documents</h3>
            <p className="text-gray-600">
              Enter a search query to find relevant content in your uploaded documents.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
