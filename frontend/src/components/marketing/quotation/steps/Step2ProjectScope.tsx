/**
 * Step 2: Project Scope
 * Collects project description, goals, and desired features
 */

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/marketing/ui/label';
import { Textarea } from '@/components/marketing/ui/textarea';
import { Checkbox } from '@/components/marketing/ui/checkbox';
import { Lightbulb } from 'lucide-react';
import type { FormStepProps } from '../types';
import {
    getProjectDescriptionPlaceholder,
    getRecommendedFeatures,
    getPackageSpecificQuestions,
} from '../serviceConfig';

export const Step2ProjectScope: React.FC<FormStepProps> = ({
  formData,
  errors,
  onChange,
  onClearError: _onClearError,
  serviceContext,
  packageType = 'basic',
  packageName,
}) => {
  const [charCount, setCharCount] = useState(formData.projectDescription.length);
  const [recommendedFeatures, setRecommendedFeatures] = useState<string[]>([]);
  const maxChars = 1000;

  // Get package-specific questions
  const packageQuestions = getPackageSpecificQuestions(serviceContext, packageType);
  const primaryGoals = packageQuestions.primaryGoals;
  const specificFeatures = packageQuestions.specificFeatures;
  const placeholder = getProjectDescriptionPlaceholder(serviceContext);

  // Update character count
  useEffect(() => {
    setCharCount(formData.projectDescription.length);
  }, [formData.projectDescription]);

  // Update recommended features when goals change
  useEffect(() => {
    if (formData.primaryGoals.length > 0) {
      const recommended = getRecommendedFeatures(serviceContext, formData.primaryGoals);
      setRecommendedFeatures(recommended);
    } else {
      setRecommendedFeatures([]);
    }
  }, [formData.primaryGoals, serviceContext]);

  useEffect(() => {
    const allowedGoals = new Set(primaryGoals.map((g) => g.value));
    const allowedFeatures = new Set(specificFeatures.map((f) => f.value));

    const filteredGoals = (formData.primaryGoals || []).filter((g) => allowedGoals.has(g));
    if (filteredGoals.length !== formData.primaryGoals.length) {
      onChange('primaryGoals', filteredGoals);
    }

    const filteredFeatures = (formData.specificFeatures || []).filter((f) => allowedFeatures.has(f));
    if (filteredFeatures.length !== formData.specificFeatures.length) {
      onChange('specificFeatures', filteredFeatures);
    }
  }, [serviceContext, packageType]);

  // Handle goal checkbox change
  const handleGoalChange = (goalValue: string, checked: boolean) => {
    const currentGoals = formData.primaryGoals || [];
    if (checked) {
      onChange('primaryGoals', [...currentGoals, goalValue]);
    } else {
      onChange('primaryGoals', currentGoals.filter((g) => g !== goalValue));
    }
  };

  // Handle feature checkbox change
  const handleFeatureChange = (featureValue: string, checked: boolean) => {
    const currentFeatures = formData.specificFeatures || [];
    if (checked) {
      onChange('specificFeatures', [...currentFeatures, featureValue]);
    } else {
      onChange('specificFeatures', currentFeatures.filter((f) => f !== featureValue));
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Package Context Info */}
      {packageName && (
        <div className="p-3 bg-ethos-navy/5 border border-ethos-navy/20 rounded-lg">
          <p className="text-xs sm:text-sm text-ethos-navy">
            📦 <strong>{packageName}</strong> - {packageType === 'basic' ? 'Essential features' : packageType === 'standard' ? 'Popular choice with more features' : 'Complete solution with all features'}
          </p>
        </div>
      )}

      {/* Project Description */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="projectDescription" className="text-sm sm:text-base text-ethos-navy font-medium">
          Project Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="projectDescription"
          value={formData.projectDescription}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= maxChars) {
              onChange('projectDescription', value);
            }
          }}
          placeholder={placeholder}
          className={errors.projectDescription ? 'border-red-500 focus:ring-red-500' : ''}
          aria-invalid={!!errors.projectDescription}
          aria-describedby={
            errors.projectDescription
              ? 'projectDescription-error'
              : 'projectDescription-help'
          }
          rows={6}
          required
        />
        <div className="flex justify-between items-center">
          <p id="projectDescription-help" className="text-xs text-gray-500">
            Tell us about your project in your own words (minimum 20 characters)
          </p>
          <span
            className={`text-xs ${charCount > maxChars * 0.9 ? 'text-orange-600' : 'text-gray-500'}`}
          >
            {charCount}/{maxChars}
          </span>
        </div>
        {errors.projectDescription && (
          <p id="projectDescription-error" className="text-sm text-red-600" role="alert">
            {errors.projectDescription}
          </p>
        )}
      </div>

      {/* Primary Goals */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium">
          Primary Goals <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">Select 1-4 goals that best describe what you want to achieve</p>
        <div className="flex flex-col gap-2 sm:gap-2.5" role="group" aria-labelledby="primaryGoals-label">
          {primaryGoals.map((goal) => (
            <div key={goal.value} className="flex items-start gap-3">
              <Checkbox
                id={`goal-${goal.value}`}
                checked={formData.primaryGoals.includes(goal.value)}
                onCheckedChange={(checked) => handleGoalChange(goal.value, checked as boolean)}
                className="mt-1 h-4 w-4 sm:h-4 sm:w-4"
                aria-describedby={`goal-${goal.value}-label`}
              />
              <Label
                htmlFor={`goal-${goal.value}`}
                id={`goal-${goal.value}-label`}
                className="text-xs sm:text-sm text-gray-700 font-normal cursor-pointer flex-1 py-1.5 sm:py-2"
              >
                {goal.label}
              </Label>
            </div>
          ))}
        </div>
        {errors.primaryGoals && (
          <p className="text-sm text-red-600" role="alert">
            {errors.primaryGoals}
          </p>
        )}
      </div>

      {/* Recommended Features (if any) */}
      {recommendedFeatures.length > 0 && (
        <div className="p-3 sm:p-4 bg-ethos-purple/5 border border-ethos-purple/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-ethos-purple flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-ethos-navy mb-1">
                Recommended Features
              </p>
              <p className="text-xs text-gray-700">
                Based on your goals, you might want to consider these features:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                {recommendedFeatures.map((featureValue) => {
                  const feature = specificFeatures.find((f) => f.value === featureValue);
                  if (!feature) return null;
                  return (
                    <span
                      key={featureValue}
                      className="inline-flex items-center px-2 py-1 bg-ethos-purple/10 text-ethos-purple text-xs rounded-full"
                    >
                      {feature.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specific Features */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium">
          Specific Features <span className="text-gray-500 font-normal">(Optional)</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          Select any specific features you need (you can select multiple)
        </p>
        <div className="flex flex-col gap-2 sm:gap-2.5" role="group" aria-labelledby="specificFeatures-label">
          {specificFeatures.map((feature) => {
            const isRecommended = recommendedFeatures.includes(feature.value);
            return (
              <div key={feature.value} className="flex items-start gap-3">
                <Checkbox
                  id={`feature-${feature.value}`}
                  checked={formData.specificFeatures.includes(feature.value)}
                  onCheckedChange={(checked) =>
                    handleFeatureChange(feature.value, checked as boolean)
                  }
                  className="mt-1 h-4 w-4 sm:h-4 sm:w-4"
                  aria-describedby={`feature-${feature.value}-label`}
                />
                <Label
                  htmlFor={`feature-${feature.value}`}
                  id={`feature-${feature.value}-label`}
                  className="text-xs sm:text-sm text-gray-700 font-normal cursor-pointer flex-1 py-1.5 sm:py-2 flex items-center gap-2 flex-wrap"
                >
                  <span>{feature.label}</span>
                  {isRecommended && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-ethos-purple/10 text-ethos-purple text-xs rounded-full">
                      Recommended
                    </span>
                  )}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Help Text */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Why we need this:</strong> Understanding your goals and desired features helps us
          provide an accurate scope and timeline for your project.
        </p>
      </div>
    </div>
  );
};
