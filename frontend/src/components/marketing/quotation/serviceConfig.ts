/**
 * Service-specific configuration and question logic
 */

import type { ServiceContext } from './types';
import { SERVICE_CONFIGS } from './types';

/**
 * Get service-specific primary goals
 */
export const getPrimaryGoalsForService = (serviceContext: ServiceContext) => {
  return SERVICE_CONFIGS[serviceContext].primaryGoals;
};

/**
 * Get service-specific features
 */
export const getSpecificFeaturesForService = (serviceContext: ServiceContext) => {
  return SERVICE_CONFIGS[serviceContext].specificFeatures;
};

/**
 * Get service display name
 */
export const getServiceDisplayName = (serviceContext: ServiceContext): string => {
  const names: Record<ServiceContext, string> = {
    'intelligent-applications': 'Web & Mobile Applications',
    'solutions': 'AI Solutions',
    'smart-assistant': 'Smart Business Assistant',
    'system-integration': 'System Integration',
  };
  return names[serviceContext];
};

/**
 * Get service-specific placeholder text for project description
 */
export const getProjectDescriptionPlaceholder = (serviceContext: ServiceContext): string => {
  const placeholders: Record<ServiceContext, string> = {
    'intelligent-applications':
      'Example: We need a mobile app for our e-commerce business that allows customers to browse products, make purchases, and track orders. We currently have a website but want to expand to mobile...',
    'solutions':
      'Example: We want to implement AI-powered automation to reduce manual data entry and improve our team\'s efficiency. Currently, our staff spends 10+ hours per week on repetitive tasks...',
    'smart-assistant':
      'Example: We need a 24/7 AI chatbot to handle customer inquiries, qualify leads, and provide instant support. Our current support team is overwhelmed with repetitive questions...',
    'system-integration':
      'Example: We need to connect our CRM (Salesforce) with our email marketing platform (Mailchimp) and accounting software (Xero) to automate data synchronization and eliminate manual entry...',
  };
  return placeholders[serviceContext];
};

/**
 * Get service-specific help text for integration needs
 */
export const getIntegrationNeedsHelpText = (serviceContext: ServiceContext): string => {
  const helpTexts: Record<ServiceContext, string> = {
    'intelligent-applications':
      'Which systems should your application integrate with? (e.g., payment gateways, CRM, inventory management)',
    'solutions':
      'Which existing systems need to be connected? (e.g., CRM, databases, third-party APIs)',
    'smart-assistant':
      'Which platforms should the assistant integrate with? (e.g., website, Facebook Messenger, Slack, CRM)',
    'system-integration':
      'Describe the data flow between systems and any specific integration requirements.',
  };
  return helpTexts[serviceContext];
};

/**
 * Determine if certain fields should be required based on service context
 */
export const isFieldRequiredForService = (
  field: string,
  serviceContext: ServiceContext
): boolean => {
  // All fields have the same requirements across services for now
  // This function allows for future customization
  const requiredFields = [
    'companyName',
    'industry',
    'companySize',
    'contactName',
    'contactEmail',
    'projectDescription',
    'primaryGoals',
    'dataVolume',
    'desiredTimeline',
    'budgetRange',
    'flexibility',
  ];

  return requiredFields.includes(field);
};

/**
 * Get recommended features based on selected goals
 */
export const getRecommendedFeatures = (
  serviceContext: ServiceContext,
  selectedGoals: string[]
): string[] => {
  // Simple recommendation logic - can be enhanced with more sophisticated matching
  const recommendations: Record<ServiceContext, Record<string, string[]>> = {
    'intelligent-applications': {
      'increase-sales': ['ecommerce', 'payment-integration', 'mobile-app'],
      'improve-cx': ['customer-portal', 'mobile-app', 'admin-dashboard'],
      'automate-processes': ['admin-dashboard', 'api-development'],
      'scale-operations': ['api-development', 'admin-dashboard'],
    },
    'solutions': {
      'reduce-costs': ['workflow-automation', 'system-integration'],
      'improve-efficiency': ['workflow-automation', 'ai-chatbot'],
      'better-insights': ['data-analytics', 'reporting'],
      'competitive-advantage': ['ai-chatbot', 'data-analytics'],
    },
    'smart-assistant': {
      '24-7-support': ['multi-channel', 'nlp'],
      'lead-qualification': ['crm-integration', 'analytics'],
      'task-automation': ['crm-integration', 'learning'],
      'knowledge-management': ['nlp', 'learning'],
    },
    'system-integration': {
      'connect-systems': ['api-integration', 'custom-connectors'],
      'eliminate-manual-entry': ['data-sync', 'workflow-automation'],
      'automate-workflows': ['workflow-automation', 'monitoring'],
      'centralize-data': ['data-sync', 'monitoring'],
    },
  };

  const serviceRecommendations = recommendations[serviceContext];
  const recommended = new Set<string>();

  selectedGoals.forEach((goal) => {
    const features = serviceRecommendations[goal] || [];
    features.forEach((feature) => recommended.add(feature));
  });

  return Array.from(recommended);
};

/**
 * Validate service context
 */
export const isValidServiceContext = (context: string): context is ServiceContext => {
  return ['intelligent-applications', 'solutions', 'smart-assistant', 'system-integration'].includes(
    context
  );
};

/**
 * Get package-specific questions
 * Returns filtered goals and features based on package type
 */
export const getPackageSpecificQuestions = (
  serviceContext: ServiceContext,
  packageType: 'basic' | 'standard' | 'enterprise' = 'basic'
) => {
  const config = SERVICE_CONFIGS[serviceContext];

  // For basic packages, show fewer options
  if (packageType === 'basic') {
    return {
      primaryGoals: config.primaryGoals.slice(0, 2), // Show first 2 goals
      specificFeatures: config.specificFeatures.slice(0, 3), // Show first 3 features
    };
  }

  // For standard packages, show most options
  if (packageType === 'standard') {
    return {
      primaryGoals: config.primaryGoals.slice(0, 3), // Show first 3 goals
      specificFeatures: config.specificFeatures.slice(0, 4), // Show first 4 features
    };
  }

  // For enterprise packages, show all options
  return {
    primaryGoals: config.primaryGoals, // Show all goals
    specificFeatures: config.specificFeatures, // Show all features
  };
};
