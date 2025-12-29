/**
 * Chat Forms Index
 * Export all form components and types
 */

// Components
export { ChatFormContainer } from './ChatFormContainer';
export { ConsultationRequestForm } from './ConsultationRequestForm';
export { ROICalculatorForm } from './ROICalculatorForm';

// Types
export type {
    ChatFormProps, ChatFormType, ConsultationFormData, ConsultationRequestFormProps, ContactPreference, FormSubmission, FormValidationErrors, ROICalculationResult, ROICalculatorFormProps, ROIFormData
} from './chatFormTypes';

export {
    CONSULTATION_VALIDATION_RULES, DEFAULT_CONSULTATION_FORM_DATA, DEFAULT_ROI_FORM_DATA, ROI_VALIDATION_RULES
} from './chatFormTypes';

// Validation
export {
    getFirstError, hasErrors, validateConsultationField,
    validateConsultationForm, validateROIField,
    validateROIForm
} from './chatFormValidation';
