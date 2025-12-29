import { cn } from '@/lib/marketing-utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React, { ReactNode } from 'react';

// =============================================================================
// ENHANCED CARD COMPONENT
// =============================================================================

const cardVariants = cva('relative overflow-hidden transition-all duration-300', {
  variants: {
    variant: {
      default: 'bg-white rounded-lg shadow-md',
      hero: 'bg-gradient-to-br from-white via-white to-gray-200 shadow-lg shadow-purple-200 flex flex-col',
      service:
        'bg-gradient-to-b from-gray-50 to-gray-100 text-center hover:shadow-xl transition-shadow duration-300',
      testimonial:
        'border border-white/20 flex-shrink-0 hover:scale-[1.02] focus-within:scale-[1.02]',
      feature: 'bg-white border border-gray-100 hover:border-ethos-purple/20 hover:shadow-lg',
      colored: 'relative group',
    },
    size: {
      sm: 'p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-4 sm:p-6 lg:p-8 xl:p-10',
      testimonial: 'p-4 sm:p-5 md:p-6 lg:p-7',
    },
    radius: {
      default: 'rounded-lg',
      large: 'rounded-2xl',
      xlarge: 'rounded-2xl',
    },
    width: {
      auto: 'w-auto',
      full: 'w-full',
      constrained: 'w-full max-w-[320px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl',
      testimonial: 'w-full max-w-[240px] sm:max-w-[280px] md:max-w-sm lg:max-w-md xl:max-w-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    radius: 'default',
    width: 'auto',
  },
});

interface EnhancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
  customBackground?: string;
  customShadow?: string;
  asChild?: boolean;
}

export const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  (
    {
      className,
      variant,
      size,
      radius,
      width,
      children,
      customBackground,
      customShadow,
      style,
      ...props
    },
    ref
  ) => {
    const getVariantStyle = () => {
      const baseStyle: React.CSSProperties = { ...style };

      if (variant === 'service' && !customShadow) {
        baseStyle.boxShadow =
          '0 4px 4px rgba(0, 0, 0, 0.25), inset -30px -30px 50px rgba(255, 255, 255, 0.7), inset 30px 30px 50px rgba(0, 39, 80, 0.05)';
      }

      if (variant === 'testimonial' && !customShadow) {
        baseStyle.background = 'linear-gradient(180deg, #FEFEFE 0%, #F8F7F7 100%)';
        baseStyle.boxShadow =
          '0 8px 32px rgba(116, 113, 224, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
        baseStyle.transform = 'translate3d(0, 0, 0)';
        baseStyle.backfaceVisibility = 'hidden';
      }

      if (customBackground) {
        baseStyle.background = customBackground;
      }

      if (customShadow) {
        baseStyle.boxShadow = customShadow;
      }

      return baseStyle;
    };

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, radius, width }), 'mx-auto', className)}
        style={getVariantStyle()}
        {...props}
      >
        {children}
      </div>
    );
  }
);
EnhancedCard.displayName = 'EnhancedCard';

// =============================================================================
// RESPONSIVE GRID COMPONENT
// =============================================================================

const gridVariants = cva('grid', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
      auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      testimonials: 'grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_auto_minmax(300px,1fr)]',
    },
    gap: {
      sm: 'gap-4 sm:gap-6',
      md: 'gap-6 md:gap-8 lg:gap-10',
      lg: 'gap-6 md:gap-8 lg:gap-10 xl:gap-12',
      minimal: 'gap-1 xl:gap-2',
    },
  },
  defaultVariants: {
    cols: 3,
    gap: 'md',
  },
});

interface ResponsiveGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  children: ReactNode;
}

export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ className, cols, gap, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(gridVariants({ cols, gap }), className)} {...props}>
        {children}
      </div>
    );
  }
);
ResponsiveGrid.displayName = 'ResponsiveGrid';

// =============================================================================
// ANIMATED CARD COMPONENT
// =============================================================================

interface AnimatedCardProps {
  children: ReactNode;
  variant?: 'float' | 'hover' | 'focus' | 'none';
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  variant = 'hover',
  className = '',
  style,
}) => {
  const getAnimationClasses = () => {
    switch (variant) {
      case 'float':
        return 'animate-float-slow';
      case 'hover':
        return 'hover:scale-[1.02] transition-transform duration-300';
      case 'focus':
        return 'hover:scale-[1.02] focus-within:scale-[1.02] transition-transform duration-300';
      default:
        return '';
    }
  };

  return (
    <div className={cn(getAnimationClasses(), className)} style={style}>
      {children}
    </div>
  );
};

// =============================================================================
// GRADIENT TEXT COMPONENT
// =============================================================================

interface GradientTextProps {
  children: ReactNode;
  variant?: 'purple' | 'navy-gray' | 'purple-pink';
  className?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  variant = 'purple',
  className = '',
}) => {
  const getGradientClasses = () => {
    switch (variant) {
      case 'navy-gray':
        return 'bg-gradient-to-r from-ethos-navy-light to-ethos-gray-light bg-clip-text text-transparent';
      case 'purple-pink':
        return 'bg-gradient-to-r from-ethos-purple-gradient-start to-ethos-purple-gradient-end bg-clip-text text-transparent';
      default:
        return 'text-ethos-purple';
    }
  };

  return <span className={cn(getGradientClasses(), className)}>{children}</span>;
};

