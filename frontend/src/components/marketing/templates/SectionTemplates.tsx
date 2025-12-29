import React, { ReactNode } from 'react';
import { Button } from '@/components/marketing/ui/button';

// =============================================================================
// SECTION CONTAINER COMPONENT
// =============================================================================

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'gradient-ways' | 'gradient-testimonials';
  padding?: 'standard' | 'large' | 'hero';
  id?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  className = '',
  background = 'white',
  padding = 'standard',
  id
}) => {
  const getBackgroundClasses = () => {
    switch (background) {
      case 'gray':
        return { background: '#F2F2F2' };
      case 'gradient-ways':
        return { background: 'linear-gradient(180deg, #FFF 37.11%, #E8E8E8 100%)' };
      case 'gradient-testimonials':
        return { background: 'linear-gradient(180deg, #FFF 60.69%, #DDD 100%)' };
      default:
        return {};
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case 'large':
        return 'py-16 md:py-20 lg:py-24 xl:py-28';
      case 'hero':
        return 'py-12 lg:py-20';
      default:
        return 'py-8 md:py-12 lg:py-16';
    }
  };

  return (
    <section
      className={`w-full ${getPaddingClasses()} ${className}`}
      style={getBackgroundClasses()}
      id={id}
      aria-label={id ? `Section: ${id}` : 'Content section'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
};

// =============================================================================
// SECTION HEADER COMPONENT
// =============================================================================

interface SectionHeaderProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  alignment?: 'left' | 'center';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  titleAccent,
  subtitle,
  alignment = 'center',
  className = ''
}) => {
  const alignmentClasses = alignment === 'center' ? 'text-center' : 'text-left';

  return (
    <header className={`mb-12 md:mb-16 lg:mb-20 ${alignmentClasses} ${className}`}>
      <h2 className="heading-section font-medium leading-snug tracking-tight mb-3 lg:mb-4">
        <span style={{ color: '#0F1345' }}>{title}</span>
        {titleAccent && (
          <>
            <br />
            <span style={{ color: '#7409C5' }}>{titleAccent}</span>
          </>
        )}
      </h2>
      {subtitle && (
        <p className="text-body-small font-normal leading-relaxed tracking-tight text-ethos-gray max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </header>
  );
};

// =============================================================================
// CONTENT WITH IMAGE SECTION
// =============================================================================

interface ContentWithImageProps {
  imageSrc: string;
  imageAlt: string;
  imageAnimation?: boolean;
  reverse?: boolean;
  children: ReactNode;
  className?: string;
}

export const ContentWithImageSection: React.FC<ContentWithImageProps> = ({
  imageSrc,
  imageAlt,
  imageAnimation = false,
  reverse = false,
  children,
  className = ''
}) => {
  const gridOrder = reverse ? 'lg:order-2' : 'lg:order-1';
  const contentOrder = reverse ? 'lg:order-1' : 'lg:order-2';
  const animationClass = imageAnimation ? 'animate-float-mole' : '';

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 ${className}`}>
      <div className={`flex justify-start items-start relative ${gridOrder}`}>
        <div className="relative -mt-16 sm:-mt-20 md:-mt-24 lg:-mt-32 -ml-4 sm:-ml-6 md:-ml-8 lg:-ml-12">
          <img
            src={imageSrc}
            alt={imageAlt}
            className={`w-full max-w-[360px] sm:max-w-[440px] md:max-w-[520px] lg:max-w-[600px] xl:max-w-[650px] h-auto object-contain ${animationClass}`}
          />
        </div>
      </div>

      <div className={`flex flex-col justify-center w-full sm:lg:${contentOrder}`}>
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// FEATURE GRID COMPONENT
// =============================================================================

interface FeatureItem {
  number?: number;
  title: string;
  description: string;
}

interface FeatureGridProps {
  features: FeatureItem[];
  className?: string;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ features, className = '' }) => {
  return (
    <div className={`sm:lg:${className}`}>
      {features.map((feature, index) => (
        <div key={index} className="flex items-start gap-6">
          {feature.number && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-body-small bg-ethos-purple">
              {feature.number}
            </div>
          )}
          <div>
            <h3 className="heading-subsection font-medium text-ethos-navy mb-2">
              {feature.title}
            </h3>
            <p className="text-body-small text-ethos-gray leading-relaxed">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// CARD GRID SECTION
// =============================================================================

interface Card {
  title: string;
  subtitle?: string;
  content?: string;
  value?: string;
  type?: 'statistic' | 'service' | 'feature';
}

interface CardGridProps {
  cards: Card[];
  gridCols?: string;
  cardType?: 'hero' | 'service' | 'testimonial';
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  gridCols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  cardType = 'service',
  className = ''
}) => {
  const getCardClasses = () => {
    switch (cardType) {
      case 'hero':
        return 'bg-gradient-to-br from-white via-white to-gray-200 rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-10 shadow-lg shadow-purple-200 flex flex-col w-full max-w-[320px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto';
      case 'service':
        return 'w-full max-w-[320px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-10 text-center hover:shadow-xl transition-shadow duration-300';
      default:
        return 'bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg';
    }
  };

  const getCardStyle = () => {
    if (cardType === 'service') {
      return {
        boxShadow: "0 4px 4px rgba(0, 0, 0, 0.25), inset -30px -30px 50px rgba(255, 255, 255, 0.7), inset 30px 30px 50px rgba(0, 39, 80, 0.05)"
      };
    }
    return {};
  };

  return (
    <div className={`grid ${gridCols} gap-6 md:gap-8 lg:gap-10 xl:gap-12 ${className}`}>
      {cards.map((card, index) => (
        <div
          key={index}
          className={getCardClasses()}
          style={getCardStyle()}
        >
          {card.value && (
            <div className="mb-6">
              <span className="block heading-display font-bold bg-gradient-to-r from-ethos-purple-gradient-start to-ethos-purple-gradient-end bg-clip-text text-transparent leading-none tracking-tight">
                {card.value}
              </span>
            </div>
          )}
          <h3 className="heading-subsection font-normal mb-2 sm:mb-3 lg:mb-4 bg-gradient-to-r from-ethos-purple-gradient-start to-ethos-purple-gradient-end bg-clip-text text-transparent tracking-tight leading-snug">
            {card.title}
          </h3>
          {card.subtitle && (
            <p className="text-body-default font-normal bg-gradient-to-r from-ethos-gray to-ethos-gray-lighter bg-clip-text text-transparent leading-relaxed tracking-tight">
              {card.subtitle}
            </p>
          )}
          {card.content && (
            <p className="text-ethos-gray text-body-default font-normal leading-relaxed tracking-tight">
              {card.content}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// CTA SECTION COMPONENT
// =============================================================================

interface CTASectionProps {
  title: string;
  buttonText: string;
  onButtonClick?: () => void;
  buttonHref?: string;
  className?: string;
}

export const CTASection: React.FC<CTASectionProps> = ({
  title,
  buttonText,
  onButtonClick,
  buttonHref,
  className = ''
}) => {
  return (
    <div className={`text-center ${className}`}>
      <h3 className="heading-section font-normal leading-snug tracking-tight mb-8 sm:mb-10 lg:mb-12 text-ethos-gray">
        {title}
      </h3>
      <div className="flex justify-center">
        {buttonHref ? (
          <Button variant="ethos" size="lg" asChild>
            <a href={buttonHref}>{buttonText}</a>
          </Button>
        ) : (
          <Button variant="ethos" size="lg" onClick={onButtonClick}>
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// HERO SECTION TEMPLATE
// =============================================================================

interface HeroSectionProps {
  title: string;
  titleAccent?: string;
  imageSrc?: string;
  imageAlt?: string;
  overlayImageSrc?: string;
  overlayImageAlt?: string;
  showStats?: boolean;
  stats?: Card[];
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  titleAccent,
  imageSrc,
  imageAlt,
  overlayImageSrc,
  overlayImageAlt,
  showStats = false,
  stats = [],
  className = ''
}) => {
  return (
    <div className={`relative w-full overflow-hidden min-h-screen bg-white ${className}`}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20">
        {/* Hero Banner */}
        <div className="text-center mb-4 -mt-2">
          <h1 className="heading-hero font-semibold font-poppins leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-ethos-navy-light to-ethos-gray-light bg-clip-text text-transparent">
              {title}
            </span>
            {titleAccent && (
              <>
                <br />
                <span className="text-ethos-purple">{titleAccent}</span>
              </>
            )}
          </h1>
        </div>

        {/* Hero Image */}
        {imageSrc && (
          <div className="relative flex justify-center -mt-4">
            <div className="relative">
              <img
                src={imageSrc}
                alt={imageAlt || ''}
                className="w-full h-auto object-contain"
              />
              {overlayImageSrc && (
                <img
                  src={overlayImageSrc}
                  alt={overlayImageAlt || ''}
                  className="absolute top-[38.5%] sm:top-[40.5%] md:top-[41.5%] lg:top-[42.5%] left-[55%] sm:left-[57%] md:left-[58%] transform -translate-x-1/2 -translate-y-1/2 w-[44%] sm:w-[45%] md:w-[46%] h-auto animate-float-slow"
                />
              )}
            </div>
          </div>
        )}

        {/* Stats Section */}
        {showStats && stats.length > 0 && (
          <div className="relative z-10 pb-16 mt-16">
            <SectionHeader
              title="Proven results for"
              titleAccent="Your Business"
              className="mb-12 md:mb-16 lg:mb-20"
            />
            <CardGrid
              cards={stats}
              gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              cardType="hero"
            />
          </div>
        )}
      </div>
    </div>
  );
};
