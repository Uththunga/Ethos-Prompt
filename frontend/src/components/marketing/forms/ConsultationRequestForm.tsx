/**
 * ConsultationRequestForm
 * Streamlined consultation booking form embedded within chat interface
 * Single-step form with inline validation and success confirmation
 */

import React, { useState, useCallback, useId, useEffect } from 'react';
import { ChatFormContainer } from './ChatFormContainer';
import type {
    ConsultationFormData,
    ConsultationRequestFormProps,
    ContactPreference,
    FormValidationErrors,
} from './chatFormTypes';
import { DEFAULT_CONSULTATION_FORM_DATA } from './chatFormTypes';
import {
    validateConsultationField,
    validateConsultationForm,
    hasErrors,
} from './chatFormValidation';
import { chatFormService } from '@/services/chatFormService';
import { consultationAnalytics } from '@/services/formAnalytics';
import './ChatForms.css';

export const ConsultationRequestForm: React.FC<ConsultationRequestFormProps> = ({
  onClose,
  onSubmit,
  onComplete,
  prefillData,
  pageContext = 'solutions',
}) => {
  const [formData, setFormData] = useState<ConsultationFormData>({
    ...DEFAULT_CONSULTATION_FORM_DATA,
    ...prefillData,
  });
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generate unique IDs for accessibility
  const formId = useId();

  // Screen reader announcement state
  const [srAnnouncement, setSrAnnouncement] = useState('');

  // Track form opened
  useEffect(() => {
    const source = prefillData ? 'roi_calculator' : 'button';
    consultationAnalytics.opened(source as 'button' | 'agent' | 'roi_calculator');
  }, [prefillData]);

  // ==========================================================================
  // Field Handlers
  // ==========================================================================

  const handleChange = useCallback(
    (field: keyof ConsultationFormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;

        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
          setErrors((prev) => {
            const { [field]: _, ...rest } = prev;
            return rest;
          });
        }

        // Clear submit error
        if (submitError) {
          setSubmitError(null);
        }
      },
    [errors, submitError]
  );

  const handleRadioChange = (value: ContactPreference) => {
    setFormData((prev) => ({
      ...prev,
      contactPreference: value,
    }));

    // Clear error if exists
    setErrors((prev) => {
      if (prev.contactPreference) {
        const { contactPreference: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  };

  const handleBlur = useCallback(
    (field: keyof ConsultationFormData) => () => {
      const value = formData[field] || ''; // Handle optional fields like phone
      const error = validateConsultationField(field, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [formData]
  );

  // ==========================================================================
  // Form Submission
  // ==========================================================================



  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all fields
      const allErrors = validateConsultationForm(formData);
      if (hasErrors(allErrors)) {
        setErrors(allErrors);
        // Track first validation error
        const firstError = Object.keys(allErrors)[0];
        if (firstError) {
          consultationAnalytics.validationError(firstError);
        }
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Submit via backend service
        const result = await chatFormService.submitConsultation(formData, pageContext);

        if (result.success) {
          setReferenceNumber(result.referenceNumber);
          setIsSuccess(true);

          // Screen reader announcement
          setSrAnnouncement(`Thank you! Your consultation request has been submitted successfully. Reference number: ${result.referenceNumber}`);

          // Track analytics
          consultationAnalytics.submitted(
            formData.contactPreference,
            !!prefillData
          );

          // Track submission in history
          chatFormService.addFormSubmission({
            id: result.referenceNumber,
            type: 'consultation-request',
            data: formData,
            referenceNumber: result.referenceNumber,
            submittedAt: new Date(),
          });

          onSubmit?.(formData, result.referenceNumber);
          onComplete?.({ ...formData, referenceNumber: result.referenceNumber });
        } else {
          setSubmitError(result.error || 'Unable to submit request. Please try again.');
        }
      } catch (error) {
        console.error('Submission error:', error);
        setSubmitError('Unable to submit request. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit, onComplete]
  );

  // ==========================================================================
  // Render Field
  // ==========================================================================

  const renderTextField = (
    field: keyof ConsultationFormData,
    label: string,
    placeholder: string,
    required: boolean = true,
    type: 'text' | 'email' = 'text'
  ) => {
    const fieldId = `${formId}-${field}`;
    const errorId = `${fieldId}-error`;
    const hasError = !!errors[field];

    return (
      <div className="chat-form-field">
        <label
          htmlFor={fieldId}
          className={`chat-form-label ${required ? 'chat-form-label-required' : ''}`}
        >
          {label}
        </label>
        <input
          type={type}
          id={fieldId}
          className={`chat-form-input ${hasError ? 'error' : ''}`}
          value={formData[field]}
          onChange={handleChange(field)}
          onBlur={handleBlur(field)}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          disabled={isSubmitting}
        />
        {hasError && (
          <div id={errorId} className="chat-form-error" role="alert">
            <span aria-hidden="true">⚠</span>
            {errors[field]}
          </div>
        )}
      </div>
    );
  };

  const renderTextarea = (
    field: keyof ConsultationFormData,
    label: string,
    placeholder: string
  ) => {
    const fieldId = `${formId}-${field}`;
    const errorId = `${fieldId}-error`;
    const hasError = !!errors[field];

    return (
      <div className="chat-form-field">
        <label htmlFor={fieldId} className="chat-form-label">
          {label}
        </label>
        <textarea
          id={fieldId}
          className={`chat-form-textarea ${hasError ? 'error' : ''}`}
          value={formData[field]}
          onChange={handleChange(field)}
          onBlur={handleBlur(field)}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          disabled={isSubmitting}
          rows={3}
        />
        {hasError && (
          <div id={errorId} className="chat-form-error" role="alert">
            <span aria-hidden="true">⚠</span>
            {errors[field]}
          </div>
        )}
      </div>
    );
  };

  // ==========================================================================
  // Render Success State
  // ==========================================================================

  if (isSuccess) {
    return (
      <ChatFormContainer title="Request Received" icon="" onClose={onClose}>
        {/* Screen reader announcements */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {srAnnouncement}
        </div>

        <div className="chat-form-success">
          <div className="chat-form-success-icon" aria-hidden="true">
            ✓
          </div>
          <h4>Thank You, {formData.name}!</h4>
          <p>
            We've received your consultation request and will be in touch via{' '}
            {formData.contactPreference === 'phone'
              ? 'phone'
              : formData.contactPreference === 'video'
                ? 'video call'
                : 'email'}{' '}
            within 24 hours.
          </p>
          <div className="chat-form-reference">Reference: {referenceNumber}</div>
        </div>
        <div className="chat-form-actions">
          <button
            type="button"
            className="chat-form-btn chat-form-btn-primary"
            onClick={onClose}
          >
            Continue Chatting
          </button>
        </div>
      </ChatFormContainer>
    );
  }

  // ==========================================================================
  // Render Form
  // ==========================================================================

  return (
    <ChatFormContainer title="Request a Consultation" icon="" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
          Tell us how to reach you and we'll schedule a free consultation.
        </p>

        {renderTextField('name', 'Your Name', 'e.g., John Smith', true)}
        {renderTextField('email', 'Email Address', 'e.g., john@company.com', true, 'email')}
        {renderTextField('company', 'Company Name', 'e.g., Acme Corp', false)}

        {/* Contact Preference Radio Group */}
        <div className="chat-form-field">
          <span className="chat-form-label chat-form-label-required">
            Preferred Contact Method
          </span>
          <div
            className="chat-form-radio-group"
            role="radiogroup"
            aria-labelledby={`${formId}-contact-label`}
          >
            {[
              { value: 'email' as const, label: 'Email' },
              { value: 'phone' as const, label: 'Phone' },
              { value: 'video' as const, label: 'Video' },
            ].map((option) => (
              <div key={option.value} className="chat-form-radio">
                <input
                  type="radio"
                  id={`${formId}-contact-${option.value}`}
                  name="contactPreference"
                  value={option.value}
                  checked={formData.contactPreference === option.value}
                  onChange={() => handleRadioChange(option.value)}
                  disabled={isSubmitting}
                />
                <label htmlFor={`${formId}-contact-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
          {errors.contactPreference && (
            <div className="chat-form-error" role="alert">
              <span aria-hidden="true">⚠</span>
              {errors.contactPreference}
            </div>
          )}
        </div>

        {/* Conditional Phone Field - only show if phone is selected */}
        {formData.contactPreference === 'phone' && (
          <>
            {renderTextField('phone', 'Phone Number', '+1 (555) 123-4567', true, 'text')}
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '-8px 0 16px' }}>
              We'll call you at this number to discuss your needs.
            </p>
          </>
        )}

        {/* Helpful note for video preference */}
        {formData.contactPreference === 'video' && (
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px', padding: '12px', background: '#f3f4f6', borderRadius: '6px' }}>
            💡 We'll send you a video call link (Zoom/Google Meet) via email after you submit this form.
          </p>
        )}

        {renderTextarea('notes', 'Additional Notes', "Anything specific you'd like to discuss?")}

        {/* Submit Error */}
        {submitError && (
          <div
            className="chat-form-error"
            role="alert"
            style={{ marginBottom: '12px', justifyContent: 'center' }}
          >
            <span aria-hidden="true">⚠</span>
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="chat-form-actions">
          <button
            type="button"
            className="chat-form-btn chat-form-btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="chat-form-btn chat-form-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="chat-form-spinner" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </form>
    </ChatFormContainer>
  );
};

export default ConsultationRequestForm;
