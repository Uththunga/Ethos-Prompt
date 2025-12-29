/**
 * ROICalculatorForm
 * Interactive ROI calculator embedded within chat interface
 * Features service selection + 2-step progressive disclosure with animated results
 * Supports 3 services: Smart Assistant, System Integration, Intelligent Applications
 */

import React, { useState, useCallback, useId, useEffect } from 'react';
import { ChatFormContainer } from './ChatFormContainer';
import type {
  ROIFormData,
  ROICalculationResult,
  ROICalculatorFormProps,
  FormValidationErrors,
  ROIServiceType,
} from './chatFormTypes';
import { DEFAULT_ROI_FORM_DATA } from './chatFormTypes';
import { validateROIField, validateROIFormForService, hasErrors } from './chatFormValidation';
import { chatFormService } from '@/services/chatFormService';
import { roiAnalytics } from '@/services/formAnalytics';
import { formatCurrency } from '@/hooks/useROICalculator';
import './ChatForms.css';

// Service metadata
const SERVICE_INFO: Record<ROIServiceType, { name: string; description: string }> = {
  'smart-assistant': {
    name: 'Smart Business Assistant',
    description: 'Customer service automation',
  },
  'system-integration': {
    name: 'System Integration',
    description: 'Connect your business apps',
  },
  'intelligent-applications': {
    name: 'Intelligent Applications',
    description: 'Discover your online potential',
  },
};

