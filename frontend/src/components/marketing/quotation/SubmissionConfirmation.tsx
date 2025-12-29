/**
 * SubmissionConfirmation - Success page after quotation request submission
 */

import React, { useState } from 'react';
import { Button } from '@/components/marketing/ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/marketing/ui/accordion';
import { CheckCircle, Shield, Mail, Calendar, FileText } from 'lucide-react';
import type { SubmissionConfirmationProps } from './types';
import {
    INDUSTRY_OPTIONS,
    COMPANY_SIZE_OPTIONS,
    DATA_VOLUME_OPTIONS,
    TIMELINE_OPTIONS,
    BUDGET_RANGE_OPTIONS,
    FLEXIBILITY_OPTIONS,
    SECURITY_REQUIREMENTS_OPTIONS,
    CONSULTATION_FORMAT_OPTIONS,
    TIME_SLOT_OPTIONS,
    SERVICE_CONFIGS,
} from './types';

/**
 * SubmissionConfirmation Component
 *
 * Displays success message and submitted requirements summary after form submission
 */
export const SubmissionConfirmation: React.FC<SubmissionConfirmationProps> = ({
  referenceNumber,
  submittedData,
  onClose,
  serviceContext = 'solutions',
}) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Helper to get label from value
  const getLabel = (options: Array<{ value: string; label: string }>, value: string): string => {
    return options.find((opt) => opt.value === value)?.label || value;
  };

  // Helper to get multiple labels
  const getLabels = (options: Array<{ value: string; label: string }>, values: string[]): string => {
    return values.map((v) => getLabel(options, v)).join(', ');
  };

  // Get service-specific config for goal/feature labels
  const serviceConfig = SERVICE_CONFIGS[serviceContext as keyof typeof SERVICE_CONFIGS] || SERVICE_CONFIGS.solutions;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Success Icon and Message */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-ethos-navy mb-2 px-4">
          Success! Your Request Has Been Received
        </h2>
        <p className="text-sm sm:text-base text-gray-600 px-4">
          Thank you for your interest. We're excited to work with you!
        </p>
      </div>

      {/* Reference Number */}
      <div className="p-3 sm:p-4 bg-ethos-purple/5 border border-ethos-purple/20 rounded-lg text-center">
        <p className="text-xs sm:text-sm text-ethos-purple mb-1">Your Reference Number</p>
        <p className="text-lg sm:text-2xl font-bold text-ethos-navy font-mono break-all">{referenceNumber}</p>
        <p className="text-xs text-ethos-purple/80 mt-1">
          Save this number for your records
        </p>
      </div>

      {/* What Happens Next */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h3 className="text-base sm:text-lg font-semibold text-ethos-navy">What Happens Next:</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-ethos-purple text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-ethos-purple" />
                <p className="text-sm sm:text-base font-medium text-ethos-navy">Confirmation Email</p>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 break-words">
                You'll receive a confirmation email within 1 minute at{' '}
                <strong className="break-all">{submittedData.contactEmail}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-ethos-purple text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-ethos-purple" />
                <p className="text-sm sm:text-base font-medium text-ethos-navy">Requirements Review</p>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Our team will carefully review your requirements and prepare a custom quotation
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-ethos-purple text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-ethos-purple" />
                <p className="text-sm sm:text-base font-medium text-ethos-navy">
                  {submittedData.needsConsultation ? 'Consultation Scheduling' : 'Quotation Delivery'}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                {submittedData.needsConsultation
                  ? "We'll contact you within 24 business hours to schedule your free consultation"
                  : "You'll receive your detailed quotation within 24 hours"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Summary */}
      <div>
        <Accordion
          type="single"
          collapsible
          value={isAccordionOpen ? 'summary' : ''}
          onValueChange={(value) => setIsAccordionOpen(value === 'summary')}
        >
          <AccordionItem value="summary" className="border border-gray-200 rounded-lg px-4">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-sm sm:text-base font-semibold text-ethos-navy">
                View Your Submitted Requirements
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 sm:gap-4 pt-2">
                {/* Business Information */}
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-ethos-navy mb-2">Business Information</h4>
                  <dl className="flex flex-col gap-1.5 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <dt className="text-gray-600 w-full sm:w-32">Company:</dt>
                      <dd className="text-gray-900 font-medium break-words">{submittedData.companyName}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <dt className="text-gray-600 w-full sm:w-32">Industry:</dt>
                      <dd className="text-gray-900">{getLabel(INDUSTRY_OPTIONS, submittedData.industry)}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <dt className="text-gray-600 w-full sm:w-32">Company Size:</dt>
                      <dd className="text-gray-900">{getLabel(COMPANY_SIZE_OPTIONS, submittedData.companySize)}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <dt className="text-gray-600 w-full sm:w-32">Contact:</dt>
                      <dd className="text-gray-900">{submittedData.contactName}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <dt className="text-gray-600 w-full sm:w-32">Email:</dt>
                      <dd className="text-gray-900 break-all">{submittedData.contactEmail}</dd>
                    </div>
                    {submittedData.contactPhone && (
                      <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                        <dt className="text-gray-600 w-full sm:w-32">Phone:</dt>
                        <dd className="text-gray-900 break-all">{submittedData.contactPhone}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Project Scope */}
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-ethos-navy mb-2">Project Scope</h4>
                  <dl className="flex flex-col gap-1 text-xs sm:text-sm">
                    <div>
                      <dt className="text-gray-600 mb-1">Description:</dt>
                      <dd className="text-gray-900 whitespace-pre-wrap">{submittedData.projectDescription}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 mb-1">Primary Goals:</dt>
                      <dd className="text-gray-900">
                        {submittedData.primaryGoals.map((goal) => (
                          <span key={goal} className="inline-block mr-1.5 sm:mr-2 mb-1 px-2 py-1 bg-ethos-purple/10 text-ethos-purple rounded text-xs">
                            {getLabel(serviceConfig.primaryGoals, goal)}
                          </span>
                        ))}
                      </dd>
                    </div>
                    {submittedData.specificFeatures.length > 0 && (
                      <div>
                        <dt className="text-gray-600 mb-1">Specific Features:</dt>
                        <dd className="text-gray-900">
                          {submittedData.specificFeatures.map((feature) => (
                            <span key={feature} className="inline-block mr-1.5 sm:mr-2 mb-1 px-2 py-1 bg-ethos-navy/10 text-ethos-navy rounded text-xs">
                              {getLabel(serviceConfig.specificFeatures, feature)}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Technical Requirements */}
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-ethos-navy mb-2">Technical Requirements</h4>
                  <dl className="flex flex-col gap-1 text-xs sm:text-sm">
                    {submittedData.existingSystems.length > 0 && (
                      <div>
                        <dt className="text-gray-600 mb-1">Existing Systems:</dt>
                        <dd className="text-gray-900 break-words">{submittedData.existingSystems.join(', ')}</dd>
                      </div>
                    )}
                    {submittedData.integrationNeeds && (
                      <div>
                        <dt className="text-gray-600 mb-1">Integration Needs:</dt>
                        <dd className="text-gray-900">{submittedData.integrationNeeds}</dd>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <dt className="text-gray-600 w-full sm:w-32">Data Volume:</dt>
                      <dd className="text-gray-900">{getLabel(DATA_VOLUME_OPTIONS, submittedData.dataVolume)}</dd>
                    </div>
                    {submittedData.securityRequirements.length > 0 && (
                      <div>
                        <dt className="text-gray-600 mb-1">Security:</dt>
                        <dd className="text-gray-900">{getLabels(SECURITY_REQUIREMENTS_OPTIONS, submittedData.securityRequirements)}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Timeline & Budget */}
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-ethos-navy mb-2">Timeline & Budget</h4>
                  <dl className="flex flex-col gap-1.5 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <dt className="text-gray-600 w-full sm:w-32">Timeline:</dt>
                      <dd className="text-gray-900">{getLabel(TIMELINE_OPTIONS, submittedData.desiredTimeline)}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <dt className="text-gray-600 w-full sm:w-32">Budget:</dt>
                      <dd className="text-gray-900">{getLabel(BUDGET_RANGE_OPTIONS, submittedData.budgetRange)}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                      <dt className="text-gray-600 w-full sm:w-32">Flexibility:</dt>
                      <dd className="text-gray-900">{getLabel(FLEXIBILITY_OPTIONS, submittedData.flexibility)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Consultation */}
                {submittedData.needsConsultation && (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-ethos-navy mb-2">Consultation Preference</h4>
                    <dl className="flex flex-col gap-1.5 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-1">
                        <dt className="text-gray-600 w-full sm:w-32">Format:</dt>
                        <dd className="text-gray-900">
                          {submittedData.consultationFormat
                            ? getLabel(CONSULTATION_FORMAT_OPTIONS, submittedData.consultationFormat)
                            : 'Not specified'}
                        </dd>
                      </div>
                      {submittedData.preferredTimeSlots.length > 0 && (
                        <div>
                          <dt className="text-gray-600 mb-1">Preferred Times:</dt>
                          <dd className="text-gray-900">{getLabels(TIME_SLOT_OPTIONS, submittedData.preferredTimeSlots)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Data Protection Notice */}
      <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-green-800">
          <strong>Your information is protected.</strong> We will only use your data to prepare
          your quotation and provide consultation. We will never share your data with third parties.
        </p>
      </div>

      {/* Close Button */}
      <div className="flex justify-center pt-3 sm:pt-4">
        <Button
          onClick={onClose}
          variant="ethos"
          size="lg"
          className="min-w-[160px] sm:min-w-[200px] text-sm sm:text-base"
        >
          Close
        </Button>
      </div>
    </div>
  );
};
