/**
 * FeaturedServiceCard Component - Usage Examples
 * 
 * This file demonstrates various ways to use the FeaturedServiceCard component
 * for highlighting featured services on the Solutions page.
 */

import React from 'react';
import { FeaturedServiceCard } from './featured-service-card';
import { DollarSign, Clock, Zap, TrendingUp } from '@/components/icons/lucide';

/**
 * Example 1: Basic Usage (Minimum Required Props)
 * 
 * This is the simplest way to use the component with just the essential props.
 */
export const BasicExample = () => (
  <FeaturedServiceCard
    title="Smart Business Assistant"
    description="24/7 AI-powered support that handles customer service, sales, and operations—like having a skilled team member who never sleeps."
    benefits={[
      'Reduce customer service costs by 87%',
      'Answer customer questions in under 30 seconds',
      'Handle 80% of inquiries automatically',
      'Live in 30 days with full support',
    ]}
    stats={[
      { label: 'Cost Reduction', value: '87%' },
      { label: 'Response Time', value: '<30s' },
      { label: 'Automation Rate', value: '80%' },
      { label: 'Customer Satisfaction', value: '95%' },
    ]}
    startingPrice="$890"
    ctaText="Calculate Your Savings"
    ctaLink="/services/smart-assistant#roi-calculator"
  />
);

/**
 * Example 2: Full Featured (With All Optional Props)
 * 
 * This example shows all available props including image, custom badge, and currency.
 */
export const FullFeaturedExample = () => (
  <FeaturedServiceCard
    title="Smart Business Assistant"
    description="24/7 AI-powered support that handles customer service, sales, and operations—like having a skilled team member who never sleeps."
    benefits={[
      'Reduce customer service costs by 87%',
      'Answer customer questions in under 30 seconds',
      'Handle 80% of inquiries automatically',
      'Live in 30 days with full support',
    ]}
    stats={[
      { label: 'Cost Reduction', value: '87%' },
      { label: 'Response Time', value: '<30s' },
      { label: 'Automation Rate', value: '80%' },
      { label: 'Customer Satisfaction', value: '95%' },
    ]}
    startingPrice="$890"
    currency="AUD"
    ctaText="Calculate Your Savings"
    ctaLink="/services/smart-assistant#roi-calculator"
    imageSrc="/assets/marketing/images/smart-assistant-dashboard.png"
    badge="⭐ Most Popular"
    className="mb-16"
  />
);

/**
 * Example 3: With Custom Icons in Stats
 * 
 * This example demonstrates how to add custom icons to statistics for better visual appeal.
 */
export const StatsWithIconsExample = () => (
  <FeaturedServiceCard
    title="Smart Business Assistant"
    description="24/7 AI-powered support that handles customer service, sales, and operations—like having a skilled team member who never sleeps."
    benefits={[
      'Reduce customer service costs by 87%',
      'Answer customer questions in under 30 seconds',
      'Handle 80% of inquiries automatically',
      'Live in 30 days with full support',
    ]}
    stats={[
      {
        label: 'Cost Reduction',
        value: '87%',
        icon: <DollarSign className="w-5 h-5 text-green-500" />,
      },
      {
        label: 'Response Time',
        value: '<30s',
        icon: <Clock className="w-5 h-5 text-blue-500" />,
      },
      {
        label: 'Automation Rate',
        value: '80%',
        icon: <Zap className="w-5 h-5 text-purple-500" />,
      },
      {
        label: 'Customer Satisfaction',
        value: '95%',
        icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
      },
    ]}
    startingPrice="$890"
    currency="AUD"
    ctaText="Calculate Your Savings"
    ctaLink="/services/smart-assistant#roi-calculator"
    imageSrc="/assets/marketing/images/smart-assistant-dashboard.png"
  />
);

/**
 * Example 4: System Integration Service
 * 
 * Example for a different service with different metrics and benefits.
 */
export const SystemIntegrationExample = () => (
  <FeaturedServiceCard
    title="Connect Everything"
    description="Seamlessly integrate all your business tools and platforms. Automate data flow between email, calendar, and CRM systems."
    benefits={[
      'Connect 100+ business applications',
      'Automate repetitive data entry tasks',
      'Real-time synchronization across platforms',
      'No coding required - visual workflow builder',
    ]}
    stats={[
      { label: 'Time Saved', value: '15hrs/week' },
      { label: 'Integrations', value: '100+' },
      { label: 'Error Reduction', value: '99%' },
      { label: 'Setup Time', value: '2 days' },
    ]}
    startingPrice="$1,497"
    currency="AUD"
    ctaText="Explore Integrations"
    ctaLink="/services/system-integration"
    badge="🔗 Best for Teams"
  />
);

/**
 * Example 5: Digital Transformation Service
 * 
 * Example for enterprise-level service with higher pricing.
 */
