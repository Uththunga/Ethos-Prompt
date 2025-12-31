import { ServicePageTemplate } from '@/components/marketing/templates/ServicePageTemplate';
import { ServiceCTA } from '@/components/marketing/services/ServiceCTA';

import { GatedROICalculator } from '@/components/marketing/ui/gated-roi-calculator';
import { TrustSignals } from '@/components/marketing/ui/service-enhancements';
import { InvestmentSection } from '@/components/marketing/ui/service-layout-components';
import { Button } from '@/components/marketing/ui/button';

import SmartAssistantDemoInteractive from '@/components/marketing/interactive/SmartAssistantDemoInteractive';
import { InteractiveFAQ } from '@/components/marketing/ui/interactive-faq';
import { MarketingChatModal } from '@/components/marketing/MarketingChatModal';
import Moleicon from '@/components/marketing/ui/Moleicon';
import { useState } from 'react';

import {
    Bot,
    CheckCircle, Clock,
    DollarSign,
    MessageSquare,
    TrendingUp,
    Users,
    Zap,
    Shield,
    Target,
    AlertTriangle
} from 'lucide-react';

export default function SmartBusinessAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);


  // Solution features with icons and gradients
  const solutionFeatures = [
    {
      title: 'Answers 80% of Questions Instantly',
      description:
        'Customers get help in seconds, not hours. Day or night, the quality is always perfect. No bad days, no attitude.',
      icon: <Bot className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-blue-50 to-purple-50',
    },
    {
      title: 'Turn Your 9-5 Business to Run 24/7',
      description:
        'It chats with visitors, figures out who\'s serious, and books meetings for your sales team. You wake up to a calendar full of qualified prospects.',
      icon: <Target className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-purple-50 to-pink-50',
    },
    {
      title: 'Automates the Busywork',
      description:
        'Scheduling, data entry, order lookups. It handles the boring stuff so your team doesn\'t have to. They\'ll thank you for it.',
      icon: <Zap className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-green-50 to-blue-50',
    },
    {
      title: 'Calls for Backup',
      description:
        'It knows when to call for backup. If a customer gets frustrated or asks something complex, it instantly alerts you. You step in for the moments that matter, and it handles the rest.',
      icon: <AlertTriangle className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-orange-50 to-red-50',
    },
    {
      title: 'Connects to Your Tools',
      description:
        'Works with the software you already use. No complex setup, no ripping out your current systems. It just plugs in.',
      icon: <MessageSquare className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-teal-50 to-green-50',
    },
    {
      title: 'Bank-Level Security',
      description:
        'We take security as seriously as you do. Your data is locked down and safe, meeting the highest industry standards.',
      icon: <Shield className="w-6 h-6 text-ethos-purple" />,
      gradient: 'from-gray-50 to-blue-50',
    },
  ];

  // Proof items with compelling statistics - Simplified with gradient icons
  const proofItems = [
    {
      title: 'Lowest Response Times',
      description:
        'Under 30 seconds instead of hours. When people get help immediately, they buy more and stick around longer. It\'s that simple.',
      icon: <Clock className="w-8 h-8 text-ethos-purple" />,
      metric: '87%',
      metricLabel: 'faster',
      gradient: 'from-blue-500 to-indigo-600',
      stats: [
        { label: 'Response time', value: '<30s' },
        { label: 'Availability', value: '24/7' },
      ],
    },
    {
      title: 'Drastic Cost Savings',
      description:
        'From $6 per interaction down to $0.50. Most businesses save over $180K a year while actually improving their service quality. Better results for less money.',
      icon: <DollarSign className="w-8 h-8 text-ethos-purple" />,
      metric: '12x',
      metricLabel: 'savings',
      gradient: 'from-green-500 to-emerald-600',
      stats: [
        { label: 'Per interaction', value: '$0.50' },
        { label: 'Annual savings', value: '$180K+' },
      ],
    },
    {
      title: 'Higher Conversion Rate',
      description:
        'When every lead gets instant attention and consistent follow-up, more of them convert. No more opportunities slipping through the cracks.',
      icon: <TrendingUp className="w-8 h-8 text-ethos-purple" />,
      metric: '35%',
      metricLabel: 'increase',
      gradient: 'from-purple-500 to-pink-600',
      stats: [
        { label: 'Response', value: 'Instant' },
        { label: 'Follow-up', value: '100%' },
      ],
    },
    {
      title: 'Fully Automated Service Under Your Surveillance',
      description:
        'Your assistant runs on autopilot for routine tasks but keeps you in the loop for main decisions. You always know what\'s going on, ensuring a genuine human connection when it matters.',
      icon: <Users className="w-8 h-8 text-ethos-purple" />,
      metric: '100%',
      metricLabel: 'oversight',
      gradient: 'from-orange-500 to-amber-600',
      stats: [
        { label: 'Control', value: 'Full' },
        { label: 'Handoff', value: 'Seamless' },
      ],
    },
  ];

  return (
    <ServicePageTemplate
      // Hero Section
      heroTitle={
        <>
          <span
            style={{
              fontFamily: 'Poppins',
              background:
                'linear-gradient(to right, var(--ethos-navy-light), var(--ethos-gray-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}
          >
            Smart Business
          </span>
          <br />
          <span
            style={{
              fontFamily: 'Poppins',
              wordWrap: 'break-word',
              display: 'inline-block',
              background:
                'linear-gradient(90deg, var(--ethos-purple), #000, var(--ethos-purple))',
              backgroundSize: '200% auto',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              paddingBottom: '0.1em',
              lineHeight: '1.2',
              animation: 'shine 10s linear infinite',
            }}
          >
            Assistant
          </span>
        </>
      }
      heroSubtitle="Stop losing customers to slow response times"
      heroDescription={
        <div>
          <p className="text-body-large text-gray-900 mb-4">
            Think of it as a team member who never sleeps. It handles customer questions, qualifies
            leads, and takes care of the busywork, so you can focus on growing your business.
          </p>
          <ul className="text-left text-gray-900 mb-4">
            <li className="flex items-start mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Answers customer questions instantly, any time of day</span>
            </li>
            <li className="flex items-start mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Cuts your customer service costs dramatically</span>
            </li>
            <li className="flex items-start mb-2 last:mb-0">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Turns more prospects into paying customers</span>
            </li>
          </ul>
        </div>
      }
      heroImage={
        <div className="relative w-full">
          <img
            src="/assets/marketing/images/CAS.png"
            alt="Smart Business Assistant AI-powered interface displaying automated customer service conversations, real-time business analytics dashboards, intelligent lead generation workflows, and 24/7 task automation capabilities for modern businesses"
            className="w-full h-auto max-h-[400px] sm:max-h-[500px] md:max-h-[550px] lg:max-h-[600px] xl:max-h-[650px] max-w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl -mt-16 mx-auto object-contain mix-blend-multiply"
            loading="eager"
            decoding="async"
          />
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.22)' }}
          />
        </div>
      }
      // Solution Section
      solutionTitle={
        <>
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">Let Your Business </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Cruise on Autopilot
            </span>
          </h2>
        </>
      }
      solutionDescription="It learns from every interaction and handles the work your team dreads. No coffee breaks, no sick days, just results."
      solutionFeatures={solutionFeatures}
      // Proof/Evidence Section
      proofTitle={
        <>
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">Proven Results That </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Transform Businesses
            </span>
          </h2>
        </>
      }
      proofDescription="Here's what actually happens when businesses start using this. These aren't projections or promises—they are proven results from companies like yours."
      proofItems={proofItems}
      // CTA Section
      ctaSection={
        <ServiceCTA
          titlePart1="Ready to Stop Wasting"
          titlePart2="Time and Money?"
          description="Your team’s time is too valuable to be spent on repetitive tasks while customers wait for responses. A Smart Business Assistant can streamline the busywork, lower operational costs, and support sustainable growth. Book a free consultation, and we’ll show you precisely how it can transform your business."
          buttonText="Get Your Free AI Business Assessment"
          buttonLink="/contact?source=smart-assistant"
        />
      }
      additionalContent={
        <>
          {/* Enhanced Sections - Optimized Conversion Flow */}

          {/* Phase 2: Solution Understanding & Trust Building */}
          {/* Meet molē - Premium AI Agent Showcase */}
          <section
            className="py-16 sm:py-20 lg:py-28 xl:py-32 relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #FFF 20%, #F8F6FF 50%, #E8E8E8 100%)' }}
          >
            {/* Floating particles effect - enhanced for premium feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: Math.random() * 6 + 2 + 'px',
                    height: Math.random() * 6 + 2 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                    background: `rgba(121, 0, 227, ${Math.random() * 0.2 + 0.05})`,
                    animationDelay: Math.random() * 4 + 's',
                    animationDuration: Math.random() * 4 + 2 + 's',
                  }}
                />
              ))}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

              {/* Grid Layout - 2 columns on lg, single column on mobile */}
              <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-16 items-start">

                {/* Title & Description - Mobile only (order-1), hidden on desktop */}
                <div className="order-1 lg:hidden">
                  <h2 className="heading-hero font-medium leading-tight tracking-tight mb-4 text-center">
                    <span className="text-ethos-navy-light">Meet Our </span>
                    <span className="text-gradient-shine font-poppins font-medium inline-block">
                      molē
                    </span>
                  </h2>
                  <p className="text-body-large font-normal leading-relaxed tracking-tight text-ethos-gray text-center">
                    Your tireless AI assistant that understands your business, speaks naturally, and treats every customer like a VIP—24 hours a day, 7 days a week.
                  </p>
                </div>

                {/* Left Column - Title + Features (Desktop/Tablet) */}
                <div className="order-3 lg:order-1 flex flex-col">
                  {/* Title & Description - Desktop only, hidden on mobile */}
                  <div className="hidden lg:block mb-6">
                    <h2 className="heading-hero font-medium leading-tight tracking-tight mb-4 text-center">
                      <span className="text-ethos-navy-light">Meet Our </span>
                      <span className="text-gradient-shine font-poppins font-medium inline-block">
                        molē
                      </span>
                    </h2>
                    <p className="text-body-large font-normal leading-relaxed tracking-tight text-ethos-gray text-center">
                      Your tireless AI assistant that understands your business, speaks naturally, and treats every customer like a VIP—24 hours a day, 7 days a week.
                    </p>
                  </div>

                  {/* Features - Non-technical language with bullet points */}
                  <div className="space-y-4">
                    {[
                      {
                        title: 'Your Data is Safe',
                        description: 'Protected by the same security banks use. Your information never leaves your control.',
                        icon: '🔒'
                      },
                      {
                        title: 'Never Sleeps',
                        description: 'Ready to help your customers at 2am on a Sunday, just like on a Monday morning.',
                        icon: '🌙'
                      },
                      {
                        title: 'Always Gets It Right',
                        description: 'Only gives answers it can verify from your actual business information. No guessing, no making things up.',
                        icon: '✓'
                      },
                      {
                        title: 'Sounds Like You',
                        description: 'Talks the way your brand talks—whether that\'s professional, friendly, or casual.',
                        icon: '💬'
                      },
                      {
                        title: 'Knows When to Call for Help',
                        description: 'Seamlessly passes complex issues to your team so nothing falls through the cracks.',
                        icon: '🤝'
                      },
                      {
                        title: 'Finds Your Best Prospects',
                        description: 'Chats with visitors, figures out who\'s ready to buy, and books meetings automatically.',
                        icon: '🎯'
                      },
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 mb-3 sm:mb-4 last:mb-0"
                      >
                        <div className="relative w-7 h-7 flex-shrink-0 mt-1">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#6D6AED] to-[#7900E3]" />
                          <img
                            src={`${import.meta.env.BASE_URL || '/'}assets/marketing/images/check-icon.png`}
                            alt=""
                            className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold mb-1">{feature.title}</h3>
                          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="mt-10 flex justify-center">
                    <Button
                      onClick={() => setIsChatOpen(true)}
                      variant="ethos"
                      size="lg"
                      className="px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <span className="mr-2">💬</span>
                      Chat with molē Now
                    </Button>
                  </div>
                </div>

                {/* Right Column - Prominent Moleicon */}
                <div className="order-1 lg:order-2 relative flex flex-col items-center justify-center py-8 lg:py-0 group">
                  {/* Multiple layered glow effects for premium look */}
                  <div
                    className="absolute w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full blur-3xl opacity-40 transition-opacity duration-500 group-hover:opacity-60"
                    style={{
                      background: 'radial-gradient(circle, rgba(121, 0, 227, 0.5) 0%, rgba(109, 106, 237, 0.3) 40%, transparent 70%)',
                    }}
                  />
                  <div
                    className="absolute w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] lg:w-[450px] lg:h-[450px] rounded-full blur-2xl opacity-30 transition-opacity duration-500 group-hover:opacity-50"
                    style={{
                      background: 'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, transparent 60%)',
                    }}
                  />

                  {/* Moleicon container - LARGER with click handler */}
                  <div
                    className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[512px] lg:h-[512px] z-10 cursor-pointer mt-24 lg:mt-32"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <Moleicon hue={0} hoverIntensity={0.5} rotateOnHover={true} />

                    {/* Creative Speech Bubble - appears on hover */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none scale-90 group-hover:scale-100">
                      <div className="relative bg-white rounded-2xl shadow-xl px-6 py-4 border border-purple-100">
                        {/* Bubble content */}
                        <div className="flex items-center gap-3">
                          <span className="text-2xl animate-pulse">💬</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">Click on me to talk!</p>
                            <p className="text-xs text-purple-600">I'm here to help 24/7</p>
                          </div>
                        </div>

                        {/* Bubble tail/pointer */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="w-4 h-4 bg-white border-r border-b border-purple-100 transform rotate-45" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hint text on desktop - hidden when hovering as bubble shows */}
                  <div className="hidden lg:flex items-center gap-2 mt-6 text-gray-500 animate-bounce group-hover:opacity-0 transition-opacity duration-300" style={{ animationDuration: '2s' }}>
                    <span className="text-sm">Hover over me!</span>
                    <span>👆</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trust Signals - Establish credibility */}
          <TrustSignals />

          {/* Interactive Demo Section */}
          <SmartAssistantDemoInteractive />


          {/* Interactive ROI Calculator */}
          <section className="py-12 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
                  <span className="text-ethos-navy">Calculate </span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                  >
                    Your ROI
                  </span>
                </h2>
                <p className="text-body-large text-ethos-gray">
                  See exactly how much you could save and earn with AI automation
                </p>
              </div>
              <GatedROICalculator
                service="smart-assistant"
                title="Calculate Your Smart Business Assistant Return on Investment"
                description="See exactly how much you could save and earn with AI automation"
                leadMagnet="Smart Business Assistant Return on Investment Report + Implementation Roadmap"
                showHeader={false}
                inputs={[
                  {
                    key: 'monthlyCustomerInquiries',
                    label: 'Monthly Customer Inquiries',
                    type: 'number',
                    defaultValue: 500,
                    tooltip: 'Average number of customer service inquiries per month',
                  },
                  {
                    key: 'averageResponseTime',
                    label: 'Current Average Response Time (hours)',
                    type: 'number',
                    defaultValue: 4,
                    tooltip: 'How long customers currently wait for responses',
                  },
                  {
                    key: 'supportStaffCount',
                    label: 'Customer Support Staff',
                    type: 'number',
                    defaultValue: 3,
                    tooltip: 'Number of full-time customer support employees',
                  },
                  {
                    key: 'averageSalary',
                    label: 'Average Support Staff Salary',
                    type: 'number',
                    defaultValue: 55000, // Australian customer service median 2025
                    prefix: '$',
                    tooltip: 'Annual salary per support staff member',
                  },
                  {
                    key: 'monthlyLeads',
                    label: 'Monthly New Leads',
                    type: 'number',
                    defaultValue: 200,
                    tooltip: 'Number of new leads generated monthly',
                  },
                  {
                    key: 'currentConversionRate',
                    label: 'Current Lead Conversion Rate',
                    type: 'number',
                    defaultValue: 15,
                    suffix: '%',
                    tooltip: 'Percentage of leads that become customers',
                  },
                  {
                    key: 'averageCustomerValue',
                    label: 'Average Customer Value',
                    type: 'number',
                    defaultValue: 2500,
                    prefix: '$',
                    tooltip: 'Average revenue per customer over their lifetime',
                  },
                ]}
                calculation={(inputs) => {
                  const monthlyInquiries = Number(inputs.monthlyCustomerInquiries) || 500;
                  const responseTime = Number(inputs.averageResponseTime) || 4;
                  const staffCount = Number(inputs.supportStaffCount) || 3;
                  const avgSalary = Number(inputs.averageSalary) || 45000;
                  const monthlyLeads = Number(inputs.monthlyLeads) || 200;
                  const conversionRate = Number(inputs.currentConversionRate) || 15;
                  const customerValue = Number(inputs.averageCustomerValue) || 2500;

                  // Cost savings calculations - Australian 2025 benchmarks
                  // Human interaction cost: $8.50 (industry avg incl. overhead)
                  // AI interaction cost: $0.70 (including token + compute)
                  const currentMonthlyCost = monthlyInquiries * 8.5; // $8.50 per human interaction
                  const aiMonthlyCost = monthlyInquiries * 0.7; // $0.70 per AI interaction
                  const monthlySavings = currentMonthlyCost - aiMonthlyCost;
                  const annualSavings = monthlySavings * 12;

                  // Staff efficiency gains
                  const timeReduction = 0.87; // 87% reduction in response time
                  const staffEfficiencyGain = avgSalary * timeReduction * 0.6; // 60% of time can be reallocated
                  const totalStaffSavings = staffEfficiencyGain * staffCount;

                  // Revenue increase from better conversion
                  // Australian 2025 benchmark: 25-35% improvement from faster response
                  const improvedConversionRate = conversionRate * 1.30; // +30% improvement
                  const additionalConversions =
                    monthlyLeads * ((improvedConversionRate - conversionRate) / 100);
                  const monthlyRevenueIncrease = additionalConversions * customerValue;
                  const annualRevenueIncrease = monthlyRevenueIncrease * 12;

                  // Total ROI calculation
                  const totalAnnualBenefit =
                    annualSavings + totalStaffSavings + annualRevenueIncrease;
                  const annualInvestment = 697 * 12; // Professional plan
                  const roi = ((totalAnnualBenefit - annualInvestment) / annualInvestment) * 100;

                  return {
                    monthlySavings: Math.round(monthlySavings),
                    annualSavings: Math.round(annualSavings),
                    staffSavings: Math.round(totalStaffSavings),
                    revenueIncrease: Math.round(annualRevenueIncrease),
                    totalBenefit: Math.round(totalAnnualBenefit),
                    roi: Math.round(roi),
                    paybackPeriod:
                      Math.round((annualInvestment / (totalAnnualBenefit / 12)) * 10) / 10,
                    responseTimeImprovement:
                      Math.round(responseTime * (1 - timeReduction) * 10) / 10,
                  };
                }}
              />
            </div>
          </section>

          {/* Phase 3: Value Demonstration & Desire - Investment Section */}
          <InvestmentSection
            pricing={[
              {
                title: 'Starter Custom AI',
                startingPrice: 'Custom pricing based on your needs',
                description:
                  'Perfect for small businesses ready to implement their first custom AI solution',
                features: [
                  'Comprehensive business process analysis',
                  'Custom AI model development for your specific use case',
                  'Integration with your existing systems',
                  'Basic training data preparation and model fine-tuning',
                  '30 days of post-deployment support',
                  'Monthly maintenance and optimization',
                ],
                popular: false,
              },
              {
                title: 'Professional Custom AI',
                startingPrice: 'Custom pricing based on your needs',
                description:
                  'Complete custom AI development for growing businesses with complex workflows',
                features: [
                  'In-depth industry and competitive analysis',
                  'Advanced AI model architecture design',
                  'Multi-modal AI capabilities (text, voice, vision)',
                  'Advanced data preprocessing and feature engineering',
                  'Custom API development for seamless integration',
                  '3 months of premium support and optimization',
                ],
                popular: true,
              },
              {
                title: 'Enterprise Custom AI',
                startingPrice: 'Custom pricing based on your needs',
                description:
                  'Full-scale AI transformation for large organizations with mission-critical needs',
                features: [
                  'Executive-level strategy consultation and roadmap',
                  'Enterprise-grade AI architecture and infrastructure',
                  'Custom large language model training on your data',
                  'Advanced multi-agent AI systems',
                  'Complete business system integration',
                  'Dedicated AI success manager and 24/7 support',
                ],
                popular: false,
              },
            ]}
            serviceContext="smart-assistant"
            serviceName="Smart Business Assistant"
            showEngagementModels={false}
          />

          {/* Interactive FAQ Section */}
          <section className="py-12 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-4">
                  <span className="text-ethos-navy">Common Questions </span>
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
                  Everything you need to know about adding an AI team member.
                </p>
              </div>
              <InteractiveFAQ
                title=""
                description=""
                className="pt-0 pb-4"
                faqs={[
                  {
                    id: '1',
                    question: 'What happens if the AI doesn\'t know the answer?',
                    answer:
                      'It never guesses. If the assistant encounters a question it can\'t answer with 100% confidence, it instantly escalates the conversation to your team via email or SMS, providing the full chat history so you can step in seamlessly.',
                    category: 'Functionality',
                  },
                  {
                    id: '2',
                    question: 'How long does it take to set up?',
                    answer:
                      'Setup typically takes 2-4 weeks, but varies depending on your existing systems and what needs to be built. We will provide a confirmed timeline after your initial consultation.',
                    category: 'Onboarding',
                  },
                  {
                    id: '3',
                    question: 'Can it actually book appointments?',
                    answer:
                      'Yes. It integrates directly with your calendar (Calendly, Google, Outlook, etc.). It qualifies the lead first, checks your real-time availability, and books the slot without you lifting a finger.',
                    category: 'Capabilities',
                  },
                  {
                    id: '4',
                    question: 'Does it sound like a robot?',
                    answer:
                      'No. We customize the "personality" to match your brand voice—whether that\'s professional, friendly, or casual. Most customers won\'t realize they\'re talking to an AI until you tell them.',
                    category: 'Customization',
                  },
                  {
                    id: '5',
                    question: 'Is my business data secure?',
                    answer:
                      'Absolutely. We use enterprise-grade encryption and never share your data with other clients. You have full control over what the AI knows and what it keeps private.',
                    category: 'Security',
                  },
                ]}
                categories={['Functionality', 'Onboarding', 'Capabilities', 'Customization', 'Security']}
                contactCTA={{
                  text: 'Ask molē',
                  link: '#',
                }}
                onContactClick={() => setIsChatOpen(true)}
              />
              <MarketingChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                pageContext="smart-assistant"
              />
            </div>
          </section>

        </>
      }
    />
  );
}
