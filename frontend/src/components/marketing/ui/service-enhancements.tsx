import { Badge } from '@/components/marketing/ui/badge';
import { Button } from '@/components/marketing/ui/button';
import { ClientLogo, TestimonialAvatar } from '@/components/marketing/ui/image-with-fallback';
import {
    AlertCircle,
    ArrowRight,
    Calculator,
    CheckCircle,
    Quote,
    Shield,
    Star,
} from 'lucide-react';
import React, { useState } from 'react';

// Client Testimonial Component
interface TestimonialProps {
  name: string;
  role: string;
  company: string;
  image: string;
  testimonial: string;
  metrics: {
    label: string;
    value: string;
  }[];
  rating: number;
}

export const ClientTestimonial: React.FC<TestimonialProps> = ({
  name,
  role,
  company,
  image,
  testimonial,
  metrics,
  rating,
}) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 bg-white border border-gray-200 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
      <div className="flex items-start gap-4 mb-6">
        <TestimonialAvatar
          src={image}
          name={name}
          className="w-16 h-16 border-2 border-ethos-purple/20"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-ethos-navy text-lg">{name}</h4>
            <div className="flex gap-1">
              {[...Array(rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
          <p className="text-ethos-gray text-sm">
            {role} at {company}
          </p>
        </div>
        <Quote className="w-8 h-8 text-ethos-purple/30" />
      </div>

      <blockquote className="text-ethos-gray-dark text-base leading-relaxed mb-6 italic">
        "{testimonial}"
      </blockquote>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl font-bold text-ethos-purple mb-1">{metric.value}</div>
            <div className="text-xs text-ethos-gray">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Client Logos Section
interface ClientLogosProps {
  title?: string;
  logos: {
    name: string;
    logo: string;
    industry: string;
  }[];
}

export const ClientLogos: React.FC<ClientLogosProps> = ({
  title = 'Trusted by Industry Leaders',
  logos,
}) => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-center text-2xl font-semibold text-ethos-navy mb-8">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 items-center">
          {logos.map((client, index) => (
            <div key={index} className="flex flex-col items-center">
              <ClientLogo
                src={client.logo}
                name={client.name}
                className="h-12 w-auto grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
              />
              <span className="text-xs text-ethos-gray text-center">{client.industry}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ROI Calculator Component
interface ROICalculatorProps {
  title: string;
  description: string;
  inputs: {
    label: string;
    key: string;
    type: 'number' | 'select';
    options?: string[];
    defaultValue?: string | number;
    prefix?: string;
    suffix?: string;
  }[];
  calculation: (inputs: Record<string, string | number>) => {
    monthlySavings: number;
    annualSavings: number;
    roi: number;
    paybackPeriod: number;
  };
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({
  title,
  description,
  inputs,
  calculation,
}) => {
  const [inputValues, setInputValues] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    inputs.forEach((input) => {
      initial[input.key] = input.defaultValue || (input.type === 'number' ? 0 : '');
    });
    return initial;
  });

  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (key: string, value: string | number) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  const calculateROI = () => {
    const results = calculation(inputValues);
    setShowResults(true);
    return results;
  };

  const results = showResults ? calculateROI() : null;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5 border border-ethos-purple/20 rounded-2xl transition-all duration-300 hover:shadow-lg" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-ethos-purple" />
        <h3 className="text-2xl font-semibold text-ethos-navy">{title}</h3>
      </div>

      <p className="text-ethos-gray mb-8">{description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {inputs.map((input, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-ethos-navy mb-2">{input.label}</label>
            {input.type === 'number' ? (
              <div className="relative">
                {input.prefix && (
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ethos-gray">
                    {input.prefix}
                  </span>
                )}
                <input
                  type="number"
                  value={inputValues[input.key]}
                  onChange={(e) => handleInputChange(input.key, Number(e.target.value))}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-ethos-purple focus:border-transparent ${
                    input.prefix ? 'pl-8' : ''
                  } ${input.suffix ? 'pr-12' : ''}`}
                />
                {input.suffix && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ethos-gray">
                    {input.suffix}
                  </span>
                )}
              </div>
            ) : (
              <select
                value={inputValues[input.key]}
                onChange={(e) => handleInputChange(input.key, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
              >
                {input.options?.map((option, optIndex) => (
                  <option key={optIndex} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      <Button onClick={calculateROI} variant="ethos" size="lg" className="mb-8">
        Calculate Your ROI
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 bg-white rounded-lg border border-ethos-purple/20">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              ${results.monthlySavings.toLocaleString()}
            </div>
            <div className="text-sm text-ethos-gray">Monthly Savings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              ${results.annualSavings.toLocaleString()}
            </div>
            <div className="text-sm text-ethos-gray">Annual Savings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-ethos-purple mb-1">{results.roi}%</div>
            <div className="text-sm text-ethos-gray">ROI</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-ethos-navy mb-1">{results.paybackPeriod}</div>
            <div className="text-sm text-ethos-gray">Months to Payback</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Pricing Card Component
interface PricingCardProps {
  title: string;
  description: string;
  startingPrice: string;
  features: string[];
  popular?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  description,
  startingPrice,
  features,
  popular = false,
  ctaText = 'Get Started',
  ctaLink = '/contact',
}) => {
  return (
    <div
      className={`p-4 sm:p-6 md:p-8 relative rounded-2xl bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        popular
          ? 'border-2 border-ethos-purple sm:scale-105'
          : 'border border-gray-200'
      }`}
      style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-ethos-purple text-white px-4 py-1">
          Most Popular
        </Badge>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-semibold text-ethos-navy mb-2">{title}</h3>
        <p className="text-ethos-gray mb-4">{description}</p>
        <div className="text-4xl font-bold text-ethos-purple mb-1">{startingPrice}</div>
        <div className="text-sm text-ethos-gray">Starting from</div>
      </div>

      <ul className="mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-1 flex-shrink-0" />
            <span className="text-sm sm:text-base text-ethos-gray-dark">{feature}</span>
          </li>
        ))}
      </ul>

      <Button variant={popular ? 'ethos' : 'outline'} size="lg" asChild>
        <a href={ctaLink}>{ctaText}</a>
      </Button>
    </div>
  );
};

// Urgency Banner Component
interface UrgencyBannerProps {
  message: string;
  ctaText: string;
  ctaLink: string;
  expiryDate?: string;
  limitedSlots?: number;
}

export const UrgencyBanner: React.FC<UrgencyBannerProps> = ({
  message,
  ctaText,
  ctaLink,
  expiryDate,
  limitedSlots,
}) => {
  return (
    <div className="bg-gradient-to-r from-ethos-purple to-pink-600 text-white py-3 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{message}</span>
          {expiryDate && <span className="text-purple-100">Expires: {expiryDate}</span>}
          {limitedSlots && (
            <span className="text-purple-100">Only {limitedSlots} slots remaining</span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white text-ethos-purple hover:bg-ethos-purple/5"
          asChild
        >
          <a href={ctaLink}>{ctaText}</a>
        </Button>
      </div>
    </div>
  );
};

// Trust Signals Component - Simple & Direct
interface TrustSignal {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface TrustSignalsProps {
  signals?: TrustSignal[];
}

export const TrustSignals: React.FC<TrustSignalsProps> = ({ signals }) => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const bannerBackgroundPath = `${baseUrl}assets/marketing/images/banner-background.jpg`;

  return (
    <section className="w-full relative overflow-hidden bg-white">
      <div className="relative">
        {/* Background Section with Navy */}
        <div className="relative flex flex-col py-12 bg-gray-800">
          {/* Banner Background Image - positioned behind content */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={bannerBackgroundPath}
              alt=""
              className="w-full h-full object-cover object-center sm:object-right transition-all duration-300"
              aria-hidden="true"
            />
          </div>

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gray-900/60" aria-hidden="true"></div>

          {/* Content Section */}
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-3">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-300 mb-4 tracking-tight">
                Your Data is <span className="text-ethos-purple/80 hover:text-ethos-purple transition-colors">Safe & Secure</span>
              </h2>
              <p className="text-base text-gray-400 max-w-2xl mx-auto">
                We protect your information like a bank protects your money
              </p>
            </div>

            {/* Security Features Grid - Auto-center based on number of items */}
            {(() => {
              const securitySignals = signals || [
                {
                  title: 'Your Data Stays Private',
                  description: 'Like a locked safe, only you have the key',
                  icon: <Shield className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                },
                {
                  title: 'We Check Every Entry',
                  description: 'Like checking ID at the door, every single time',
                  icon: <Shield className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                },
                {
                  title: 'Always Watching for Threats',
                  description: 'Like a security guard who never sleeps',
                  icon: <Shield className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                }
              ];
              const itemCount = securitySignals.length;

              // Determine grid classes based on item count
              const gridClasses = itemCount === 3
                ? "grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-center"
                : itemCount === 4
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto text-center"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto text-center";

              return (
                <div className={gridClasses}>
                  {securitySignals.map((signal, index) => (
                    <div key={index} className="text-gray-400">
                      <div className="flex justify-center mb-2">
                        {signal.icon}
                      </div>
                      <div className="text-base font-semibold mb-1 text-gray-300">{signal.title}</div>
                      <div className="text-gray-500 text-sm">{signal.description}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
};
