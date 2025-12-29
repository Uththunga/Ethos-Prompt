import React from 'react';
import {
    SearchType,
    SEARCH_TYPE_CONFIGS,
    HybridSearchOptions,
    DEFAULT_SEARCH_PRESETS,
    SearchConfigPreset
} from '../../types/hybridSearch';

interface SearchTypeSelectorProps {
  searchType: SearchType;
  options: HybridSearchOptions;
  onSearchTypeChange: (type: SearchType) => void;
  onOptionsChange: (options: HybridSearchOptions) => void;
  disabled?: boolean;
  showAdvanced?: boolean;
}

export const SearchTypeSelector: React.FC<SearchTypeSelectorProps> = ({
  searchType,
  options,
  onSearchTypeChange,
  onOptionsChange,
  disabled = false,
  showAdvanced = false,
}) => {
  const handlePresetSelect = (preset: SearchConfigPreset) => {
    onSearchTypeChange(preset.options.searchType);
    onOptionsChange(preset.options);
  };

  const handleAdvancedOptionChange = (key: keyof HybridSearchOptions, value: any) => {
    onOptionsChange({
      ...options,
      [key]: value,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Type Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(SEARCH_TYPE_CONFIGS).map(([type, config]) => (
            <button
              key={type}
              onClick={() => onSearchTypeChange(type as SearchType)}
              disabled={disabled}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200
                ${searchType === type
                  ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-900/20`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {config.recommended && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  ⭐
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl mb-1">{config.icon}</div>
                <div className="font-medium text-sm">{config.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {config.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_SEARCH_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              disabled={disabled}
              className={`
                p-2 rounded-md border text-left transition-all duration-200
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600
                hover:bg-gray-50 dark:hover:bg-gray-800
              `}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{preset.name}</div>
                {preset.recommended && (
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded">
                    Recommended
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && searchType === 'hybrid' && (
        <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
            Advanced Options
          </h4>

          {/* Semantic Weight */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Semantic Weight: {((options.alpha || 0.7) * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={options.alpha || 0.7}
              onChange={(e) => handleAdvancedOptionChange('alpha', parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Keyword Focus</span>
              <span>Semantic Focus</span>
            </div>
          </div>

          {/* Fusion Algorithm */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Fusion Algorithm
            </label>
            <select
              value={options.fusionAlgorithm || 'adaptive'}
              onChange={(e) => handleAdvancedOptionChange('fusionAlgorithm', e.target.value)}
              disabled={disabled}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
            >
              <option value="adaptive">Adaptive (Recommended)</option>
              <option value="rrf">Reciprocal Rank Fusion</option>
              <option value="combsum">CombSUM</option>
              <option value="borda">Borda Count</option>
            </select>
          </div>

          {/* Enhancement Options */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="spellCorrection"
                checked={options.enableSpellCorrection !== false}
                onChange={(e) => handleAdvancedOptionChange('enableSpellCorrection', e.target.checked)}
                disabled={disabled}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="spellCorrection" className="text-sm text-gray-600 dark:text-gray-400">
                Enable Spell Correction
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="queryExpansion"
                checked={options.enableQueryExpansion !== false}
                onChange={(e) => handleAdvancedOptionChange('enableQueryExpansion', e.target.checked)}
                disabled={disabled}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="queryExpansion" className="text-sm text-gray-600 dark:text-gray-400">
                Enable Query Expansion
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="adaptiveFusion"
                checked={options.useAdaptiveFusion !== false}
                onChange={(e) => handleAdvancedOptionChange('useAdaptiveFusion', e.target.checked)}
                disabled={disabled}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="adaptiveFusion" className="text-sm text-gray-600 dark:text-gray-400">
                Use Adaptive Fusion
              </label>
            </div>
          </div>

          {/* Max Results */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Max Results: {options.maxResults || 10}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={options.maxResults || 10}
              onChange={(e) => handleAdvancedOptionChange('maxResults', parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>5</span>
              <span>50</span>
            </div>
          </div>
        </div>
      )}

      {/* Current Configuration Summary */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">
          Current Configuration
        </h4>
        <div className="text-xs text-blue-600 dark:text-blue-300 flex flex-col gap-1">
          <div>Type: {SEARCH_TYPE_CONFIGS[searchType].label}</div>
          {searchType === 'hybrid' && (
            <>
              <div>Semantic Weight: {((options.alpha || 0.7) * 100).toFixed(0)}%</div>
              <div>Algorithm: {options.fusionAlgorithm || 'adaptive'}</div>
              <div>Enhancements: {[
                options.enableSpellCorrection !== false && 'Spell Check',
                options.enableQueryExpansion !== false && 'Query Expansion',
                options.useAdaptiveFusion !== false && 'Adaptive Fusion'
              ].filter(Boolean).join(', ')}</div>
            </>
          )}
          <div>Max Results: {options.maxResults || 10}</div>
        </div>
      </div>
    </div>
  );
};
