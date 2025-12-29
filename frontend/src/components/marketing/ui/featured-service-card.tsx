import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/marketing/ui/button';
import { ArrowRight, CheckCircle, Star } from '@/components/icons/lucide';
import { cn } from '@/lib/utils';

/**
 * Props for individual stat items displayed in the featured service card
 */
interface StatItem {
  /** The main value/metric to display (e.g., "87%", "<30s") */
  value: string;
  /** Descriptive label for the stat (e.g., "Cost Reduction") */
  label: string;
  /** Optional icon to display above the stat */
  icon?: React.ReactNode;
}

/**
 * Props for the FeaturedServiceCard component
 */
export interface FeaturedServiceCardProps {
  /** Main title of the featured service */
  title: string;
  /** Detailed description of the service */
  description: string;
  /** Array of key benefits to display with checkmarks */
  benefits: string[];
  /** Array of statistics/metrics to showcase in a grid */
  stats: StatItem[];
  /** Starting price (e.g., "$890") */
  startingPrice: string;
  /** Currency code (default: "AUD") */
  currency?: string;
  /** Text for the primary call-to-action button */
  ctaText: string;
  /** Link/route for the CTA button */
  ctaLink: string;
  /** Optional image source for visual representation */
  imageSrc?: string;
  /** Badge text to display (default: "Most Popular") */
  badge?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FeaturedServiceCard Component
 *
 * A prominent, visually-rich card component designed to highlight the most popular
 * or recommended service. Features a large layout with statistics grid, benefits list,
 * pricing display, and prominent CTA.
 *
 * Optimized for Australian market with AUD pricing and conversion-focused design.
 *
 * @example
 * ```tsx
 * <FeaturedServiceCard
 *   title="Smart Business Assistant"
 *   description="24/7 AI-powered support that handles customer service..."
 *   benefits={[
 *     'Reduce customer service costs by 87%',
 *     'Answer customer questions in under 30 seconds',
 *   ]}
 *   stats={[
 *     { label: 'Cost Reduction', value: '87%' },
 *     { label: 'Response Time', value: '<30s' },
 *   ]}
 *   startingPrice="$890"
 *   currency="AUD"
 *   ctaText="Calculate Your Savings"
 *   ctaLink="/services/smart-assistant#roi-calculator"
 * />
 * ```
 */
export const FeaturedServiceCard: React.FC<FeaturedServiceCardProps> = ({
  title,
  description,
  benefits,
  stats,
  startingPrice,
  currency = 'AUD',
  ctaText,
  ctaLink,
  imageSrc,
  badge = 'Most Popular',
  className = '',
}) => {
  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-ethos-purple/5 via-white to-ethos-navy/5',
        'rounded-2xl p-6 md:p-8 lg:p-12',
        'border-2 border-ethos-purple/20 shadow-xl hover:shadow-2xl',
        'transition-all duration-300',
        className
      )}
    >
      {/* Badge */}
      <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs md:text-sm font-bold px-4 md:px-6 py-1.5 md:py-2 rounded-full shadow-lg flex items-center gap-2">
          <Star className="w-3 h-3 md:w-4 md:h-4 fill-white" />
          <span>{badge}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
        {/* Left Column: Content */}
        <div className="md:">
          {/* Title & Description */}
          <div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3">
              <span
                className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                style={{
                  background: 'linear-gradient(to right, var(--ethos-purple), var(--ethos-navy))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {title}
              </span>
            </h3>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">{description}</p>
          </div>

          {/* Benefits List */}
          <ul className="md:">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 md:gap-3">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {stat.icon && <div className="mb-1 md:mb-2 text-ethos-purple">{stat.icon}</div>}
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-ethos-purple mb-1">
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-gray-600 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Pricing & CTA */}
          <div className="md:pt-4 border-t border-gray-200">
            {/* Pricing */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm md:text-base text-gray-600">Starting from</span>
              <span
                className="text-3xl md:text-4xl lg:text-5xl font-bold"
                style={{
                  background:
                    'linear-gradient(to right, var(--ethos-purple), var(--ethos-purple-dark))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {startingPrice}
              </span>
              <span className="text-sm md:text-base text-gray-600">/month {currency}</span>
            </div>
            <p className="text-xs md:text-sm text-gray-500">+ GST</p>

            {/* CTA Button */}
            <Link to={ctaLink} className="block">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold text-base md:text-lg py-4 md:py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                style={{
                  background:
                    'linear-gradient(to right, var(--ethos-purple), var(--ethos-purple-dark))',
                }}
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Image/Visual */}
        {imageSrc && (
          <div className="relative order-first lg:order-last">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              {/* Gradient Overlay for better text contrast if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-2xl -z-10" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-full blur-2xl -z-10" />
          </div>
        )}
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
    </div>
  );
};

/**
 * Default export for convenience
 */
export default FeaturedServiceCard;
