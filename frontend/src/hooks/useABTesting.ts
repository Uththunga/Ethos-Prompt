import { useState, useEffect, useCallback } from 'react';

// A/B Testing Framework for EthosPrompt Service Pages

interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100
  config: Record<string, unknown>;
}

interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
  description?: string;
}

// Predefined A/B tests for EthosPrompt service pages
const AB_TESTS: ABTest[] = [
  {
    id: 'hero-cta-test',
    name: 'Hero CTA Button Text',
    description: 'Testing different CTA button text for higher conversion',
    isActive: true,
    startDate: '2024-01-01',
    variants: [
      { 
        id: 'control', 
        name: 'Get Free Consultation', 
        weight: 50, 
        config: { 
          text: 'Get Free Consultation', 
          color: 'purple',
          urgency: false
        } 
      },
      { 
        id: 'variant-a', 
        name: 'Start Your Project Today', 
        weight: 25, 
        config: { 
          text: 'Start Your Project Today', 
          color: 'purple',
          urgency: true
        } 
      },
      { 
        id: 'variant-b', 
        name: 'Get Instant Quote', 
        weight: 25, 
        config: { 
          text: 'Get Instant Quote', 
          color: 'navy',
          urgency: false
        } 
      }
    ]
  },
  {
    id: 'pricing-display-test',
    name: 'Pricing Display Format',
    description: 'Testing static vs dynamic pricing displays',
    isActive: true,
    startDate: '2024-01-01',
    variants: [
      { 
        id: 'control', 
        name: 'Static Pricing Cards', 
        weight: 50, 
        config: { 
          type: 'static',
          showCalculator: false
        } 
      },
      { 
        id: 'variant-a', 
        name: 'Dynamic Pricing Calculator', 
        weight: 50, 
        config: { 
          type: 'dynamic',
          showCalculator: true
        } 
      }
    ]
  },
  {
    id: 'testimonial-format-test',
    name: 'Testimonial Display Format',
    description: 'Testing different testimonial layouts for trust building',
    isActive: true,
    startDate: '2024-01-01',
    variants: [
      { 
        id: 'control', 
        name: 'Standard Cards', 
        weight: 33, 
        config: { 
          layout: 'cards',
          showVideo: false,
          showMetrics: false
        } 
      },
      { 
        id: 'variant-a', 
        name: 'Video Testimonials', 
        weight: 33, 
        config: { 
          layout: 'cards',
          showVideo: true,
          showMetrics: false
        } 
      },
      { 
        id: 'variant-b', 
        name: 'Metric-Focused', 
        weight: 34, 
        config: { 
          layout: 'cards',
          showVideo: false,
          showMetrics: true
        } 
      }
    ]
  },
  {
    id: 'urgency-banner-test',
    name: 'Urgency Banner Messaging',
    description: 'Testing different urgency messages for conversion',
    isActive: true,
    startDate: '2024-01-01',
    variants: [
      { 
        id: 'control', 
        name: 'Limited Time Offer', 
        weight: 50, 
        config: { 
          message: '🔥 Limited Time: 25% Off All Services - Ends Soon!',
          color: 'red',
          intensity: 'medium'
        } 
      },
      { 
        id: 'variant-a', 
        name: 'Booking Urgency', 
        weight: 50, 
        config: { 
          message: '⚡ Only 3 Project Slots Left This Month - Book Now!',
          color: 'orange',
          intensity: 'high'
        } 
      }
    ]
  },
  {
    id: 'social-proof-test',
    name: 'Social Proof Notifications',
    description: 'Testing social proof notification effectiveness',
    isActive: true,
    startDate: '2024-01-01',
    variants: [
      { 
        id: 'control', 
        name: 'No Notifications', 
        weight: 33, 
        config: { 
          enabled: false
        } 
      },
      { 
        id: 'variant-a', 
        name: 'Recent Activity', 
        weight: 33, 
        config: { 
          enabled: true,
          type: 'recent_activity',
          frequency: 'medium'
        } 
      },
      { 
        id: 'variant-b', 
        name: 'Live Counter', 
        weight: 34, 
        config: { 
          enabled: true,
          type: 'live_counter',
          frequency: 'high'
        } 
      }
    ]
  }
];

