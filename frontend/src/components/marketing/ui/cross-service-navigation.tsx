import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Network, Rocket, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/marketing/ui/button';

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  benefits: string[];
  popular?: boolean;
  complementary?: boolean;
}

interface CrossServiceNavigationProps {
  currentService: 'system-integration' | 'digital-solutions' | 'smart-assistant';
  title?: string;
  description?: string;
  showComparison?: boolean;
  compact?: boolean;
}

const allServices: Record<string, ServiceCard> = {
  'system-integration': {
    id: 'system-integration',
    title: 'Connect Everything',
    description: 'Seamlessly integrate all your business systems',
    icon: <Network className="w-5 h-5" />,
    link: '/services/system-integration',
    benefits: ['Eliminate data silos', 'Automate workflows', 'Real-time sync'],
    complementary: true,
  },
  'digital-solutions': {
    id: 'digital-solutions',
    title: 'Digital Solutions & Modernization',
    description: 'Transform your business with modern technology and legacy migration',
    icon: <Rocket className="w-5 h-5" />,
    link: '/services/digital-solutions',
    benefits: ['60% cost reduction', '3x performance', '150% engagement'],
  },
  'smart-assistant': {
    id: 'smart-assistant',
    title: 'Smart Business Assistant',
    description: '24/7 AI-powered automation for customer service and operations',
    icon: <Rocket className="w-5 h-5" />,
    link: '/services/smart-assistant',
    benefits: ['24/7 customer support', '87% cost reduction', 'Instant responses'],
    popular: true,
  },
};

const serviceRelationships = {
  'system-integration': {
    related: ['digital-solutions', 'smart-assistant'],
    complementary: ['digital-solutions'],
    upgrade: ['digital-solutions'],
  },
  'digital-solutions': {
    related: ['system-integration', 'smart-assistant'],
    complementary: ['system-integration'],
    upgrade: ['system-integration'],
  },
  'smart-assistant': {
    related: ['system-integration', 'digital-solutions'],
    complementary: ['system-integration'],
    upgrade: ['digital-solutions'],
  },
};

