import { MarketingChatModal } from '@/components/marketing/MarketingChatModal';
import { ServicePageTemplate } from '@/components/marketing/templates/ServicePageTemplate';
import React, { useState } from 'react';

import { ServiceCTA } from '@/components/marketing/services/ServiceCTA';

import { GatedROICalculator } from '@/components/marketing/ui/gated-roi-calculator';
import { InteractiveFAQ } from '@/components/marketing/ui/interactive-faq';
import { TrustSignals } from '@/components/marketing/ui/service-enhancements';
import { InvestmentSection } from '@/components/marketing/ui/service-layout-components';
import { IntegrationLogosMarquee } from '@/components/marketing/sections/IntegrationLogosMarquee';

import {
    CheckCircle, Cpu,
    Database, Gauge,
    Lock,
    Network,
    RefreshCw,
    Server, Workflow,
    Zap
} from 'lucide-react';

// Extend the solution feature type to include gradient
type SolutionFeature = {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient?: string;
};

// Proof item type matches Smart Business Assistant standard
type ProofItem = {
  title: string;
  metric: string;
  metricLabel: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  stats: Array<{ label: string; value: string }>;
};

export default function SystemIntegration() {
  const [isChatOpen, setIsChatOpen] = useState(false);


  // ROI Calculator configuration
  const roiCalculatorInputs = [
    {
      label: 'Number of Employees',
      key: 'employees',
      type: 'number' as const,
      defaultValue: 50,
      suffix: 'employees',
    },
    {
      label: 'Average Hourly Rate',
      key: 'hourlyRate',
      type: 'number' as const,
      defaultValue: 35,
      prefix: '$',
    },
    {
      label: 'Hours Spent on Manual Data Tasks (per employee/week)',
      key: 'manualHours',
      type: 'number' as const,
      defaultValue: 8,
      suffix: 'hours',
    },
    {
      label: 'Industry Type',
      key: 'industry',
      type: 'select' as const,
      options: [
        'Manufacturing',
        'Professional Services',
        'Healthcare',
        'Finance',
        'Technology',
        'Retail',
      ],
      defaultValue: 'Professional Services',
    },
  ];

  const calculateROI = (inputs: {
    employees?: number;
    hourlyRate?: number;
    manualHours?: number;
    industry?: string;
  }) => {
    const employees = inputs.employees ?? 0;
    const hourlyRate = inputs.hourlyRate ?? 0;
    const manualHours = inputs.manualHours ?? 0;

    // GAP-002 FIX: Industry-specific efficiency multipliers (Australian 2025 benchmarks)
    // Different industries have varying potential for integration automation gains
    const industryMultipliers: Record<string, number> = {
      'Manufacturing': 0.85,           // Higher repetitive processes
      'Professional Services': 0.75,   // Mix of custom and standard work
      'Healthcare': 0.80,              // High compliance, structured workflows
      'Finance': 0.82,                 // High data processing needs
      'Technology': 0.78,              // Already somewhat automated
      'Retail': 0.80,                  // Inventory and order processing
    };

    const efficiencyGain = industryMultipliers[inputs.industry ?? ''] ?? 0.80;

    // Calculate current waste
    const weeklyWaste = employees * manualHours * hourlyRate;
    const monthlyWaste = weeklyWaste * 4.33; // Average weeks per month
    const annualWaste = monthlyWaste * 12;

    // Apply industry-specific efficiency gain
    const monthlySavings = monthlyWaste * efficiencyGain;
    const annualSavings = annualWaste * efficiencyGain;

    // Industry-specific service cost (larger/more complex industries may have higher costs)
    const baseMonthlyCost = 2500;
    const industryCostMultiplier: Record<string, number> = {
      'Manufacturing': 1.15,
      'Healthcare': 1.20,
      'Finance': 1.25,
      'Professional Services': 1.0,
      'Technology': 1.10,
      'Retail': 1.05,
    };
    const monthlyCost = baseMonthlyCost * (industryCostMultiplier[inputs.industry ?? ''] ?? 1.0);

    const roi = ((monthlySavings - monthlyCost) / monthlyCost) * 100;
    const paybackPeriod = monthlyCost / Math.max(monthlySavings - monthlyCost, 1);

    return {
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      roi: Math.round(roi),
      paybackPeriod: Math.round(paybackPeriod),
    };
  };

  // Pricing data
  const pricingPlans = [
    {
      title: 'Essential',
      description: 'Perfect for small teams getting started with integration',
      startingPrice: 'Custom pricing based on your needs',
      features: [
        'Up to 10 app integrations',
        'Basic workflow automation',
        'Standard support',
        'Monthly reporting',
        'Email and chat support',
      ],
    },
    {
      title: 'Professional',
      description: 'Ideal for growing businesses with complex workflows',
      startingPrice: 'Custom pricing based on your needs',
      features: [
        'Up to 50 app integrations',
        'Advanced workflow automation',
        'Custom API integrations',
        'Real-time monitoring',
        'Priority support',
        'Dedicated integration specialist',
      ],
      popular: true,
    },
    {
      title: 'Enterprise',
      description: 'Custom solutions for large organizations',
      startingPrice: 'Custom pricing based on your needs',
      features: [
        'Unlimited integrations',
        'Enterprise-grade security',
        'Custom development',
        '24/7 dedicated support',
        'SLA guarantees',
        'On-premise deployment options',
      ],
    },
  ];

  // Solution features with icons and gradients
  const solutionFeatures: SolutionFeature[] = [
    {
      title: 'Connect Everything You Use',
      description: 'We work with over 600 apps. If you use it, we can probably connect it.',
      icon: <Network className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-blue-50 to-purple-50',
    },
    {
      title: 'Data That Moves Itself',
      description:
        'Information flows between your email, CRM, and accounting tools automatically. No more copy-paste.',
      icon: <RefreshCw className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-purple-50 to-pink-50',
    },
    {
      title: 'Workflows That Just Work',
      description:
        'When a customer signs, the deal, invoice, workspace and onboarding all trigger automatically. Magic.',
      icon: <Workflow className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-pink-50 to-blue-50',
    },
    {
      title: 'One Dashboard to Rule Them All',
      description: "See what's happening across your entire business in one place.",
      icon: <Server className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-blue-50 to-indigo-50',
    },
    {
      title: 'Handle the Complex Stuff',
      description:
        'Multi-step approvals, conditional logic, data formatting. We handle the hard parts.',
      icon: <Cpu className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-indigo-50 to-purple-50',
    },
    {
      title: 'Bank-Level Security',
      description:
        "Your data stays encrypted and safe. We treat your information like it's our own.",
      icon: <Lock className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-purple-50 to-pink-50',
    },
  ];

  // Proof points with metrics - Enhanced with full detail structure
  const proofItems: ProofItem[] = [
    {
      title: 'Get 20% of Your Week Back',
      description:
        'That fifth of the day your people spend on data entry is just the start. Integrated data gives your team the accurate, real-time view they need to make better decisions.',
      icon: <Gauge className="w-8 h-8 text-ethos-purple" />,
      metric: '85%',
      metricLabel: 'reduction',
      gradient: 'from-ethos-purple to-ethos-purple-dark',
      stats: [
        { label: 'Time saved', value: '21%' },
        { label: 'Error reduction', value: '95%' },
      ],
    },
    {
      title: '100% Accurate Data',
      description:
        'When information syncs automatically, everyone works from the same accurate data. No more conflicts, no more "which version is right?" conversations.',
      icon: <Database className="w-8 h-8 text-ethos-purple" />,
      metric: '95%',
      metricLabel: 'accuracy',
      gradient: 'from-ethos-purple to-ethos-purple-dark',
      stats: [
        { label: 'Data accuracy', value: '99.9%' },
        { label: 'Sync time', value: '<1s' },
      ],
    },
    {
      title: 'Processes Run in Minutes',
      description:
        'Processes that used to take hours now take minutes. When your systems work together, bottlenecks disappear and your business runs smoother.',
      icon: <Zap className="w-8 h-8 text-ethos-purple" />,
      metric: '60%',
      metricLabel: 'faster',
      gradient: 'from-ethos-purple to-ethos-purple-dark',
      stats: [
        { label: 'Process time', value: '-60%' },
        { label: 'Throughput', value: '+150%' },
      ],
    },
    {
      title: 'Setup in Days, Not Months',
      description:
        'Connect hundreds of apps without touching code. Your tools work together like they were built that way from the start.',
      icon: <Network className="w-8 h-8 text-ethos-purple" />,
      metric: '600+',
      metricLabel: 'integrations',
      gradient: 'from-ethos-purple to-ethos-purple-dark',
      stats: [
        { label: 'Setup time', value: '<1 day' },
        { label: 'Uptime', value: '99.9%' },
      ],
    },
  ];

  return (
    <ServicePageTemplate
      // Hero Section
      heroTitle={
        <>
          <span className="text-gradient-navy font-poppins inline-block">
            Connect
          </span>
          <br />
          <span className="text-gradient-shine font-poppins inline-block pb-[0.1em] leading-[1.2]">
            Everything
          </span>
        </>
      }
      heroSubtitle="Stop wasting hours copying data between apps"
      heroDescription={
        <div>
          <p className="text-body-large text-gray-900 mb-4">
            Does Your team spends 20% of their day copying data between apps? That's insane. We
            connect your tools so information flows automatically. No more manual entry, no more
            errors.
          </p>
          <ul className="text-left text-gray-900 mb-4">
            <li className="flex items-start mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Connect your apps in minutes without writing code</span>
            </li>
            <li className="flex items-start mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Eliminate most manual data entry with smart automation</span>
            </li>
            <li className="flex items-start mb-2 last:mb-0">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Keep your data accurate and consistent everywhere</span>
            </li>
          </ul>
        </div>
      }
      heroImage={
        <div className="relative w-full">
          <img
            src="/assets/marketing/images/system-integration.webp"
            alt="Enterprise system integration platform connecting CRM, ERP, marketing automation, customer support, accounting software, and 600+ business applications in a unified automated workflow ecosystem eliminating manual data entry"
            className="w-full h-auto max-h-[350px] sm:max-h-[450px] md:max-h-[550px] lg:max-h-[600px] xl:max-h-[650px] max-w-full sm:max-w-xl lg:max-w-4xl xl:max-w-5xl -mt-10 lg:-mt-20 mx-auto object-contain mix-blend-multiply"
            loading="eager"
            decoding="async"
          />
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.22)', mixBlendMode: 'overlay' }}
          />
        </div>
      }
      // Solution Section
      solutionTitle={
        <>
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">Your Systems, </span>
            <span className="text-gradient-purple-navy">
              Finally Talking to Each Other
            </span>
          </h2>
        </>
      }
      solutionDescription="We build the bridges between your apps. Information flows where it needs to go, automatically."
      solutionFeatures={solutionFeatures}
      // Proof/Evidence Section
      proofTitle={
        <>
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">The Numbers </span>
            <span className="text-gradient-purple-navy">
              Don't Lie
            </span>
          </h2>
        </>
      }
      proofDescription="Here's what happens when your systems actually talk to each other. Real results from businesses that stopped wasting time on manual data work."
      proofItems={proofItems}
      // CTA Section
      ctaSection={
        <ServiceCTA
          titlePart1="Ready to Stop"
          titlePart2="Wasting Time on Data Entry?"
          description="Your team has better things to do than copy information between systems all day. Let's talk about connecting your tools so data flows automatically. Get a free audit and we'll show you exactly how much time and money you could save."
          buttonText="Get Your Free Integration Audit"
          buttonLink="/contact?source=system-integration"
        />
      }
      additionalContent={
        <>
          {/* Enhanced Sections - Optimized Conversion Flow */}

          {/* Phase 2: Solution Understanding & Trust Building */}
          {/* Integration Logos Marquee - Visual showcase of supported integrations */}
          <IntegrationLogosMarquee />

          {/* Trust Signals - Your Data is Safe & Secure */}
          <TrustSignals />

          {/* ROI Calculator */}
          <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
                  <span className="text-ethos-navy">Calculate Your Integration </span>
                  <span className="text-gradient-purple-navy">
                    Everything Connected
                  </span>
                </h2>
                <p className="text-body-large text-ethos-gray">
                  See how much you could save by eliminating manual data tasks
                </p>
              </div>
              <GatedROICalculator
                title="System Integration Return on Investment Calculator"
                description="Enter your organization details below to see your potential savings from connecting your business systems."
                service="system-integration"
                leadMagnet="Free Integration Audit Tool + Cost Savings Calculator + Implementation Roadmap"
                showHeader={false}
                inputs={roiCalculatorInputs}
                calculation={calculateROI}
              />
            </div>
          </section>

          {/* Phase 3: Value Demonstration & Desire - Tabbed Section */}
          <InvestmentSection
            pricing={pricingPlans}
            serviceContext="system-integration"
            serviceName="System Integration"
          />

          {/* Integration Examples */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
                  <span className="text-ethos-navy">Popular Integration </span>
                  <span className="text-gradient-purple-navy">
                    Growth Unlocked
                  </span>
                </h2>
                <p className="text-body-large text-ethos-gray">
                  See how we connect your favorite business tools
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div
                  className="p-4 sm:p-6 md:p-8 bg-white border border-gray-200 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
                >
                  <h3 className="heading-card font-semibold text-ethos-navy mb-4">
                    Sales & Marketing Automation
                  </h3>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                        <span className="text-ethos-purple font-semibold text-body-small">1</span>
                      </div>
                      <span className="text-ethos-gray">Lead captured in website form</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                        <span className="text-ethos-purple font-semibold text-sm">2</span>
                      </div>
                      <span className="text-ethos-gray">
                        Automatically added to CRM with lead scoring
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                        <span className="text-ethos-purple font-semibold text-sm">3</span>
                      </div>
                      <span className="text-ethos-gray">Triggers personalized email sequence</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3 last:mb-0">
                      <div className="w-8 h-8 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                        <span className="text-ethos-purple font-semibold text-sm">4</span>
                      </div>
                      <span className="text-ethos-gray">Creates follow-up task for sales team</span>
                    </div>
                  </div>
                  <div className="mt-6 text-sm text-ethos-purple font-medium">
                    Saves 15 hours/week per sales rep
                  </div>
                </div>

                <div
                  className="p-4 sm:p-6 md:p-8 bg-white border border-gray-200 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}
                >
                  <h3 className="heading-card font-semibold text-ethos-navy mb-4">
                    Customer Support Integration
                  </h3>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                        <span className="text-ethos-purple font-semibold text-sm">1</span>
                      </div>
                      <span className="text-ethos-gray">Support ticket created</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                        <span className="text-ethos-purple font-semibold text-sm">2</span>
                      </div>
                      <span className="text-ethos-gray">Customer data pulled from CRM</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                        <span className="text-ethos-purple font-semibold text-sm">3</span>
                      </div>
                      <span className="text-ethos-gray">
                        Updates customer record with issue details
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3 last:mb-0">
                      <div className="w-8 h-8 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                        <span className="text-ethos-purple font-semibold text-sm">4</span>
                      </div>
                      <span className="text-ethos-gray">
                        Sends resolution notification via preferred channel
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 text-sm text-ethos-purple font-medium">
                    Improves resolution time by 60%
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive FAQ Section */}
          <section className="py-12 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-4">
                  <span className="text-ethos-navy">Integration Questions </span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)',
                    }}
                  >
                    Answered
                  </span>
                </h2>
                <p className="text-body-large text-ethos-gray">
                  Find answers to common questions about system integration
                </p>
              </div>
              <InteractiveFAQ
                title=""
                description=""
                className="pt-0 pb-4"
                faqs={[
                  {
                    id: '1',
                    question: 'How long does a typical integration take?',
                    answer:
                      'Simple integrations (2-3 apps) can be completed in 1-2 weeks. Complex enterprise integrations typically take 4-8 weeks. We provide detailed timelines during your free audit.',
                    category: 'Timeline',
                    tags: ['integration', 'timeline', 'implementation'],
                  },
                  {
                    id: '2',
                    question: 'What if we use custom or older systems?',
                    answer:
                      'We specialize in connecting all types of systems, including custom-built and older platforms. Our team has experience with custom APIs, database integrations, and various system architectures.',
                    category: 'Technical',
                    tags: ['custom', 'api', 'integration'],
                  },
                  {
                    id: '3',
                    question: 'How do you ensure data security during integration?',
                    answer:
                      "All data transfers use enterprise-grade encryption. We're SOC 2 Type II certified and follow strict security protocols. Your data never leaves your approved systems without proper authorization.",
                    category: 'Security',
                    tags: ['security', 'encryption', 'compliance'],
                  },
                  {
                    id: '4',
                    question: 'What happens if one of our integrated systems changes?',
                    answer:
                      'We monitor all integrations 24/7 and provide automatic updates when systems change. Our support team proactively manages any required adjustments to keep your workflows running smoothly.',
                    category: 'Support',
                    tags: ['maintenance', 'monitoring', 'updates'],
                  },
                  {
                    id: '5',
                    question: 'How do you handle the implementation process?',
                    answer:
                      'We follow a proven 4-phase implementation process: Discovery & Planning, Development & Testing, Deployment, and Optimization. Each phase includes stakeholder reviews and testing to ensure smooth delivery.',
                    category: 'Implementation',
                    tags: ['implementation', 'process', 'deployment'],
                  },
                  {
                    id: '6',
                    question: 'Can you integrate with industry-specific software?',
                    answer:
                      'Yes! We have experience with industry-specific platforms across healthcare, finance, manufacturing, and more. We can integrate with specialized ERP, CRM, and vertical-specific solutions.',
                    category: 'Compatibility',
                    tags: ['industry', 'erp', 'crm'],
                  },
                  {
                    id: '7',
                    question: 'What is the typical ROI timeline for integration projects?',
                    answer:
                      'Most businesses see positive ROI within 3-6 months. Time savings and error reduction provide immediate benefits, while efficiency gains compound over time.',
                    category: 'ROI',
                    tags: ['roi', 'savings', 'timeline'],
                  },
                ]}
                categories={[
                  'Timeline',
                  'Compatibility',
                  'Security',
                  'Support',
                  'Implementation',
                  'ROI',
                ]}
                showSearch={true}
                showCategories={true}
                contactCTA={{
                  text: 'Ask molē',
                  link: '#',
                }}
                onContactClick={() => setIsChatOpen(true)}
              />
              <MarketingChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                pageContext="system-integration"
              />
            </div>
          </section>

        </>
      }
    />
  );
}
