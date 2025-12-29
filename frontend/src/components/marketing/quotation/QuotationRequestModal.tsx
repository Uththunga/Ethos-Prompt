/**
 * QuotationRequestModal - Main modal component for the Advanced CTA Quotation System
 */

import React, { useEffect, useReducer, useCallback, useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/marketing/ui/dialog';
import { Button } from '@/components/marketing/ui/button';
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import type { QuotationRequestModalProps } from './types';
import {
    formReducer,
    initialFormState,
    loadFormDataFromStorage,
    clearFormDataFromStorage,
    clearFormDataFromStorageForService,
    getStepData,
    loadFormDataFromStorageForService,
    saveFormDataToStorageForService,
} from './formReducer';
import { validateStep } from './validation';
import { Step1BusinessInfo } from './steps/Step1BusinessInfo';
import { Step2ProjectScope } from './steps/Step2ProjectScope';
import { Step2AIDetails } from './steps/Step2AIDetails';
import { Step2IntegrationDetails } from './steps/Step2IntegrationDetails';
import { Step2AppDetails } from './steps/Step2AppDetails';
import { Step3TechnicalRequirements } from './steps/Step3TechnicalRequirements';
import { Step4TimelineBudget } from './steps/Step4TimelineBudget';
import { Step5ConsultationPreference } from './steps/Step5ConsultationPreference';
import { SubmissionConfirmation } from './SubmissionConfirmation';
import { quotationService } from '@/services/quotationService';
import { getPersistedROIResult } from '@/services/chatFormService';
import { useAnalytics as useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { quotationAnalytics } from '@/services/formAnalytics';
import { getPersistedUtmParams } from '@/utils/utmTracking';

/**
 * QuotationRequestModal Component
 *
 * Main modal that orchestrates the multi-step quotation request form.
 * Features:
 * - 5-step progressive form
 * - Auto-save to localStorage
 * - Step validation
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Mobile-responsive
 */
export const QuotationRequestModal: React.FC<QuotationRequestModalProps> = ({
  isOpen,
  onClose,
  serviceContext,
  serviceName, // Will be used in backend submission
  packageType = 'basic',
  packageName = '',
}) => {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const modalContentRef = useRef<HTMLDivElement>(null);
  const { trackServiceEvent, trackFormInteraction } = useMarketingAnalytics();

  // Check if this service needs a service-specific step (Step 2.5)
  const hasServiceSpecificStep = ['smart-assistant', 'system-integration', 'intelligent-applications'].includes(serviceContext);
  const totalSteps = hasServiceSpecificStep ? 6 : 5;

  // Update totalSteps in state when it changes
  useEffect(() => {
    if (state.totalSteps !== totalSteps) {
      dispatch({ type: 'SET_TOTAL_STEPS', payload: totalSteps });
    }
  }, [totalSteps, state.totalSteps]);

  useEffect(() => {
    if (isOpen) {
      // GAP-007: GA4-compatible tracking
      quotationAnalytics.opened(serviceContext, serviceName);
      trackServiceEvent({
        action: 'quotation_modal_opened',
        category: 'Quotation',
        label: serviceContext,
        service: serviceContext,
        page_section: 'quotation_modal',
        user_journey_stage: 'consideration',
      });
    }
  }, [isOpen, serviceContext, serviceName, trackServiceEvent]);

  // Load saved data on mount
  useEffect(() => {
    if (isOpen) {
      const savedByService = loadFormDataFromStorageForService(serviceContext);
      if (savedByService) {
        dispatch({ type: 'LOAD_SAVED_DATA', payload: savedByService });
      } else {
        const legacySaved = loadFormDataFromStorage();
        if (legacySaved) {
          dispatch({ type: 'LOAD_SAVED_DATA', payload: legacySaved });
        } else {
          const mapExitIntentKey = (ctx: string) =>
            ctx === 'intelligent-applications'
              ? 'web-mobile'
              : ctx === 'solutions'
              ? 'ai-solutions'
              : ctx;
          try {
            const key = `exit_intent_lead_${mapExitIntentKey(serviceContext)}`;
            const raw = localStorage.getItem(key);
            if (raw) {
              const lead = JSON.parse(raw);
              if (lead?.email) {
                dispatch({ type: 'UPDATE_FIELD', payload: { field: 'contactEmail', value: lead.email } });
              }
              if (lead?.name) {
                dispatch({ type: 'UPDATE_FIELD', payload: { field: 'contactName', value: lead.name } });
              }
            }
          } catch {
            // Intentionally ignoring JSON parse errors from localStorage
          }
        }
      }
    }
  }, [isOpen]);

  // Initialize service-specific configs for 6-step services
  // This ensures the configs are not undefined when validation runs
  useEffect(() => {
    if (isOpen && hasServiceSpecificStep) {
      // Initialize the appropriate config based on service context if not already set
      if (serviceContext === 'smart-assistant' && !state.formData.aiAssistantConfig) {
        dispatch({
          type: 'UPDATE_FIELD',
          payload: {
            field: 'aiAssistantConfig',
            value: {
              expectedMonthlyInteractions: '',
              deploymentChannels: [],
              languages: ['en'],
              humanHandoffRequired: false,
              knowledgeBaseSize: '',
            },
          },
        });
      } else if (serviceContext === 'system-integration' && !state.formData.integrationConfig) {
        dispatch({
          type: 'UPDATE_FIELD',
          payload: {
            field: 'integrationConfig',
            value: {
              integrations: [{
                id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                sourceSystem: '',
                targetSystem: '',
                direction: '',
                syncFrequency: '',
                apiAvailable: null,
              }],
            },
          },
        });
      } else if (serviceContext === 'intelligent-applications' && !state.formData.applicationConfig) {
        dispatch({
          type: 'UPDATE_FIELD',
          payload: {
            field: 'applicationConfig',
            value: {
              applicationType: '',
              developmentApproach: '',
              offlineRequired: false,
              appStoreSubmission: false,
              existingBackend: false,
            },
          },
        });
      }
    }
  }, [isOpen, hasServiceSpecificStep, serviceContext, state.formData.aiAssistantConfig, state.formData.integrationConfig, state.formData.applicationConfig]);

  // Auto-save form data when it changes (throttled)
  useEffect(() => {
    if (isOpen && state.currentStep > 1) {
      const timeoutId = setTimeout(() => {
        saveFormDataToStorageForService(serviceContext, state.formData);
      }, 2000); // Save 2 seconds after last change

      return () => clearTimeout(timeoutId);
    }
  }, [state.formData, state.currentStep, isOpen, serviceContext]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof typeof state.formData, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
    // Clear error for this field when user starts typing
    dispatch({ type: 'CLEAR_ERROR', payload: field });
  }, []);

  // Handle clear error
  const handleClearError = useCallback((field: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: field });
  }, []);

  // Handle next step
  const handleNext = useCallback(() => {
    // Validate current step before proceeding
    // Pass serviceContext for 6-step service flows
    const stepData = getStepData(state.formData, state.currentStep, serviceContext);
    const validation = validateStep(state.currentStep, stepData, serviceContext);

    if (!validation.isValid) {
      dispatch({ type: 'SET_ERRORS', payload: validation.errors });
      return;
    }

    // Clear errors and move to next step
    dispatch({ type: 'SET_ERRORS', payload: {} });

    trackServiceEvent({
      action: 'quotation_step_completed',
      category: 'Quotation',
      label: `step_${state.currentStep}`,
      service: serviceContext,
      page_section: 'quotation_modal',
      user_journey_stage:
        state.currentStep === state.totalSteps ? 'decision' : 'consideration',
      custom_parameters: {
        step: state.currentStep,
        total_steps: state.totalSteps,
      },
    });
    // GAP-007: GA4-compatible tracking
    quotationAnalytics.stepCompleted(state.currentStep, getStepTitle(state.currentStep));
    dispatch({ type: 'NEXT_STEP' });
  }, [state.formData, state.currentStep, state.totalSteps, serviceContext, trackServiceEvent]);

  // Handle previous step
  const handleBack = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!showConfirmation) {
      // GAP-007: GA4-compatible tracking
      quotationAnalytics.abandoned(state.currentStep, getStepTitle(state.currentStep));
      trackServiceEvent({
        action: 'quotation_abandoned',
        category: 'Quotation',
        label: serviceContext,
        service: serviceContext,
        page_section: 'quotation_modal',
        user_journey_stage: 'consideration',
        custom_parameters: {
          last_step: state.currentStep,
          total_steps: state.totalSteps,
        },
      });

      trackFormInteraction('quotation', 'abandon', serviceContext, {
        last_step: state.currentStep,
        total_steps: state.totalSteps,
      });
    }

    // Save data before closing
    if (state.currentStep > 1) {
      saveFormDataToStorageForService(serviceContext, state.formData);
    }
    onClose();
  }, [
    state.formData,
    state.currentStep,
    state.totalSteps,
    onClose,
    serviceContext,
    showConfirmation,
    trackServiceEvent,
    trackFormInteraction,
  ]);

  // Handle successful submission
  const handleSubmissionSuccess = useCallback((refNumber: string) => {
    // GAP-007: GA4-compatible tracking
    quotationAnalytics.submitted(refNumber, serviceContext);
    // Clear saved data from localStorage
    clearFormDataFromStorageForService(serviceContext);
    clearFormDataFromStorage();
    // Set reference number and show confirmation
    setReferenceNumber(refNumber);
    setShowConfirmation(true);
  }, [serviceContext]);

  // Handle closing confirmation and resetting
  const handleConfirmationClose = useCallback(() => {
    setShowConfirmation(false);
    dispatch({ type: 'RESET_FORM' });
    onClose();
  }, [onClose]);

  // Scroll to top when step changes
  useEffect(() => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.currentStep]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Get step title (dynamic based on service type)
  const getStepTitle = (step: number): string => {
    if (hasServiceSpecificStep) {
      const titles = [
        'Tell Us About Your Business',
        'Describe Your Project',
        serviceContext === 'smart-assistant' ? 'AI Assistant Details' :
        serviceContext === 'system-integration' ? 'Integration Details' :
        'Application Details',
        'Technical Requirements',
        'Timeline & Budget',
        'Consultation Preference',
      ];
      return titles[step - 1] || '';
    }
    const titles = [
      'Tell Us About Your Business',
      'Describe Your Project',
      'Technical Requirements',
      'Timeline & Budget',
      'Consultation Preference',
    ];
    return titles[step - 1] || '';
  };

  // Get step description (dynamic based on service type)
  const getStepDescription = (step: number): string => {
    if (hasServiceSpecificStep) {
      const descriptions = [
        'Help us understand your business so we can provide the most accurate quotation.',
        'Share your vision and goals for this project.',
        serviceContext === 'smart-assistant' ? 'Tell us about your AI assistant requirements.' :
        serviceContext === 'system-integration' ? 'Define the systems you need to connect.' :
        'Tell us about your application requirements.',
        'Let us know about your technical needs and existing systems.',
        'Tell us about your timeline and budget expectations.',
        'Would you like to schedule a consultation to discuss your project?',
      ];
      return descriptions[step - 1] || '';
    }
    const descriptions = [
      'Help us understand your business so we can provide the most accurate quotation.',
      'Share your vision and goals for this project.',
      'Let us know about your technical needs and existing systems.',
      'Tell us about your timeline and budget expectations.',
      'Would you like to schedule a consultation to discuss your project?',
    ];
    return descriptions[step - 1] || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        ref={modalContentRef}
        className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full"
        aria-describedby="quotation-modal-description"
      >
        {showConfirmation ? (
          // Show confirmation after successful submission
          <SubmissionConfirmation
            referenceNumber={referenceNumber}
            submittedData={state.formData}
            onClose={handleConfirmationClose}
            serviceContext={serviceContext}
          />
        ) : (
          <>
            {/* Progress Indicator */}
            <div className="mb-4 sm:mb-6" role="progressbar" aria-valuenow={state.currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-ethos-purple">
                  Step {state.currentStep} of {totalSteps}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                  {Math.round((state.currentStep / totalSteps) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-ethos-purple h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(state.currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-ethos-navy">
                {getStepTitle(state.currentStep)}
              </DialogTitle>
              <DialogDescription id="quotation-modal-description" className="text-sm sm:text-base text-gray-600 mt-2">
                {getStepDescription(state.currentStep)}
              </DialogDescription>
            </DialogHeader>

        {/* Trust Badge */}
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4 sm:mb-6">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-green-800">
            <strong>Your data is safe and secure.</strong> We only use your information to create
            your custom quotation and provide the best consultation experience.
          </p>
        </div>

        {/* Form Steps */}
        <div className="min-h-[300px]">
          {/* Step 1: Business Info - Always first */}
          {state.currentStep === 1 && (
            <Step1BusinessInfo
              formData={state.formData}
              errors={state.errors}
              onChange={handleFieldChange}
              onClearError={handleClearError}
              serviceContext={serviceContext}
              packageType={packageType}
              packageName={packageName}
            />
          )}

          {/* Step 2: Project Scope - Always second */}
          {state.currentStep === 2 && (
            <Step2ProjectScope
              formData={state.formData}
              errors={state.errors}
              onChange={handleFieldChange}
              onClearError={handleClearError}
              serviceContext={serviceContext}
              packageType={packageType}
              packageName={packageName}
            />
          )}

          {/* Step 3: Service-specific OR Technical Requirements */}
          {state.currentStep === 3 && (
            hasServiceSpecificStep ? (
              // Service-specific step
              serviceContext === 'smart-assistant' ? (
                <Step2AIDetails
                  formData={state.formData}
                  errors={state.errors}
                  onChange={handleFieldChange}
                  onClearError={handleClearError}
                  serviceContext={serviceContext}
                  packageType={packageType}
                  packageName={packageName}
                />
              ) : serviceContext === 'system-integration' ? (
                <Step2IntegrationDetails
                  formData={state.formData}
                  errors={state.errors}
                  onChange={handleFieldChange}
                  onClearError={handleClearError}
                  serviceContext={serviceContext}
                  packageType={packageType}
                  packageName={packageName}
                />
              ) : (
                <Step2AppDetails
                  formData={state.formData}
                  errors={state.errors}
                  onChange={handleFieldChange}
                  onClearError={handleClearError}
                  serviceContext={serviceContext}
                  packageType={packageType}
                  packageName={packageName}
                />
              )
            ) : (
              // No service-specific step, show Technical Requirements
              <Step3TechnicalRequirements
                formData={state.formData}
                errors={state.errors}
                onChange={handleFieldChange}
                onClearError={handleClearError}
                serviceContext={serviceContext}
                packageType={packageType}
                packageName={packageName}
              />
            )
          )}

          {/* Step 4: Technical Requirements (if has service step) OR Timeline & Budget */}
          {state.currentStep === 4 && (
            hasServiceSpecificStep ? (
              <Step3TechnicalRequirements
                formData={state.formData}
                errors={state.errors}
                onChange={handleFieldChange}
                onClearError={handleClearError}
                serviceContext={serviceContext}
                packageType={packageType}
                packageName={packageName}
              />
            ) : (
              <Step4TimelineBudget
                formData={state.formData}
                errors={state.errors}
                onChange={handleFieldChange}
                onClearError={handleClearError}
                serviceContext={serviceContext}
                packageType={packageType}
                packageName={packageName}
              />
            )
          )}

          {/* Step 5: Timeline & Budget (if has service step) OR Consultation */}
          {state.currentStep === 5 && (
            hasServiceSpecificStep ? (
              <Step4TimelineBudget
                formData={state.formData}
                errors={state.errors}
                onChange={handleFieldChange}
                onClearError={handleClearError}
                serviceContext={serviceContext}
                packageType={packageType}
                packageName={packageName}
              />
            ) : (
              <Step5ConsultationPreference
                formData={state.formData}
                errors={state.errors}
                onChange={handleFieldChange}
                onClearError={handleClearError}
                serviceContext={serviceContext}
                packageType={packageType}
                packageName={packageName}
              />
            )
          )}

          {/* Step 6: Consultation Preference (only if has service step) */}
          {state.currentStep === 6 && hasServiceSpecificStep && (
            <Step5ConsultationPreference
              formData={state.formData}
              errors={state.errors}
              onChange={handleFieldChange}
              onClearError={handleClearError}
              serviceContext={serviceContext}
              packageType={packageType}
              packageName={packageName}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-200 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={state.currentStep === 1}
            className="min-h-[44px] min-w-[80px] sm:min-w-[120px] text-sm sm:text-base"
            aria-label="Go to previous step"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Back
          </Button>

          <div className="flex justify-end gap-2">
            {state.currentStep < totalSteps ? (
              <Button
                type="button"
                variant="ethos"
                onClick={handleNext}
                disabled={state.isSubmitting}
                className="min-h-[44px] min-w-[80px] sm:min-w-[120px] text-sm sm:text-base"
                aria-label="Go to next step"
              >
                Next
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ethos"
                onClick={async () => {
                  // Validate final step - must pass serviceContext for 6-step flows
                  const stepData = getStepData(state.formData, state.currentStep, serviceContext);
                  const validation = validateStep(state.currentStep, stepData, serviceContext);

                  if (!validation.isValid) {
                    dispatch({ type: 'SET_ERRORS', payload: validation.errors });
                    return;
                  }

                  // Set submitting state
                  dispatch({ type: 'SET_SUBMITTING', payload: true });

                  try {
                    const metadata = {
                      submittedAt: new Date().toISOString(),
                      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                      referrerUrl: typeof document !== 'undefined' ? document.referrer || window.location.href : '',
                      // GAP-009: Include UTM params for marketing attribution
                      utmParams: getPersistedUtmParams(),
                    };

                    // GAP-005 FIX: Retrieve ROI calculator result if user completed it before quotation
                    const roiResult = getPersistedROIResult();
                    const roiSnapshot = roiResult ? {
                      serviceType: roiResult.serviceType,
                      monthlySavings: roiResult.monthlySavings,
                      annualSavings: roiResult.annualSavings,
                      calculatedAt: roiResult.calculatedAt.toISOString(),
                      ...(roiResult.roi !== undefined ? { roi: roiResult.roi } : {}),
                      ...(roiResult.paybackPeriod ? { paybackPeriod: roiResult.paybackPeriod } : {}),
                    } : undefined;

                    const response = await quotationService.submitQuotation({
                      serviceContext,
                      serviceName,
                      packageType,
                      packageName,
                      formData: state.formData,
                      metadata,
                      roiSnapshot,
                    });

                    if (!response.success || !response.referenceNumber) {
                      throw new Error(response.error || 'Submission failed');
                    }

                    trackServiceEvent({
                      action: 'quotation_submitted',
                      category: 'Quotation',
                      label: serviceContext,
                      service: serviceContext,
                      user_journey_stage: 'action',
                      page_section: 'quotation_modal',
                      custom_parameters: {
                        reference_number: response.referenceNumber,
                        service_name: serviceName,
                        package_type: packageType,
                        package_name: packageName || '',
                        ...(response.contactId ? { contact_id: response.contactId } : {}),
                      },
                    });

                    trackFormInteraction('quotation', 'complete', serviceContext, {
                      step: state.currentStep,
                      total_steps: state.totalSteps,
                      ...(response.contactId ? { contact_id: response.contactId } : {}),
                    });

                    handleSubmissionSuccess(response.referenceNumber);
                  } catch (error) {
                    console.error('Submission error:', error);
                    dispatch({
                      type: 'SET_ERRORS',
                      payload: { general: 'Failed to submit. Please try again.' },
                    });
                  } finally {
                    dispatch({ type: 'SET_SUBMITTING', payload: false });
                  }
                }}
                disabled={state.isSubmitting}
                className="min-h-[44px] min-w-[100px] sm:min-w-[120px] text-sm sm:text-base"
                aria-label="Submit quotation request"
              >
                {state.isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}
          </div>
        </div>

            {/* Privacy Notice */}
            <div className="pt-3 sm:pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                By submitting this form, you agree to our privacy policy. We will never share your data
                with third parties.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
