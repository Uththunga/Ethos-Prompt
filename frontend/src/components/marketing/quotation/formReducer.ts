/**
 * Form state reducer for the Advanced CTA Quotation System
 */

import type { QuotationFormAction, QuotationFormData, QuotationFormState } from './types';

// Initial form data
export const initialFormData: QuotationFormData = {
  // Step 1: Business Information
  companyName: '',
  industry: '',
  companySize: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',

  // Step 2: Project Scope
  projectDescription: '',
  primaryGoals: [],
  specificFeatures: [],

  // Step 3: Technical Requirements
  existingSystems: [],
  integrationNeeds: '',
  dataVolume: '',
  securityRequirements: [],

  // Step 4: Timeline & Budget
  desiredTimeline: '',
  budgetRange: '',
  flexibility: '',

  // Step 5: Consultation Preference
  needsConsultation: false,
  consultationFormat: null,
  preferredTimeSlots: [],

  // Service-specific configs (initialized when needed)
  aiAssistantConfig: undefined,
  integrationConfig: undefined,
  applicationConfig: undefined,
};

// Initial form state
export const initialFormState: QuotationFormState = {
  currentStep: 1,
  totalSteps: 5,
  formData: initialFormData,
  errors: {},
  isSubmitting: false,
};

// Form reducer
export const formReducer = (
  state: QuotationFormState,
  action: QuotationFormAction
): QuotationFormState => {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: Math.max(1, Math.min(action.payload, state.totalSteps)),
      };

    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps),
      };

    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
      };

    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload,
      };

    case 'CLEAR_ERROR': {
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        errors: newErrors,
      };
    }

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case 'SET_TOTAL_STEPS':
      return {
        ...state,
        totalSteps: action.payload,
      };

    case 'RESET_FORM':
      return initialFormState;

    case 'LOAD_SAVED_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
      };

    default:
      return state;
  }
};

// LocalStorage helpers
const STORAGE_KEY = 'quotation_form_data';
const STORAGE_EXPIRY_KEY = 'quotation_form_expiry';
const STORAGE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Per-service storage key helpers
const storageKeyFor = (service?: string) =>
  service && service.trim().length > 0 ? `${STORAGE_KEY}_${service}` : STORAGE_KEY;
const storageExpiryKeyFor = (service?: string) =>
  service && service.trim().length > 0 ? `${STORAGE_EXPIRY_KEY}_${service}` : STORAGE_EXPIRY_KEY;

export const saveFormDataToStorage = (formData: Partial<QuotationFormData>): void => {
  try {
    const expiryTime = Date.now() + STORAGE_DURATION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    localStorage.setItem(STORAGE_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error('Failed to save form data to localStorage:', error);
  }
};

export const saveFormDataToStorageForService = (
  serviceContext: string,
  formData: Partial<QuotationFormData>
): void => {
  try {
    const expiryTime = Date.now() + STORAGE_DURATION;
    localStorage.setItem(storageKeyFor(serviceContext), JSON.stringify(formData));
    localStorage.setItem(storageExpiryKeyFor(serviceContext), expiryTime.toString());
  } catch (error) {
    console.error('Failed to save form data to localStorage:', error);
  }
};

export const loadFormDataFromStorage = (): Partial<QuotationFormData> | null => {
  try {
    const expiryTime = localStorage.getItem(STORAGE_EXPIRY_KEY);
    if (!expiryTime || Date.now() > parseInt(expiryTime, 10)) {
      // Data expired, clear storage
      clearFormDataFromStorage();
      return null;
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return null;

    return JSON.parse(savedData);
  } catch (error) {
    console.error('Failed to load form data from localStorage:', error);
    return null;
  }
};

export const loadFormDataFromStorageForService = (
  serviceContext: string
): Partial<QuotationFormData> | null => {
  try {
    const expiryTime = localStorage.getItem(storageExpiryKeyFor(serviceContext));
    if (!expiryTime || Date.now() > parseInt(expiryTime, 10)) {
      clearFormDataFromStorageForService(serviceContext);
      return null;
    }

    const savedData = localStorage.getItem(storageKeyFor(serviceContext));
    if (!savedData) return null;

    return JSON.parse(savedData);
  } catch (error) {
    console.error('Failed to load form data from localStorage:', error);
    return null;
  }
};

export const clearFormDataFromStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to clear form data from localStorage:', error);
  }
};

export const clearFormDataFromStorageForService = (serviceContext: string): void => {
  try {
    localStorage.removeItem(storageKeyFor(serviceContext));
    localStorage.removeItem(storageExpiryKeyFor(serviceContext));
  } catch (error) {
    console.error('Failed to clear form data from localStorage:', error);
  }
};

// Helper to get step data for validation
// Service context determines if we use 5-step or 6-step flow
const SIX_STEP_SERVICES = ['smart-assistant', 'system-integration', 'intelligent-applications'];

export const getStepData = (formData: QuotationFormData, step: number, serviceContext?: string): any => {
  const hasSixSteps = serviceContext && SIX_STEP_SERVICES.includes(serviceContext);

  if (hasSixSteps) {
    // 6-step flow: 1=Business, 2=Project, 3=Service-Specific, 4=Technical, 5=Timeline, 6=Consultation
    switch (step) {
      case 1:
        return {
          companyName: formData.companyName,
          industry: formData.industry,
          companySize: formData.companySize,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
        };
      case 2:
        return {
          projectDescription: formData.projectDescription,
          primaryGoals: formData.primaryGoals,
          specificFeatures: formData.specificFeatures,
        };
      case 3:
        // Service-specific config
        if (serviceContext === 'smart-assistant') {
          return { aiAssistantConfig: formData.aiAssistantConfig };
        } else if (serviceContext === 'system-integration') {
          return { integrationConfig: formData.integrationConfig };
        } else {
          return { applicationConfig: formData.applicationConfig };
        }
      case 4:
        return {
          existingSystems: formData.existingSystems,
          integrationNeeds: formData.integrationNeeds,
          dataVolume: formData.dataVolume,
          securityRequirements: formData.securityRequirements,
        };
      case 5:
        return {
          desiredTimeline: formData.desiredTimeline,
          budgetRange: formData.budgetRange,
          flexibility: formData.flexibility,
        };
      case 6:
        return {
          needsConsultation: formData.needsConsultation,
          consultationFormat: formData.consultationFormat,
          preferredTimeSlots: formData.preferredTimeSlots,
        };
      default:
        return {};
    }
  }

  // 5-step flow: 1=Business, 2=Project, 3=Technical, 4=Timeline, 5=Consultation
  switch (step) {
    case 1:
      return {
        companyName: formData.companyName,
        industry: formData.industry,
        companySize: formData.companySize,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
      };
    case 2:
      return {
        projectDescription: formData.projectDescription,
        primaryGoals: formData.primaryGoals,
        specificFeatures: formData.specificFeatures,
      };
    case 3:
      return {
        existingSystems: formData.existingSystems,
        integrationNeeds: formData.integrationNeeds,
        dataVolume: formData.dataVolume,
        securityRequirements: formData.securityRequirements,
      };
    case 4:
      return {
        desiredTimeline: formData.desiredTimeline,
        budgetRange: formData.budgetRange,
        flexibility: formData.flexibility,
      };
    case 5:
      return {
        needsConsultation: formData.needsConsultation,
        consultationFormat: formData.consultationFormat,
        preferredTimeSlots: formData.preferredTimeSlots,
      };
    default:
      return {};
  }
};
