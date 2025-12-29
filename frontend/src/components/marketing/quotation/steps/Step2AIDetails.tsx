/**
 * Step 2.5: AI Assistant Details
 * Service-specific questions for Smart Business Assistant quotations
 */

import React from 'react';
import { Label } from '@/components/marketing/ui/label';
import { Checkbox } from '@/components/marketing/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/marketing/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/marketing/ui/select';
import { MessageSquare, Languages, Users, Database } from 'lucide-react';
import type { FormStepProps, AIAssistantConfig } from '../types';
import {
    AI_INTERACTION_OPTIONS,
    AI_CHANNEL_OPTIONS,
    AI_LANGUAGE_OPTIONS,
    AI_KB_SIZE_OPTIONS,
} from '../types';

export const Step2AIDetails: React.FC<FormStepProps> = ({
  formData,
  errors,
  onChange,
  onClearError,
}) => {
  // Get or create the AI config
  const aiConfig: AIAssistantConfig = formData.aiAssistantConfig || {
    expectedMonthlyInteractions: '',
    deploymentChannels: [],
    languages: ['en'],
    humanHandoffRequired: false,
    knowledgeBaseSize: '',
  };

  // Update AI config field
  const updateConfig = (field: keyof AIAssistantConfig, value: any) => {
    onChange('aiAssistantConfig', {
      ...aiConfig,
      [field]: value,
    });
  };

  // Toggle channel
  const toggleChannel = (channel: string, checked: boolean) => {
    const current = aiConfig.deploymentChannels || [];
    if (checked) {
      updateConfig('deploymentChannels', [...current, channel]);
    } else {
      updateConfig('deploymentChannels', current.filter(c => c !== channel));
    }
  };

  // Toggle language
  const toggleLanguage = (lang: string, checked: boolean) => {
    const current = aiConfig.languages || [];
    if (checked) {
      updateConfig('languages', [...current, lang]);
    } else {
      updateConfig('languages', current.filter(l => l !== lang));
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Section Header */}
      <div className="p-3 sm:p-4 bg-ethos-purple/5 border border-ethos-purple/20 rounded-lg">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-5 h-5 text-ethos-purple flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ethos-navy mb-1">
              AI Assistant Configuration
            </p>
            <p className="text-xs text-gray-700">
              Help us understand your conversational AI needs. This information helps us
              provide an accurate quote and ensure the solution meets your requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Expected Monthly Interactions */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Expected Monthly Conversations <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          How many customer inquiries or conversations do you expect per month?
        </p>
        <Select
          value={aiConfig.expectedMonthlyInteractions || ''}
          onValueChange={(value) => {
            updateConfig('expectedMonthlyInteractions', value);
            if (errors['aiAssistantConfig.expectedMonthlyInteractions']) {
              onClearError('aiAssistantConfig.expectedMonthlyInteractions');
            }
          }}
        >
          <SelectTrigger
            className={errors['aiAssistantConfig.expectedMonthlyInteractions']
              ? 'h-10 sm:h-11 border-red-500 focus:ring-red-500'
              : 'h-10 sm:h-11'}
          >
            <SelectValue placeholder="Select expected volume" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={5} className="z-[1060]">
            {AI_INTERACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors['aiAssistantConfig.expectedMonthlyInteractions'] && (
          <p className="text-sm text-red-600" role="alert">
            {errors['aiAssistantConfig.expectedMonthlyInteractions']}
          </p>
        )}
      </div>

      {/* Deployment Channels */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium">
          Deployment Channels <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          Where would you like the AI assistant to be available? (Select all that apply)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {AI_CHANNEL_OPTIONS.map((channel) => (
            <div key={channel.value} className="flex items-center gap-2">
              <Checkbox
                id={`channel-${channel.value}`}
                checked={aiConfig.deploymentChannels?.includes(channel.value) || false}
                onCheckedChange={(checked) => toggleChannel(channel.value, !!checked)}
              />
              <Label
                htmlFor={`channel-${channel.value}`}
                className="text-xs sm:text-sm text-gray-700 font-normal cursor-pointer"
              >
                {channel.label}
              </Label>
            </div>
          ))}
        </div>
        {errors['aiAssistantConfig.deploymentChannels'] && (
          <p className="text-sm text-red-600" role="alert">
            {errors['aiAssistantConfig.deploymentChannels']}
          </p>
        )}
      </div>

      {/* Languages */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium flex items-center gap-2">
          <Languages className="w-4 h-4" />
          Languages Required
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          What languages should the assistant understand and respond in?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AI_LANGUAGE_OPTIONS.map((lang) => (
            <div key={lang.value} className="flex items-center gap-2">
              <Checkbox
                id={`lang-${lang.value}`}
                checked={aiConfig.languages?.includes(lang.value) || false}
                onCheckedChange={(checked) => toggleLanguage(lang.value, !!checked)}
              />
              <Label
                htmlFor={`lang-${lang.value}`}
                className="text-xs sm:text-sm text-gray-700 font-normal cursor-pointer"
              >
                {lang.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge Base Size */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium flex items-center gap-2">
          <Database className="w-4 h-4" />
          Knowledge Base Size
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          How much documentation/FAQs will the AI need to learn from?
        </p>
        <RadioGroup
          value={aiConfig.knowledgeBaseSize || ''}
          onValueChange={(value) => updateConfig('knowledgeBaseSize', value)}
          className="flex flex-col gap-2 sm:gap-2.5"
        >
          {AI_KB_SIZE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-3">
              <RadioGroupItem
                value={option.value}
                id={`kb-${option.value}`}
                className="h-4 w-4 sm:h-4 sm:w-4"
              />
              <Label
                htmlFor={`kb-${option.value}`}
                className="text-xs sm:text-sm text-gray-700 font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Human Handoff */}
      <div className="flex flex-col gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox
            id="humanHandoff"
            checked={aiConfig.humanHandoffRequired}
            onCheckedChange={(checked) => updateConfig('humanHandoffRequired', !!checked)}
          />
          <Label
            htmlFor="humanHandoff"
            className="text-sm sm:text-base text-ethos-navy font-medium cursor-pointer"
          >
            Human handoff required
          </Label>
        </div>
        <p className="text-xs text-gray-600 ml-7">
          Should the AI be able to transfer complex conversations to a human agent?
        </p>
      </div>

      {/* Help Text */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Why we need this:</strong> These details help us estimate how complex your AI assistant
          needs to be, which affects development time and ongoing costs (API usage, hosting).
        </p>
      </div>
    </div>
  );
};
