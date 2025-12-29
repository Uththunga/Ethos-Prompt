import {
    CheckCircleIcon,
    CogIcon,
    DocumentTextIcon,
    InformationCircleIcon,
    MagnifyingGlassIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import React, { useState } from 'react';
import { functions } from '../../config/firebase';

interface HybridRetrievalConfigProps {
  onConfigChange?: (config: HybridConfig) => void;
}

interface HybridConfig {
  semantic_weight: number;
  keyword_weight: number;
  rerank_weight: number;
  use_query_expansion: boolean;
  use_reranking: boolean;
}

const HybridRetrievalConfig: React.FC<HybridRetrievalConfigProps> = ({
  onConfigChange
}) => {
  const [config, setConfig] = useState<HybridConfig>({
    semantic_weight: 0.5,
    keyword_weight: 0.3,
    rerank_weight: 0.2,
    use_query_expansion: true,
    use_reranking: true
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateConfig = (updates: Partial<HybridConfig>) => {
    const newConfig = { ...config, ...updates };

    // Auto-normalize weights
    const totalWeight = newConfig.semantic_weight + newConfig.keyword_weight + newConfig.rerank_weight;
    if (totalWeight > 0) {
      newConfig.semantic_weight = newConfig.semantic_weight / totalWeight;
      newConfig.keyword_weight = newConfig.keyword_weight / totalWeight;
      newConfig.rerank_weight = newConfig.rerank_weight / totalWeight;
    }

    setConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      const configureHybridRetrieval = httpsCallable(functions, 'configure_hybrid_retrieval');

      const result = await configureHybridRetrieval(config);
      const data = result.data as { success?: boolean; error?: string };

      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving hybrid retrieval config:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultConfig = {
      semantic_weight: 0.5,
      keyword_weight: 0.3,
      rerank_weight: 0.2,
      use_query_expansion: true,
      use_reranking: true
    };
    setConfig(defaultConfig);
    if (onConfigChange) {
      onConfigChange(defaultConfig);
    }
  };

  const getWeightPercentage = (weight: number) => {
    return Math.round(weight * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <CogIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">
              Hybrid Retrieval Configuration
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
            <span className="text-xs text-gray-500">
              {isExpanded ? 'Hide' : 'Show'} Settings
            </span>
          </div>
        </button>
      </div>

      {/* Configuration Panel */}
      {isExpanded && (
        <div className="p-4">
          {/* Weight Configuration */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <SparklesIcon className="h-4 w-4 mr-2 text-blue-500" />
              Retrieval Method Weights
            </h4>

            <div >
              {/* Semantic Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700 flex items-center">
                    <MagnifyingGlassIcon className="h-4 w-4 mr-1 text-blue-500" />
                    Semantic Search
                  </label>
                  <span className="text-sm font-medium text-gray-900">
                    {getWeightPercentage(config.semantic_weight)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.semantic_weight}
                  onChange={(e) => updateConfig({ semantic_weight: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vector similarity search using embeddings
                </p>
              </div>

              {/* Keyword Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1 text-green-500" />
                    Keyword Search
                  </label>
                  <span className="text-sm font-medium text-gray-900">
                    {getWeightPercentage(config.keyword_weight)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.keyword_weight}
                  onChange={(e) => updateConfig({ keyword_weight: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                />
                <p className="text-xs text-gray-500 mt-1">
                  BM25 algorithm for exact term matching
                </p>
              </div>

              {/* Rerank Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700 flex items-center">
                    <SparklesIcon className="h-4 w-4 mr-1 text-purple-500" />
                    Cross-Encoder Reranking
                  </label>
                  <span className="text-sm font-medium text-gray-900">
                    {getWeightPercentage(config.rerank_weight)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.rerank_weight}
                  onChange={(e) => updateConfig({ rerank_weight: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Neural reranking for improved relevance
                </p>
              </div>
            </div>

            {/* Weight Visualization */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Weight Distribution</span>
                <span>Total: 100%</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500"
                  style={{ width: `${getWeightPercentage(config.semantic_weight)}%` }}
                />
                <div
                  className="bg-green-500"
                  style={{ width: `${getWeightPercentage(config.keyword_weight)}%` }}
                />
                <div
                  className="bg-purple-500"
                  style={{ width: `${getWeightPercentage(config.rerank_weight)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Advanced Features
            </h4>

            <div >
              {/* Query Expansion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="query-expansion"
                    checked={config.use_query_expansion}
                    onChange={(e) => updateConfig({ use_query_expansion: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="query-expansion" className="text-sm text-gray-700">
                    Query Expansion
                  </label>
                  <div className="group relative">
                    <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Automatically expand queries with synonyms
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  config.use_query_expansion
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {config.use_query_expansion ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {/* Cross-Encoder Reranking */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reranking"
                    checked={config.use_reranking}
                    onChange={(e) => updateConfig({ use_reranking: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="reranking" className="text-sm text-gray-700">
                    Neural Reranking
                  </label>
                  <div className="group relative">
                    <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Use cross-encoder model for better relevance
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  config.use_reranking
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {config.use_reranking ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={resetToDefaults}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={saveConfiguration}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CogIcon className="h-4 w-4" />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HybridRetrievalConfig;
