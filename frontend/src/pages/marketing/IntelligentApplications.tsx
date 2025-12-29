import { ServiceCTA } from '@/components/marketing/services/ServiceCTA';
import { DesignShowcase } from '@/components/marketing/ui/DesignShowcase';

import { GatedROICalculator } from '@/components/marketing/ui/gated-roi-calculator';
import { InteractiveFAQ } from '@/components/marketing/ui/interactive-faq';
import { TrustSignals } from '@/components/marketing/ui/service-enhancements';
import { InvestmentSection } from '@/components/marketing/ui/service-layout-components';

import {
    BarChart3,
    CheckCircle, Layers,
    Monitor,
    Shield,
    Smartphone,
    TrendingUp, Zap
} from 'lucide-react';
import { MarketingChatModal } from '@/components/marketing/MarketingChatModal';
import { ServicePageTemplate } from '@/components/marketing/templates/ServicePageTemplate';
import { useState } from 'react';

export default function IntelligentApplications() {
  const [isChatOpen, setIsChatOpen] = useState(false);


  // Opportunity Calculator configuration - for businesses without a website yet
  const opportunityCalculatorInputs = [
    {
      label: 'Your Average Sale/Order Value',
      key: 'productPrice',
      type: 'number' as const,
      defaultValue: 150,
      prefix: '$',
    },
    {
      label: 'Monthly Sales Goal',
      key: 'salesGoal',
      type: 'number' as const,
      defaultValue: 50,
      suffix: 'sales',
    },
    {
      label: 'Your Industry',
      key: 'industry',
      type: 'select' as const,
      options: ['E-commerce/Retail', 'Professional Services', 'Healthcare', 'Hospitality', 'Education', 'Other'],
      defaultValue: 'E-commerce/Retail',
    },
  ];

  const calculateOpportunity = (inputs: {
    productPrice?: number;
    salesGoal?: number;
    industry?: string;
  }) => {
    const productPrice = inputs.productPrice ?? 150;
    const salesGoal = inputs.salesGoal ?? 50;

    // Industry-specific online conversion potential (Australian 2025 benchmarks)
    const industryMultipliers: Record<string, number> = {
      'E-commerce/Retail': 0.03,      // 3% conversion rate
      'Professional Services': 0.05,  // 5% inquiry-to-client
      'Healthcare': 0.08,             // 8% booking rate
      'Hospitality': 0.04,            // 4% booking rate
      'Education': 0.06,              // 6% enrollment rate
      'Other': 0.04,                  // 4% average
    };

    const conversionRate = industryMultipliers[inputs.industry ?? 'Other'] ?? 0.04;

    // Calculate what's needed to hit their goal
    const visitorsNeeded = Math.ceil(salesGoal / conversionRate);

    // Without a website (word of mouth only): ~20% of goal achievable
    const withoutWebsiteSales = Math.round(salesGoal * 0.2);
    const withoutWebsiteRevenue = withoutWebsiteSales * productPrice;

    // With a professional website
    const withWebsiteSales = salesGoal;
    const withWebsiteRevenue = withWebsiteSales * productPrice;

    // The opportunity being missed
    const missedSales = salesGoal - withoutWebsiteSales;
    const monthlyOpportunityCost = missedSales * productPrice;
    const annualOpportunityCost = monthlyOpportunityCost * 12;

    return {
      // What they're missing
      monthlySavings: monthlyOpportunityCost,
      annualSavings: annualOpportunityCost,

      // For display
      withoutWebsiteSales,
      withoutWebsiteRevenue,
      withWebsiteSales,
      withWebsiteRevenue,
      visitorsNeeded,
      missedSales,

      // Legacy fields for compatibility
      roi: Math.round((annualOpportunityCost / 15000) * 100), // vs typical build cost
      paybackPeriod: Math.round(15000 / monthlyOpportunityCost), // months to payback
    };
  };

  // Pricing data - NO PRICES, Quotation-Based
  const pricingPlans = [
    {
      title: 'Web Application',
      description: 'Custom web application development from scratch',
      startingPrice: 'Custom pricing based on your needs',
      features: [
        'Custom design & development',
        'Responsive mobile layout',
        'User authentication system',
        'Database integration',
        'Admin dashboard',
        'Support included',
        'Hosting setup & deployment',
        'Submit requirements to receive detailed quotation',
      ],
    },
    {
      title: 'Mobile Application',
      description: 'Native iOS and Android mobile app development',
      startingPrice: 'Custom pricing based on your needs',
      features: [
        'iOS + Android native apps',
        'Custom UI/UX design',
        'Push notifications',
        'Offline functionality',
        'App store submission',
        'Support included',
        'Backend API development',
        'Submit requirements to receive detailed quotation',
      ],
      popular: true,
    },
    {
      title: 'Enterprise Application',
      description: 'Complex custom application development for large organizations',
      startingPrice: 'Custom pricing based on your needs',
      features: [
        'Fully custom development',
        'Advanced features & integrations',
        'Scalable cloud architecture',
        'Security & compliance',
        'Dedicated development team',
        'Extended support included',
        'White-label options available',
        'Submit requirements to receive detailed quotation',
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
            Custom Web &
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
            Mobile Applications
          </span>
        </>
      }
      heroSubtitle="We build custom apps that actually fit your business"
      heroDescription={
        <div>
          <p className="text-body-large text-gray-900 mb-4">
            Custom software built exactly how your business works, not the other way around. E-commerce, customer portals, mobile apps, management systems. Built from scratch, tailored to you.
          </p>
          <ul className="text-left text-gray-900 mb-4">
            <li className="flex items-start mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Custom web apps - E-commerce, portals, dashboards</span>
            </li>
            <li className="flex items-start mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>iOS and Android apps - Native mobile development</span>
            </li>
            <li className="flex items-start mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Apps that work everywhere - Phone, tablet, and desktop</span>
            </li>
          </ul>
        </div>
      }
      heroImage={
        <div className="relative w-full">
          <img
            src="/assets/marketing/images/intelligent-apps-hero.webp"
            alt="Modern responsive web and mobile application development showcasing cross-platform e-commerce solutions, progressive web apps, native iOS and Android applications, real-time analytics dashboards, and mobile-first user experiences optimized for conversion"
            className="w-full h-auto max-h-[1200px] sm:max-h-[1600px] md:max-h-[2000px] lg:max-h-[2500px] xl:max-h-[3000px] max-w-full sm:max-w-6xl lg:max-w-[120rem] xl:max-w-[150rem] mt-0 sm:mt-2 lg:mt-4 mr-0 ml-auto object-contain mix-blend-multiply lg:scale-110 lg:origin-right lg:translate-y-[-5%] lg:translate-x-[5%]"
            loading="eager"
            decoding="async"
          />
          <div
            className="pointer-events-none absolute inset-0 lg:scale-110 lg:origin-right lg:translate-y-[-5%] lg:translate-x-[5%]"
            aria-hidden="true"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.22)' }}
          />
        </div>
      }
      showHeroCTA={false}
      // Solution Section
      solutionTitle={
        <>
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">Software </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Built for You
            </span>
          </h2>
        </>
      }
      solutionDescription="Fast, reliable, and built with modern technology that scales as you grow. It's your intellectual property, your asset."
      solutionFeatures={[
        {
          title: 'Custom Web Apps',
          description:
            'E-commerce, portals, dashboards, built from scratch to match your exact requirements.',
          icon: <Monitor className="w-6 h-6 text-ethos-purple" />,
          gradient: 'from-blue-50 to-purple-50',
        },
        {
          title: 'iOS and Android Apps',
          description:
            'Apps built specifically for iPhone and Android. Fast, smooth, and exactly what your customers expect.',
          icon: <Smartphone className="w-6 h-6 text-ethos-purple" />,
          gradient: 'from-purple-50 to-pink-50',
        },
        {
          title: 'Apps That Work Everywhere',
          description:
            'Works on phone, tablet, and desktop. Install it like an app, but without the App Store headaches.',
          icon: <Layers className="w-6 h-6 text-ethos-purple" />,
          gradient: 'from-pink-50 to-blue-50',
        },
        {
          title: 'Speed Matters',
          description:
            'Apps built with up-to-date technology comply with modern standards and deliver results in no time.',
          icon: <Zap className="w-6 h-6 text-ethos-purple" />,
          gradient: 'from-orange-50 to-red-50',
        },
        {
          title: 'Bank-Level Security',
          description:
            'Built-in security from day one. We keep the bad guys out and your data safe.',
          icon: <Shield className="w-6 h-6 text-ethos-purple" />,
          gradient: 'from-green-50 to-teal-50',
        },
        {
          title: 'Grows With You',
          description:
            'Start small, grow big. Whether you have 100 users or 100,000, your app stays fast.',
          icon: <TrendingUp className="w-6 h-6 text-ethos-purple" />,
          gradient: 'from-purple-50 to-pink-50',
        },
      ]}
      // Proof/Evidence Section
      proofTitle={
        <>
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">Real Business </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Impact
            </span>
          </h2>
        </>
      }
      proofDescription="Here's what happens when your software actually works for you."
      proofItems={[
        {
          title: 'Mobile Users Buy More',
          description:
            'A great mobile experience converts way better than a desktop-only site. When your app works smoothly on phones, more browsers turn into buyers.',
          icon: <TrendingUp className="w-8 h-8 text-ethos-purple" />,
          metric: '3.5x',
          metricLabel: 'conversions',
          gradient: 'from-blue-500 to-indigo-600',
          stats: [
            { label: 'Mobile ROI', value: '350%' },
            { label: 'Avg increase', value: '+250%' },
          ],
        },
        {
          title: 'Meet Customers on Web and Mobile',
          description:
            'Customers move between your website on desktop and your mobile experience. When both are fast and consistent, they trust your brand and are more likely to buy.',
          icon: <Smartphone className="w-8 h-8 text-ethos-purple" />,
          metric: '70%',
          metricLabel: 'mobile time',
          gradient: 'from-green-500 to-emerald-600',
          stats: [
            { label: 'User preference', value: 'Mobile' },
            { label: 'Engagement', value: '+62%' },
          ],
        },
        {
          title: 'Capture More Market Share',
          description:
            'Mobile commerce is massive and growing fast. If your mobile experience is great, you capture a bigger slice of that pie.',
          icon: <BarChart3 className="w-8 h-8 text-ethos-purple" />,
          metric: '$4.9T',
          metricLabel: 'market size',
          gradient: 'from-purple-500 to-pink-600',
          stats: [
            { label: 'Growth rate', value: '+25%/yr' },
            { label: 'Market share', value: '72.9%' },
          ],
        },
        {
          title: 'Speed Wins',
          description:
            'When your app loads in under a second, people stay. Fast apps rank better in search, convert more visitors, and cost less to run.',
          icon: <Zap className="w-8 h-8 text-ethos-purple" />,
          metric: '<1s',
          metricLabel: 'load time',
          gradient: 'from-orange-500 to-amber-600',
          stats: [
            { label: 'Retention', value: '95%' },
            { label: 'Performance score', value: '98+' },
          ],
        },
      ]}
      // CTA Section
      ctaSection={
        <ServiceCTA
          titlePart1="Ready to Build Your"
          titlePart2="Custom Application?"
          description="Whether you need a web application, mobile app, or both, we'll build exactly what your business needs from scratch. Submit your requirements through our advanced request system and receive a detailed quotation tailored to your specific needs. No obligation, completely free."
          buttonText="Submit Requirements & Get Quotation"
          buttonLink="/contact?source=web-mobile-applications"
        />
      }
      additionalContent={
        <>
          {/* Design Showcase - Highlight design quality */}
          <DesignShowcase />

          {/* Trust Signals - Establish credibility early */}
          <TrustSignals />

          {/* Opportunity Calculator */}
          <section className="py-12 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
                  <span className="text-ethos-navy">Discover Your </span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                  >
                    Business Opportunity
                  </span>
                </h2>
                <p className="text-body-large text-ethos-gray">
                  See how much potential revenue you're missing without a professional web or mobile presence
                </p>
              </div>
              <GatedROICalculator
                title="Business Opportunity Calculator"
                description="Enter your business goals to see the opportunity cost of not having a professional online presence."
                service="web-mobile"
                leadMagnet="Free Business Opportunity Assessment + Market Analysis + Growth Strategy Report"
                showHeader={false}
                inputs={opportunityCalculatorInputs}
                calculation={calculateOpportunity}
              />
            </div>
          </section>

          {/* Testimonials and Pricing Tabbed Section */}
          <InvestmentSection
            pricing={pricingPlans}
            serviceContext="intelligent-applications"
            serviceName="Web & Mobile Applications"
            title={
              <>
                <span className="text-ethos-navy">Tell Us What You Need, </span>
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}>
                  Get Your Quotation
                </span>
              </>
            }
            description="Every project is unique. Submit your requirements through our advanced request system and we'll send you a detailed quotation tailored to your specific needs. No hidden fees, no surprisesjust transparent pricing based on your actual requirements."
          />

          {/* Interactive FAQ Section */}
          <InteractiveFAQ
            title={
              <span className="heading-section font-medium leading-tight tracking-[-0.02em]">
                <span className="text-ethos-navy">Development </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Questions Answered
                </span>
              </span>
            }
            description="Find answers to common questions about web and mobile development"
            faqs={[
              {
                id: '1',
                question: 'How long does development typically take?',
                answer:
                  'Simple websites take 2-4 weeks, while complex web applications take 8-16 weeks. Mobile apps typically require 12-20 weeks. We provide detailed timelines during your free consultation.',
                category: 'Timeline',
                tags: ['development', 'timeline', 'duration'],
              },
              {
                id: '2',
                question: 'Do you provide ongoing maintenance and support?',
                answer:
                  'Yes! All projects include 3-12 months of support depending on the package. We also offer ongoing maintenance plans for updates, security patches, and feature enhancements.',
                category: 'Support',
                tags: ['maintenance', 'support', 'updates'],
              },
              {
                id: '3',
                question: 'Can you integrate with our existing systems?',
                answer:
                  "Absolutely. We specialize in integrating new applications with existing CRMs, databases, payment systems, and third-party APIs. We'll audit your current systems during the consultation.",
                category: 'Integration',
                tags: ['integration', 'systems', 'api'],
              },
              {
                id: '4',
                question: 'What about mobile app store approval?',
                answer:
                  'We handle the entire app store submission process for both iOS and Android. Our apps are built to meet all store guidelines, and we manage the approval process from start to finish.',
                category: 'Mobile',
                tags: ['mobile', 'app store', 'approval'],
              },
              {
                id: '5',
                question: 'What technologies do you use?',
                answer:
                  'We use modern, proven technologies including React, React Native, Node.js, Python, and cloud platforms like AWS. We choose the best tech stack for each project based on your specific requirements.',
                category: 'Technology',
                tags: ['technology', 'react', 'mobile', 'web'],
              },
              {
                id: '6',
                question: 'How do you ensure quality and testing?',
                answer:
                  'We follow rigorous testing protocols including unit testing, integration testing, and user acceptance testing. All applications undergo security audits and performance optimization before launch.',
                category: 'Quality',
                tags: ['testing', 'quality', 'security'],
              },
            ]}
            categories={['Timeline', 'Support', 'Integration', 'Mobile', 'Technology', 'Quality']}
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
            pageContext="intelligent-applications"
          />

        </>
      }
    />
  );
}
