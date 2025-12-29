/* eslint-disable react-refresh/only-export-components */

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
}

/**
 * Optimized Image Component with WebP support, lazy loading, and responsive sizing
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  sizes,
  priority = false,
  quality = 80,
  format = 'auto',
  lazy = true,
  onLoad,
  onError,
  fallback
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized image URLs
  const generateImageUrl = useCallback((originalSrc: string, targetFormat?: string) => {
    // If it's already a data URL or external URL, return as-is
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // For local images, we can add query parameters for optimization
    const url = new URL(originalSrc, window.location.origin);

    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    if (quality !== 80) url.searchParams.set('q', quality.toString());
    if (targetFormat && targetFormat !== 'auto') {
      url.searchParams.set('f', targetFormat);
    }

    return url.toString();
  }, [width, height, quality]);

  // Check WebP support
  const supportsWebP = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }, []);

  // Check AVIF support
  const supportsAVIF = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }, []);

  // Get the best supported format
  const getBestFormat = useCallback(() => {
    if (format !== 'auto') return format;

    if (supportsAVIF()) return 'avif';
    if (supportsWebP()) return 'webp';
    return undefined; // Use original format
  }, [format, supportsAVIF, supportsWebP]);

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback((baseSrc: string, targetFormat?: string) => {
    if (!width) return undefined;

    const breakpoints = [0.5, 1, 1.5, 2]; // Different density ratios
    return breakpoints
      .map(ratio => {
        const scaledWidth = Math.round(width * ratio);
        const url = generateImageUrl(baseSrc, targetFormat);
        const urlObj = new URL(url);
        urlObj.searchParams.set('w', scaledWidth.toString());
        return `${urlObj.toString()} ${ratio}x`;
      })
      .join(', ');
  }, [width, generateImageUrl]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [lazy, priority, isInView]);

  // Update current src when in view
  useEffect(() => {
    if (isInView && !currentSrc) {
      const bestFormat = getBestFormat();
      setCurrentSrc(generateImageUrl(src, bestFormat));
    }
  }, [isInView, currentSrc, src, generateImageUrl, getBestFormat]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);

    // Try fallback if available
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setHasError(false);
      return;
    }

    onError?.();
  }, [fallback, currentSrc, onError]);

  // Generate picture element with multiple formats
  const renderPictureElement = () => {
    const bestFormat = getBestFormat();
    const sources = [];

    // Add AVIF source if supported and not the best format
    if (supportsAVIF() && bestFormat !== 'avif') {
      const avifSrc = generateImageUrl(src, 'avif');
      const avifSrcSet = generateSrcSet(src, 'avif');
      sources.push(
        <source
          key="avif"
          srcSet={avifSrcSet || avifSrc}
          sizes={sizes}
          type="image/avif"
        />
      );
    }

    // Add WebP source if supported and not the best format
    if (supportsWebP() && bestFormat !== 'webp') {
      const webpSrc = generateImageUrl(src, 'webp');
      const webpSrcSet = generateSrcSet(src, 'webp');
      sources.push(
        <source
          key="webp"
          srcSet={webpSrcSet || webpSrc}
          sizes={sizes}
          type="image/webp"
        />
      );
    }

    return (
      <picture>
        {sources}
        <img
          ref={imgRef}
          src={isInView ? currentSrc : placeholder}
          srcSet={isInView ? generateSrcSet(src, bestFormat) : undefined}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </picture>
    );
  };

  // Render placeholder while not in view
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={{ width, height }}
        aria-label={`Loading ${alt}`}
      >
        {placeholder && (
          <img
            src={placeholder}
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
        )}
      </div>
    );
  }

  // Render error state
  if (hasError && !fallback) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {renderPictureElement()}

      {/* Loading overlay */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          {placeholder && (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          )}
        </div>
      )}
    </div>
  );
};

// Hook for preloading images
export const useImagePreloader = () => {
  const preloadImage = useCallback((src: string, format?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;

      // Use optimized URL if format is specified
      if (format) {
        const url = new URL(src, window.location.origin);
        url.searchParams.set('f', format);
        img.src = url.toString();
      } else {
        img.src = src;
      }
    });
  }, []);

  const preloadImages = useCallback(async (sources: string[]): Promise<void> => {
    await Promise.all(sources.map(src => preloadImage(src)));
  }, [preloadImage]);

  return { preloadImage, preloadImages };
};

// Utility function to generate placeholder data URL
export const generatePlaceholder = (width: number, height: number, color = '#e5e7eb'): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }

  return canvas.toDataURL();
};
