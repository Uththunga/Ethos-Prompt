/**
 * Zod validation schemas for the Advanced CTA Quotation System
 */

import { z } from 'zod';

// Email validation with common patterns
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .refine(
    (email) => {
      // Block common disposable email domains (expanded list)
      const disposableDomains = [
        // Original 5
        'tempmail.com',
        'throwaway.email',
        'guerrillamail.com',
        '10minutemail.com',
        'mailinator.com',
        // Additional common disposable domains
        'yopmail.com',
        'temp-mail.org',
        'dispostable.com',
        'fakeinbox.com',
        'sharklasers.com',
        'trashmail.com',
        'getnada.com',
        'mohmal.com',
        'tempmailaddress.com',
        'emailondeck.com',
        'inboxbear.com',
        'mytemp.email',
        'tempinbox.com',
        'spambox.us',
        'throwawaymail.com',
        'maildrop.cc',
        'harakirimail.com',
        'spamgourmet.com',
        'mailnesia.com',
        'getairmail.com',
        'mintemail.com',
        'moakt.com',
        'instantemailaddress.com',
        'emailfake.com',
        'trash-mail.com',
        'disposableemailaddresses.com',
        'emailsensei.com',
        'trbvm.com',
        'mailsac.com',
      ];
      const domain = email.split('@')[1]?.toLowerCase();
      return !disposableDomains.includes(domain);
    },
    { message: 'Please use a business email address' }
  );

// Phone validation (optional, but must be valid if provided)
const phoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => {
      if (!phone || phone.trim() === '') return true;
      // Basic phone validation - allows various formats
      const phoneRegex = /^[\d\s\-+()]+$/;
      return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },
    { message: 'Please enter a valid phone number' }
  );

// Step 1: Business Information
export const step1Schema = z.object({
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  industry: z.string().min(1, 'Please select an industry'),
  companySize: z.string().min(1, 'Please select company size'),
  contactName: z
    .string()
    .min(1, 'Contact name is required')
    .min(2, 'Contact name must be at least 2 characters')
    .max(100, 'Contact name must be less than 100 characters'),
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
});

// Step 2: Project Scope
export const step2Schema = z.object({
  projectDescription: z
    .string()
    .min(1, 'Project description is required')
    .min(20, 'Please provide at least 20 characters describing your project')
    .max(1000, 'Project description must be less than 1000 characters'),
  primaryGoals: z
    .array(z.string())
    .min(1, 'Please select at least one primary goal')
    .max(4, 'Please select no more than 4 primary goals'),
  specificFeatures: z.array(z.string()).optional(),
});

// Step 3: Technical Requirements
export const step3Schema = z.object({
  existingSystems: z.array(z.string()).optional(),
  integrationNeeds: z
    .string()
    .max(500, 'Integration needs description must be less than 500 characters')
    .optional(),
  dataVolume: z.string().min(1, 'Please select data volume'),
  securityRequirements: z.array(z.string()).optional(),
});

// Service-specific: AI Assistant Configuration
export const aiAssistantConfigSchema = z.object({
  aiAssistantConfig: z.object({
    expectedMonthlyInteractions: z.string().min(1, 'Please select expected conversation volume'),
    deploymentChannels: z.array(z.string()).min(1, 'Please select at least one deployment channel'),
    languages: z.array(z.string()).default(['en']),
    humanHandoffRequired: z.boolean().default(false),
    knowledgeBaseSize: z.string().optional(),
  }),
});

// Service-specific: System Integration Configuration
// Fixed to match IntegrationConfig interface in types.ts (integrations: IntegrationPair[])
export const integrationConfigSchema = z.object({
  integrationConfig: z.object({
    integrations: z.array(z.object({
      id: z.string(),
      sourceSystem: z.string().min(1, 'Please enter a source system'),
      targetSystem: z.string().min(1, 'Please enter a target system'),
      direction: z.string().optional(),
      syncFrequency: z.string().optional(),
      apiAvailable: z.boolean().nullable(),
    })).min(1, 'Please add at least one integration'),
  }),
});

// Service-specific: Application Configuration
// Fixed to match ApplicationConfig interface in types.ts
export const applicationConfigSchema = z.object({
  applicationConfig: z.object({
    applicationType: z.string().min(1, 'Please select application type'),
    developmentApproach: z.string().optional(),
    offlineRequired: z.boolean().optional(),
    appStoreSubmission: z.boolean().optional(),
    existingBackend: z.boolean().optional(),
  }),
});

// Step 4: Timeline & Budget
export const step4Schema = z.object({
  desiredTimeline: z.string().min(1, 'Please select a desired timeline'),
  budgetRange: z.string().min(1, 'Please select a budget range'),
  flexibility: z.string().min(1, 'Please indicate your flexibility'),
});