// =============================================================================
// STATISTIC CARD COMPONENT
// =============================================================================

interface StatisticCardProps {
  value: string;
  title: string;
  description: string;
  className?: string;
}

export const StatisticCard: React.FC<StatisticCardProps> = ({
  value,
  title,
  description,
  className = '',
}) => {
  return (
    <EnhancedCard
      variant="hero"
      size="lg"
      radius="xlarge"
      width="constrained"
      className={className}
    >
      <div className="mb-6">
        <span className="block text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-ethos-purple-gradient-start to-ethos-purple-gradient-end bg-clip-text text-transparent leading-none tracking-tight">
          {value}
        </span>
      </div>
      <h3 className="text-ethos-gray text-lg md:text-xl lg:text-2xl font-normal mb-4 leading-snug tracking-tight">
        {title}
      </h3>
      <p className="text-ethos-gray text-base md:text-lg font-normal leading-relaxed tracking-tight">
        {description}
      </p>
    </EnhancedCard>
  );
};

// =============================================================================
// SERVICE CARD COMPONENT
// =============================================================================

interface ServiceCardProps {
  title: string;
  description: string;
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, className = '' }) => {
  return (
    <EnhancedCard
      variant="service"
      size="lg"
      radius="xlarge"
      width="constrained"
      className={className}
    >
      <h3 className="text-base sm:text-lg lg:text-xl font-normal mb-2 sm:mb-3 lg:mb-4 bg-gradient-to-r from-ethos-purple-gradient-start to-ethos-purple-gradient-end bg-clip-text text-transparent tracking-tight leading-snug">
        {title}
      </h3>
      <p className="text-sm sm:text-base lg:text-lg font-normal bg-gradient-to-r from-ethos-gray to-ethos-gray-lighter bg-clip-text text-transparent leading-relaxed tracking-tight">
        {description}
      </p>
    </EnhancedCard>
  );
};

// =============================================================================
// COLORED CARD COMPONENT (for ServiceFailures style)
// =============================================================================

interface ColoredCardProps {
  children: ReactNode;
  backgroundColor: string;
  className?: string;
  maxWidth?: string;
}

export const ColoredCard: React.FC<ColoredCardProps> = ({
  children,
  backgroundColor,
  className = '',
  maxWidth = 'lg:max-w-md xl:max-w-lg',
}) => {
  return (
    <div className={cn('relative group w-full mx-auto', maxWidth, className)}>
      {/* Background Shape */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300 group-hover:scale-[1.02] shadow-lg hover:shadow-xl"
        style={{ background: backgroundColor }}
      />

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 xl:p-10">{children}</div>
    </div>
  );
};

// =============================================================================
// FEATURE LIST COMPONENT
// =============================================================================

interface FeatureItem {
  text: string;
  dotColor?: string;
}

interface FeatureListProps {
  features: FeatureItem[];
  title?: string;
  titleColor?: string;
  textColor?: string;
  className?: string;
}

export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  title,
  titleColor = 'text-white',
  textColor = 'text-white',
  className = '',
}) => {
  return (
    <div className={className}>
      {title && (
        <h3
          className={`text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-snug tracking-tight mb-3 sm:mb-4 lg:mb-6 ${titleColor}`}
        >
          {title}
        </h3>
      )}

      <div className="sm:lg:">
        {features.map((feature, index) => (
          <div key={index}>
            <div className="flex items-start gap-2 sm:gap-3 group/item">
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0 mt-1 transition-transform duration-200 group-hover/item:scale-110"
                style={{ background: feature.dotColor || '#7900E3' }}
                role="presentation"
                aria-hidden="true"
              />
              <p
                className={`text-xs sm:text-sm lg:text-base leading-relaxed tracking-tight transition-opacity duration-200 group-hover/item:opacity-90 ${textColor}`}
              >
                {feature.text}
              </p>
            </div>
            {index < features.length - 1 && (
              <div className="h-px bg-white/30 transition-opacity duration-300 hover:bg-white/50 ml-5 sm:ml-7 lg:ml-8 mt-2 sm:mt-3 lg:mt-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// FLOATING IMAGE COMPONENT
// =============================================================================

interface FloatingImageProps {
  src: string;
  alt: string;
  className?: string;
  animation?: 'float' | 'float-mole' | 'none';
  overlayImage?: {
    src: string;
    alt: string;
    position: string;
    size: string;
  };
}

export const FloatingImage: React.FC<FloatingImageProps> = ({
  src,
  alt,
  className = '',
  animation = 'none',
  overlayImage,
}) => {
  const getAnimationClass = () => {
    switch (animation) {
      case 'float':
        return 'animate-float-slow';
      case 'float-mole':
        return 'animate-float-mole';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        className={cn('w-full h-auto object-contain', getAnimationClass(), className)}
      />
      {overlayImage && (
        <img
          src={overlayImage.src}
          alt={overlayImage.alt}
          className={cn(
            'absolute transform -translate-x-1/2 -translate-y-1/2',
            overlayImage.position,
            overlayImage.size,
            getAnimationClass()
          )}
        />
      )}
    </div>
  );
};
