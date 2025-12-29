import {
  ChartBarIcon,
  CubeIcon,
  DocumentTextIcon,
  PlayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { functions } from '../../config/firebase';

interface ChunkingStrategy {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bestFor: string[];
  pros: string[];
  cons: string[];
}

interface AnalysisResult {
  success?: boolean;
  analysis: {
    format_type: string;
    structure_score: number;
    complexity_score: number;
  };
  recommendation?: string;
  recommended_strategy?: string;
}

interface ChunkingResult {
  success?: boolean;
  strategy: string;
  chunk_count: number;
  avg_chunk_size: number;
  error?: string;
}

interface ChunkingStrategySelectorProps {
  text: string;
  onStrategySelect: (strategy: string) => void;
  onChunkingComplete?: (result: ChunkingResult) => void;
}

const ChunkingStrategySelector: React.FC<ChunkingStrategySelectorProps> = ({
  text,
  onStrategySelect,
  onChunkingComplete,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('adaptive');
  const [analyzing, setAnalyzing] = useState(false);
  const [chunking, setChunking] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [chunkingResult, setChunkingResult] = useState<ChunkingResult | null>(null);

  const strategies: ChunkingStrategy[] = [
    {
      id: 'adaptive',
      name: 'Adaptive',
      description: 'Automatically selects the best strategy based on content analysis',
      icon: SparklesIcon,
      color: 'blue',
      bestFor: ['Mixed content', 'Unknown document types', 'General purpose'],
      pros: ['Automatic optimization', 'Best overall results', 'No configuration needed'],
      cons: ['Slightly slower', 'Less predictable'],
    },
    {
      id: 'semantic',
      name: 'Semantic',
      description: 'Uses AI to detect topic boundaries and semantic coherence',
      icon: CpuChipIcon,
      color: 'purple',
      bestFor: ['Essays', 'Articles', 'Narrative text', 'Research papers'],
      pros: ['Preserves meaning', 'Natural boundaries', 'High quality chunks'],
      cons: ['Requires AI processing', 'Slower for large texts'],
    },
    {
      id: 'hierarchical',
      name: 'Hierarchical',
      description: 'Preserves document structure like headers, sections, and lists',
      icon: DocumentTextIcon,
      color: 'green',
      bestFor: ['Documentation', 'Manuals', 'Structured reports', 'Markdown/HTML'],
      pros: ['Preserves structure', 'Maintains context', 'Good for navigation'],
      cons: ['Requires structured content', 'May create uneven chunks'],
    },
    {
      id: 'fixed_size',
      name: 'Fixed Size',
      description: 'Splits text into chunks of approximately equal size',
      icon: CubeIcon,
      color: 'gray',
      bestFor: ['Code', 'Data files', 'Uniform processing', 'Simple content'],
      pros: ['Fast processing', 'Predictable size', 'Simple implementation'],
      cons: ['May break sentences', 'Ignores content structure'],
    },
  ];

  const analyzeText = React.useCallback(async () => {
    try {
      setAnalyzing(true);
      const analyzeTextStructure = httpsCallable(functions, 'analyze_text_structure');

      const result = await analyzeTextStructure({ text });
      const data = result.data as AnalysisResult;

      if (data.success) {
        setAnalysis(data);
        // Auto-select recommended strategy
        if (data.recommendation) {
          setSelectedStrategy(data.recommendation);
        }
      }
    } catch (error) {
      console.error('Failed to analyze text structure:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [text]);

  useEffect(() => {
    if (text && text.length > 100) {
      analyzeText();
    }
  }, [text, analyzeText]);

  const performChunking = async () => {
    try {
      setChunking(true);
      const advancedDocumentChunking = httpsCallable(functions, 'advanced_document_chunking');

      const result = await advancedDocumentChunking({
        text,
        strategy: selectedStrategy,
        config: {
          min_structure_score: 0.3,
          min_coherence_score: 0.6,
          prefer_structure_preservation: true,
        },
      });

      const data = result.data as ChunkingResult;

      if (data.success) {
        setChunkingResult(data);
        if (onChunkingComplete) {
          onChunkingComplete(data);
        }
      } else {
        throw new Error(data.error || 'Chunking failed');
      }
    } catch (error) {
      console.error('Error performing chunking:', error);
      alert('Failed to perform chunking. Please try again.');
    } finally {
      setChunking(false);
    }
  };

  const handleStrategySelect = (strategyId: string) => {
    setSelectedStrategy(strategyId);
    onStrategySelect(strategyId);
  };

  const getStrategyColor = (color: string) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50 text-blue-800',
      purple: 'border-purple-200 bg-purple-50 text-purple-800',
      green: 'border-green-200 bg-green-50 text-green-800',
      gray: 'border-gray-200 bg-gray-50 text-gray-800',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getSelectedColor = (color: string) => {
    const colors = {
      blue: 'border-blue-500 bg-blue-100 ring-2 ring-blue-500',
      purple: 'border-purple-500 bg-purple-100 ring-2 ring-purple-500',
      green: 'border-green-500 bg-green-100 ring-2 ring-green-500',
      gray: 'border-gray-500 bg-gray-100 ring-2 ring-gray-500',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Analysis Results */}
      {analysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">Content Analysis</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-blue-700 font-medium">Format:</span>
              <span className="ml-2 text-blue-600">{analysis.analysis.format_type}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-blue-700 font-medium">Structure Score:</span>
              <span className="ml-2 text-blue-600">
                {(analysis.analysis.structure_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-blue-700 font-medium">Complexity:</span>
              <span className="ml-2 text-blue-600">
                {(analysis.analysis.complexity_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="mt-3 text-sm text-blue-700">
            <strong>Recommended:</strong> {analysis.recommended_strategy}
          </div>
        </div>
      )}

      {/* Strategy Selection */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Chunking Strategy</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strategy) => {
            const isSelected = selectedStrategy === strategy.id;
            const isRecommended = analysis?.recommended_strategy === strategy.id;

            return (
              <div
                key={strategy.id}
                onClick={() => handleStrategySelect(strategy.id)}
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  isSelected
                    ? getSelectedColor(strategy.color)
                    : `border-gray-200 hover:${getStrategyColor(strategy.color)}`
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                    Recommended
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <strategy.icon
                    className={`h-6 w-6 mt-1 ${
                      isSelected ? `text-${strategy.color}-600` : 'text-gray-400'
                    }`}
                  />

                  <div className="flex-1">
                    <h4
                      className={`font-medium ${
                        isSelected ? `text-${strategy.color}-900` : 'text-gray-900'
                      }`}
                    >
                      {strategy.name}
                    </h4>

                    <p
                      className={`text-sm mt-1 ${
                        isSelected ? `text-${strategy.color}-700` : 'text-gray-600'
                      }`}
                    >
                      {strategy.description}
                    </p>

                    <div className="mt-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500">Best for:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {strategy.bestFor.map((item, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                isSelected
                                  ? `bg-${strategy.color}-200 text-${strategy.color}-800`
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategy Details (shown when selected) */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-green-700">Pros:</span>
                        <ul className="mt-1">
                          {strategy.pros.map((pro, index) => (
                            <li key={index} className="text-green-600">
                              • {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-red-700">Cons:</span>
                        <ul className="mt-1">
                          {strategy.cons.map((con, index) => (
                            <li key={index} className="text-red-600">
                              • {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={analyzeText}
          disabled={analyzing || !text}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <ChartBarIcon className="h-4 w-4" />
              <span>Re-analyze Text</span>
            </>
          )}
        </button>

        <button
          onClick={performChunking}
          disabled={chunking || !text || !selectedStrategy}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {chunking ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4" />
              <span>Apply Chunking</span>
            </>
          )}
        </button>
      </div>

      {/* Chunking Results */}
      {chunkingResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Chunking Complete</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Strategy:</span>
              <span className="ml-2">{chunkingResult.strategy}</span>
            </div>
            <div>
              <span className="font-medium">Chunks:</span>
              <span className="ml-2">{chunkingResult.chunk_count}</span>
            </div>
            <div>
              <span className="font-medium">Avg Size:</span>
              <span className="ml-2">{Math.round(chunkingResult.avg_chunk_size)} chars</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkingStrategySelector;
