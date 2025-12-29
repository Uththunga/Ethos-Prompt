/**
 * Chat Form Types
 * Type definitions for inline chat forms (ROI Calculator & Consultation Request)
 */

// =============================================================================
// Form Types
// =============================================================================

export type ChatFormType = 'roi-calculator' | 'consultation-request';

// =============================================================================
// ROI Calculator Types
// =============================================================================

export type ROIServiceType = 'smart-assistant' | 'system-integration' | 'intelligent-applications';

export interface ROIFormData {
  // Service selection (Step 0)
  serviceType: ROIServiceType | '';

  // Smart Business Assistant fields
  teamSize: number | '';
  monthlyInquiries: number | '';
  avgResponseTime: number | '';
  hourlyEmployeeCost: number | '';

  // System Integration fields
  employees: number | '';
  hourlyRate: number | '';
  manualHours: number | '';

  // Intelligent Applications fields (Opportunity Calculator)
  productPrice: number | '';
  salesGoal: number | '';
}

export interface ROICalculationResult {
  serviceType: ROIServiceType;
  monthlySavings: number;
  annualSavings: number;
  paybackPeriod: string;
  calculatedAt: Date;
  // Service-specific fields
  monthlyTimeSavings?: number;  // Smart Assistant
  monthlyMoneySavings?: number; // Smart Assistant
  roi?: number;                  // System Integration, Intelligent Apps
  missedSales?: number;          // Intelligent Apps (Opportunity)
}

export const DEFAULT_ROI_FORM_DATA: ROIFormData = {
  serviceType: '',
  // Smart Business Assistant
  teamSize: '',
  monthlyInquiries: '',
  avgResponseTime: '',
  hourlyEmployeeCost: '',
  // System Integration
  employees: '',
  hourlyRate: '',
  manualHours: '',
  // Intelligent Applications (Opportunity Calculator)
  productPrice: '',
  salesGoal: '',
};

// =============================================================================
// Consultation Request Types
// =============================================================================

export type ContactPreference = 'email' | 'phone' | 'video';

export interface ConsultationFormData {
  name: string;
  email: string;
  company: string;
  contactPreference: ContactPreference | '';
  phone?: string; // Optional - only required if contactPreference is 'phone'
  notes: string;
}

export const DEFAULT_CONSULTATION_FORM_DATA: ConsultationFormData = {
  name: '',
  email: '',
  company: '',
  contactPreference: '',
  phone: '',
  notes: '',
};

// =============================================================================
// Form State Types
// =============================================================================

export interface FormValidationErrors {
  [key: string]: string;
}

export interface ChatFormProps {
  onClose: () => void;
  onComplete?: (data: unknown) => void;
}

export interface ROICalculatorFormProps extends ChatFormProps {
  onCalculate?: (result: ROICalculationResult) => void;
  onRequestConsultation?: () => void;
}

export interface ConsultationRequestFormProps extends ChatFormProps {
  onSubmit?: (data: ConsultationFormData, referenceNumber: string) => void;
  prefillData?: Partial<ConsultationFormData>;
  /** Service context for proper lead routing - defaults to 'solutions' */
  pageContext?: 'intelligent-applications' | 'solutions' | 'smart-assistant' | 'system-integration';
}

// =============================================================================
// Form Submission Types
// =============================================================================

export interface FormSubmission {
  id: string;
  type: ChatFormType;
  data: ROIFormData | ConsultationFormData;
  result?: ROICalculationResult;
  submittedAt: Date;
  referenceNumber?: string;
}

// =============================================================================
// Validation Rules
// =============================================================================

export const ROI_VALIDATION_RULES = {
  // Smart Business Assistant
  teamSize: { min: 1, max: 500, required: true },
  monthlyInquiries: { min: 1, max: 10000, required: true },
  avgResponseTime: { min: 0.1, max: 72, required: true },
  hourlyEmployeeCost: { min: 10, max: 500, required: true },
  // System Integration
  employees: { min: 1, max: 1000, required: true },
  hourlyRate: { min: 10, max: 500, required: true },
  manualHours: { min: 1, max: 40, required: true },
  // Intelligent Applications (Opportunity Calculator)
  productPrice: { min: 1, max: 100000, required: true },
  salesGoal: { min: 1, max: 10000, required: true },
} as const;

export const CONSULTATION_VALIDATION_RULES = {
  name: { minLength: 2, maxLength: 100, required: true },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  company: { maxLength: 100, required: false },
  contactPreference: { required: true },
  phone: { minLength: 10, maxLength: 20, required: false }, // Optional - validated conditionally
  notes: { maxLength: 500, required: false },
} as const;
