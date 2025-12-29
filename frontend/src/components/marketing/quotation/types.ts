/**
 * Type definitions for the Advanced CTA Quotation System
 */

// Service context types
export type ServiceContext =
  | 'intelligent-applications'
  | 'solutions'
  | 'smart-assistant'
  | 'system-integration';

// Form data structure
export interface QuotationFormData {
  // Step 1: Business Information
  companyName: string;
  industry: string;
  companySize: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  // Step 2: Project Scope
  projectDescription: string;
  primaryGoals: string[];
  specificFeatures: string[];

  // Step 3: Technical Requirements
  existingSystems: string[];
  integrationNeeds: string;
  dataVolume: string;
  securityRequirements: string[];

  // Step 4: Timeline & Budget
  desiredTimeline: string;
  budgetRange: string;
  flexibility: string;

  // Step 5: Consultation Preference
  needsConsultation: boolean;
  consultationFormat: 'phone' | 'video' | 'in-person' | null;
  preferredTimeSlots: string[];
  timezone?: string; // Auto-detected user timezone for scheduling

  // Service-specific extension fields (optional)
  aiAssistantConfig?: AIAssistantConfig;
  integrationConfig?: IntegrationConfig;
  applicationConfig?: ApplicationConfig;
}

// AI Assistant specific configuration
export interface AIAssistantConfig {
  expectedMonthlyInteractions: 'under-500' | '500-2000' | '2000-10000' | '10000-plus' | '';
  deploymentChannels: string[]; // 'website' | 'whatsapp' | 'facebook' | 'slack' | 'sms' | 'teams'
  languages: string[];
  humanHandoffRequired: boolean;
  knowledgeBaseSize: 'small' | 'medium' | 'large' | '';
}

// System Integration specific configuration
export interface IntegrationConfig {
  integrations: IntegrationPair[];
}

export interface IntegrationPair {
  id: string;
  sourceSystem: string;
  targetSystem: string;
  direction: 'one-way' | 'bi-directional' | '';
  syncFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | '';
  apiAvailable: boolean | null;
}

// Application specific configuration
export interface ApplicationConfig {
  applicationType: 'web-only' | 'mobile-ios' | 'mobile-android' | 'mobile-both' | 'pwa' | '';
  developmentApproach?: 'native' | 'react-native' | 'flutter' | '';
  offlineRequired?: boolean;
  appStoreSubmission?: boolean;
  existingBackend?: boolean;
}

// Form state management
export interface QuotationFormState {
  currentStep: number;
  totalSteps: number;
  formData: QuotationFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

// Form actions for reducer
export type QuotationFormAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_TOTAL_STEPS'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof QuotationFormData; value: any } }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_SAVED_DATA'; payload: Partial<QuotationFormData> };

// Component props
export interface QuotationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceContext: ServiceContext;
  serviceName: string;
  packageType?: 'basic' | 'standard' | 'enterprise'; // Which pricing package was clicked
  packageName?: string; // Name of the package (e.g., "Web Application", "Mobile Application")
}

export interface FormStepProps {
  formData: QuotationFormData;
  errors: Record<string, string>;
  onChange: (field: keyof QuotationFormData, value: any) => void;
  onClearError: (field: string) => void;
  serviceContext: ServiceContext;
  packageType?: 'basic' | 'standard' | 'enterprise';
  packageName?: string;
}

export interface SubmissionConfirmationProps {
  referenceNumber: string;
  submittedData: QuotationFormData;
  onClose: () => void;
  /** Service context for proper label lookups */
  serviceContext?: ServiceContext;
}

// API types
export interface QuotationSubmissionRequest {
  serviceContext: ServiceContext;
  serviceName: string;
  formData: QuotationFormData;
  metadata: {
    submittedAt: string;
    userAgent: string;
    referrerUrl: string;
  };
}

export interface QuotationSubmissionResponse {
  success: boolean;
  referenceNumber: string;
  message: string;
  error?: string;
  contactId?: string;
}

// Firestore document structure
export interface QuotationRequestDocument {
  // Metadata
  id: string;
  referenceNumber: string;
  status: 'pending' | 'reviewed' | 'quoted' | 'converted' | 'declined';
  createdAt: Date;
  updatedAt: Date;

  // Service Context
  serviceContext: ServiceContext;
  serviceName: string;

  // Business Information
  businessInfo: {
    companyName: string;
    industry: string;
    companySize: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
  };

  // Project Scope
  projectScope: {
    description: string;
    primaryGoals: string[];
    specificFeatures: string[];
  };

  // Technical Requirements
  technicalRequirements: {
    existingSystems: string[];
    integrationNeeds: string;
    dataVolume: string;
    securityRequirements: string[];
  };

  // Timeline & Budget
  timelineBudget: {
    desiredTimeline: string;
    budgetRange: string;
    flexibility: string;
  };

