import { Button } from '@/components/marketing/ui/button';
import {
  ArrowRight,
  Calculator,
  CheckCircle,
  Clock,
  DollarSign,
  HelpCircle,
  Mail,
  TrendingUp,
  X,
} from 'lucide-react';
import { Input } from '@/components/marketing/ui/input';
import React, { useState } from 'react';
import { useAnalytics as useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import {
  useROICalculator,
  formatCurrency,
  formatNumber,
  type ROICalculatorInputs,
} from '@/hooks/useROICalculator';

interface UnifiedROICalculatorProps {
  title?: string;
  description?: string;
  showHeader?: boolean;
  leadMagnet?: string;
  onEmailCapture?: (
    email: string,
    name?: string,
    calculatorData?: Record<string, unknown>
  ) => Promise<void>;
}

export const UnifiedROICalculator: React.FC<UnifiedROICalculatorProps> = ({
  title = 'Calculate Your Digital Transformation ROI',
  description = 'See exactly how much you could save and earn with modern digital solutions. Our calculator combines cost savings from migration with revenue growth from optimization.',
  showHeader = true,
  leadMagnet = 'Get Your Complete Digital Transformation ROI Report + Custom Roadmap',
  onEmailCapture,
}) => {
  // Use the shared ROI calculator hook with Australian 2025 benchmarks
  const { inputs, results, setInput } = useROICalculator();

  const [showEmailGate, setShowEmailGate] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { trackROICalculator, trackEmailCapture, trackEvent } = useMarketingAnalytics();

  const handleInputChange = (key: keyof ROICalculatorInputs, value: string | number) => {
    setInput(key, value as ROICalculatorInputs[typeof key]);
  };

  const handleCalculateClick = () => {
    trackROICalculator('start', 'digital-solutions');

    setShowEmailGate(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      // Use results from hook directly
      const calculatorData = {
        inputs,
        results,
        service: 'digital-solutions',
        timestamp: new Date().toISOString(),
      };

      let contactId: string | undefined;

      if (onEmailCapture) {
        await onEmailCapture(email, name, calculatorData);
      } else {
        // Default email capture logic
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

        const response = await fetch('/api/leads/capture-roi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            name,
            service: 'digital-solutions',
            source: 'unified_roi_calculator',
            meta: {
              roiSnapshot: calculatorData,
              leadMagnet,
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

      trackEmailCapture('unified_roi_calculator', 'digital-solutions', leadMagnet, contactId);
      trackROICalculator('email_gate', 'digital-solutions', results.annualBenefit);

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
        label: 'digital-solutions',
        custom_parameters: {
          service_type: 'digital-solutions',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // formatCurrency and formatNumber are imported from hook

  return (
    <div
      className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5 border border-ethos-purple/20 rounded-2xl transition-all duration-300 hover:shadow-lg"
      style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
    >
      {showHeader && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-ethos-purple" />
            <h3 className="text-2xl font-semibold text-ethos-navy">{title}</h3>
          </div>

          <p className="text-ethos-gray mb-8">{description}</p>
        </>
      )}

      {/* Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Current Platform */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ethos-navy mb-2">
            Current Platform
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Your current website or application platform
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </label>
          <select
            value={inputs.currentPlatform}
            onChange={(e) => handleInputChange('currentPlatform', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
          >
            <option value="WordPress">WordPress</option>
            <option value="Custom PHP/Legacy">Custom PHP/Legacy</option>
            <option value="Shopify">Shopify</option>
            <option value="Wix/Squarespace">Wix/Squarespace</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Monthly Visitors */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ethos-navy mb-2">
            Monthly Website Visitors
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Average number of unique visitors per month
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </label>
          <input
            type="number"
            value={inputs.monthlyVisitors}
            onChange={(e) => handleInputChange('monthlyVisitors', Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
          />
        </div>

        {/* Conversion Rate */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ethos-navy mb-2">
            Current Conversion Rate
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs">
                Percentage of visitors who complete a desired action
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </label>
          <div className="relative">
            <input
              type="number"
              value={inputs.conversionRate}
              onChange={(e) => handleInputChange('conversionRate', Number(e.target.value))}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
              step="0.1"
              min="0"
              max="100"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ethos-gray">
              %
            </span>
          </div>
        </div>

        {/* Average Order Value */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ethos-navy mb-2">
            Average Order/Lead Value
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs">
                Average revenue per conversion (order, lead, subscription)
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ethos-gray">
              $
            </span>
            <input
              type="number"
              value={inputs.orderValue}
              onChange={(e) => handleInputChange('orderValue', Number(e.target.value))}
              className="w-full px-4 py-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        {/* Monthly Maintenance Costs */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ethos-navy mb-2">
            Monthly Maintenance Costs
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs">
                Total monthly costs for hosting, plugins, updates, security, and developer time
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ethos-gray">
              $
            </span>
            <input
              type="number"
              value={inputs.maintenanceCosts}
              onChange={(e) => handleInputChange('maintenanceCosts', Number(e.target.value))}
              className="w-full px-4 py-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        {/* Business Type */}
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ethos-navy mb-2">
            Business Type
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Your industry for conversion improvement estimates
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </label>
          <select
            value={inputs.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
          >
            <option value="E-commerce">E-commerce</option>
            <option value="Professional Services">Professional Services</option>
            <option value="SaaS">SaaS</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Calculate Button */}
      {!showEmailGate && !showResults && (
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleCalculateClick}
            className="px-6 py-3 text-button-default font-medium"
            variant="ethos"
            size="lg"
          >
            Calculate My ROI
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Email Gate Modal */}
      {showEmailGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="relative w-full max-w-sm sm:max-w-md mx-auto bg-white rounded-2xl max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
          >
            <button
              onClick={() => setShowEmailGate(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              {!isSubmitted ? (
                <>
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-ethos-purple to-ethos-navy rounded-full">
                    <Calculator className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-semibold text-ethos-navy text-center mb-2">
                    Get Your ROI Report
                  </h3>

                  <p className="text-ethos-gray text-center mb-6">
                    Enter your email to receive your personalized digital transformation ROI
                    analysis and custom roadmap.
                  </p>

                  <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ethos-navy mb-2">
                        Name (Optional)
                      </label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setName(e.target.value)
                        }
                        placeholder="Your name"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ethos-navy mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEmail(e.target.value)
                          }
                          placeholder="you@company.com"
                          required
                          className="w-full pl-10"
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5 p-4 rounded-2xl">
                      <p className="text-sm text-ethos-gray">
                        <strong className="text-ethos-navy">You'll receive:</strong>
                      </p>
                      <ul className="mt-2 flex flex-col gap-1 text-sm text-ethos-gray">
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Complete ROI analysis with cost savings & revenue growth</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Custom digital transformation roadmap</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Platform migration strategy & timeline</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !email}
                        className="px-6 py-3 text-button-default font-medium"
                        variant="ethos"
                        size="lg"
                      >
                        {isSubmitting ? 'Sending...' : 'Get My ROI Report'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                      We respect your privacy. No spam, ever.
                    </p>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-ethos-navy mb-2">Success!</h3>
                  <p className="text-ethos-gray">
                    Check your email for your personalized ROI report. Showing your results now...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {showResults && results && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Primary Metrics - Large Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Monthly Benefit */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">Total Monthly Benefit</p>
              </div>
              <p className="text-3xl font-bold text-green-900 mb-1">
                {formatCurrency(results.totalMonthlyBenefit)}
                <span className="text-lg font-normal text-green-700">/month</span>
              </p>
              <p className="text-xs text-green-700">↑ Cost Savings + Revenue Growth</p>
            </div>

            {/* Payback Period */}
            <div className="bg-gradient-to-br from-ethos-navy/5 to-ethos-navy/10 p-6 rounded-2xl border border-ethos-navy/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-ethos-navy" />
                <p className="text-sm font-medium text-ethos-navy">Payback Period</p>
              </div>
              <p className="text-3xl font-bold text-ethos-navy mb-1">
                {results.paybackPeriodFormatted}
              </p>
              <p className="text-xs text-gray-700">Break-even by {results.breakEvenDate}</p>
            </div>

            {/* 3-Year ROI */}
            <div className="bg-gradient-to-br from-ethos-purple/5 to-ethos-purple/10 p-6 rounded-2xl border border-ethos-purple/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-ethos-purple" />
                <p className="text-sm font-medium text-ethos-purple">3-Year ROI</p>
              </div>
              <p className="text-3xl font-bold text-ethos-purple mb-1">
                {formatNumber(results.threeYearROI)}%
              </p>
              <p className="text-xs text-gray-700">
                {formatCurrency(results.threeYearBenefit)} total benefit
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h4 className="text-lg font-semibold text-ethos-navy mb-4">Detailed Breakdown</h4>

            <div className="flex flex-col gap-4">
              {/* Cost Savings */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div>
                  <p className="font-medium text-ethos-navy">Monthly Cost Savings</p>
                  <p className="text-sm text-ethos-gray">
                    Reduced maintenance, hosting, and developer costs
                  </p>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(results.monthlyCostSavings)}
                </p>
              </div>

              {/* Revenue Growth */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div>
                  <p className="font-medium text-ethos-navy">Monthly Revenue Growth</p>
                  <p className="text-sm text-ethos-gray">
                    From improved conversion rates and user experience
                  </p>
                </div>
                <p className="text-xl font-bold text-ethos-purple">
                  {formatCurrency(results.monthlyRevenueGrowth)}
                </p>
              </div>

              {/* Annual Benefit */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div>
                  <p className="font-medium text-ethos-navy">Annual Benefit</p>
                  <p className="text-sm text-ethos-gray">
                    Total savings and revenue growth per year
                  </p>
                </div>
                <p className="text-xl font-bold text-ethos-purple">
                  {formatCurrency(results.annualBenefit)}
                </p>
              </div>

              {/* Implementation Cost */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-ethos-navy">Estimated Implementation Cost</p>
                  <p className="text-sm text-ethos-gray">
                    One-time investment for {inputs.currentPlatform} migration
                  </p>
                </div>
                <p className="text-xl font-bold text-ethos-navy">
                  {formatCurrency(results.implementationCost)}
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Comparison */}
          <div className="bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5 p-6 rounded-2xl border border-ethos-purple/20">
            <h4 className="text-lg font-semibold text-ethos-navy mb-4">Revenue Comparison</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl">
                <p className="text-sm text-ethos-gray mb-1">Current Monthly Revenue</p>
                <p className="text-2xl font-bold text-ethos-navy">
                  {formatCurrency(results.currentMonthlyRevenue)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-green-500">
                <p className="text-sm text-green-700 mb-1">Projected Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(results.improvedMonthlyRevenue)}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-ethos-navy to-ethos-purple p-6 rounded-2xl text-white text-center">
            <h4 className="text-xl font-semibold mb-2">Ready to Transform Your Business?</h4>
            <p className="text-white/90 mb-4">
              Let's discuss how we can help you achieve these results with a custom digital
              transformation strategy.
            </p>
            <Button
              onClick={() => (window.location.href = '/contact?source=roi-calculator')}
              className="bg-white text-ethos-navy hover:bg-gray-100 px-6 py-3 rounded-lg font-medium"
              variant="secondary"
              size="lg"
            >
              Schedule Free Consultation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
