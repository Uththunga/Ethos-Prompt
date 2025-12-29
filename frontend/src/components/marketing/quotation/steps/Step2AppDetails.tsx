/**
 * Step 2.5: Application Details
 * Service-specific questions for Intelligent Applications quotations
 */

import React from 'react';
import { Label } from '@/components/marketing/ui/label';
import { Checkbox } from '@/components/marketing/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/marketing/ui/radio-group';
import { Smartphone, Globe, Code, Wifi, Store } from 'lucide-react';
import type { FormStepProps, ApplicationConfig } from '../types';
import { APP_TYPE_OPTIONS, APP_DEV_APPROACH_OPTIONS } from '../types';

export const Step2AppDetails: React.FC<FormStepProps> = ({
  formData,
  errors,
  onChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClearError: _,
}) => {
  // Get or create the app config
  const appConfig: ApplicationConfig = formData.applicationConfig || {
    applicationType: '',
    developmentApproach: '',
    offlineRequired: false,
    appStoreSubmission: false,
    existingBackend: false,
  };

  // Update app config field
  const updateConfig = (field: keyof ApplicationConfig, value: any) => {
    onChange('applicationConfig', {
      ...appConfig,
      [field]: value,
    });
  };

  // Check if mobile type selected
  const isMobile = ['mobile-ios', 'mobile-android', 'mobile-both'].includes(appConfig.applicationType);
  const isPWA = appConfig.applicationType === 'pwa';

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Section Header */}
      <div className="p-3 sm:p-4 bg-ethos-purple/5 border border-ethos-purple/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Code className="w-5 h-5 text-ethos-purple flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ethos-navy mb-1">
              Application Configuration
            </p>
            <p className="text-xs text-gray-700">
              Tell us about the type of application you need. This helps us determine
              the right technology stack and development approach.
            </p>
          </div>
        </div>
      </div>

      {/* Application Type */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium">
          Application Type <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          What type of application do you need?
        </p>
        <RadioGroup
          value={appConfig.applicationType || ''}
          onValueChange={(value) => {
            // Update all fields in a single call to avoid stale closure issues
            if (value === 'web-only') {
              // Reset mobile-specific fields when switching to web-only
              onChange('applicationConfig', {
                ...appConfig,
                applicationType: value,
                developmentApproach: '',
                offlineRequired: false,
                appStoreSubmission: false,
              });
            } else {
              updateConfig('applicationType', value);
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {APP_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`app-type-${option.value}`}
              className={`flex items-center gap-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors min-h-[52px] ${
                appConfig.applicationType === option.value
                  ? 'border-ethos-purple bg-ethos-purple/5'
                  : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
              }`}
            >
              <RadioGroupItem
                value={option.value}
                id={`app-type-${option.value}`}
                className="h-4 w-4 flex-shrink-0"
              />
              <div className="flex items-center gap-2 flex-1">
                {option.value.includes('mobile') ? (
                  <Smartphone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : option.value === 'pwa' ? (
                  <Wifi className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-700">
                  {option.label}
                </span>
              </div>
            </label>
          ))}
        </RadioGroup>
        {errors['applicationConfig.applicationType'] && (
          <p className="text-sm text-red-600" role="alert">
            {errors['applicationConfig.applicationType']}
          </p>
        )}
      </div>

      {/* Mobile-specific: Development Approach */}
      {isMobile && (
        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg">
          <Label className="text-sm sm:text-base text-ethos-navy font-medium">
            Development Approach
          </Label>
          <p className="text-xs sm:text-sm text-gray-600">
            How should the mobile app be built?
          </p>
          <RadioGroup
            value={appConfig.developmentApproach || ''}
            onValueChange={(value) => updateConfig('developmentApproach', value)}
            className="flex flex-col gap-2"
          >
            {APP_DEV_APPROACH_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-3">
                <RadioGroupItem
                  value={option.value}
                  id={`approach-${option.value}`}
                  className="h-2.5 w-2.5"
                />
                <Label
                  htmlFor={`approach-${option.value}`}
                  className="text-xs sm:text-sm text-gray-700 font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <p className="text-xs text-gray-500 mt-1">
            💡 Cross-platform approaches (React Native, Flutter) can reduce development
            time and cost when targeting both iOS and Android.
          </p>
        </div>
      )}

      {/* Mobile/PWA specific options */}
      {(isMobile || isPWA) && (
        <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
          <Label className="text-sm font-semibold text-ethos-navy">
            Additional Requirements
          </Label>

          {/* Offline Support */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="offlineRequired"
              checked={appConfig.offlineRequired}
              onCheckedChange={(checked) => updateConfig('offlineRequired', !!checked)}
            />
            <div>
              <Label
                htmlFor="offlineRequired"
                className="text-sm text-gray-700 font-normal cursor-pointer flex items-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                Offline functionality required
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">
                App should work without internet connection
              </p>
            </div>
          </div>

          {/* App Store Submission */}
          {isMobile && (
            <div className="flex items-start gap-3">
              <Checkbox
                id="appStoreSubmission"
                checked={appConfig.appStoreSubmission}
                onCheckedChange={(checked) => updateConfig('appStoreSubmission', !!checked)}
              />
              <div>
                <Label
                  htmlFor="appStoreSubmission"
                  className="text-sm text-gray-700 font-normal cursor-pointer flex items-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  App Store submission help needed
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  We'll handle Apple App Store and/or Google Play submission
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backend Requirement */}
      <div className="flex flex-col gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox
            id="existingBackend"
            checked={appConfig.existingBackend}
            onCheckedChange={(checked) => updateConfig('existingBackend', !!checked)}
          />
          <Label
            htmlFor="existingBackend"
            className="text-sm sm:text-base text-ethos-navy font-medium cursor-pointer"
          >
            We have an existing backend/API
          </Label>
        </div>
        <p className="text-xs text-gray-600 ml-7">
          Check this if you already have a backend or API the app will connect to.
          Leave unchecked if we need to build the backend too.
        </p>
      </div>

      {/* Help Text */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Why we need this:</strong> Application type and platform significantly
          affect development time and cost. Mobile apps targeting both platforms can
          cost 40-60% more than single-platform solutions.
        </p>
      </div>
    </div>
  );
};