  // Consultation Preference
  consultationPreference: {
    needsConsultation: boolean;
    consultationFormat: string | null;
    preferredTimeSlots: string[];
  };

  // Submission Metadata
  metadata: {
    submittedAt: Date;
    userAgent: string;
    referrerUrl: string;
    ipAddress: string | null;
  };

  // Sales Team Notes (added later)
  salesNotes: {
    assignedTo: string | null;
    quotationSentAt: Date | null;
    quotationAmount: number | null;
    notes: string;
  };
}

// Service-specific configuration
export interface ServiceQuestionConfig {
  primaryGoals: Array<{ value: string; label: string }>;
  specificFeatures: Array<{ value: string; label: string }>;
}

export const SERVICE_CONFIGS: Record<ServiceContext, ServiceQuestionConfig> = {
  'intelligent-applications': {
    primaryGoals: [
      { value: 'increase-sales', label: 'Increase sales and revenue' },
      { value: 'improve-cx', label: 'Improve customer experience' },
      { value: 'automate-processes', label: 'Automate business processes' },
      { value: 'scale-operations', label: 'Scale operations efficiently' },
    ],
    specificFeatures: [
      { value: 'ecommerce', label: 'E-commerce platform' },
      { value: 'customer-portal', label: 'Customer portal' },
      { value: 'mobile-app', label: 'Mobile application' },
      { value: 'admin-dashboard', label: 'Admin dashboard' },
      { value: 'payment-integration', label: 'Payment integration' },
      { value: 'api-development', label: 'API development' },
    ],
  },
  solutions: {
    primaryGoals: [
      { value: 'reduce-costs', label: 'Reduce operational costs' },
      { value: 'improve-efficiency', label: 'Improve team efficiency' },
      { value: 'better-insights', label: 'Get better business insights' },
      { value: 'competitive-advantage', label: 'Gain competitive advantage' },
    ],
    specificFeatures: [
      { value: 'ai-chatbot', label: 'AI chatbot' },
      { value: 'workflow-automation', label: 'Workflow automation' },
      { value: 'data-analytics', label: 'Data analytics' },
      { value: 'system-integration', label: 'System integration' },
      { value: 'reporting', label: 'Custom reporting' },
    ],
  },
  'smart-assistant': {
    primaryGoals: [
      { value: '24-7-support', label: '24/7 customer support' },
      { value: 'lead-qualification', label: 'Lead qualification' },
      { value: 'task-automation', label: 'Task automation' },
      { value: 'knowledge-management', label: 'Knowledge management' },
    ],
    specificFeatures: [
      { value: 'multi-channel', label: 'Multi-channel support' },
      { value: 'crm-integration', label: 'CRM integration' },
      { value: 'nlp', label: 'Natural language processing' },
      { value: 'learning', label: 'Learning capabilities' },
      { value: 'analytics', label: 'Conversation analytics' },
    ],
  },
  'system-integration': {
    primaryGoals: [
      { value: 'connect-systems', label: 'Connect existing systems' },
      { value: 'eliminate-manual-entry', label: 'Eliminate manual data entry' },
      { value: 'automate-workflows', label: 'Automate workflows' },
      { value: 'centralize-data', label: 'Centralize data' },
    ],
    specificFeatures: [
      { value: 'api-integration', label: 'API integration' },
      { value: 'data-sync', label: 'Real-time data synchronization' },
      { value: 'workflow-automation', label: 'Workflow automation' },
      { value: 'custom-connectors', label: 'Custom connectors' },
      { value: 'monitoring', label: 'Integration monitoring' },
    ],
  },
};

// Industry options
export const INDUSTRY_OPTIONS = [
  { value: 'ecommerce', label: 'E-commerce & Retail' },
  { value: 'professional-services', label: 'Professional Services' },
  { value: 'saas', label: 'SaaS & Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'other', label: 'Other' },
];

// Company size options
export const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

// Data volume options (generic - used as fallback)
export const DATA_VOLUME_OPTIONS = [
  { value: 'small', label: 'Small (<1GB)' },
  { value: 'medium', label: 'Medium (1-10GB)' },
  { value: 'large', label: 'Large (10-100GB)' },
  { value: 'enterprise', label: 'Enterprise (>100GB)' },
];

// Service-specific data volume options with contextual labels
export const DATA_VOLUME_OPTIONS_BY_SERVICE: Record<ServiceContext, typeof DATA_VOLUME_OPTIONS> = {
  'smart-assistant': [
    { value: 'small', label: '<500 conversations/month' },
    { value: 'medium', label: '500-2,000 conversations/month' },
    { value: 'large', label: '2,000-10,000 conversations/month' },
    { value: 'enterprise', label: '10,000+ conversations/month' },
  ],
  'system-integration': [
    { value: 'small', label: '<1,000 records synced/day' },
    { value: 'medium', label: '1,000-10,000 records/day' },
    { value: 'large', label: '10,000-100,000 records/day' },
    { value: 'enterprise', label: '100,000+ records/day' },
  ],
  'intelligent-applications': [
    { value: 'small', label: '<1,000 users' },
    { value: 'medium', label: '1,000-10,000 users' },
    { value: 'large', label: '10,000-100,000 users' },
    { value: 'enterprise', label: '100,000+ users' },
  ],
  'solutions': DATA_VOLUME_OPTIONS, // Generic for AI Solutions
};

// Timeline options
export const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'ASAP (As soon as possible)' },
  { value: '1-3-months', label: '1-3 months' },
  { value: '3-6-months', label: '3-6 months' },
  { value: '6-12-months', label: '6-12 months' },
  { value: 'flexible', label: 'Flexible / Not urgent' },
];

