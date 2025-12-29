import { useEffect, useRef, useState } from 'react';

// Performance metrics interface
interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}
type LayoutShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean };
type FirstInputEntry = PerformanceEntry & { processingStart: number };
type MemoryInfo = { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };


// Lazy loading hook for images
export const useLazyLoading = () => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isIntersecting };
};

// Debounced scroll hook for performance
export const useDebouncedScroll = (callback: () => void, delay: number = 100) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(callback, delay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay]);
};

// Performance monitoring hook
export const usePerformanceMonitoring = (service: string) => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});

  useEffect(() => {
    // Measure Core Web Vitals
    const measurePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;

        setMetrics(prev => ({
          ...prev,
          loadTime
        }));

        // Measure FCP
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          setMetrics(prev => ({
            ...prev,
            firstContentfulPaint: fcpEntry.startTime
          }));
        }

        // Measure LCP using PerformanceObserver
        if ('PerformanceObserver' in window) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            setMetrics(prev => ({
              ...prev,
              largestContentfulPaint: lastEntry.startTime
            }));
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // Measure CLS
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              const e = entry as unknown as LayoutShiftEntry;
              if (!e.hadRecentInput) {
                clsValue += e.value;
              }
            }
            setMetrics(prev => ({
              ...prev,
              cumulativeLayoutShift: clsValue
            }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Measure FID
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const e = entry as unknown as FirstInputEntry;
              setMetrics(prev => ({
                ...prev,
                firstInputDelay: e.processingStart - e.startTime
              }));
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        }
      }
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    return () => {
      window.removeEventListener('load', measurePerformance);
    };
  }, []);

  // Report performance metrics
  useEffect(() => {
    if (Object.keys(metrics).length > 0) {
      // Send to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'performance_metrics', {
          event_category: 'Performance',
          event_label: service,
          custom_parameter_1: metrics.loadTime,
          custom_parameter_2: metrics.firstContentfulPaint,
          custom_parameter_3: metrics.largestContentfulPaint,
          custom_parameter_4: metrics.cumulativeLayoutShift
        });
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Performance Metrics:', metrics);
      }
    }
  }, [metrics, service]);

  return metrics;
};

// Image optimization hook
export const useOptimizedImage = (src: string, alt: string) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { ref, isIntersecting } = useLazyLoading();

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setHasError(true);
        // Fallback to placeholder
        setImageSrc('/assets/images/placeholder.jpg');
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isIntersecting, src]);

  return {
    ref,
    src: imageSrc,
    alt,
    isLoaded,
    hasError,
    isIntersecting
  };
};

// Bundle size monitoring
export const useBundleAnalysis = () => {
  const [bundleInfo, setBundleInfo] = useState<{
    totalSize: number;
    gzippedSize: number;
    chunks: string[];
  } | null>(null);

  useEffect(() => {
    // Analyze loaded resources
    if ('performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      let totalSize = 0;
      const chunks: string[] = [];

      resources.forEach(resource => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          totalSize += resource.transferSize || 0;
          chunks.push(resource.name);
        }
      });

      setBundleInfo({
        totalSize,
        gzippedSize: totalSize * 0.7, // Estimated gzip compression
        chunks
      });
    }
  }, []);

  return bundleInfo;
};

// Memory usage monitoring
export const useMemoryMonitoring = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const mem = (performance as Performance & { memory?: MemoryInfo }).memory;
        if (mem) {
          setMemoryInfo({
            usedJSHeapSize: mem.usedJSHeapSize,
            totalJSHeapSize: mem.totalJSHeapSize,
            jsHeapSizeLimit: mem.jsHeapSizeLimit
          });
        }
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Resource preloading hook
export const useResourcePreloading = (resources: string[]) => {
  useEffect(() => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;

      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
        link.as = 'image';
      }

      document.head.appendChild(link);
    });
  }, [resources]);
};

// Critical CSS inlining utility
export const inlineCriticalCSS = (css: string) => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

// Service Worker registration for caching
export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true);

      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
          setIsRegistered(true);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return { isSupported, isRegistered };
};

// Performance optimization recommendations
export const getPerformanceRecommendations = (metrics: Partial<PerformanceMetrics>) => {
  const recommendations: string[] = [];

  if (metrics.loadTime && metrics.loadTime > 3000) {
    recommendations.push('Consider optimizing images and reducing bundle size');
  }

  if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 2500) {
    recommendations.push('Optimize critical rendering path and inline critical CSS');
  }

  if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 4000) {
    recommendations.push('Optimize largest content elements and consider lazy loading');
  }

  if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
    recommendations.push('Fix layout shifts by setting dimensions for images and ads');
  }

  if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
    recommendations.push('Reduce JavaScript execution time and consider code splitting');
  }

  return recommendations;
};

// Main performance optimization hook
export const usePerformanceOptimization = (service: string) => {
  const metrics = usePerformanceMonitoring(service);
  const bundleInfo = useBundleAnalysis();
  const memoryInfo = useMemoryMonitoring();
  const { isSupported: swSupported, isRegistered: swRegistered } = useServiceWorker();

  const recommendations = getPerformanceRecommendations(metrics);

  return {
    metrics,
    bundleInfo,
    memoryInfo,
    serviceWorker: { isSupported: swSupported, isRegistered: swRegistered },
    recommendations,
    optimizations: {
      useLazyLoading,
      useOptimizedImage,
      useDebouncedScroll,
      useResourcePreloading,
      inlineCriticalCSS
    }
  };
};
