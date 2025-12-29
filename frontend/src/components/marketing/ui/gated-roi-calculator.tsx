import { Button } from '@/components/marketing/ui/button';
import { Input } from '@/components/marketing/ui/input';
import {
    ArrowRight,
    Calculator,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    HelpCircle,
    Mail,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAnalytics as useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { formatCurrency } from '@/hooks/useROICalculator';

interface GatedROICalculatorProps {
  title: string;
  description: string;
  showHeader?: boolean;
  inputs: {
    label: string;
    key: string;
    type: 'number' | 'select';
    options?: string[];
    defaultValue?: string | number;
    prefix?: string;
    suffix?: string;
    tooltip?: string;
  }[];
  calculation: (inputs: Record<string, string | number>) => {
    monthlySavings: number;
    annualSavings: number;
    roi: number;
    paybackPeriod: number;
    costSavings?: number;
    revenueRecovery?: number;
    productivityGains?: number;
    implementationCost?: number;
  };
  service:
    | 'ai-solutions'
    | 'system-integration'
    | 'web-mobile'
    | 'digital-transformation'
    | 'smart-assistant';
  leadMagnet?: string;
  onEmailCapture?: (
    email: string,
    name?: string,
    calculatorData?: Record<string, unknown>
  ) => Promise<void>;
}

export const GatedROICalculator: React.FC<GatedROICalculatorProps> = ({
  title,
  description,
  showHeader = true,
  inputs,
  calculation,
  service,
  leadMagnet,
  onEmailCapture,
}) => {
  const [inputValues, setInputValues] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    inputs.forEach((input) => {
      initial[input.key] = input.defaultValue || (input.type === 'number' ? 0 : '');
    });
    return initial;
  });

  const [showEmailGate, setShowEmailGate] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { trackROICalculator, trackEmailCapture, trackEvent } = useMarketingAnalytics();

  const handleInputChange = (key: string, value: string | number) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculateClick = () => {
    trackROICalculator('start', service);

    setShowEmailGate(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const calculatorData = {
        inputs: inputValues,
        results: calculation(inputValues),
        service,
        timestamp: new Date().toISOString(),
      };

      const metadata: {
        userAgent?: string;
        referrerUrl?: string;
        utmParams?: Record<string, string>;
      } = {};

      if (typeof navigator !== 'undefined') {
        metadata.userAgent = navigator.userAgent;
      }

      if (typeof document !== 'undefined' && document.referrer) {
        metadata.referrerUrl = document.referrer;
      } else if (typeof window !== 'undefined') {
        metadata.referrerUrl = window.location.href;
      }

      const utmParams: Record<string, string> = {};
      try {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.forEach((value, key) => {
            if (key.toLowerCase().startsWith('utm_')) {
              utmParams[key] = value;
            }
          });
        }
      } catch {
        // Ignore URL parsing errors
      }

      if (Object.keys(utmParams).length > 0) {
        metadata.utmParams = utmParams;
      }

      let contactId: string | undefined;

      if (onEmailCapture) {
        await onEmailCapture(email, name, calculatorData);
      } else {
        // Default email capture logic
        const response = await fetch('/api/leads/capture-roi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            name,
            service,
            source: 'roi_calculator',
            meta: {
              roiSnapshot: calculatorData,
              leadMagnet:
                leadMagnet || `${service} Return on Investment Calculator Results`,
            },
            metadata,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to capture lead');
        }

        try {
          const json = await response.json();
          if (json && typeof json === 'object' && json.contactId) {
            contactId = String(json.contactId);
          }
        } catch {
          // Intentionally ignoring JSON parse errors from response
        }
      }

      const results = calculatorData.results;
      const annualSavings = typeof results?.annualSavings === 'number' ? results.annualSavings : undefined;

      trackEmailCapture(
        'roi_calculator',
        service,
        leadMagnet || `${service} Return on Investment Calculator Results`,
        contactId,
      );
      trackROICalculator('email_gate', service, annualSavings);

      setIsSubmitted(true);
      setTimeout(() => {
        setShowResults(true);
        setShowEmailGate(false);
      }, 1500);
    } catch (error) {
      console.error('Error capturing calculator lead:', error);
      trackEvent({
        action: 'roi_calculator_error',
        category: 'ROI Calculator',
        label: service,
        custom_parameters: {
          service_type: service,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const results = showResults ? calculation(inputValues) : null;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5 border border-ethos-purple/20 rounded-2xl transition-all duration-300 hover:shadow-lg" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
      {showHeader && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-ethos-purple" />
            <h3 className="text-2xl font-semibold text-ethos-navy">{title}</h3>
          </div>

          <p className="text-ethos-gray mb-8">{description}</p>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {inputs.map((input) => (
          <div key={input.key}>
            <label className="flex items-center gap-2 text-sm font-medium text-ethos-navy mb-2">
              {input.label}
              {input.tooltip && (
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs">
                    {input.tooltip}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </label>
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
                {input.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {!showEmailGate && !showResults && (
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleCalculateClick}
            className="px-6 py-3 text-button-default font-medium rounded-full"
            variant="ethos"
            size="lg"
          >
            Calculate ROI
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Email Gate Modal */}
      {showEmailGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm sm:max-w-md mx-auto bg-white rounded-2xl max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
            <button
              onClick={() => setShowEmailGate(false)}
              className="absolute top-4 right-4 p-3 rounded-full hover:bg-gray-100 transition-colors min-h-[48px] min-w-[48px] touch-manipulation"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-4 sm:p-6 md:p-8">
              {isSubmitted ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-ethos-navy mb-2">Almost There!</h3>
                  <p className="text-ethos-gray">Preparing your personalized ROI report...</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                      <Mail className="w-8 h-8 text-ethos-purple" />
                    </div>
                    <h3 className="text-xl font-semibold text-ethos-navy mb-3">
                      Get Your ROI Report
                    </h3>
                    <p className="text-ethos-gray text-sm">
                      Enter your email to receive your personalized ROI calculation plus bonus resources.
                    </p>
                  </div>

                  <div className="bg-ethos-purple/5 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Download className="w-5 h-5 text-ethos-purple mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-ethos-navy text-sm">You'll Get:</h4>
                        <p className="text-ethos-gray text-sm">
                          {leadMagnet || `Detailed ${service} Return on Investment report + implementation guide`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                    <Input
                      type="text"
                      placeholder="Your Name (Optional)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full"
                    />
                    <Input
                      type="email"
                      placeholder="Your Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full"
                    />
                    <div className="flex justify-center">
                      <Button
                        type="submit"
                        disabled={!email || isSubmitting}
                        variant="ethos"
                        size="lg"
                        className="px-6 py-3 text-button-default font-medium rounded-full"
                      >
                        {isSubmitting ? 'Sending...' : 'Get My ROI Report'}
                      </Button>
                    </div>
                  </form>

                  <p className="text-xs text-ethos-gray text-center mt-4">
                    No spam. Unsubscribe anytime. We respect your privacy.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div>
          {/* Main ROI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5 rounded-2xl border border-ethos-purple/20" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-green-600 mr-1" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {formatCurrency(results.monthlySavings)}
              </div>
              <div className="text-sm text-ethos-gray">Monthly Savings</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-green-600 mr-1" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {formatCurrency(results.annualSavings)}
              </div>
              <div className="text-sm text-ethos-gray">Annual Savings</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-ethos-purple mr-1" />
              </div>
              <div className="text-3xl font-bold text-ethos-purple mb-1">{results.roi}%</div>
              <div className="text-sm text-ethos-gray">ROI</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-ethos-navy mr-1" />
              </div>
              <div className="text-3xl font-bold text-ethos-navy mb-1">
                {results.paybackPeriod === 999 ? '∞' : results.paybackPeriod}
              </div>
              <div className="text-sm text-ethos-gray">Months to Payback</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          {(results.costSavings || results.revenueRecovery || results.productivityGains) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
              <h4 className="text-lg font-semibold text-ethos-navy mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Savings Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.costSavings && results.costSavings > 0 && (
                  <div className="text-center p-4 bg-ethos-navy/5 rounded-lg border border-ethos-navy/10">
                    <div className="text-2xl font-bold text-ethos-navy mb-1">
                      {formatCurrency(results.costSavings)}
                    </div>
                    <div className="text-sm text-gray-600">Cost Reduction</div>
                    <div className="text-xs text-gray-500 mt-1">27% avg. service cost savings</div>
                  </div>
                )}
                {results.revenueRecovery && results.revenueRecovery > 0 && (
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatCurrency(results.revenueRecovery)}
                    </div>
                    <div className="text-sm text-gray-600">Revenue Recovery</div>
                    <div className="text-xs text-gray-500 mt-1">After-hours & faster response</div>
                  </div>
                )}
                {results.productivityGains && results.productivityGains > 0 && (
                  <div className="text-center p-4 bg-ethos-purple/5 rounded-lg border border-ethos-purple/10">
                    <div className="text-2xl font-bold text-ethos-purple mb-1">
                      {formatCurrency(results.productivityGains)}
                    </div>
                    <div className="text-sm text-gray-600">Productivity Gains</div>
                    <div className="text-xs text-gray-500 mt-1">1.2 hours saved per agent/day</div>
                  </div>
                )}
              </div>
              {results.implementationCost && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">
                    Monthly Implementation Cost:{' '}
                    <span className="font-semibold">
                      {formatCurrency(results.implementationCost)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <Button
              onClick={() => (window.location.href = '/contact?source=roi-calculator')}
              variant="ethos"
              size="lg"
            >
              Schedule Your Free Consultation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Get a personalized implementation plan and detailed ROI analysis
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
