/* eslint-disable react-refresh/only-export-components */

import React, { useEffect, useRef, useState } from 'react';
import { Skeleton } from './SkeletonLoader';

interface ProgressiveImageProps {
  src: string;
  placeholderSrc?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  blur?: boolean;

}

/**
 * Progressive image loading component with blur-up effect
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholderSrc,
  alt,
  width,
  height,
  className = '',
  onLoad,
  onError,
  lazy = true,
  blur = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate low-quality placeholder if not provided
  const generatePlaceholder = (): string => {
    if (placeholderSrc) return placeholderSrc;

    // For demo purposes, create a simple placeholder
    // In production, you'd generate actual low-quality images
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, 20, 20);
    }
    return canvas.toDataURL();
  };

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

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
        rootMargin: '50px',
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
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const placeholder = generatePlaceholder(src);

  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 dark:bg-gray-700 ${className}`}
        style={{ width, height }}
      >
        <Skeleton width="100%" height="100%" variant="rectangular" />
      </div>
    );
  }

  if (hasError) {
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
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder image with blur effect */}
      {!isLoaded && (
        <img
          src={placeholder}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            blur ? 'filter blur-sm' : ''
          }`}
          style={{ opacity: isLoaded ? 0 : 1 }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethos-purple"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Progressive background image component
 */
export const ProgressiveBackgroundImage: React.FC<{
  src: string;
  placeholderSrc?: string;
  children?: React.ReactNode;
  className?: string;
  lazy?: boolean;
}> = ({ src, placeholderSrc, children, className = '', lazy = true }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.src = src;
  }, [isInView, src]);

  const backgroundImage = isLoaded ? src : placeholderSrc;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: !isLoaded && placeholderSrc ? 'blur(4px)' : undefined,
        transition: 'filter 0.3s ease-in-out'
      }}
    >
      {children}

      {!isLoaded && isInView && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
    </div>
  );
};

/**
 * Image gallery with progressive loading
 */
export const ProgressiveImageGallery: React.FC<{
  images: Array<{ src: string; alt: string; placeholder?: string }>;
  columns?: number;
  gap?: number;
  className?: string;
}> = ({ images, columns = 3, gap = 4, className = '' }) => {
  return (
    <div
      className={`grid gap-${gap} ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {images.map((image, index) => (
        <ProgressiveImage
          key={index}
          src={image.src}
          placeholderSrc={image.placeholder}
          alt={image.alt}
          className="w-full h-48 rounded-lg"
          lazy={true}
        />
      ))}
    </div>
  );
};

/**
 * Hook for progressive image loading
 */
export const useProgressiveImage = (src: string, placeholderSrc?: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setIsLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoaded(false);
    };

    img.src = src;
  }, [src]);

  return {
    src: isLoaded ? src : placeholderSrc,
    isLoaded,
    hasError
  };
};