export const ROICalculatorForm: React.FC<ROICalculatorFormProps> = ({
  onClose,
  onCalculate,
  onRequestConsultation,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0); // Start at step 0 (service selection)
  const [formData, setFormData] = useState<ROIFormData>(DEFAULT_ROI_FORM_DATA);
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [result, setResult] = useState<ROICalculationResult | null>(null);

  // Generate unique IDs for accessibility
  const formId = useId();

  // Screen reader announcement state
  const [srAnnouncement, setSrAnnouncement] = useState('');

  // Track form opened
  useEffect(() => {
    roiAnalytics.opened('button');
  }, []);

  // ==========================================================================
  // Service Selection
  // ==========================================================================

  const handleServiceSelect = useCallback((service: ROIServiceType) => {
    setFormData((prev) => ({ ...prev, serviceType: service }));
    setCurrentStep(1);
    setSrAnnouncement(`Selected ${SERVICE_INFO[service].name}. Step 1: Enter your details.`);
  }, []);

  // ==========================================================================
  // Field Handlers
  // ==========================================================================

  const handleChange = useCallback(
    (field: keyof ROIFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const numValue = rawValue === '' ? '' : parseFloat(rawValue);

      setFormData((prev) => ({
        ...prev,
        [field]: numValue,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (field: keyof ROIFormData) => () => {
      const error = validateROIField(field, formData[field] as number | '');
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [formData]
  );

  // ==========================================================================
  // Step Navigation
  // ==========================================================================

  const handleNext = useCallback(() => {
    if (!formData.serviceType) return;

    // Validate only fields for the current step
    let stepErrors: FormValidationErrors = {};
    if (formData.serviceType === 'smart-assistant' && currentStep === 1) {
      // Step 1 fields
      const step1Fields: (keyof ROIFormData)[] = ['teamSize', 'monthlyInquiries'];
      step1Fields.forEach((field) => {
        const error = validateROIField(field, formData[field] as number | '');
        if (error) stepErrors[field] = error;
      });
    } else {
      // For single-step or final step, validate everything
      stepErrors = validateROIFormForService(formData, formData.serviceType);
    }

    if (hasErrors(stepErrors)) {
      setErrors(stepErrors);
      return;
    }

    // For Smart Assistant, go to step 2. Others calculate directly.
    if (formData.serviceType === 'smart-assistant' && currentStep === 1) {
      setCurrentStep(2);
      setSrAnnouncement('Step 2: Cost information');
    }
  }, [formData, currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep === 1) {
      setCurrentStep(0);
      setSrAnnouncement('Step 0: Select a service');
    } else if (currentStep === 2) {
      setCurrentStep(1);
      setSrAnnouncement('Step 1: Team information');
    }
  }, [currentStep]);

  // ==========================================================================
  // ROI Calculation (Service-Specific)
  // ==========================================================================

  const calculateROI = useCallback((): ROICalculationResult | null => {
    if (!formData.serviceType) return null;

    const allErrors = validateROIFormForService(formData, formData.serviceType);
    if (hasErrors(allErrors)) {
        setErrors(allErrors);
        return null;
    }

    let monthlySavings = 0;
    let annualSavings = 0;
    let paybackPeriod = '';
    let monthlyTimeSavings: number | undefined;
    let monthlyMoneySavings: number | undefined;
    let roi: number | undefined;

    switch (formData.serviceType) {
      case 'smart-assistant': {
        const { teamSize, monthlyInquiries, avgResponseTime, hourlyEmployeeCost } = formData;
        if (
          teamSize === '' ||
          monthlyInquiries === '' ||
          avgResponseTime === '' ||
          hourlyEmployeeCost === ''
        ) return null;

        // 70% time savings through AI automation
        const efficiencyFactor = 0.7;
        monthlyTimeSavings = Math.round(monthlyInquiries * avgResponseTime * efficiencyFactor);
        monthlyMoneySavings = Math.round(monthlyTimeSavings * hourlyEmployeeCost);
        monthlySavings = monthlyMoneySavings;
        annualSavings = monthlySavings * 12;

        const estimatedCost = teamSize * 500;
        const paybackMonths = Math.ceil(estimatedCost / Math.max(monthlySavings, 1));
        paybackPeriod =
          paybackMonths <= 1
            ? 'Less than 1 month'
            : paybackMonths <= 12
              ? `${paybackMonths} months`
              : `${Math.ceil(paybackMonths / 12)} year(s)`;
        break;
      }

      case 'system-integration': {
        const { employees, hourlyRate, manualHours } = formData;
        if (employees === '' || hourlyRate === '' || manualHours === '') return null;

        // 80% reduction in manual work
        const weeklyWaste = employees * manualHours * hourlyRate;
        const monthlyWaste = weeklyWaste * 4.33;
        const efficiencyGain = 0.8;
        monthlySavings = Math.round(monthlyWaste * efficiencyGain);
        annualSavings = Math.round(monthlySavings * 12);

        const monthlyCost = 2500;
        roi = Math.round(((monthlySavings - monthlyCost) / monthlyCost) * 100);
        const paybackMonths = Math.ceil(monthlyCost / Math.max(monthlySavings - monthlyCost, 1));
        paybackPeriod = paybackMonths <= 1 ? 'Less than 1 month' : `${paybackMonths} months`;
        break;
      }

      case 'intelligent-applications': {
        const { productPrice, salesGoal } = formData;
        if (productPrice === '' || salesGoal === '') return null;

        // Opportunity Calculator: What they're missing without a web presence
        // Without a website, word-of-mouth only reaches ~20% of potential
        const withoutWebsiteSales = Math.round(salesGoal * 0.2);
        const calculatedMissedSales = salesGoal - withoutWebsiteSales;

        monthlySavings = Math.round(calculatedMissedSales * productPrice);
        annualSavings = Math.round(monthlySavings * 12);

        const typicalBuildCost = 15000;
        roi = Math.round((annualSavings / typicalBuildCost) * 100);
        const paybackMonths = Math.ceil(typicalBuildCost / Math.max(monthlySavings, 1));
        paybackPeriod = paybackMonths <= 1 ? 'Less than 1 month' : paybackMonths <= 12 ? `${paybackMonths} months` : `${Math.ceil(paybackMonths / 12)} year(s)`;

        // Return early with missedSales included
        return {
          serviceType: formData.serviceType,
          monthlySavings,
          annualSavings,
          paybackPeriod,
          calculatedAt: new Date(),
          roi,
          missedSales: calculatedMissedSales,
        };
      }
    }

    return {
      serviceType: formData.serviceType,
      monthlySavings,
      annualSavings,
      paybackPeriod,
      calculatedAt: new Date(),
      monthlyTimeSavings,
      monthlyMoneySavings,
      roi,
    };
  }, [formData]);

  const handleCalculate = useCallback(() => {
    const calculationResult = calculateROI();
    if (calculationResult) {
      setResult(calculationResult);
      chatFormService.persistROIResult(calculationResult);
      roiAnalytics.calculated(calculationResult.annualSavings, calculationResult.monthlySavings);
      onCalculate?.(calculationResult);
      onComplete?.(calculationResult);
    }
  }, [calculateROI, onCalculate, onComplete]);

  // ==========================================================================
  // Consultation Request
  // ==========================================================================

  const handleRequestConsultation = useCallback(() => {
    roiAnalytics.scheduleClicked();
    onRequestConsultation?.();
  }, [onRequestConsultation]);

  // ==========================================================================
  // Render Field Helper
  // ==========================================================================

  const renderField = (
    field: keyof ROIFormData,
    label: string,
    placeholder: string,
    prefix?: string,
    suffix?: string
  ) => {
    const fieldId = `${formId}-${field}`;
    const errorId = `${fieldId}-error`;
    const hasError = !!errors[field];

    return (
      <div className="chat-form-field">
        <label htmlFor={fieldId} className="chat-form-label chat-form-label-required">
          {label}
        </label>
        <div style={{ position: 'relative' }}>
          {prefix && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              {prefix}
            </span>
          )}
          <input
            type="number"
            id={fieldId}
            className={`chat-form-input ${hasError ? 'error' : ''}`}
            value={formData[field] as number | ''}
            onChange={handleChange(field)}
            onBlur={handleBlur(field)}
            placeholder={placeholder}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            style={prefix ? { paddingLeft: '28px' } : undefined}
            min="0"
            step="any"
          />
          {suffix && (
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
                fontSize: '12px',
              }}
            >
              {suffix}
            </span>
          )}
        </div>
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
  // Render Result
  // ==========================================================================

  if (result) {
    const serviceInfo = SERVICE_INFO[result.serviceType];
    const savingsPercentage = Math.min(100, Math.round((result.annualSavings / 100000) * 100));
    const isOpportunityCalc = result.serviceType === 'intelligent-applications';

    return (
      <ChatFormContainer title="Results" icon="" onClose={onClose}>
        <div className="roi-result">
          <div className="roi-result-header">
            <h4>{isOpportunityCalc ? 'Your Business Opportunity' : serviceInfo.name}</h4>
          </div>

          {/* For Opportunity Calculator - Show what they're missing */}
          {isOpportunityCalc && result.missedSales !== undefined && (
            <div className="roi-result-item" style={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(220, 38, 38, 0.1) 100%)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              border: '1px solid rgba(220, 38, 38, 0.2)'
            }}>
              <div className="roi-result-label" style={{ color: '#dc2626' }}>⚠️ WITHOUT A WEBSITE</div>
              <div className="roi-result-value" style={{ color: '#dc2626' }}>
                Missing {result.missedSales} sales/month
              </div>
            </div>
          )}

          <div className="roi-result-item">
            <div className="roi-result-label">
              {isOpportunityCalc ? 'Annual Opportunity Cost' : 'Annual Savings'}
            </div>
            <div className="roi-result-value highlight">
              {formatCurrency(result.annualSavings)}
            </div>
            <div className="roi-result-bar">
              <div
                className="roi-result-bar-fill"
                style={{ width: `${savingsPercentage}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="roi-result-item">
            <div className="roi-result-label">
              {isOpportunityCalc ? 'Monthly Opportunity Cost' : 'Monthly Savings'}
            </div>
            <div className="roi-result-value">{formatCurrency(result.monthlySavings)}</div>
          </div>

          {result.monthlyTimeSavings !== undefined && (
            <div className="roi-result-item">
              <div className="roi-result-label">Time Saved Monthly</div>
              <div className="roi-result-value">{result.monthlyTimeSavings} hours</div>
            </div>
          )}

          {result.roi !== undefined && (
            <div className="roi-result-item">
              <div className="roi-result-label">
                {isOpportunityCalc ? 'First Year Return' : 'Estimated ROI'}
              </div>
              <div className="roi-result-value">{result.roi}%</div>
            </div>
          )}

          <div className="roi-result-item">
            <div className="roi-result-label">Estimated Payback Period</div>
            <div className="roi-result-value">{result.paybackPeriod}</div>
          </div>
        </div>

        <div className="chat-form-actions">
          <button
            type="button"
            className="chat-form-btn chat-form-btn-primary"
            onClick={handleRequestConsultation}
          >
            {isOpportunityCalc ? 'Request Consultation' : 'Schedule Consultation'}
          </button>
        </div>
      </ChatFormContainer>
    );
  }

  // ==========================================================================
  // Render Service Selection (Step 0)
  // ==========================================================================

  if (currentStep === 0) {
    return (
      <ChatFormContainer title="ROI Calculator" icon="" onClose={onClose}>
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {srAnnouncement}
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
          Which service are you interested in?
        </p>

        <div className="service-selection-grid">
          {(Object.keys(SERVICE_INFO) as ROIServiceType[]).map((service) => (
            <button
              key={service}
              type="button"
              className="service-selection-card"
              onClick={() => handleServiceSelect(service)}
            >
              <span className="service-selection-name">{SERVICE_INFO[service].name}</span>
              <span className="service-selection-desc">{SERVICE_INFO[service].description}</span>
            </button>
          ))}
        </div>
      </ChatFormContainer>
    );
  }

  // ==========================================================================
  // Render Form Steps (Step 1+)
  // ==========================================================================

  const getTotalSteps = () => formData.serviceType === 'smart-assistant' ? 2 : 1;

  return (
    <ChatFormContainer
      title="ROI Calculator"
      icon=""
      onClose={onClose}
      currentStep={currentStep}
      totalSteps={getTotalSteps()}
    >
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {srAnnouncement}
      </div>

      {/* Service badge */}
      <div className="service-badge" style={{ marginBottom: '12px' }}>
        <span>{SERVICE_INFO[formData.serviceType as ROIServiceType]?.name}</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (formData.serviceType === 'smart-assistant' && currentStep === 1) {
            handleNext();
          } else {
            handleCalculate();
          }
        }}
      >
        {/* Smart Business Assistant - Step 1 */}
        {formData.serviceType === 'smart-assistant' && currentStep === 1 && (
          <>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
              Tell us about your team to estimate potential savings.
            </p>
            {renderField('teamSize', 'Team Size', 'e.g., 10', undefined, 'people')}
            {renderField('monthlyInquiries', 'Monthly Customer Inquiries', 'e.g., 500')}
          </>
        )}

        {/* Smart Business Assistant - Step 2 */}
        {formData.serviceType === 'smart-assistant' && currentStep === 2 && (
          <>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
              Almost there! A few more details for your estimate.
            </p>
            {renderField('avgResponseTime', 'Avg. Response Time', 'e.g., 2', undefined, 'hours')}
            {renderField('hourlyEmployeeCost', 'Hourly Employee Cost', 'e.g., 50', '$')}
          </>
        )}

        {/* System Integration - Step 1 (only step) */}
        {formData.serviceType === 'system-integration' && currentStep === 1 && (
          <>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
              Tell us about your current manual processes.
            </p>
            {renderField('employees', 'Number of Employees', 'e.g., 50', undefined, 'people')}
            {renderField('hourlyRate', 'Average Hourly Rate', 'e.g., 35', '$')}
            {renderField('manualHours', 'Manual Hours per Week', 'e.g., 5', undefined, 'hrs/week')}
          </>
        )}

        {/* Intelligent Applications - Step 1 (Opportunity Calculator) */}
        {formData.serviceType === 'intelligent-applications' && currentStep === 1 && (
          <>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
              Tell us about your business goals to see your opportunity.
            </p>
            {renderField('productPrice', 'Your Average Sale/Order Value', 'e.g., 150', '$')}
            {renderField('salesGoal', 'Monthly Sales Goal', 'e.g., 50', undefined, 'sales')}
          </>
        )}

        <div className="chat-form-actions">
          <button
            type="button"
            className="chat-form-btn chat-form-btn-secondary"
            onClick={handleBack}
          >
            Back
          </button>
          <button type="submit" className="chat-form-btn chat-form-btn-primary">
            {formData.serviceType === 'smart-assistant' && currentStep === 1 ? 'Next' : 'Calculate ROI'}
          </button>
        </div>
      </form>
    </ChatFormContainer>
  );
};

export default ROICalculatorForm;
