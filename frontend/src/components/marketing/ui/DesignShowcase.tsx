import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, Maximize2 } from 'lucide-react';
import { Button } from '@/components/marketing/ui/button';

// Industry configuration with 5 images each
const industries = [
  {
    id: 'agtech',
    name: 'Ag-Tech',
    description: 'Smart farming & agricultural solutions',
    images: [
      '/assets/marketing/Mockups/Ag-Tech/Ag-Tech (1).webp',
      '/assets/marketing/Mockups/Ag-Tech/Ag-Tech (7).webp',
      '/assets/marketing/Mockups/Ag-Tech/Ag-Tech (8).webp',
      '/assets/marketing/Mockups/Ag-Tech/Ag-Tech (10).webp',
      '/assets/marketing/Mockups/Ag-Tech/Ag-Tech (11).webp',
    ],
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Learning management & educational platforms',
    images: [
      '/assets/marketing/Mockups/Education/Education (1).webp',
      '/assets/marketing/Mockups/Education/Education (2).webp',
      '/assets/marketing/Mockups/Education/Education (3).webp',
      '/assets/marketing/Mockups/Education/Education (4).webp',
      '/assets/marketing/Mockups/Education/Education (6).webp',
    ],
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Law firm & legal practice management',
    images: [
      '/assets/marketing/Mockups/Legal/Legal (1).webp',
      '/assets/marketing/Mockups/Legal/Legal (2).webp',
      '/assets/marketing/Mockups/Legal/Legal (3).webp',
      '/assets/marketing/Mockups/Legal/Legal (4).webp',
      '/assets/marketing/Mockups/Legal/Legal (1).webp',
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Booking & travel experience platforms',
    images: [
      '/assets/marketing/Mockups/Travel/Travel- (1).webp',
      '/assets/marketing/Mockups/Travel/Travel- (2).webp',
      '/assets/marketing/Mockups/Travel/Travel- (3).webp',
      '/assets/marketing/Mockups/Travel/Travel- (4).webp',
      '/assets/marketing/Mockups/Travel/Travel (15).webp',
    ],
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Health, fitness & wellness applications',
    images: [
      '/assets/marketing/Mockups/Wellness/Wellness (1).webp',
      '/assets/marketing/Mockups/Wellness/Wellness (2).webp',
      '/assets/marketing/Mockups/Wellness/Wellness (3).webp',
      '/assets/marketing/Mockups/Wellness/Wellness (4).webp',
      '/assets/marketing/Mockups/Wellness/Wellness (1).webp',
    ],
  },
];


// Image preloader hook for smooth transitions
function useImagePreloader(images: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    images.forEach((src) => {
      if (!loadedImages.has(src)) {
        const img = new Image();
        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(src));
        };
        img.src = src;
      }
    });
  }, [images, loadedImages]);

  return loadedImages;
}

// Touch/Swipe hook for mobile gestures
function useSwipeGesture(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50
) {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}

