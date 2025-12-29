/**
 * Advanced CTA Quotation System - Main exports
 */

// Types
export type {
    FormStepProps, QuotationFormAction, QuotationFormData,
    QuotationFormState, QuotationRequestDocument, QuotationRequestModalProps, QuotationSubmissionRequest,
    QuotationSubmissionResponse, ServiceContext, ServiceQuestionConfig, SubmissionConfirmationProps
} from './types';

export {
    BUDGET_RANGE_OPTIONS, COMPANY_SIZE_OPTIONS, CONSULTATION_FORMAT_OPTIONS, DATA_VOLUME_OPTIONS, FLEXIBILITY_OPTIONS, INDUSTRY_OPTIONS, SECURITY_REQUIREMENTS_OPTIONS, SERVICE_CONFIGS, TIMELINE_OPTIONS, TIME_SLOT_OPTIONS
} from './types';

// Validation
export {
    completeFormSchema, sanitizeFormData, sanitizeInput, step1Schema,
    step2Schema,
    step3Schema,
    step4Schema,
    step5Schema, submissionRequestSchema, validateField, validateStep
} from './validation';

// Form reducer
export {
    clearFormDataFromStorage, formReducer, getStepData, initialFormData,
    initialFormState, loadFormDataFromStorage, saveFormDataToStorage
} from './formReducer';

// Components
export { QuotationRequestModal } from './QuotationRequestModal';
export { SubmissionConfirmation } from './SubmissionConfirmation';

// Step Components
export * from './steps';

// Service Configuration
export * from './serviceConfig';
