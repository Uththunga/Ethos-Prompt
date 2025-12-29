import { memo, useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

interface Testimonial {
  name: string;
  role: string;
  rating: number;
  text: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

interface ScrollingRowProps {
  testimonials: Testimonial[];
  direction?: 'left' | 'right';
}

const testimonials = [
  {
    name: 'Sebastian Siemiatkowski',
    role: 'CEO, Klarna',
    rating: 5,
    text: "Our AI assistant now manages two-thirds of all customer chats, equivalent to 800 full-time employees. We've seen a 25% drop in repeat inquiries and resolution times fell from 11 minutes to just 2 minutes.",
  },
  {
    name: 'Dimitri O.',
    role: 'Co-Founder, Loop Earplugs',
    rating: 5,
    text: "Since implementing the AI agent, we've achieved a 357% ROI. It handles customer inquiries 24/7, reducing our response time by 194% while maintaining an 80% customer satisfaction score.",
  },
  {
    name: 'Luis von Ahn',
    role: 'CEO, Duolingo',
    rating: 5,
    text: "AI is completely transformative for us. By automating content creation and feedback, we've seen a 40% year-over-year growth in daily active users and a 43% increase in paid subscribers.",
  },
  {
    name: 'Alex Pilon',
    role: 'Shopify Merchant',
    rating: 5,
    text: "The AI system learned my store's context perfectly. It acts as a 24/7 salesperson, driving a 14.5% lift in conversions by answering questions and making personalized product recommendations.",
  },
  {
    name: 'Manufacturing Lead',
    role: 'Siemens',
    rating: 5,
    text: "AI optimization reduced our production time by 15% and overall costs by 12%. We're now hitting a 99.5% on-time delivery rate by predicting and preventing bottlenecks before they happen.",
  },
  {
    name: 'Supply Chain Director',
    role: 'Unilever',
    rating: 5,
    text: "We reduced the time to generate complex contract analysis from weeks to minutes. This efficiency gain led to a 10% reduction in inventory costs and significantly faster decision-making.",
  },
  {
    name: 'HR Director',
    role: 'DocuSign',
    rating: 5,
    text: "The AI-powered onboarding system cut our new hire ramp-up time by 40%. Employees now get instant answers to policy questions, freeing HR to focus on strategic initiatives.",
  },
  {
    name: 'CTO',
    role: 'Stripe',
    rating: 5,
    text: "Integrating AI into our developer tools increased API adoption by 35%. The intelligent documentation assistant reduced support tickets by half while improving developer satisfaction scores.",
  },
];

const StarIcon = memo(() => (
  <svg
    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
    viewBox="0 0 38 35"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 0L23.2658 13.1287H37.0701L25.9022 21.2426L30.1679 34.3713L19 26.2574L7.83208 34.3713L12.0978 21.2426L0.929926 13.1287H14.7342L19 0Z"
      fill="#7409C5"
    />
  </svg>
));
StarIcon.displayName = 'StarIcon';

const TestimonialCard = memo(({ testimonial }: TestimonialCardProps) => (
  <div
    className="w-[75vw] sm:w-[320px] md:w-[360px] lg:w-[400px] xl:w-[440px] 2xl:w-[480px] min-h-[200px] sm:min-h-[220px] md:min-h-[240px] lg:min-h-[260px] bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-5 sm:p-6 md:p-7 lg:p-8 mx-3 sm:mx-4 lg:mx-5 flex-shrink-0 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] focus-within:scale-[1.02]"
    style={{
      boxShadow:
        '0 4px 4px rgba(0, 0, 0, 0.25), inset -30px -30px 50px rgba(255, 255, 255, 0.7), inset 30px 30px 50px rgba(0, 39, 80, 0.05)',
      transform: 'translate3d(0, 0, 0)',
      backfaceVisibility: 'hidden',
    }}
    role="listitem"
    aria-label={`Testimonial from ${testimonial.name}`}
    tabIndex={0}
  >
    <div className="w-full h-full relative flex flex-col">
      <blockquote
        className="flex-1 mb-3 sm:mb-4 md:mb-5 font-normal leading-relaxed"
        style={{
          fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
          lineHeight: '1.6',
          color: '#484848',
        }}
      >
        "{testimonial.text}"
      </blockquote>
      <footer className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
        <div className="flex items-center">
          <div className="w-1 h-8 sm:h-10 mr-2 sm:mr-3 rounded-full bg-gradient-to-b from-[#D47CD9] to-ethos-purple" />
          <div>
            <cite
              className="not-italic font-semibold"
              style={{
                fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                background: 'linear-gradient(to right, #7471E0, #EA73D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {testimonial.name}
            </cite>
            <p
              className="mt-0.5 sm:mt-1"
              style={{
                fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
                color: '#717493',
              }}
            >
              {testimonial.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-ethos-purple/5 to-ethos-purple-light/5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full">
          <StarIcon />
          <span
            className="font-semibold text-ethos-purple"
            style={{
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
            }}
          >
            {testimonial.rating}
          </span>
        </div>
      </footer>
    </div>
  </div>
));
TestimonialCard.displayName = 'TestimonialCard';

const ScrollingRow = ({ testimonials, direction = 'left' }: ScrollingRowProps) => {
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const currentPositionRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const cards = container.querySelectorAll('[role="listitem"]');

      if (cards.length === 0) return;

      // Calculate width of one complete set (half of duplicated content)
      const singleSetLength = cards.length / 2;
      let totalWidth = 0;

      for (let i = 0; i < singleSetLength; i++) {
        const card = cards[i] as HTMLElement;
        const styles = window.getComputedStyle(card);
        const marginLeft = parseFloat(styles.marginLeft);
        const marginRight = parseFloat(styles.marginRight);
        totalWidth += card.offsetWidth + marginLeft + marginRight;
      }

      setWidth(totalWidth);
    }
  }, [testimonials]);

  useEffect(() => {
    if (width === 0 || prefersReducedMotion || isDraggingRef.current) return;

    let isActive = true;

    const isMobile = window.innerWidth < 768;
    const ANIMATION_DURATION = 60;
    const MOBILE_DURATION_MULTIPLIER = 0.85;
    const baseDuration = isMobile
      ? ANIMATION_DURATION * MOBILE_DURATION_MULTIPLIER
      : ANIMATION_DURATION;

    const from = direction === 'left' ? 0 : -width;
    const to = direction === 'left' ? -width : 0;

    // Calculate constant speed (pixels per second)
    const totalDistance = Math.abs(to - from);
    const pixelsPerSecond = totalDistance / baseDuration;

    const animate = async () => {
      if (!isActive || paused || isDraggingRef.current) return;

      // Get current position (or start from beginning)
      const currentPos = currentPositionRef.current;

      // Calculate remaining distance from current position
      const remainingDistance = direction === 'left'
        ? Math.abs(to - currentPos)
        : Math.abs(currentPos - to);

      // Calculate duration based on constant speed
      const duration = remainingDistance / pixelsPerSecond;

      // Animate from current position to end at constant speed
      await controls.start({
        x: to,
        transition: {
          duration,
          ease: 'linear',
          repeat: 0,
        },
      });

      // When complete, reset and restart
      if (isActive && !paused && !isDraggingRef.current) {
        currentPositionRef.current = from;
        controls.set({ x: from });
        requestAnimationFrame(() => animate());
      }
    };

    if (!paused) {
      animate();
    }

    return () => {
      isActive = false;
      controls.stop();
    };
  }, [width, direction, paused, controls, prefersReducedMotion]);

  // Enhanced touch and interaction handlers for mobile - memoized
  const handleMouseEnter = useCallback(() => setPaused(true), []);
  const handleMouseLeave = useCallback(() => setPaused(false), []);
  const handleFocus = useCallback(() => setPaused(true), []);
  const handleBlur = useCallback(() => setPaused(false), []);

  // Optimized touch event handlers for mobile devices - allow scrolling
  const handleTouchStart = useCallback(() => {
    setPaused(true);
  }, []);
  const handleTouchEnd = useCallback(() => {
    setPaused(false);
  }, []);

  const handleDragStart = () => {
    isDraggingRef.current = true;
    setPaused(true);
  };

  const handleDragEnd = (_event: any, info: any) => {
    isDraggingRef.current = false;
    // Update current position to where user released
    currentPositionRef.current = info.point.x;
    setPaused(false);
  };

  return (
    <motion.div
      className="flex cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-ethos-purple/20 focus:ring-offset-2 rounded-lg touch-pan-y"
      ref={containerRef}
      animate={controls}
      drag="x"
      dragConstraints={{ left: -width, right: 0 }}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        willChange: prefersReducedMotion ? 'auto' : 'transform',
        transform: 'translate3d(0, 0, 0)', // Hardware acceleration
        backfaceVisibility: 'hidden', // Performance optimization
        perspective: 1000, // Enable 3D rendering context
        WebkitOverflowScrolling: 'touch' as any, // iOS smooth scrolling
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label={`Testimonials row scrolling ${direction}. ${
        prefersReducedMotion
          ? 'Animation disabled for accessibility.'
          : 'Hover, touch, or drag to navigate. Animation pauses on interaction.'
      }`}
      tabIndex={0}
    >
      {[...testimonials, ...testimonials].map((testimonial, index) => (
        <TestimonialCard key={`${direction}-${index}`} testimonial={testimonial} />
      ))}
    </motion.div>
  );
};

export const Testimonials = () => {
  const row1 = testimonials.slice(0, 4);
  const row2 = testimonials.slice(4, 8);

  // Animation style for the shine effect
  const animationStyle = `
    @keyframes shine {
      to {
        background-position: 200% center;
      }
    }
  `;

  return (
    <section
      className="w-full relative py-12 sm:py-16 lg:py-20 xl:py-24 overflow-hidden min-h-screen lg:min-h-[85vh] xl:min-h-[90vh] lg:flex lg:flex-col lg:justify-center"
      style={{
        background: 'linear-gradient(180deg, #FFF 60.69%, #DDD 100%)',
      }}
      aria-labelledby="testimonials-heading"
    >
      <style dangerouslySetInnerHTML={{ __html: animationStyle }} />

      {/* Left fade overlay - full section height (hidden on mobile) */}
      <div
        className="hidden md:block absolute left-0 top-0 bottom-0 w-36 lg:w-44 xl:w-52 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(240, 240, 240, 1) 0%, rgba(240, 240, 240, 0.7) 40%, rgba(240, 240, 240, 0) 100%)',
        }}
      />

      {/* Right fade overlay - full section height (hidden on mobile) */}
      <div
        className="hidden md:block absolute right-0 top-0 bottom-0 w-36 lg:w-44 xl:w-52 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, rgba(240, 240, 240, 1) 0%, rgba(240, 240, 240, 0.7) 40%, rgba(240, 240, 240, 0) 100%)',
        }}
      />

      {/* Header with standard container */}
      <div className="container-standard">
        <header className="text-center mb-8 sm:mb-10 lg:mb-12 z-10">
          <h2 id="testimonials-heading" className="heading-hero font-medium text-center max-w-7xl mx-auto leading-[1.13] tracking-[-0.03em]">
            <span className="text-ethos-navy">See What </span>
            <span className="text-gradient-shine font-poppins font-medium inline-block">
              Intelligent Systems Can Do
            </span>
          </h2>
        </header>
      </div>

      {/* Full-width carousel area */}
      <div className="relative w-full overflow-visible px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div
          className="relative w-full flex flex-col gap-4 md:gap-5 lg:gap-6 xl:gap-8"
          style={{ transform: 'translate3d(0, 0, 0)' }}
          role="list"
          aria-label="Customer testimonials"
        >
          <ScrollingRow testimonials={row1} direction="left" />
          <ScrollingRow testimonials={row2} direction="right" />
        </div>
      </div>


    </section>
  );
};