// A/B Testing Hook
export const useABTest = (testId: string) => {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getVariant = () => {
      try {
        const test = AB_TESTS.find(t => t.id === testId && t.isActive);
        if (!test) {
          setIsLoading(false);
          return;
        }

        // Get or create user ID for consistent variant assignment
        let userId = localStorage.getItem('ab-test-user-id');
        if (!userId) {
          userId = Math.random().toString(36).substring(7);
          localStorage.setItem('ab-test-user-id', userId);
        }

        // Check if user already has a variant assigned for this test
        const existingVariant = localStorage.getItem(`ab-test-${testId}`);
        if (existingVariant) {
          const variant = test.variants.find(v => v.id === existingVariant);
          if (variant) {
            setVariant(variant);
            setIsLoading(false);
            return;
          }
        }

        // Assign new variant based on consistent hashing
        const hash = simpleHash(userId + testId);
        const random = (hash % 100) + 1;
        
        let cumulativeWeight = 0;
        for (const testVariant of test.variants) {
          cumulativeWeight += testVariant.weight;
          if (random <= cumulativeWeight) {
            setVariant(testVariant);
            localStorage.setItem(`ab-test-${testId}`, testVariant.id);
            
            // Track variant assignment
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'ab_test_variant_assigned', {
                event_category: 'A/B Testing',
                event_label: `${testId}:${testVariant.id}`,
                custom_parameter_1: testId,
                custom_parameter_2: testVariant.id,
                custom_parameter_3: testVariant.name
              });
            }
            break;
          }
        }
      } catch (error) {
        console.error('A/B Test error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getVariant();
  }, [testId]);

  const trackConversion = useCallback((conversionType: string, value?: number, additionalData?: Record<string, string | number | boolean>) => {
    if (variant && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_conversion', {
        event_category: 'A/B Testing',
        event_label: `${testId}:${variant.id}:${conversionType}`,
        value: value,
        custom_parameter_1: testId,
        custom_parameter_2: variant.id,
        custom_parameter_3: conversionType,
        ...additionalData
      });
    }

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('A/B Test Conversion:', {
        testId,
        variant: variant?.id,
        conversionType,
        value,
        additionalData
      });
    }
  }, [testId, variant]);

  const trackInteraction = useCallback((interactionType: string, element: string) => {
    if (variant && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_interaction', {
        event_category: 'A/B Testing',
        event_label: `${testId}:${variant.id}:${interactionType}`,
        custom_parameter_1: testId,
        custom_parameter_2: variant.id,
        custom_parameter_3: interactionType,
        custom_parameter_4: element
      });
    }
  }, [testId, variant]);

  return { 
    variant, 
    isLoading, 
    trackConversion, 
    trackInteraction,
    config: variant?.config || {}
  };
};

// Multi-test hook for running multiple A/B tests simultaneously
export const useMultipleABTests = (testIds: string[]) => {
  const [variants, setVariants] = useState<Record<string, ABTestVariant>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getVariants = () => {
      const newVariants: Record<string, ABTestVariant> = {};
      
      testIds.forEach(testId => {
        const test = AB_TESTS.find(t => t.id === testId && t.isActive);
        if (test) {
          let userId = localStorage.getItem('ab-test-user-id');
          if (!userId) {
            userId = Math.random().toString(36).substring(7);
            localStorage.setItem('ab-test-user-id', userId);
          }

          const existingVariant = localStorage.getItem(`ab-test-${testId}`);
          if (existingVariant) {
            const variant = test.variants.find(v => v.id === existingVariant);
            if (variant) {
              newVariants[testId] = variant;
              return;
            }
          }

          const hash = simpleHash(userId + testId);
          const random = (hash % 100) + 1;
          
          let cumulativeWeight = 0;
          for (const variant of test.variants) {
            cumulativeWeight += variant.weight;
            if (random <= cumulativeWeight) {
              newVariants[testId] = variant;
              localStorage.setItem(`ab-test-${testId}`, variant.id);
              break;
            }
          }
        }
      });

      setVariants(newVariants);
      setIsLoading(false);
    };

    getVariants();
  }, [testIds]);

  return { variants, isLoading };
};

// A/B test analytics hook
export const useABTestAnalytics = () => {
  const getTestResults = useCallback((testId: string) => {
    // In a real implementation, this would fetch from your analytics service
    return {
      testId,
      totalParticipants: 1000,
      conversionRate: {
        control: 0.12,
        'variant-a': 0.15,
        'variant-b': 0.14
      },
      statisticalSignificance: 0.95,
      winner: 'variant-a',
      improvement: 25
    };
  }, []);

  const getAllActiveTests = useCallback(() => {
    return AB_TESTS.filter(test => test.isActive);
  }, []);

  return { getTestResults, getAllActiveTests };
};

// Simple hash function for consistent variant assignment
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Utility function to check if user is in a specific variant
export const isVariant = (testId: string, variantId: string): boolean => {
  const storedVariant = localStorage.getItem(`ab-test-${testId}`);
  return storedVariant === variantId;
};

// Utility function to get variant config
export const getVariantConfig = (testId: string): Record<string, unknown> => {
  const test = AB_TESTS.find(t => t.id === testId);
  if (!test) return {};

  const storedVariant = localStorage.getItem(`ab-test-${testId}`);
  if (!storedVariant) return {};

  const variant = test.variants.find(v => v.id === storedVariant);
  return variant?.config || {};
};

// Export test configurations for external use
export { AB_TESTS };