// Step 5: Consultation Preference - Base schema for shape access
const step5BaseSchema = z.object({
  needsConsultation: z.boolean(),
  consultationFormat: z
    .enum(['phone', 'video', 'in-person'])
    .nullable(),
  preferredTimeSlots: z.array(z.string()),
});

// Step 5: Consultation Preference - With cross-field validation
export const step5Schema = step5BaseSchema.superRefine((data, ctx) => {
  // If needsConsultation is true, format must be selected
  if (data.needsConsultation && !data.consultationFormat) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a consultation format',
      path: ['consultationFormat'],
    });
  }
  // If needsConsultation is true, at least one time slot must be selected
  if (data.needsConsultation && data.preferredTimeSlots.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select at least one preferred time slot',
      path: ['preferredTimeSlots'],
    });
  }
});

// Complete form schema - uses base schema for shape access
export const completeFormSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
  ...step5BaseSchema.shape,
}).superRefine((data, ctx) => {
  // Cross-field validation for step 5 fields
  if (data.needsConsultation && !data.consultationFormat) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a consultation format',
      path: ['consultationFormat'],
    });
  }
  if (data.needsConsultation && data.preferredTimeSlots.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select at least one preferred time slot',
      path: ['preferredTimeSlots'],
    });
  }
});

// API submission schema
export const submissionRequestSchema = z.object({
  serviceContext: z.enum([
    'intelligent-applications',
    'solutions',
    'smart-assistant',
    'system-integration',
  ]),
  serviceName: z.string().min(1),
  formData: completeFormSchema,
  metadata: z.object({
    submittedAt: z.string(),
    userAgent: z.string(),
    referrerUrl: z.string(),
  }),
});

// Schema shapes lookup for field validation (avoids ZodEffects issue)
const schemaShapes = {
  1: step1Schema.shape,
  2: step2Schema.shape,
  3: step3Schema.shape,
  4: step4Schema.shape,
  5: step5BaseSchema.shape,
} as const;

// Validation helper functions
// Service context determines if we use 5-step or 6-step flow
const SIX_STEP_SERVICES = ['smart-assistant', 'system-integration', 'intelligent-applications'];

export const validateStep = (
  step: number,
  data: any,
  serviceContext?: string
): { isValid: boolean; errors: Record<string, string> } => {
  const hasSixSteps = serviceContext && SIX_STEP_SERVICES.includes(serviceContext);

  // Determine which schema to use based on step and service context
  let schema;
  if (hasSixSteps) {
    // 6-step flow: 1=Business, 2=Project, 3=Service-Specific, 4=Technical, 5=Timeline, 6=Consultation
    switch (step) {
      case 1: schema = step1Schema; break;
      case 2: schema = step2Schema; break;
      case 3:
        // Service-specific step
        if (serviceContext === 'smart-assistant') schema = aiAssistantConfigSchema;
        else if (serviceContext === 'system-integration') schema = integrationConfigSchema;
        else schema = applicationConfigSchema;
        break;
      case 4: schema = step3Schema; break;
      case 5: schema = step4Schema; break;
      case 6: schema = step5Schema; break;
      default:
        return { isValid: false, errors: { general: 'Invalid step number' } };
    }
  } else {
    // 5-step flow: 1=Business, 2=Project, 3=Technical, 4=Timeline, 5=Consultation
    const schemas = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema];
    schema = schemas[step - 1];
  }

  if (!schema) {
    return { isValid: false, errors: { general: 'Invalid step number' } };
  }

  try {
    console.log(`[Validation] Step ${step} (${hasSixSteps ? '6-step flow' : '5-step flow'}):`, data);
    schema.parse(data);
    console.log(`[Validation] Step ${step} PASSED`);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
        console.error(`[Validation] Step ${step} ERROR - Field "${path}": ${err.message}`);
      });
      return { isValid: false, errors };
    }
    console.error(`[Validation] Step ${step} UNKNOWN ERROR:`, error);
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

export const validateField = (
  field: string,
  value: any,
  step: number
): { isValid: boolean; error?: string } => {
  const shape = schemaShapes[step as keyof typeof schemaShapes];

  if (!shape) {
    return { isValid: false, error: 'Invalid step number' };
  }

  try {
    // Get the field schema from the shapes lookup
    const fieldSchema = (shape as any)[field];
    if (!fieldSchema) {
      return { isValid: true }; // Field not in this step's schema
    }

    fieldSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Validation failed' };
  }
};

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  // Remove potential XSS vectors
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const sanitizeFormData = (data: any): any => {
  const sanitized = { ...data };

  // Sanitize string fields
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    }
  });

  return sanitized;
};
