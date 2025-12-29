/**
 * Step 1: Business Information
 * Collects company details and contact information
 */

import React from 'react';
import { Label } from '@/components/marketing/ui/label';
import { Input } from '@/components/marketing/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/marketing/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/marketing/ui/radio-group';
import type { FormStepProps } from '../types';
import { INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS } from '../types';

export const Step1BusinessInfo: React.FC<FormStepProps> = ({
  formData,
  errors,
  onChange,
  onClearError,
  packageName,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Selected Package Info */}
      {packageName && (
        <div className="p-3 sm:p-4 bg-ethos-purple/5 border border-ethos-purple/20 rounded-lg">
          <p className="text-xs sm:text-sm text-ethos-navy">
            <strong>Selected Package:</strong> {packageName}
          </p>
        </div>
      )}

      {/* Company Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="companyName" className="text-sm sm:text-base text-ethos-navy font-medium">
          Company Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="companyName"
          type="text"
          value={formData.companyName}
          onChange={(e) => onChange('companyName', e.target.value)}
          onBlur={() => {
            if (!formData.companyName.trim()) {
              // Validation will be handled by the parent
            }
          }}
          placeholder="Enter your company name"
          className={errors.companyName ? 'border-red-500 focus:ring-red-500' : ''}
          aria-invalid={!!errors.companyName}
          aria-describedby={errors.companyName ? 'companyName-error' : undefined}
          required
        />
        {errors.companyName && (
          <p id="companyName-error" className="text-sm text-red-600" role="alert">
            {errors.companyName}
          </p>
        )}
      </div>

      {/* Industry */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="industry" className="text-sm sm:text-base text-ethos-navy font-medium">
          Industry <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.industry || ''}
          onValueChange={(value) => {
            onChange('industry', value);
            if (errors.industry) {
              onClearError('industry');
            }
          }}
        >
          <SelectTrigger
            id="industry"
            className={errors.industry ? 'h-10 sm:h-11 border-red-500 focus:ring-red-500' : 'h-10 sm:h-11'}
            aria-invalid={!!errors.industry}
            aria-describedby={errors.industry ? 'industry-error' : undefined}
          >
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={5} className="z-[1060]">
            {INDUSTRY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.industry && (
          <p id="industry-error" className="text-sm text-red-600" role="alert">
            {errors.industry}
          </p>
        )}
      </div>

      {/* Company Size */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium">
          Company Size <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.companySize}
          onValueChange={(value) => onChange('companySize', value)}
          className="flex flex-col gap-2 sm:gap-2.5"
          aria-invalid={!!errors.companySize}
          aria-describedby={errors.companySize ? 'companySize-error' : undefined}
        >
          {COMPANY_SIZE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-3">
              <RadioGroupItem
                value={option.value}
                id={`size-${option.value}`}
                className="h-4 w-4 sm:h-4 sm:w-4"
              />
              <Label
                htmlFor={`size-${option.value}`}
                className="text-xs sm:text-sm text-gray-700 font-normal cursor-pointer flex-1 py-0.5 sm:py-2"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.companySize && (
          <p id="companySize-error" className="text-sm text-red-600" role="alert">
            {errors.companySize}
          </p>
        )}
      </div>

      {/* Contact Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="contactName" className="text-sm sm:text-base text-ethos-navy font-medium">
          Your Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="contactName"
          type="text"
          value={formData.contactName}
          onChange={(e) => onChange('contactName', e.target.value)}
          placeholder="Enter your full name"
          className={errors.contactName ? 'border-red-500 focus:ring-red-500' : ''}
          aria-invalid={!!errors.contactName}
          aria-describedby={errors.contactName ? 'contactName-error' : undefined}
          required
        />
        {errors.contactName && (
          <p id="contactName-error" className="text-sm text-red-600" role="alert">
            {errors.contactName}
          </p>
        )}
      </div>

      {/* Contact Email */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="contactEmail" className="text-sm sm:text-base text-ethos-navy font-medium">
          Business Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => onChange('contactEmail', e.target.value)}
          placeholder="you@company.com"
          className={errors.contactEmail ? 'border-red-500 focus:ring-red-500' : ''}
          aria-invalid={!!errors.contactEmail}
          aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
          required
        />
        {errors.contactEmail && (
          <p id="contactEmail-error" className="text-sm text-red-600" role="alert">
            {errors.contactEmail}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Please use a business email address (not a personal or disposable email)
        </p>
      </div>

      {/* Contact Phone */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="contactPhone" className="text-sm sm:text-base text-ethos-navy font-medium">
          Phone Number <span className="text-gray-500 font-normal">(Optional)</span>
        </Label>
        <Input
          id="contactPhone"
          type="tel"
          value={formData.contactPhone}
          onChange={(e) => onChange('contactPhone', e.target.value)}
          placeholder="+61 4XX XXX XXX"
          className={errors.contactPhone ? 'border-red-500 focus:ring-red-500' : ''}
          aria-invalid={!!errors.contactPhone}
          aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
        />
        {errors.contactPhone && (
          <p id="contactPhone-error" className="text-sm text-red-600" role="alert">
            {errors.contactPhone}
          </p>
        )}
      </div>

      {/* Help Text */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Why we need this:</strong> This information helps us understand your business
          context and provide the most accurate quotation tailored to your needs.
        </p>
      </div>
    </div>
  );
};
