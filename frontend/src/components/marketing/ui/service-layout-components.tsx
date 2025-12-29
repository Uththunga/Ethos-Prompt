import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/marketing/ui/accordion';
import { Button } from '@/components/marketing/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/marketing/ui/tabs';
import { cn } from '@/lib/marketing-utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    MagnifyingGlassIcon,
    CodeBracketIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    ClockIcon
} from '@/components/icons/heroicons';
import React from 'react';

// Service-specific tabbed section component
interface ServiceTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    badge?: string;
  }>;
  defaultTab?: string;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function ServiceTabs({
  tabs,
  defaultTab,
  className,
  variant = 'default',
}: ServiceTabsProps) {
  const getTabsListStyles = () => {
    switch (variant) {
      case 'pills':
        return 'bg-gray-100 p-1 rounded-lg';
      case 'underline':
        return 'bg-transparent border-b border-gray-200 rounded-none p-0 h-auto';
      default:
        return 'bg-ethos-purple/5 p-1 rounded-lg border border-ethos-purple/10';
    }
  };

  const getTabTriggerStyles = () => {
    switch (variant) {
      case 'pills':
        return 'data-[state=active]:bg-white data-[state=active]:text-ethos-navy data-[state=active]:shadow-sm text-gray-600 hover:text-ethos-navy';
      case 'underline':
        return 'data-[state=active]:bg-transparent data-[state=active]:text-ethos-purple data-[state=active]:border-b-2 data-[state=active]:border-ethos-purple data-[state=active]:shadow-none rounded-none border-b-2 border-transparent text-gray-600 hover:text-ethos-purple pb-3';
      default:
        return 'data-[state=active]:bg-white data-[state=active]:text-ethos-purple data-[state=active]:shadow-sm text-ethos-navy/70 hover:text-ethos-purple';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <Tabs defaultValue={defaultTab || tabs[0]?.id} className="w-full">
        <TabsList
          className={cn('grid w-full gap-1', getTabsListStyles())}
          style={{
            gridTemplateColumns:
              tabs.length > 3
                ? 'repeat(auto-fit, minmax(120px, 1fr))'
                : `repeat(${tabs.length}, 1fr)`,
          }}
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'relative text-sm sm:text-base px-2 sm:px-4 py-2',
                getTabTriggerStyles()
              )}
            >
              {tab.label}
              {tab.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-ethos-purple text-white rounded-full">
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Service-specific accordion component
interface ServiceAccordionProps {
  items: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    defaultOpen?: boolean;
  }>;
  type?: 'single' | 'multiple';
  className?: string;
  variant?: 'default' | 'bordered' | 'minimal';
}

export function ServiceAccordion({
  items,
  type = 'single',
  className,
  variant = 'default',
}: ServiceAccordionProps) {
  const getAccordionStyles = () => {
    switch (variant) {
      case 'bordered':
        return 'border border-gray-200 rounded-lg overflow-hidden';
      case 'minimal':
        return '';
      default:
        return 'bg-white rounded-lg shadow-sm border border-gray-100';
    }
  };

  const getItemStyles = () => {
    switch (variant) {
      case 'bordered':
        return 'border-b border-gray-200 last:border-b-0 px-4 sm:px-6';
      case 'minimal':
        return 'bg-gray-50 rounded-lg px-4 sm:px-6 border-0';
      default:
        return 'px-4 sm:px-6 border-b border-gray-100 last:border-b-0';
    }
  };

  const defaultOpenItems = items.filter((item) => item.defaultOpen).map((item) => item.id);

  const accordionProps =
    type === 'single'
      ? {
          type: 'single' as const,
          value: defaultOpenItems[0] as string,
          className: cn(getAccordionStyles(), className),
        }
      : {
          type: 'multiple' as const,
          value: defaultOpenItems as string[],
          className: cn(getAccordionStyles(), className),
        };

  return (
    <Accordion {...accordionProps}>
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id} className={getItemStyles()}>
          <AccordionTrigger className="text-left text-base sm:text-lg font-semibold text-ethos-navy hover:text-ethos-purple">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="text-gray-700 text-base leading-relaxed">
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// Horizontal scrolling container
interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  showControls?: boolean;
  itemWidth?: string;
  gap?: string;
}

export function HorizontalScroll({
  children,
  className,
  showControls = false,
  itemWidth = 'auto',
  gap = '1rem',
}: HorizontalScrollProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={cn('relative', className)}>
      {showControls && (
        <>
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-ethos-navy" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-ethos-navy" />
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide pb-4"
        style={{ gap, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {React.Children.map(children, (child, index) => (
          <div key={index} className="flex-shrink-0" style={{ width: itemWidth }}>
            {child}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500 text-center md:hidden">
        Swipe sideways to see more
      </p>
    </div>
  );
}

// Multi-column grid component
interface MultiColumnGridProps {
  children: React.ReactNode;
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}

export function MultiColumnGrid({
  children,
  columns = { default: 1 },
  gap = '1.5rem',
  className,
}: MultiColumnGridProps) {
  const getGridClasses = () => {
    const { default: defaultCols, sm, md, lg, xl } = columns;
    let classes = `grid-cols-${defaultCols}`;

    if (sm) classes += ` sm:grid-cols-${sm}`;
    if (md) classes += ` md:grid-cols-${md}`;
    if (lg) classes += ` lg:grid-cols-${lg}`;
    if (xl) classes += ` xl:grid-cols-${xl}`;

    return classes;
  };

  return (
    <div className={cn('grid', getGridClasses(), className)} style={{ gap }}>
      {children}
    </div>
  );
}

// Compact feature grid (2 rows instead of 3)
interface CompactFeatureGridProps {
  features: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient?: string;
  }>;
  className?: string;
}

export function CompactFeatureGrid({ features, className }: CompactFeatureGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {features.map((feature, index) => (
        <div
          key={index}
          className={cn(
            'bg-gradient-to-br rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1',
            feature.gradient || 'from-gray-50 to-gray-100'
          )}
        >
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
            {feature.icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
          <p className="text-gray-600 text-body-sm leading-relaxed">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}

// Horizontal testimonials carousel
interface HorizontalTestimonialsProps {
  testimonials: Array<{
    name: string;
    role: string;
    company: string;
    testimonial: string;
    image?: string;
    rating?: number;
    metrics?: Array<{ label: string; value: string }>;
  }>;
  className?: string;
}

export function HorizontalTestimonials({ testimonials, className }: HorizontalTestimonialsProps) {
  return (
    <HorizontalScroll className={className} showControls={true} itemWidth="400px" gap="1.5rem">
      {testimonials.map((testimonial, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full"
        >
          <div className="flex items-start gap-4 mb-4">
            {testimonial.image && (
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h4 className="font-semibold text-ethos-navy">{testimonial.name}</h4>
              <p className="text-sm text-gray-600">{testimonial.role}</p>
              <p className="text-sm text-ethos-purple">{testimonial.company}</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4 text-body-sm leading-relaxed">{testimonial.testimonial}</p>
          {testimonial.metrics && (
            <div className="grid grid-cols-2 gap-2">
              {testimonial.metrics.map((metric, idx) => (
                <div key={idx} className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-ethos-purple text-sm">{metric.value}</div>
                  <div className="text-xs text-gray-600">{metric.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </HorizontalScroll>
  );
}

// Horizontal metrics/proof points
interface HorizontalMetricsProps {
  metrics: Array<{
    metric: string;
    description: string;
    icon: React.ReactNode;
    bgColor?: string;
  }>;
  className?: string;
}

export function HorizontalMetrics({ metrics, className }: HorizontalMetricsProps) {
  return (
    <HorizontalScroll className={className} showControls={false} itemWidth="280px" gap="1rem">
      {metrics.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center h-full"
        >
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              item.bgColor || 'bg-ethos-purple/10'
            )}
          >
            {item.icon}
          </div>
          <div className="text-2xl font-bold text-ethos-navy mb-2">{item.metric}</div>
          <p className="text-gray-600 text-body-sm leading-relaxed">{item.description}</p>
        </div>
      ))}
    </HorizontalScroll>
  );
}

// ============================================================================
// Investment Section - Simplified & Professional
// ============================================================================

// Constants
const SECTION_BG_COLOR = '#F2F2F2';
const CARD_SHADOW = '0 15px 35px -5px rgba(128, 128, 128, 0.25)';
const SOFT_SHADOW = '0 15px 35px -5px rgba(128, 128, 128, 0.15)';

const DEFAULT_TITLE = (
  <>
    <span className="text-ethos-navy">Custom AI Solution </span>
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)',
      }}
    >
      Pricing
    </span>
  </>
);

const DEFAULT_DESCRIPTION =
  'Every business is unique. We conduct in-depth research into your operations, industry, and challenges to build a custom solution tailored specifically for your needs.';

const VALUE_PROPOSITIONS = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Individual Research',
    description: 'Deep analysis of your business processes, industry, and specific challenges',
  },
  {
    icon: CodeBracketIcon,
    title: 'Custom Development',
    description: 'Bespoke AI models trained specifically for your use cases and data',
  },
  {
    icon: ArrowPathIcon,
    title: 'Ongoing Optimization',
    description: 'Monthly maintenance, updates, and performance improvements',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure & Compliant',
    description: 'SOC 2 certified, GDPR compliant, Australian data residency',
  },
];

const TRUST_BADGES = ['Free Consultation', 'Custom Solutions', 'Ongoing Support'];

// Types
interface PricingTier {
  title: string;
  description: string;
  startingPrice: string; // Maintained for backward compatibility
  features: string[];
  popular?: boolean; // Maintained for backward compatibility
}

interface InvestmentSectionProps {
  pricing: PricingTier[];
  title?: React.ReactNode;
  description?: string;
  className?: string;
  serviceContext?: 'intelligent-applications' | 'solutions' | 'smart-assistant' | 'system-integration';
  serviceName?: string;
  showEngagementModels?: boolean;
}

interface ValuePropositionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  items?: string[]; // Added for potential future use or compatibility
}

// Utility Components
const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
      aria-hidden="true"
    />
  </svg>
);

const TrustBadgeIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

// Sub-Components
const SectionHeader = ({ title, description }: { title?: React.ReactNode; description?: string }) => (
  <header className="text-center mb-16">
    <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
      {title || DEFAULT_TITLE}
    </h2>
    <p className="text-body-lg text-gray-700 max-w-4xl mx-auto">{description || DEFAULT_DESCRIPTION}</p>
  </header>
);

const PricingCard = ({ plan, onGetQuote }: { plan: PricingTier; onGetQuote: (packageName: string) => void }) => (
  <article
    className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col"
    style={{ boxShadow: CARD_SHADOW }}
  >
    <header className="text-center mb-6">
      <h3 className="text-lg font-bold text-ethos-navy mb-2">{plan.title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed min-h-[40px]">{plan.description}</p>
    </header>

    <div className="mb-6 p-4 bg-ethos-purple/5 rounded-xl border border-ethos-purple/10">
      <div className="flex items-center justify-center">
        <p
          className="text-sm font-medium text-center bg-clip-text text-transparent"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--ethos-purple-gradient-start), var(--ethos-purple-gradient-end))',
          }}
        >
          {plan.startingPrice}
        </p>
      </div>
    </div>

    <div className="flex-grow mb-6">
      <h4 className="text-sm font-semibold text-ethos-navy mb-3">What's Typically Included:</h4>
      <ul className="flex flex-col gap-3" role="list">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <CheckIcon />
            <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>
    </div>

    <footer className="mt-auto">
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="lg"
          className="px-6 py-4 sm:px-8 sm:py-6 rounded-full group whitespace-normal sm:whitespace-nowrap transition-all duration-300 ease-out border-2 border-transparent text-ethos-navy hover:text-white hover:border-transparent hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
          style={{
            background:
              'linear-gradient(white, white) padding-box, linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%) border-box',
            '--hover-bg': 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--hover-bg) border-box';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%) border-box';
            e.currentTarget.style.color = ''; // Reverts to CSS class
          }}
          onClick={() => onGetQuote(plan.title)}
          aria-label={`Get custom quote for ${plan.title}`}
        >
          <span className="relative z-10 flex items-center justify-center">
            Get Custom Quote
          </span>
        </Button>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
        <ClockIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <p className="text-center">
          Receive your detailed quotation within 24 hours
        </p>
      </div>
    </footer>
  </article>
);

const ValuePropositionCard = ({ icon: Icon, title, description }: ValuePropositionCardProps) => (
  <div className="text-center">
    <div className="w-12 h-12 bg-ethos-purple/10 rounded-full flex items-center justify-center mx-auto mb-3">
      <Icon className="w-6 h-6 text-ethos-purple" />
    </div>
    <h4 className="font-semibold text-ethos-navy mb-2">{title}</h4>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

const ValueProposition = () => (
  <section
    className="mt-20 bg-white rounded-2xl p-6 sm:p-8 md:p-10"
    style={{ boxShadow: SOFT_SHADOW }}
    aria-labelledby="value-proposition-title"
  >
    <h3 id="value-proposition-title" className="text-2xl font-bold text-ethos-navy text-center mb-6">
      Why Choose Our Custom AI Solutions?
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {VALUE_PROPOSITIONS.map((value) => (
        <ValuePropositionCard key={value.title} {...value} />
      ))}
    </div>
  </section>
);

const TrustBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <TrustBadgeIcon />
    <span>{children}</span>
  </div>
);

const TrustElements = () => (
  <footer className="mt-12 text-center">
    <p className="text-gray-600 text-sm mb-4">
      Australian-owned • SOC 2 Certified • GDPR Compliant
    </p>
    <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700">
      {TRUST_BADGES.map((badge) => (
        <TrustBadge key={badge}>{badge}</TrustBadge>
      ))}
    </div>
  </footer>
);

// Main Component
export function InvestmentSection({
  pricing,
  title,
  description,
  className,
  serviceContext = 'intelligent-applications',
  serviceName = 'Custom Solution',
  showEngagementModels: _showEngagementModels = true,
}: InvestmentSectionProps) {
  const [isQuotationModalOpen, setIsQuotationModalOpen] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<{name: string; type: 'basic' | 'standard' | 'enterprise'}>({
    name: '',
    type: 'basic'
  });

  const handleGetQuote = (packageName: string, index: number) => {
    // Determine package type based on index: 0=basic, 1=standard, 2=enterprise
    const packageType = index === 0 ? 'basic' : index === 1 ? 'standard' : 'enterprise';
    setSelectedPackage({ name: packageName, type: packageType });
    setIsQuotationModalOpen(true);
  };

  return (
    <>
      <section
        id="pricing"
        className={cn('py-12 lg:py-16', className)}
        style={{ backgroundColor: SECTION_BG_COLOR }}
        aria-labelledby="investment-section-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title={title} description={description} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {pricing.map((plan, index) => (
              <PricingCard
                key={`${plan.title}-${index}`}
                plan={plan}
                onGetQuote={(packageName) => handleGetQuote(packageName, index)}
              />
            ))}
          </div>


          <ValueProposition />
          <TrustElements />
        </div>
      </section>

      {/* Quotation Request Modal - Lazy loaded */}
      {isQuotationModalOpen && (
        <React.Suspense fallback={null}>
          {React.createElement(
            React.lazy(() =>
              import('@/components/marketing/quotation').then((m) => ({
                default: m.QuotationRequestModal,
              }))
            ),
            {
              isOpen: isQuotationModalOpen,
              onClose: () => setIsQuotationModalOpen(false),
              serviceContext,
              serviceName,
              packageType: selectedPackage.type,
              packageName: selectedPackage.name,
            }
          )}
        </React.Suspense>
      )}
    </>
  );
}

// Compact FAQ accordion
interface CompactFAQProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  title?: string;
  className?: string;
}

export function CompactFAQ({
  faqs,
  title = 'Frequently Asked Questions',
  className,
}: CompactFAQProps) {
  const accordionItems = faqs.map((faq, index) => ({
    id: `faq-${index}`,
    title: faq.question,
    content: <p className="text-gray-700 leading-relaxed">{faq.answer}</p>,
    defaultOpen: index === 0, // Open first item by default
  }));

  return (
    <section className={cn('py-12 bg-white', className)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-ethos-navy mb-4">{title}</h2>
        </div>
        <div className="max-h-none overflow-visible md:max-h-96 md:overflow-y-auto">
          <ServiceAccordion items={accordionItems} type="single" variant="minimal" />
        </div>
      </div>
    </section>
  );
}

// Expandable feature cards
interface ExpandableFeatureCardsProps {
  features: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    details?: string;
    gradient?: string;
  }>;
  className?: string;
}

export function ExpandableFeatureCards({ features, className }: ExpandableFeatureCardsProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {features.map((feature, index) => (
        <div
          key={index}
          className={cn(
            'bg-gradient-to-br rounded-2xl p-6 hover:shadow-lg transition-all duration-300',
            feature.gradient || 'from-gray-50 to-gray-100'
          )}
        >
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
            {feature.icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
          <p className="text-gray-600 text-body-sm leading-relaxed mb-3">{feature.description}</p>
          {feature.details && (
            <details className="group">
              <summary className="cursor-pointer text-ethos-purple text-sm font-medium hover:text-ethos-purple-dark transition-colors">
                Learn more
              </summary>
              <p className="mt-2 text-gray-600 text-body-sm leading-relaxed">{feature.details}</p>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
