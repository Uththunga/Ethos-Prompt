/**
 * Step 5: Consultation Preference
 * Collects consultation preferences and availability
 */

import React, { useEffect } from 'react';
import { Label } from '@/components/marketing/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/marketing/ui/radio-group';
import { Checkbox } from '@/components/marketing/ui/checkbox';
import { Calendar, Phone, Video, Users, Globe } from 'lucide-react';
import type { FormStepProps } from '../types';
import { CONSULTATION_FORMAT_OPTIONS, TIME_SLOT_OPTIONS } from '../types';

export const Step5ConsultationPreference: React.FC<FormStepProps> = ({
  formData,
  errors,
  onChange,
  onClearError: _onClearError,
}) => {
  // Auto-detect timezone when consultation is selected
  useEffect(() => {
    if (formData.needsConsultation && !formData.timezone) {
      try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        onChange('timezone', detectedTimezone);
      } catch (e) {
        console.warn('Could not detect timezone:', e);
      }
    }
  }, [formData.needsConsultation, formData.timezone, onChange]);

  // Get friendly timezone label
  const getTimezoneLabel = (tz: string | undefined): string => {
    if (!tz) return 'Unknown';
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-AU', {
        timeZone: tz,
        timeZoneName: 'long',
      });
      const parts = formatter.formatToParts(now);
      const tzName = parts.find(p => p.type === 'timeZoneName')?.value || tz;
      return tzName;
    } catch {
      return tz;
    }
  };

  // Get icon for consultation format
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'phone':
        return <Phone className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'in-person':
        return <Users className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Info Box */}
      <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm font-medium text-green-900 mb-1">
              Free Consultation Available
            </p>
            <p className="text-xs text-green-700">
              We offer a free consultation to discuss your project in detail, answer questions, and
              refine your quotation. No obligation required.
            </p>
          </div>
        </div>
      </div>

      {/* Needs Consultation */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-sm sm:text-base text-ethos-navy font-medium">
          Would you like to schedule a consultation? <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs sm:text-sm text-gray-600">
          A consultation helps us understand your needs better and provide more accurate pricing.
        </p>
        <RadioGroup
          value={formData.needsConsultation ? 'yes' : 'no'}
          onValueChange={(value) => {
            const isYes = value === 'yes';
            onChange('needsConsultation', isYes);
            // Clear consultation-related fields if "no" is selected
            if (!isYes) {
              // Use setTimeout to batch these updates after the first one completes
              setTimeout(() => {
                onChange('consultationFormat', null);
                onChange('preferredTimeSlots', []);
                onChange('timezone', undefined);
              }, 0);
            }
          }}
          className="flex flex-col gap-2 sm:gap-2.5"
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem
              value="yes"
              id="consultation-yes"
              className="h-4 w-4 sm:h-4 sm:w-4"
            />
            <Label
              htmlFor="consultation-yes"
              className="text-sm sm:text-base text-gray-700 font-normal cursor-pointer flex-1 py-1.5 sm:py-2"
            >
              <strong>Yes, I'd like a consultation</strong> - Discuss my project with an expert
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem
              value="no"
              id="consultation-no"
              className="h-4 w-4 sm:h-4 sm:w-4"
            />
            <Label
              htmlFor="consultation-no"
              className="text-sm sm:text-base text-gray-700 font-normal cursor-pointer flex-1 py-1.5 sm:py-2"
            >
              <strong>No, just send me the quotation</strong> - I'll review it and reach out if
              needed
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Consultation Format (conditional) */}
      {formData.needsConsultation && (
        <>
          <div className="flex flex-col gap-2.5">
            <Label className="text-sm sm:text-base text-ethos-navy font-medium">
              Preferred Consultation Format <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={formData.consultationFormat || ''}
              onValueChange={(value) => onChange('consultationFormat', value)}
              className="flex flex-col gap-2 sm:gap-2.5"
              aria-invalid={!!errors.consultationFormat}
              aria-describedby={errors.consultationFormat ? 'consultationFormat-error' : undefined}
            >
              {CONSULTATION_FORMAT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-3">
                  <RadioGroupItem
                    value={option.value}
                    id={`format-${option.value}`}
                    className="h-4 w-4 sm:h-4 sm:w-4"
                  />
                  <Label
                    htmlFor={`format-${option.value}`}
                    className="text-sm sm:text-base text-gray-700 font-normal cursor-pointer flex-1 py-1.5 sm:py-2 flex items-center gap-2"
                  >
                    {getFormatIcon(option.value)}
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.consultationFormat && (
              <p id="consultationFormat-error" className="text-sm text-red-600" role="alert">
                {errors.consultationFormat}
              </p>
            )}
          </div>

          {/* Preferred Time Slots */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm sm:text-base text-ethos-navy font-medium">
              Preferred Time Slots <span className="text-gray-500 font-normal">(Optional)</span>
            </Label>
            <div className="flex flex-col gap-2">
              {TIME_SLOT_OPTIONS.map((timeSlot) => (
                <div key={timeSlot.value} className="flex items-center gap-3">
                  <Checkbox
                    id={`time-${timeSlot.value}`}
                    checked={formData.preferredTimeSlots.includes(timeSlot.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange('preferredTimeSlots', [...formData.preferredTimeSlots, timeSlot.value]);
                      } else {
                        onChange('preferredTimeSlots', formData.preferredTimeSlots.filter((t) => t !== timeSlot.value));
                      }
                    }}
                    className="h-4 w-4 sm:h-4 sm:w-4"
                  />
                  <Label htmlFor={`time-${timeSlot.value}`} className="text-sm sm:text-base text-gray-700 font-normal cursor-pointer flex-1 py-1.5 sm:py-2">
                    {timeSlot.label}
                  </Label>
                </div>
              ))}
            </div>
            {/* Timezone Display */}
            {formData.timezone && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Globe className="w-3.5 h-3.5" />
                <span>Your timezone: <strong>{getTimezoneLabel(formData.timezone)}</strong></span>
              </div>
            )}
          </div>

          {/* Consultation Benefits */}
          <div className="p-3 sm:p-4 bg-ethos-navy/5 border border-ethos-navy/20 rounded-lg">
            <h4 className="text-xs sm:text-sm font-semibold text-ethos-navy mb-2">
              What to Expect in Your Consultation
            </h4>
            <ul className="flex flex-col gap-1 text-xs sm:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Detailed discussion of your project requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Technical feasibility assessment</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Timeline and milestone planning</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Refined pricing based on your specific needs</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Q&A session to address all your concerns</span>
              </li>
            </ul>
          </div>
        </>
      )}

      {/* What Happens Next */}
      <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-xs sm:text-sm font-semibold text-ethos-navy mb-2">What Happens Next?</h4>
        <ol className="flex flex-col gap-2 text-xs sm:text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-ethos-purple">1.</span>
            <span>
              You'll receive a confirmation email within 1 minute with your reference number
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-ethos-purple">2.</span>
            <span>Our team will review your requirements and prepare a custom quotation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-ethos-purple">3.</span>
            <span>
              {formData.needsConsultation
                ? "We'll contact you within 24 business hours to schedule your consultation"
                : "You'll receive your detailed quotation within 24 hours"}
            </span>
          </li>
        </ol>
      </div>

      {/* Help Text */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <p className="text-xs sm:text-sm text-gray-600">
          <strong>Ready to submit?</strong> Click "Submit Request" below to send your requirements
          to our team. We'll get back to you promptly with your custom quotation.
        </p>
      </div>
    </div>
  );
};
