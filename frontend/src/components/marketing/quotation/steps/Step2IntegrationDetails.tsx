/**
 * Step 2.5: System Integration Details
 * Service-specific questions for System Integration quotations
 */

import React from 'react';
import { Label } from '@/components/marketing/ui/label';
import { Input } from '@/components/marketing/ui/input';
import { Button } from '@/components/marketing/ui/button';
import { Checkbox } from '@/components/marketing/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/marketing/ui/select';
import { Link2, Plus, Trash2, ArrowRight, ArrowLeftRight } from 'lucide-react';
import type { FormStepProps, IntegrationConfig, IntegrationPair } from '../types';
import {
    INTEGRATION_FREQUENCY_OPTIONS,
    INTEGRATION_DIRECTION_OPTIONS,
} from '../types';

// Generate unique ID for integration pairs
const generateId = () => `int-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Empty integration template
const createEmptyIntegration = (): IntegrationPair => ({
  id: generateId(),
  sourceSystem: '',
  targetSystem: '',
  direction: '',
  syncFrequency: '',
  apiAvailable: null,
});

export const Step2IntegrationDetails: React.FC<FormStepProps> = ({
  formData,
  errors,
  onChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClearError: _,
}) => {
  // Get or create the integration config
  const config: IntegrationConfig = formData.integrationConfig || {
    integrations: [createEmptyIntegration()],
  };

  // Update entire config
  const updateConfig = (newConfig: IntegrationConfig) => {
    onChange('integrationConfig', newConfig);
  };

  // Add new integration
  const addIntegration = () => {
    updateConfig({
      integrations: [...config.integrations, createEmptyIntegration()],
    });
  };

  // Remove integration
  const removeIntegration = (id: string) => {
    if (config.integrations.length > 1) {
      updateConfig({
        integrations: config.integrations.filter(i => i.id !== id),
      });
    }
  };

  // Update a specific integration
  const updateIntegration = (id: string, field: keyof IntegrationPair, value: any) => {
    updateConfig({
      integrations: config.integrations.map(i =>
        i.id === id ? { ...i, [field]: value } : i
      ),
    });
  };


  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Section Header */}
      <div className="p-3 sm:p-4 bg-ethos-purple/5 border border-ethos-purple/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Link2 className="w-5 h-5 text-ethos-purple flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ethos-navy mb-1">
              Integration Configuration
            </p>
            <p className="text-xs text-gray-700">
              Tell us about the systems you need to connect. Add each integration pair
              separately - this helps us understand the full scope of your project.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Pairs */}
      {config.integrations.map((integration, index) => (
        <div
          key={integration.id}
          className="p-4 border border-gray-200 rounded-lg bg-white relative"
        >
          {/* Header with remove button */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-ethos-navy">
              Integration {index + 1}
            </h4>
            {config.integrations.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeIntegration(integration.id)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Source → Target Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center mb-4">
            <div className="flex-1 w-full">
              <Label className="text-xs text-gray-600 mb-1 block">Source System <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g., Salesforce, Xero, HubSpot"
                value={integration.sourceSystem}
                onChange={(e) => updateIntegration(integration.id, 'sourceSystem', e.target.value)}
                className={`w-full ${errors[`integrationConfig.integrations.${index}.sourceSystem`] ? 'border-red-500' : ''}`}
              />
              {errors[`integrationConfig.integrations.${index}.sourceSystem`] && (
                <p className="text-xs text-red-600 mt-1">{errors[`integrationConfig.integrations.${index}.sourceSystem`]}</p>
              )}
            </div>
            <div className="hidden sm:flex items-center pt-5">
              {integration.direction === 'bi-directional' ? (
                <ArrowLeftRight className="w-5 h-5 text-ethos-purple" />
              ) : (
                <ArrowRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 w-full">
              <Label className="text-xs text-gray-600 mb-1 block">Target System <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g., QuickBooks, WooCommerce"
                value={integration.targetSystem}
                onChange={(e) => updateIntegration(integration.id, 'targetSystem', e.target.value)}
                className={`w-full ${errors[`integrationConfig.integrations.${index}.targetSystem`] ? 'border-red-500' : ''}`}
              />
              {errors[`integrationConfig.integrations.${index}.targetSystem`] && (
                <p className="text-xs text-red-600 mt-1">{errors[`integrationConfig.integrations.${index}.targetSystem`]}</p>
              )}
            </div>
          </div>

          {/* Direction & Frequency Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Data Direction</Label>
              <Select
                value={integration.direction || ''}
                onValueChange={(value) => updateIntegration(integration.id, 'direction', value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="z-[1060]">
                  {INTEGRATION_DIRECTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Sync Frequency</Label>
              <Select
                value={integration.syncFrequency || ''}
                onValueChange={(value) => updateIntegration(integration.id, 'syncFrequency', value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="z-[1060]">
                  {INTEGRATION_FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* API Available Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id={`api-${integration.id}`}
              checked={integration.apiAvailable === true}
              onCheckedChange={(checked) => updateIntegration(integration.id, 'apiAvailable', !!checked)}
            />
            <Label
              htmlFor={`api-${integration.id}`}
              className="text-xs sm:text-sm text-gray-700 font-normal cursor-pointer"
            >
              API is available for these systems
            </Label>
          </div>
        </div>
      ))}

      {/* Add Integration Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addIntegration}
        className="w-full border-dashed border-ethos-purple/50 text-ethos-purple hover:bg-ethos-purple/5"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Integration
      </Button>

      {/* Error Display */}
      {errors['integrationConfig.integrations'] && (
        <p className="text-sm text-red-600" role="alert">
          {errors['integrationConfig.integrations']}
        </p>
      )}

      {/* Help Text */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Why we need this:</strong> Each integration has different complexity
          based on API availability, data direction, and sync frequency. This helps us
          provide accurate development time and cost estimates.
        </p>
      </div>
    </div>
  );
};