export function DesignShowcase() {
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');

  const autoplayDuration = 5000; // 5 seconds per slide
  const animationDuration = 600; // 600ms transition
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const currentImages = useMemo(() => industries[activeIndustry].images, [activeIndustry]);

  // Preload images for smooth transitions
  useImagePreloader(currentImages);

  // Clamp function for safe index access
  const clampIndex = useCallback((index: number, length: number) => {
    return ((index % length) + length) % length;
  }, []);

  // Navigate with animation
  const navigateToSlide = useCallback((newIndex: number, direction: 'next' | 'prev') => {
    if (isAnimating) return;

    const clampedIndex = clampIndex(newIndex, currentImages.length);
    if (clampedIndex === currentSlide) return;

    setIsAnimating(true);
    setSlideDirection(direction);
    setPreviousSlide(currentSlide);
    setCurrentSlide(clampedIndex);
    setProgress(0);

    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  }, [isAnimating, currentSlide, currentImages.length, clampIndex]);

  const goToPrev = useCallback(() => {
    navigateToSlide(currentSlide - 1, 'prev');
  }, [currentSlide, navigateToSlide]);

  const goToNext = useCallback(() => {
    navigateToSlide(currentSlide + 1, 'next');
  }, [currentSlide, navigateToSlide]);

  const goToSlide = useCallback((index: number) => {
    const direction = index > currentSlide ? 'next' : 'prev';
    navigateToSlide(index, direction);
  }, [currentSlide, navigateToSlide]);

  // Touch gestures
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeGesture(
    goToNext,
    goToPrev
  );

  // Progress bar animation
  useEffect(() => {
    if (isPaused || isLightboxOpen || isAnimating) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    const progressStep = 100 / (autoplayDuration / 50); // Update every 50ms

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + progressStep;
      });
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPaused, isLightboxOpen, isAnimating]);

  // Auto-advance slideshow
  useEffect(() => {
    if (isPaused || isLightboxOpen || isAnimating) {
      if (autoplayRef.current) {
        clearTimeout(autoplayRef.current);
      }
      return;
    }

    autoplayRef.current = setTimeout(() => {
      goToNext();
    }, autoplayDuration);

    return () => {
      if (autoplayRef.current) {
        clearTimeout(autoplayRef.current);
      }
    };
  }, [isPaused, isLightboxOpen, isAnimating, currentSlide, goToNext]);

  // Reset slide when industry changes
  useEffect(() => {
    setCurrentSlide(0);
    setPreviousSlide(0);
    setProgress(0);
    setIsAnimating(false);
  }, [activeIndustry]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext]);

  // Get transform style for sliding animation
  const getSlideTransform = (index: number) => {
    if (!isAnimating) {
      return index === currentSlide ? 'translateX(0)' : 'translateX(100%)';
    }

    if (index === currentSlide) {
      return slideDirection === 'next' ? 'translateX(0)' : 'translateX(0)';
    }
    if (index === previousSlide) {
      return slideDirection === 'next' ? 'translateX(-100%)' : 'translateX(100%)';
    }
    return 'translateX(100%)';
  };

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-purple-50/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-4">
            <span className="text-ethos-navy">Get an Idea of </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              How Our Designs Look
            </span>
          </h2>
          <p className="text-body-large text-ethos-gray max-w-2xl mx-auto">
            Every industry has unique needs. Explore how we craft custom solutions that look stunning and perform flawlessly.
          </p>
        </div>

        {/* Industry Tabs - Using Standard Button Component */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {industries.map((industry, index) => (
            <Button
              key={industry.id}
              variant={activeIndustry === index ? 'ethos' : 'outline'}
              size="default"
              onClick={() => setActiveIndustry(index)}
              aria-pressed={activeIndustry === index}
              className={`transition-all duration-300 ${activeIndustry === index ? 'scale-105 shadow-lg' : 'hover:scale-102'}`}
            >
              {industry.name}
            </Button>
          ))}
        </div>

        {/* Industry Description with smooth transition */}
        <div className="h-8 mb-6 overflow-hidden">
          <p
            key={activeIndustry}
            className="text-center text-gray-500 text-sm animate-fade-slide-up"
          >
            {industries[activeIndustry].description}
          </p>
        </div>

        {/* Slideshow Container */}
        <div
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Progress Bar */}
          <div className="absolute -top-2 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden z-30">
            <div
              className="h-full bg-gradient-to-r from-ethos-purple to-ethos-cyan transition-all duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                opacity: isPaused ? 0.5 : 1
              }}
            />
          </div>

          {/* Main Image Display */}
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-900 shadow-2xl shadow-gray-300/50">
            {/* Glassmorphism overlay frame */}
            <div className="absolute inset-0 pointer-events-none z-10 rounded-2xl border border-white/20" />

            {/* Loading skeleton */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"
                 style={{ backgroundSize: '200% 100%' }} />

            {/* Slides Container */}
            <div className="absolute inset-0">
              {currentImages.map((image, index) => {
                const isActive = index === currentSlide;
                const isPrev = index === previousSlide;
                const shouldRender = isActive || (isAnimating && isPrev);

                if (!shouldRender) return null;

                return (
                  <div
                    key={`${activeIndustry}-${index}`}
                    className="absolute inset-0 will-change-transform"
                    style={{
                      transform: getSlideTransform(index),
                      transition: isAnimating ? `transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
                      zIndex: isActive ? 2 : 1,
                    }}
                  >
                    <img
                      src={image}
                      alt={`${industries[activeIndustry].name} design mockup ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setIsLightboxOpen(true)}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      draggable={false}
                      style={{
                        animation: isActive && !isAnimating ? 'ken-burns 20s ease-in-out infinite' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows with enhanced styling */}
            <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20">
              <button
                onClick={goToPrev}
                disabled={isAnimating}
                className="slide-nav-btn w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-ethos-purple to-ethos-cyan shadow-lg shadow-ethos-purple/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20">
              <button
                onClick={goToNext}
                disabled={isAnimating}
                className="slide-nav-btn w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-ethos-purple to-ethos-cyan shadow-lg shadow-ethos-purple/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-20">
              {/* Play/Pause Button */}
              <button
                onClick={() => setIsPaused((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs sm:text-sm font-medium hover:bg-black/70 transition-all duration-300"
                aria-label={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Play</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                )}
              </button>

              {/* Slide Counter & Fullscreen */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs sm:text-sm font-medium">
                  {currentSlide + 1} / {currentImages.length}
                </span>
                {/* Expand button */}
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-1.5 sm:p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/70 transition-all duration-300"
                  aria-label="Open fullscreen view"
                >
                  <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dot Navigation with animated indicator */}
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-4 sm:mt-6" role="tablist">
            {currentImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                style={{
                  height: '8px',
                  width: currentSlide === index ? '24px' : '8px',
                  minWidth: currentSlide === index ? '24px' : '8px',
                  minHeight: '8px',
                  touchAction: 'manipulation',
                }}
                className={`
                  rounded-full transition-all duration-500 ease-out
                  ${currentSlide === index
                    ? 'bg-gradient-to-r from-ethos-purple to-ethos-cyan'
                    : 'bg-gray-300 hover:bg-gray-400'
                  }
                  disabled:cursor-not-allowed
                `}
                role="tab"
                aria-selected={currentSlide === index}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Thumbnail Strip with smooth scrolling */}
          <div className="relative mt-6">
            <div
              className="flex justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 scroll-smooth hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {currentImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  disabled={isAnimating}
                  className={`
                    flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden
                    transition-all duration-500 ease-out transform
                    ${currentSlide === index
                      ? 'ring-2 ring-ethos-purple ring-offset-2 scale-105 shadow-lg'
                      : 'opacity-60 hover:opacity-100 hover:scale-102'
                    }
                    disabled:cursor-not-allowed
                  `}
                  aria-label={`View slide ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lightbox Modal with smooth animations */}
        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in"
            onClick={() => setIsLightboxOpen(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
          >
            {/* Navigation buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              disabled={isAnimating}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 disabled:opacity-50"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            {/* Image container with animation */}
            <div
              className="relative max-w-[90vw] max-h-[85vh] animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImages[currentSlide]}
                alt={`${industries[activeIndustry].name} design mockup ${currentSlide + 1} - enlarged view`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                draggable={false}
              />

              {/* Lightbox slide counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                {currentSlide + 1} / {currentImages.length}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              disabled={isAnimating}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 disabled:opacity-50"
              aria-label="Next slide"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Thumbnail strip in lightbox */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 overflow-x-auto">
              {currentImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                  disabled={isAnimating}
                  className={`
                    flex-shrink-0 w-12 h-9 rounded overflow-hidden transition-all duration-300
                    ${currentSlide === index
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-50 hover:opacity-100'
                    }
                  `}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inline CSS for animations */}
      <style>{`
        @keyframes ken-burns {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.05) translate(-1%, -1%); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-fade-slide-up {
          animation: fade-slide-up 0.4s ease-out;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        /* Slide Navigation Button Hover Effects */
        .slide-nav-btn {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      filter 0.3s ease,
                      box-shadow 0.3s ease;
        }

        .slide-nav-btn:hover:not(:disabled) {
          transform: scale(1.15);
          filter: brightness(1.15) saturate(1.1);
          box-shadow: 0 10px 35px rgba(139, 92, 246, 0.5), 0 4px 15px rgba(6, 182, 212, 0.3);
        }

        .slide-nav-btn:active:not(:disabled) {
          transform: scale(0.95);
          filter: brightness(0.95);
        }

        /* Override browser touch target minimum sizing for dot indicators */
        [role="tablist"] button {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          padding: 0;
          border: none;
          outline: none;
        }
      `}</style>
    </section>
  );
}