export const CrossServiceNavigation: React.FC<CrossServiceNavigationProps> = ({
  currentService,
  title = 'Complete Your Digital Transformation',
  description = 'Maximize your ROI by combining our services for a comprehensive solution',
  showComparison = false,
  compact = false,
}) => {
  const relationships = serviceRelationships[currentService];
  const relatedServices = relationships?.related.map((id) => allServices[id]).filter(Boolean) || [];
  const complementaryService = relationships?.complementary[0]
    ? allServices[relationships.complementary[0]]
    : null;

  const handleServiceClick = (
    serviceId: string,
    type: 'related' | 'complementary' | 'comparison'
  ) => {
    // Track cross-service navigation
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cross_service_navigation', {
        event_category: 'engagement',
        event_label: `${currentService}_to_${serviceId}`,
        service_type: type,
      });
    }
  };

  // Compact view - three buttons in one row
  if (compact) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedServices.slice(0, 3).map((service) => (
              <Link
                key={service.id}
                to={service.link}
                onClick={() => handleServiceClick(service.id, 'related')}
                className="group"
              >
                <div
                  className="relative h-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 hover:border-ethos-purple transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
                >
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-ethos-navy mb-2 group-hover:text-ethos-purple transition-colors">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>

                  {/* Benefits */}
                  <ul className=".5 mb-4">
                    {service.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start text-xs text-gray-600">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="flex items-center text-sm font-medium text-ethos-purple group-hover:text-ethos-navy transition-colors">
                    <span>Explore {service.title.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Original full view
  return (
    <section className="py-16 bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-medium text-ethos-navy mb-4">{title}</h2>
          <p className="text-xl text-ethos-gray max-w-3xl mx-auto">{description}</p>
        </div>

        {/* Complementary Service Highlight */}
        {complementaryService && (
          <div className="mb-12">
            <div
              className="p-6 md:p-8 bg-gradient-to-r from-ethos-purple/10 to-ethos-navy/10 border-2 border-ethos-purple/20 rounded-2xl transition-all duration-300 hover:shadow-lg"
              style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-ethos-navy">
                        {complementaryService.title}
                      </h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        Perfect Match
                      </span>
                    </div>
                    <p className="text-ethos-gray mb-3">{complementaryService.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {complementaryService.benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 text-sm text-ethos-gray"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-ethos-gray mb-2">Bundle & Save</div>
                  <div className="text-2xl font-bold text-green-600 mb-3">20% Off</div>
                  <Link
                    to={complementaryService.link}
                    onClick={() => handleServiceClick(complementaryService.id, 'complementary')}
                  >
                    <Button
                      size="default"
                      className="bg-ethos-purple hover:bg-ethos-purple/90 text-white"
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {relatedServices.map((service) => (
            <div
              key={service.id}
              className="p-6 rounded-2xl bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-ethos-navy">{service.title}</h3>
                    {service.popular && (
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                        <Star className="w-3 h-3" />
                        <span>Popular</span>
                      </div>
                    )}
                  </div>
                  <p className="text-ethos-gray mb-4">{service.description}</p>
                  <div className="mb-4">
                    {service.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-ethos-gray">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={service.link} onClick={() => handleServiceClick(service.id, 'related')}>
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full border-ethos-purple text-ethos-purple hover:bg-ethos-purple hover:text-white"
                    >
                      Explore {service.title}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Service Comparison CTA */}
        {showComparison && (
          <div className="text-center">
            <div
              className="p-6 bg-white border-2 border-ethos-purple/20 rounded-2xl transition-all duration-300 hover:shadow-lg"
              style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
            >
              <h3 className="text-xl font-semibold text-ethos-navy mb-3">
                Not sure which service is right for you?
              </h3>
              <p className="text-ethos-gray mb-6">
                Get a personalized recommendation based on your business needs and goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact?source=service-comparison">
                  <Button
                    size="lg"
                    className="bg-ethos-purple hover:bg-ethos-purple/90 text-white"
                    onClick={() => handleServiceClick('comparison', 'comparison')}
                  >
                    Get Free Consultation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button
                    variant="outline"
                    size="default"
                    className="border-ethos-navy text-ethos-navy hover:bg-ethos-navy hover:text-white"
                  >
                    Compare All Services
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Service Bundle Recommendations Component
interface ServiceBundleProps {
  currentService: string;
  showPricing?: boolean;
}

export const ServiceBundleRecommendations: React.FC<ServiceBundleProps> = ({
  currentService,
  showPricing = true,
}) => {
  const bundles = {
    'ai-solutions': {
      title: 'AI + Integration Bundle',
      description: 'Smart AI assistant with seamless system integration',
      services: ['ai-solutions', 'system-integration'],
      savings: '25%',
      price: '$2,999/month',
    },
    'system-integration': {
      title: 'Complete Digital Suite',
      description: 'Integration + modern digital solutions + AI support',
      services: ['system-integration', 'digital-solutions', 'smart-assistant'],
      savings: '30%',
      price: '$4,499/month',
    },
    'digital-solutions': {
      title: 'Full Transformation Package',
      description: 'Complete modernization with ongoing support',
      services: ['digital-solutions', 'system-integration', 'smart-assistant'],
      savings: '35%',
      price: '$5,999/month',
    },
    'smart-assistant': {
      title: 'AI Automation Suite',
      description: 'Smart assistant with system integration and digital solutions',
      services: ['smart-assistant', 'system-integration', 'digital-solutions'],
      savings: '30%',
      price: '$3,499/month',
    },
  };

  const bundle = bundles[currentService as keyof typeof bundles];
  if (!bundle) return null;

  return (
    <div
      className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-200 transition-all duration-300 hover:shadow-lg"
      style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-ethos-navy mb-2">
            💡 Recommended Bundle: {bundle.title}
          </h4>
          <p className="text-ethos-gray mb-3">{bundle.description}</p>
          <div className="flex items-center gap-4">
            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
              Save {bundle.savings}
            </span>
            {showPricing && (
              <span className="text-lg font-bold text-ethos-navy">Starting at {bundle.price}</span>
            )}
          </div>
        </div>
        <Link to="/contact?source=bundle-recommendation">
          <Button variant="ethos" size="lg" className="bg-green-600 hover:bg-green-700">
            Get Bundle Quote
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
