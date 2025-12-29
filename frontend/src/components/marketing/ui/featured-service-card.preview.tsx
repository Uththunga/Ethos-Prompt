/**
 * FeaturedServiceCard Component Preview
 * 
 * This file provides a visual preview of the FeaturedServiceCard component
 * with different configurations. Use this for development and testing.
 * 
 * To view: Import this component in a test page or route.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { FeaturedServiceCard } from './featured-service-card';
import { DollarSign, Clock, Zap, TrendingUp, Users, Target, Rocket, Shield } from '@/components/icons/lucide';

/**
 * Preview Container Component
 */
export const FeaturedServiceCardPreview: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              FeaturedServiceCard Component Preview
            </h1>
            <p className="text-lg text-gray-600">
              Visual examples of the FeaturedServiceCard component in different configurations
            </p>
          </div>

          {/* Example 1: Smart Business Assistant (With Image & Icons) */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Example 1: Smart Business Assistant (Full Featured)
            </h2>
            <p className="text-gray-600 mb-6">
              Complete example with image, custom icons, and all features enabled.
            </p>
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
              imageSrc="https://via.placeholder.com/600x400/7409C5/FFFFFF?text=Smart+Assistant+Dashboard"
              badge="⭐ Most Popular"
            />
          </div>

          {/* Example 2: System Integration (Without Image) */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Example 2: System Integration (No Image)
            </h2>
            <p className="text-gray-600 mb-6">
              Example without image, showing how the component adapts to single-column layout.
            </p>
            <FeaturedServiceCard
              title="Connect Everything"
              description="Seamlessly integrate all your business tools and platforms. Automate data flow between email, calendar, and CRM systems—no coding required."
              benefits={[
                'Connect 100+ business applications',
                'Automate repetitive data entry tasks',
                'Real-time synchronization across platforms',
                'Visual workflow builder - no coding needed',
              ]}
              stats={[
                {
                  label: 'Time Saved',
                  value: '15hrs/week',
                  icon: <Clock className="w-5 h-5 text-blue-500" />,
                },
                {
                  label: 'Integrations',
                  value: '100+',
                  icon: <Target className="w-5 h-5 text-purple-500" />,
                },
                {
                  label: 'Error Reduction',
                  value: '99%',
                  icon: <Shield className="w-5 h-5 text-green-500" />,
                },
                {
                  label: 'Setup Time',
                  value: '2 days',
                  icon: <Rocket className="w-5 h-5 text-orange-500" />,
                },
              ]}
              startingPrice="$1,497"
              currency="AUD"
              ctaText="Explore Integrations"
              ctaLink="/services/system-integration"
              badge="🔗 Best for Teams"
            />
          </div>

          {/* Example 3: Digital Transformation (Enterprise) */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Example 3: Digital Transformation (Enterprise Pricing)
            </h2>
            <p className="text-gray-600 mb-6">
              Example with higher pricing tier and enterprise-focused messaging.
            </p>
            <FeaturedServiceCard
              title="Modern Business Upgrade"
              description="Transform traditional operations with smart automation. Create engaging digital experiences for customers and future-proof your business with cutting-edge technology."
              benefits={[
                'Complete digital transformation roadmap',
                'Legacy system modernization',
                'Cloud migration and optimization',
                'Dedicated transformation team',
                'Change management support',
                '24/7 enterprise support',
              ]}
              stats={[
                {
                  label: 'Efficiency Gain',
                  value: '3x',
                  icon: <TrendingUp className="w-5 h-5 text-green-500" />,
                },
                {
                  label: 'ROI Timeline',
                  value: '6 months',
                  icon: <Clock className="w-5 h-5 text-blue-500" />,
                },
                {
                  label: 'Success Rate',
                  value: '98%',
                  icon: <Target className="w-5 h-5 text-purple-500" />,
                },
                {
                  label: 'Support',
                  value: '24/7',
                  icon: <Users className="w-5 h-5 text-orange-500" />,
                },
              ]}
              startingPrice="$3,997"
              currency="AUD"
              ctaText="Book Strategy Session"
              ctaLink="/contact?service=digital-transformation"
              badge="🚀 Enterprise Ready"
              imageSrc="https://via.placeholder.com/600x400/1E3A8A/FFFFFF?text=Digital+Transformation"
            />
          </div>

          {/* Example 4: Minimal Configuration */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Example 4: Minimal Configuration (Required Props Only)
            </h2>
            <p className="text-gray-600 mb-6">
              Example with only required props, showing default behavior.
            </p>
            <FeaturedServiceCard
              title="Intelligent Applications"
              description="AI-powered web and mobile apps that learn from user interactions. Personalized experiences through machine learning and continuous improvement."
              benefits={[
                'Custom AI-powered applications',
                'Personalized user experiences',
                'Continuous learning and improvement',
              ]}
              stats={[
                { label: 'User Engagement', value: '+150%' },
                { label: 'Conversion Rate', value: '+85%' },
                { label: 'Development Time', value: '8 weeks' },
                { label: 'Scalability', value: 'Unlimited' },
              ]}
              startingPrice="$2,497"
              ctaText="View Demo"
              ctaLink="/services/intelligent-applications#demo"
            />
          </div>

          {/* Example 5: Different Badge Styles */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Example 5: Custom Badge Variations
            </h2>
            <p className="text-gray-600 mb-6">
              Examples showing different badge styles for different contexts.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <FeaturedServiceCard
                title="Service A"
                description="This service uses the 'Trending' badge to indicate growing popularity."
                benefits={['Benefit 1', 'Benefit 2', 'Benefit 3']}
                stats={[
                  { label: 'Metric 1', value: '100%' },
                  { label: 'Metric 2', value: '50+' },
                ]}
                startingPrice="$890"
                ctaText="Get Started"
                ctaLink="/services/service-a"
                badge="🔥 Trending"
              />

              <FeaturedServiceCard
                title="Service B"
                description="This service uses the 'Premium' badge to indicate high-value offering."
                benefits={['Benefit 1', 'Benefit 2', 'Benefit 3']}
                stats={[
                  { label: 'Metric 1', value: '100%' },
                  { label: 'Metric 2', value: '50+' },
                ]}
                startingPrice="$1,497"
                ctaText="Get Started"
                ctaLink="/services/service-b"
                badge="💎 Premium"
              />
            </div>
          </div>

          {/* Example 6: USD Currency */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Example 6: USD Currency (International Market)
            </h2>
            <p className="text-gray-600 mb-6">
              Example showing USD pricing for international markets.
            </p>
            <FeaturedServiceCard
              title="Global AI Solutions"
              description="Enterprise-grade AI solutions for international businesses. Available worldwide with multi-currency support."
              benefits={[
                'Global deployment infrastructure',
                'Multi-language support',
                'International compliance (GDPR, CCPA)',
                '24/7 global support team',
              ]}
              stats={[
                { label: 'Countries', value: '50+' },
                { label: 'Languages', value: '25+' },
                { label: 'Uptime', value: '99.9%' },
                { label: 'Response Time', value: '<1hr' },
              ]}
              startingPrice="$699"
              currency="USD"
              ctaText="Go Global"
              ctaLink="/services/global"
              badge="🌍 Global"
            />
          </div>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-600">
              Component: <code className="bg-gray-100 px-2 py-1 rounded">FeaturedServiceCard</code>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Location: frontend/src/components/marketing/ui/featured-service-card.tsx
            </p>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default FeaturedServiceCardPreview;

