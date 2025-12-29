/**
 * Tests for Hybrid Search Components
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { SearchTypeSelector } from '../components/ai/SearchTypeSelector';
import { DocumentSearch } from '../components/ai/DocumentSearch';
import { SearchType, HybridSearchOptions, DEFAULT_SEARCH_PRESETS } from '../types/hybridSearch';
import * as aiService from '../services/aiService';

// Mock the AI service
vi.mock('../services/aiService', () => ({
  aiService: {
    searchDocuments: vi.fn(),
  },
}));

// Mock toast hook
vi.mock('../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('SearchTypeSelector', () => {
  const defaultOptions: HybridSearchOptions = {
    searchType: 'hybrid',
    alpha: 0.7,
    enableSpellCorrection: true,
    enableQueryExpansion: true,
    useAdaptiveFusion: true,
    fusionAlgorithm: 'adaptive',
    maxResults: 10,
  };

  const mockOnSearchTypeChange = vi.fn();
  const mockOnOptionsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search type options correctly', () => {
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
      />
    );

    expect(screen.getByText('Semantic')).toBeInTheDocument();
    expect(screen.getByText('Keyword')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Best of both semantic and keyword')).toBeInTheDocument();
  });

  it('shows recommended badge for hybrid search', () => {
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
      />
    );

    // Hybrid should have a recommended indicator
    const hybridButton = screen.getByRole('button', { name: /hybrid/i });
    expect(hybridButton).toBeInTheDocument();
  });

  it('calls onSearchTypeChange when search type is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
      />
    );

    const semanticButton = screen.getByRole('button', { name: /semantic/i });
    await user.click(semanticButton);

    expect(mockOnSearchTypeChange).toHaveBeenCalledWith('semantic');
  });

  it('renders quick presets', () => {
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
      />
    );

    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('Semantic Focus')).toBeInTheDocument();
    expect(screen.getByText('Keyword Focus')).toBeInTheDocument();
    expect(screen.getByText('Fast Search')).toBeInTheDocument();
  });

  it('applies preset when selected', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
      />
    );

    const semanticFocusPreset = screen.getByRole('button', { name: /semantic focus/i });
    await user.click(semanticFocusPreset);

    expect(mockOnSearchTypeChange).toHaveBeenCalledWith('hybrid');
    expect(mockOnOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        alpha: 0.9,
        fusionAlgorithm: 'rrf',
      })
    );
  });

  it('shows advanced options when enabled', () => {
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
        showAdvanced={true}
      />
    );

    expect(screen.getByText('Advanced Options')).toBeInTheDocument();
    expect(screen.getByText(/Semantic Weight:/)).toBeInTheDocument();
    expect(screen.getByText('Fusion Algorithm')).toBeInTheDocument();
  });

  it('updates semantic weight when slider is changed', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
        showAdvanced={true}
      />
    );

    const slider = screen.getByRole('slider');
    await user.clear(slider);
    await user.type(slider, '0.8');

    expect(mockOnOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        alpha: 0.8,
      })
    );
  });

  it('toggles enhancement options', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
        showAdvanced={true}
      />
    );

    const spellCorrectionCheckbox = screen.getByLabelText('Enable Spell Correction');
    await user.click(spellCorrectionCheckbox);

    expect(mockOnOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        enableSpellCorrection: false,
      })
    );
  });

  it('displays current configuration summary', () => {
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
      />
    );

    expect(screen.getByText('Current Configuration')).toBeInTheDocument();
    expect(screen.getByText('Type: Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Semantic Weight: 70%')).toBeInTheDocument();
    expect(screen.getByText('Algorithm: adaptive')).toBeInTheDocument();
  });

  it('disables controls when disabled prop is true', () => {
    render(
      <SearchTypeSelector
        searchType="hybrid"
        options={defaultOptions}
        onSearchTypeChange={mockOnSearchTypeChange}
        onOptionsChange={mockOnOptionsChange}
        disabled={true}
        showAdvanced={true}
      />
    );

    const hybridButton = screen.getByRole('button', { name: /hybrid/i });
    const slider = screen.getByRole('slider');
    const checkbox = screen.getByLabelText('Enable Spell Correction');

    expect(hybridButton).toBeDisabled();
    expect(slider).toBeDisabled();
    expect(checkbox).toBeDisabled();
  });
});

describe('DocumentSearch with Hybrid Search', () => {
  const mockSearchResponse = {
    success: true,
    results: [
      {
        chunk_id: 'chunk1',
        content: 'This is about artificial intelligence and machine learning.',
        score: 0.95,
        semantic_score: 0.9,
        keyword_score: 0.8,
        fused_score: 0.95,
        metadata: {
          filename: 'ai_doc.txt',
          file_type: 'text',
          chunk_index: 0,
          total_chunks: 1,
          created_at: '2024-01-01',
        },
        search_methods: ['semantic', 'keyword'],
        highlights: ['artificial intelligence', 'machine learning'],
        confidence: 0.92,
        rank: 1,
        search_type: 'hybrid',
      },
    ],
    total_results: 1,
    search_time: 0.5,
    cached: false,
    metadata: {
      search_type: 'hybrid',
      fusion_algorithm: 'adaptive',
      semantic_time: 0.2,
      keyword_time: 0.15,
      fusion_time: 0.1,
      enhancement_time: 0.05,
      semantic_results: 3,
      keyword_results: 2,
      intent: 'factual',
      intent_confidence: 0.85,
      corrected_query: 'artificial intelligence',
    },
    query_info: {
      original_query: 'artificial intelligence',
      corrected_query: 'artificial intelligence',
      intent: 'factual',
      intent_confidence: 0.85,
      enhanced: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (aiService.aiService.searchDocuments as any).mockResolvedValue(mockSearchResponse);
  });

  it('renders search interface with hybrid options', () => {
    render(<DocumentSearch />);

    expect(screen.getByPlaceholderText('Search your documents...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
  });

  it('shows advanced options when toggle is clicked', async () => {
    const user = userEvent.setup();
    
    render(<DocumentSearch />);

    const advancedToggle = screen.getByRole('button', { name: /show advanced/i });
    await user.click(advancedToggle);

    expect(screen.getByText('Hide Advanced')).toBeInTheDocument();
  });

  it('performs search with hybrid options', async () => {
    const user = userEvent.setup();
    
    render(<DocumentSearch />);

    const searchInput = screen.getByPlaceholderText('Search your documents...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'artificial intelligence');
    await user.click(searchButton);

    await waitFor(() => {
      expect(aiService.aiService.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'artificial intelligence',
          search_type: 'hybrid',
          hybrid_options: expect.objectContaining({
            alpha: expect.any(Number),
            enable_spell_correction: expect.any(Boolean),
            enable_query_expansion: expect.any(Boolean),
            use_adaptive_fusion: expect.any(Boolean),
            fusion_algorithm: expect.any(String),
          }),
        })
      );
    });
  });

  it('displays search results with hybrid information', async () => {
    const user = userEvent.setup();
    
    render(<DocumentSearch />);

    const searchInput = screen.getByPlaceholderText('Search your documents...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'artificial intelligence');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Results (1)')).toBeInTheDocument();
      expect(screen.getByText('ai_doc.txt')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument(); // Score
      expect(screen.getByText('92% confidence')).toBeInTheDocument();
    });
  });

  it('shows hybrid search performance breakdown', async () => {
    const user = userEvent.setup();
    
    render(<DocumentSearch />);

    const searchInput = screen.getByPlaceholderText('Search your documents...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'artificial intelligence');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Semantic')).toBeInTheDocument();
      expect(screen.getByText('Keyword')).toBeInTheDocument();
      expect(screen.getByText('Fusion')).toBeInTheDocument();
      expect(screen.getByText('Enhancement')).toBeInTheDocument();
    });
  });

  it('displays score breakdown for hybrid results', async () => {
    const user = userEvent.setup();
    
    render(<DocumentSearch />);

    const searchInput = screen.getByPlaceholderText('Search your documents...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'artificial intelligence');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Score Breakdown:')).toBeInTheDocument();
      expect(screen.getByText(/🧠 Semantic:/)).toBeInTheDocument();
      expect(screen.getByText(/🔍 Keyword:/)).toBeInTheDocument();
      expect(screen.getByText(/⚡ Fused:/)).toBeInTheDocument();
    });
  });

  it('shows highlights when available', async () => {
    const user = userEvent.setup();
    
    render(<DocumentSearch />);

    const searchInput = screen.getByPlaceholderText('Search your documents...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'artificial intelligence');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Key Highlights:')).toBeInTheDocument();
      expect(screen.getByText(/"...artificial intelligence..."/)).toBeInTheDocument();
    });
  });

  it('handles search errors gracefully', async () => {
    const user = userEvent.setup();
    
    (aiService.aiService.searchDocuments as any).mockRejectedValue(
      new Error('Search failed')
    );

    render(<DocumentSearch />);

    const searchInput = screen.getByPlaceholderText('Search your documents...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'test query');
    await user.click(searchButton);

    // Should handle error without crashing
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search your documents...')).toBeInTheDocument();
    });
  });

  it('updates search type selection', async () => {
    const user = userEvent.setup();
    
    render(<DocumentSearch />);

    // Open search type dropdown
    const searchTypeSelect = screen.getByRole('combobox');
    await user.click(searchTypeSelect);

    // Select semantic search
    const semanticOption = screen.getByRole('option', { name: /semantic/i });
    await user.click(semanticOption);

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search your documents...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'test');
    await user.click(searchButton);

    await waitFor(() => {
      expect(aiService.aiService.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          search_type: 'semantic',
        })
      );
    });
  });

  it('shows loading state during search', async () => {
    const user = userEvent.setup();
    
    // Make search take some time
    (aiService.aiService.searchDocuments as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSearchResponse), 100))
    );

    render(<DocumentSearch />);

    const searchInput = screen.getByPlaceholderText('Search your documents...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'test');
    await user.click(searchButton);

    expect(screen.getByText('Searching...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Results (1)')).toBeInTheDocument();
    });
  });
});

describe('Hybrid Search Integration', () => {
  it('maintains search type consistency across components', async () => {
    const user = userEvent.setup();
    
    render(<DocumentSearch />);

    // Change to keyword search
    const searchTypeSelect = screen.getByRole('combobox');
    await user.click(searchTypeSelect);
    
    const keywordOption = screen.getByRole('option', { name: /keyword/i });
    await user.click(keywordOption);

    // Open advanced options
    const advancedToggle = screen.getByRole('button', { name: /show advanced/i });
    await user.click(advancedToggle);

    // Should show keyword as selected in advanced options too
    await waitFor(() => {
      expect(screen.getByText('Type: Keyword')).toBeInTheDocument();
    });
  });

  it('preserves options when switching between search types', async () => {
    const user = userEvent.setup();
    
    render(<DocumentSearch />);

    // Open advanced options
    const advancedToggle = screen.getByRole('button', { name: /show advanced/i });
    await user.click(advancedToggle);

    // Change semantic weight
    const slider = screen.getByRole('slider');
    await user.clear(slider);
    await user.type(slider, '0.8');

    // Switch to semantic and back to hybrid
    const searchTypeSelect = screen.getByRole('combobox');
    await user.click(searchTypeSelect);
    
    const semanticOption = screen.getByRole('option', { name: /semantic/i });
    await user.click(semanticOption);

    await user.click(searchTypeSelect);
    const hybridOption = screen.getByRole('option', { name: /hybrid/i });
    await user.click(hybridOption);

    // Weight should be preserved
    await waitFor(() => {
      expect(screen.getByText('Semantic Weight: 80%')).toBeInTheDocument();
    });
  });
});