// Budget range options
export const BUDGET_RANGE_OPTIONS = [
  { value: 'under-10k', label: 'Under $10,000' },
  { value: '10k-25k', label: '$10,000 - $25,000' },
  { value: '25k-50k', label: '$25,000 - $50,000' },
  { value: '50k-100k', label: '$50,000 - $100,000' },
  { value: '100k-plus', label: '$100,000+' },
  { value: 'not-sure', label: 'Not sure yet' },
];

// Flexibility options
export const FLEXIBILITY_OPTIONS = [
  { value: 'fixed', label: 'Fixed timeline and budget' },
  { value: 'some', label: 'Some flexibility' },
  { value: 'very', label: 'Very flexible' },
];

// Security requirements options
export const SECURITY_REQUIREMENTS_OPTIONS = [
  { value: 'gdpr', label: 'GDPR compliance' },
  { value: 'soc2', label: 'SOC 2 certification' },
  { value: 'australian-data', label: 'Australian data residency' },
  { value: 'custom-security', label: 'Custom security requirements' },
];

// Consultation format options
export const CONSULTATION_FORMAT_OPTIONS = [
  { value: 'phone', label: 'Phone call' },
  { value: 'video', label: 'Video call' },
  { value: 'in-person', label: 'In-person meeting' },
];

// Time slot options
export const TIME_SLOT_OPTIONS = [
  { value: 'weekday-morning', label: 'Weekday mornings (9am-12pm)' },
  { value: 'weekday-afternoon', label: 'Weekday afternoons (12pm-5pm)' },
  { value: 'weekday-evening', label: 'Weekday evenings (5pm-8pm)' },
  { value: 'weekend', label: 'Weekends' },
];

// =============================================================================
// Service-Specific Options (Phase 2)
// =============================================================================

// AI Assistant - Monthly Interactions
export const AI_INTERACTION_OPTIONS = [
  { value: 'under-500', label: 'Under 500 conversations/month' },
  { value: '500-2000', label: '500-2,000 conversations/month' },
  { value: '2000-10000', label: '2,000-10,000 conversations/month' },
  { value: '10000-plus', label: '10,000+ conversations/month' },
];

// AI Assistant - Deployment Channels
export const AI_CHANNEL_OPTIONS = [
  { value: 'website', label: 'Website chat widget' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook Messenger' },
  { value: 'slack', label: 'Slack' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'sms', label: 'SMS/Text' },
  { value: 'email', label: 'Email' },
];

// AI Assistant - Language Options
export const AI_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese (Mandarin)' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'other', label: 'Other' },
];

// AI Assistant - Knowledge Base Size
export const AI_KB_SIZE_OPTIONS = [
  { value: 'small', label: 'Small (<50 documents/FAQs)' },
  { value: 'medium', label: 'Medium (50-500 documents)' },
  { value: 'large', label: 'Large (500+ documents)' },
];

// Integration - Sync Frequency
export const INTEGRATION_FREQUENCY_OPTIONS = [
  { value: 'real-time', label: 'Real-time (immediate sync)' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

// Integration - Data Direction
export const INTEGRATION_DIRECTION_OPTIONS = [
  { value: 'one-way', label: 'One-way (source → target only)' },
  { value: 'bi-directional', label: 'Bi-directional (both ways)' },
];

// Applications - Platform Type
export const APP_TYPE_OPTIONS = [
  { value: 'web-only', label: 'Web application only' },
  { value: 'mobile-ios', label: 'Mobile - iOS only' },
  { value: 'mobile-android', label: 'Mobile - Android only' },
  { value: 'mobile-both', label: 'Mobile - iOS & Android' },
  { value: 'pwa', label: 'Progressive Web App (PWA)' },
];

// Applications - Development Approach (for mobile)
export const APP_DEV_APPROACH_OPTIONS = [
  { value: 'native', label: 'Native (Swift/Kotlin)' },
  { value: 'react-native', label: 'React Native (cross-platform)' },
  { value: 'flutter', label: 'Flutter (cross-platform)' },
];
