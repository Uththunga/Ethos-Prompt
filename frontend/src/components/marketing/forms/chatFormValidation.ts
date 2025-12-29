/**
 * Chat Form Validation Utilities
 * Client-side validation with friendly error messages
 */

import type {
  ConsultationFormData,
  FormValidationErrors,
  ROIFormData,
  ROIServiceType,
} from './chatFormTypes';
import {
  CONSULTATION_VALIDATION_RULES,
  ROI_VALIDATION_RULES,
} from './chatFormTypes';

// =============================================================================
// ROI Calculator Validation
// =============================================================================

// Service-specific required fields
const SERVICE_REQUIRED_FIELDS: Record<ROIServiceType, (keyof ROIFormData)[]> = {
  'smart-assistant': ['teamSize', 'monthlyInquiries', 'avgResponseTime', 'hourlyEmployeeCost'],
  'system-integration': ['employees', 'hourlyRate', 'manualHours'],
  'intelligent-applications': ['productPrice', 'salesGoal'],
};

export function validateROIField(
  field: keyof ROIFormData,
  value: number | string | ''
): string | null {
  // Skip serviceType validation here (handled separately)
  if (field === 'serviceType') return null;

  const rules = ROI_VALIDATION_RULES[field as keyof typeof ROI_VALIDATION_RULES];
  if (!rules) return null;

  if (rules.required && (value === '' || value === null || value === undefined)) {
    return getRequiredFieldMessage(field);
  }

  if (typeof value === 'number') {
    if (value < rules.min) {
      return `Must be at least ${rules.min}`;
    }
    if (value > rules.max) {
      return `Cannot exceed ${rules.max}`;
    }
  }

  return null;
}

export function validateROIFormForService(
  data: ROIFormData,
  serviceType: ROIServiceType
): FormValidationErrors {
  const errors: FormValidationErrors = {};
  const requiredFields = SERVICE_REQUIRED_FIELDS[serviceType];

  requiredFields.forEach((field) => {
    const value = data[field];
    const error = validateROIField(field, value as number | '');
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}

// Legacy function for backward compatibility
export function validateROIForm(data: ROIFormData): FormValidationErrors {
  // If service type is set, validate only those fields
  if (data.serviceType && data.serviceType in SERVICE_REQUIRED_FIELDS) {
    return validateROIFormForService(data, data.serviceType);
  }

  // Fallback: validate smart-assistant fields (original behavior)
  return validateROIFormForService(data, 'smart-assistant');
}

// =============================================================================
// Consultation Form Validation
// =============================================================================

export function validateConsultationField(
  field: keyof ConsultationFormData,
  value: string
): string | null {
  const rules = CONSULTATION_VALIDATION_RULES[field];

  if (rules.required && !value.trim()) {
    return getRequiredFieldMessage(field);
  }

  if (!value.trim()) {
    return null; // Optional field, no further validation needed
  }

  if ('minLength' in rules && value.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }

  if ('maxLength' in rules && value.length > rules.maxLength) {
    return `Cannot exceed ${rules.maxLength} characters`;
  }

  if ('pattern' in rules && rules.pattern && !rules.pattern.test(value)) {
    if (field === 'email') {
      return 'Please enter a valid email address';
    }
    return 'Invalid format';
  }

  return null;
}

export function validateConsultationForm(
  data: ConsultationFormData
): FormValidationErrors {
  const errors: FormValidationErrors = {};

  (Object.keys(CONSULTATION_VALIDATION_RULES) as Array<keyof ConsultationFormData>).forEach(
    (field) => {
      // Handle optional fields that might be undefined
      const value = data[field] ?? '';
      const error = validateConsultationField(field, value);
      if (error) {
        errors[field] = error;
      }
    }
  );

  // GAP-001 FIX: Phone is required when contact preference is 'phone'
  if (data.contactPreference === 'phone') {
    const phoneValue = data.phone?.trim() ?? '';
    if (!phoneValue) {
      errors.phone = 'Phone number is required when phone is your preferred contact method';
    } else if (phoneValue.replace(/\D/g, '').length < 10) {
      errors.phone = 'Please enter a valid phone number with at least 10 digits';
    }
  }

  return errors;
}


// =============================================================================
// Helper Functions
// =============================================================================

function getRequiredFieldMessage(field: string): string {
  const fieldNames: Record<string, string> = {
    // Smart Business Assistant
    teamSize: 'Team size',
    monthlyInquiries: 'Monthly inquiries',
    avgResponseTime: 'Average response time',
    hourlyEmployeeCost: 'Hourly cost',
    // System Integration
    employees: 'Number of employees',
    hourlyRate: 'Hourly rate',
    manualHours: 'Manual hours per week',
    // Intelligent Applications (Opportunity)
    productPrice: 'Product/service price',
    salesGoal: 'Monthly sales goal',
    // Consultation
    name: 'Name',
    email: 'Email',
    company: 'Company',
    contactPreference: 'Contact preference',
    notes: 'Notes',
  };

  return `${fieldNames[field] || field} is required`;
}

export function hasErrors(errors: FormValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getFirstError(errors: FormValidationErrors): string | null {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}
