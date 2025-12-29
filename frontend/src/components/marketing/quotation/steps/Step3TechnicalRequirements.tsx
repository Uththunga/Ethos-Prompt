/**
 * Step 3: Technical Requirements
 * Collects information about existing systems, integrations, data volume, and security needs
 */

import React, { useState } from 'react';
import { Label } from '@/components/marketing/ui/label';
import { Input } from '@/components/marketing/ui/input';
import { Textarea } from '@/components/marketing/ui/textarea';
import { Checkbox } from '@/components/marketing/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/marketing/ui/select';
import { X } from 'lucide-react';
import type { FormStepProps } from '../types';
import { DATA_VOLUME_OPTIONS, DATA_VOLUME_OPTIONS_BY_SERVICE, SECURITY_REQUIREMENTS_OPTIONS } from '../types';
import { getIntegrationNeedsHelpText } from '../serviceConfig';

export const Step3TechnicalRequirements: React.FC<FormStepProps> = ({
  formData,
  errors,
  onChange,
  onClearError,
  serviceContext,
}) => {
  const [systemInput, setSystemInput] = useState('');
  const integrationHelpText = getIntegrationNeedsHelpText(serviceContext);

  // Handle adding a system
  const handleAddSystem = () => {
    if (systemInput.trim()) {
      const currentSystems = formData.existingSystems || [];
      if (!currentSystems.includes(systemInput.trim())) {
        onChange('existingSystems', [...currentSystems, systemInput.trim()]);
      }
      setSystemInput('');
    }
  };

  // Handle removing a system
  const handleRemoveSystem = (system: string) => {
    const currentSystems = formData.existingSystems || [];
    onChange('existingSystems', currentSystems.filter((s) => s !== system));
  };

  // Handle system input key press
  const handleSystemKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSystem();
    }
  };

  // Handle security requirement checkbox change
  const handleSecurityChange = (requirementValue: string, checked: boolean) => {
    const currentRequirements = formData.securityRequirements || [];
    if (checked) {
      onChange('securityRequirements', [...currentRequirements, requirementValue]);
    } else {
      onChange('securityRequirements', currentRequirements.filter((r) => r !== requirementValue));
    }
  };

  // Common system suggestions
  const commonSystems = [
    'Salesforce',
    'HubSpot',
    'Shopify',
    'WooCommerce',
    'Xero',
    'QuickBooks',
    'Mailchimp',
    'Slack',
    'Microsoft 365',
    'Google Workspace',
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Existing Systems */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="existingSystems" className="text-sm sm:text-base text-ethos-navy font-medium">
          Existing Systems <span className="text-gray-500 font-normal">(Optional)</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          List any software or systems you currently use (e.g., CRM, accounting, e-commerce)
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
          <Input
            id="existingSystems"
            type="text"
            value={systemInput}
            onChange={(e) => setSystemInput(e.target.value)}
            onKeyPress={handleSystemKeyPress}
            placeholder="Type a system name and press Enter"
            className="flex-1 w-full text-sm sm:text-base"
          />
          <button
            type="button"
            onClick={handleAddSystem}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-ethos-purple text-white rounded-lg hover:bg-ethos-purple/90 transition-colors min-h-[44px] min-w-[80px] sm:min-w-[100px] text-sm sm:text-base"
            aria-label="Add system"
          >
            Add
          </button>
        </div>

        {/* Display added systems */}
        {formData.existingSystems && formData.existingSystems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
            {formData.existingSystems.map((system) => (
              <span
                key={system}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs sm:text-sm"
              >
                {system}
                <button
                  type="button"
                  onClick={() => handleRemoveSystem(system)}
                  className="ml-1 hover:text-red-600 transition-colors"
                  aria-label={`Remove ${system}`}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Common systems suggestions */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Common systems:</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {commonSystems
              .filter((sys) => !formData.existingSystems?.includes(sys))
              .slice(0, 6)
              .map((system) => (
                <button
                  key={system}
                  type="button"
                  onClick={() => {
                    const currentSystems = formData.existingSystems || [];
                    onChange('existingSystems', [...currentSystems, system]);
                  }}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  + {system}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Integration Needs */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="integrationNeeds" className="text-sm sm:text-base text-ethos-navy font-medium">
          Integration Needs <span className="text-gray-500 font-normal">(Optional)</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">{integrationHelpText}</p>
        <Textarea
          id="integrationNeeds"
          value={formData.integrationNeeds}
          onChange={(e) => onChange('integrationNeeds', e.target.value)}
          placeholder="Example: We need to sync customer data between our CRM and email marketing platform in real-time..."
          className={errors.integrationNeeds ? 'border-red-500 focus:ring-red-500' : ''}
          aria-invalid={!!errors.integrationNeeds}
          aria-describedby={errors.integrationNeeds ? 'integrationNeeds-error' : undefined}
          rows={4}
        />
        {errors.integrationNeeds && (
          <p id="integrationNeeds-error" className="text-sm text-red-600" role="alert">
            {errors.integrationNeeds}
          </p>
        )}
      </div>

      {/* Data Volume */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="dataVolume" className="text-sm sm:text-base text-ethos-navy font-medium">
          {serviceContext === 'smart-assistant' ? 'Estimated Monthly Conversation Volume' : 'Estimated Data Volume'}{' '}
          <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          {serviceContext === 'smart-assistant'
            ? 'Approximate number of customer inquiries/conversations per month'
            : 'Approximate amount of data your solution will handle'}
        </p>
        <Select
          value={formData.dataVolume || ''}
          onValueChange={(value) => {
            onChange('dataVolume', value);
            if (errors.dataVolume) {
              onClearError('dataVolume');
            }
          }}
        >
          <SelectTrigger
            id="dataVolume"
            className={errors.dataVolume ? 'border-red-500 focus:ring-red-500' : ''}
            aria-invalid={!!errors.dataVolume}
            aria-describedby={errors.dataVolume ? 'dataVolume-error' : undefined}
          >
            <SelectValue placeholder="Select data volume" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={5} className="z-[1060]">
            {(DATA_VOLUME_OPTIONS_BY_SERVICE[serviceContext] || DATA_VOLUME_OPTIONS).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.dataVolume && (
          <p id="dataVolume-error" className="text-sm text-red-600" role="alert">
            {errors.dataVolume}
          </p>
        )}
      </div>

      {/* Security Requirements */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium">
          Security & Compliance <span className="text-gray-500 font-normal">(Optional)</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          Select any specific security or compliance requirements
        </p>
        <div className="flex flex-col gap-3" role="group" aria-labelledby="securityRequirements-label">
          {SECURITY_REQUIREMENTS_OPTIONS.map((requirement) => (
            <div key={requirement.value} className="flex items-start gap-3">
              <Checkbox
                id={`security-${requirement.value}`}
                checked={formData.securityRequirements?.includes(requirement.value) || false}
                onCheckedChange={(checked) =>
                  handleSecurityChange(requirement.value, checked as boolean)
                }
                className="mt-1 h-4 w-4 sm:h-4 sm:w-4"
                aria-describedby={`security-${requirement.value}-label`}
              />
              <Label
                htmlFor={`security-${requirement.value}`}
                id={`security-${requirement.value}-label`}
                className="text-sm sm:text-base text-gray-700 font-normal cursor-pointer flex-1 py-2"
              >
                {requirement.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Why we need this:</strong> Understanding your technical environment helps us
          ensure seamless integration and proper security measures for your solution.
        </p>
      </div>
    </div>
  );
};
