/**
 * Step 4: Timeline & Budget
 * Collects timeline expectations, budget range, and flexibility
 */

import React from 'react';
import { Label } from '@/components/marketing/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/marketing/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/marketing/ui/select';
import { Info, AlertTriangle } from 'lucide-react';
import type { FormStepProps } from '../types';
import { TIMELINE_OPTIONS, BUDGET_RANGE_OPTIONS, FLEXIBILITY_OPTIONS } from '../types';

export const Step4TimelineBudget: React.FC<FormStepProps> = ({
  formData,
  errors,
  onChange,
  onClearError,
  packageType,
}) => {
  // Budget-to-package mismatch check
  const getBudgetMismatchWarning = (): string | null => {
    if (!formData.budgetRange || !packageType) return null;

    const lowBudgets = ['under-10k', 'not-sure'];
    const mediumBudgets = ['10k-25k'];

    if (packageType === 'enterprise' && lowBudgets.includes(formData.budgetRange)) {
      return 'Enterprise solutions typically require higher investment. We\'ll discuss flexible options in your consultation.';
    }
    if (packageType === 'enterprise' && mediumBudgets.includes(formData.budgetRange)) {
      return 'Enterprise solutions often require $50K+. We can discuss phased approaches if budget is a concern.';
    }
    if (packageType === 'standard' && lowBudgets.includes(formData.budgetRange)) {
      return 'Standard solutions typically start at $10K+. We\'ll present options that fit your budget.';
    }
    return null;
  };

  const budgetWarning = getBudgetMismatchWarning();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Info Box */}
      <div className="p-3 sm:p-4 bg-ethos-purple/5 border border-ethos-purple/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-ethos-purple flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm font-medium text-ethos-navy mb-1">
              💡 About Pricing
            </p>
            <p className="text-xs text-gray-700">
              These estimates help us provide accurate quotations. All pricing is custom and based
              on your specific requirements. There are no hidden fees or surprises.
            </p>
          </div>
        </div>
      </div>

      {/* Desired Timeline */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium">
          Desired Timeline <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">When would you like to have this project completed?</p>
        <RadioGroup
          value={formData.desiredTimeline}
          onValueChange={(value) => onChange('desiredTimeline', value)}
          className="flex flex-col gap-2 sm:gap-2.5"
          aria-invalid={!!errors.desiredTimeline}
          aria-describedby={errors.desiredTimeline ? 'desiredTimeline-error' : undefined}
        >
          {TIMELINE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-3">
              <RadioGroupItem
                value={option.value}
                id={`timeline-${option.value}`}
                className="h-4 w-4 sm:h-4 sm:w-4"
              />
              <Label
                htmlFor={`timeline-${option.value}`}
                className="text-sm sm:text-base text-gray-700 font-normal cursor-pointer flex-1 py-1.5 sm:py-2"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.desiredTimeline && (
          <p id="desiredTimeline-error" className="text-sm text-red-600" role="alert">
            {errors.desiredTimeline}
          </p>
        )}
      </div>

      {/* Budget Range */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="budgetRange" className="text-sm sm:text-base text-ethos-navy font-medium">
          Budget Range <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          What is your approximate budget for this project? (Select "Not sure yet" if you're unsure)
        </p>
        <Select
          value={formData.budgetRange || ''}
          onValueChange={(value) => {
            onChange('budgetRange', value);
            if (errors.budgetRange) {
              onClearError('budgetRange');
            }
          }}
        >
          <SelectTrigger
            id="budgetRange"
            className={errors.budgetRange ? 'h-10 sm:h-11 border-red-500 focus:ring-red-500' : 'h-10 sm:h-11'}
            aria-invalid={!!errors.budgetRange}
            aria-describedby={errors.budgetRange ? 'budgetRange-error' : undefined}
          >
            <SelectValue placeholder="Select budget range" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={5} className="z-[1060]">
            {BUDGET_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.budgetRange && (
          <p id="budgetRange-error" className="text-sm text-red-600" role="alert">
            {errors.budgetRange}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          💡 Don't worry if you're not sure about the budget. We'll provide options that fit
          different budget levels in your quotation.
        </p>
        {budgetWarning && (
          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{budgetWarning}</p>
          </div>
        )}
      </div>

      {/* Flexibility */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium">
          Flexibility <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          How flexible are you with timeline and budget adjustments?
        </p>
        <RadioGroup
          value={formData.flexibility}
          onValueChange={(value) => onChange('flexibility', value)}
          className="flex flex-col gap-2 sm:gap-2.5"
          aria-invalid={!!errors.flexibility}
          aria-describedby={errors.flexibility ? 'flexibility-error' : undefined}
        >
          {FLEXIBILITY_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-3">
              <RadioGroupItem
                value={option.value}
                id={`flexibility-${option.value}`}
                className="h-4 w-4 sm:h-4 sm:w-4"
              />
              <Label
                htmlFor={`flexibility-${option.value}`}
                className="text-sm sm:text-base text-gray-700 font-normal cursor-pointer flex-1 py-1.5 sm:py-2"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.flexibility && (
          <p id="flexibility-error" className="text-sm text-red-600" role="alert">
            {errors.flexibility}
          </p>
        )}
      </div>

      {/* Pricing Model Explanation */}
      <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-xs sm:text-sm font-semibold text-ethos-navy mb-2">
          Understanding Our Pricing
        </h4>
        <div className="flex flex-col gap-2 text-xs sm:text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-ethos-purple font-semibold">💰</span>
            <div>
              <strong>One-Time Development:</strong> Covers research, custom development,
              integration, training, and deployment.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-ethos-purple font-semibold">📅</span>
            <div>
              <strong>Monthly Recurring:</strong> Covers API usage, hosting, maintenance, updates,
              and ongoing support.
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Why we need this:</strong> Understanding your timeline and budget helps us
          provide realistic options and ensure we can meet your expectations.
        </p>
      </div>
    </div>
  );
};