export const DigitalTransformationExample = () => (
  <FeaturedServiceCard
    title="Modern Business Upgrade"
    description="Transform traditional operations with smart automation. Create engaging digital experiences for customers and future-proof your business."
    benefits={[
      'Complete digital transformation roadmap',
      'Legacy system modernization',
      'Cloud migration and optimization',
      'Dedicated transformation team',
    ]}
    stats={[
      { label: 'Efficiency Gain', value: '3x' },
      { label: 'ROI Timeline', value: '6 months' },
      { label: 'Success Rate', value: '98%' },
      { label: 'Support', value: '24/7' },
    ]}
    startingPrice="$3,997"
    currency="AUD"
    ctaText="Book Strategy Session"
    ctaLink="/contact?service=digital-transformation"
    badge="🚀 Enterprise Ready"
  />
);

/**
 * Example 6: Without Image
 * 
 * Sometimes you may want to use the component without an image for a cleaner look.
 */
export const NoImageExample = () => (
  <FeaturedServiceCard
    title="Intelligent Applications"
    description="AI-powered web and mobile apps that learn from user interactions. Personalized experiences through machine learning."
    benefits={[
      'Custom AI-powered applications',
      'Personalized user experiences',
      'Continuous learning and improvement',
      'Cross-platform compatibility',
    ]}
    stats={[
      { label: 'User Engagement', value: '+150%' },
      { label: 'Conversion Rate', value: '+85%' },
      { label: 'Development Time', value: '8 weeks' },
      { label: 'Scalability', value: 'Unlimited' },
    ]}
    startingPrice="$2,497"
    currency="AUD"
    ctaText="View Demo"
    ctaLink="/services/intelligent-applications#demo"
  />
);

/**
 * Example 7: Custom Badge Variations
 * 
 * Different badge styles for different contexts.
 */
export const CustomBadgeExamples = () => (
  <div >
    <FeaturedServiceCard
      title="Service 1"
      description="Description here..."
      benefits={['Benefit 1', 'Benefit 2']}
      stats={[{ label: 'Metric', value: '100%' }]}
      startingPrice="$890"
      ctaText="Get Started"
      ctaLink="/services/service-1"
      badge="⭐ Most Popular"
    />

    <FeaturedServiceCard
      title="Service 2"
      description="Description here..."
      benefits={['Benefit 1', 'Benefit 2']}
      stats={[{ label: 'Metric', value: '100%' }]}
      startingPrice="$1,497"
      ctaText="Get Started"
      ctaLink="/services/service-2"
      badge="🔥 Trending"
    />

    <FeaturedServiceCard
      title="Service 3"
      description="Description here..."
      benefits={['Benefit 1', 'Benefit 2']}
      stats={[{ label: 'Metric', value: '100%' }]}
      startingPrice="$2,497"
      ctaText="Get Started"
      ctaLink="/services/service-3"
      badge="💎 Premium"
    />

    <FeaturedServiceCard
      title="Service 4"
      description="Description here..."
      benefits={['Benefit 1', 'Benefit 2']}
      stats={[{ label: 'Metric', value: '100%' }]}
      startingPrice="$890"
      ctaText="Get Started"
      ctaLink="/services/service-4"
      badge="🎯 Recommended"
    />
  </div>
);

/**
 * Example 8: Integration in Solutions Page
 * 
 * How to use the component in the actual Solutions.tsx page.
 */
export const SolutionsPageIntegration = () => (
  <section className="py-16 md:py-20 lg:py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-ethos-navy mb-4">
          Our Core Services
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Choose the solution that best fits your business needs
        </p>
      </div>

      {/* Featured Service */}
      <div className="mb-16">
        <FeaturedServiceCard
          title="Smart Business Assistant"
          description="24/7 AI-powered support that handles customer service, sales, and operations—like having a skilled team member who never sleeps."
          benefits={[
            'Reduce customer service costs by 87%',
            'Answer customer questions in under 30 seconds',
            'Handle 80% of inquiries automatically',
            'Live in 30 days with full support',
          ]}
          stats={[
            {
              label: 'Cost Reduction',
              value: '87%',
              icon: <DollarSign className="w-5 h-5 text-green-500" />,
            },
            {
              label: 'Response Time',
              value: '<30s',
              icon: <Clock className="w-5 h-5 text-blue-500" />,
            },
            {
              label: 'Automation Rate',
              value: '80%',
              icon: <Zap className="w-5 h-5 text-purple-500" />,
            },
            {
              label: 'Customer Satisfaction',
              value: '95%',
              icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
            },
          ]}
          startingPrice="$890"
          currency="AUD"
          ctaText="Calculate Your Savings"
          ctaLink="/services/smart-assistant#roi-calculator"
          imageSrc="/assets/marketing/images/smart-assistant-dashboard.png"
          badge="⭐ Most Popular"
        />
      </div>

      {/* Other Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Other service cards here */}
      </div>
    </div>
  </section>
);

