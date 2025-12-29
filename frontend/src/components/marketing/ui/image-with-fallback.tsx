/* eslint-disable react-refresh/only-export-components */

import { Building2, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className?: string;
  fallbackType?: 'avatar' | 'logo' | 'generic';
  fallbackText?: string;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  srcSet,
  sizes = '100vw',
  alt,
  className = '',
  fallbackType = 'generic',
  fallbackText,
  onError,
  onLoad,
  width,
  height,
  style,
  loading = 'lazy',
  fetchpriority = 'auto',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
  }, [src]);

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    setIsLoading(false);
    if (onError) {
      onError(event);
    }
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    if (onLoad) {
      onLoad(event);
    }
  };

  const generatePlaceholderUrl = (text: string, type: 'avatar' | 'logo' | 'generic') => {
    const encodedText = encodeURIComponent(text);
    let size: string;
    let bgColor: string;
    let textColor: string;

    switch (type) {
      case 'avatar':
        size = '150x150';
        bgColor = '6366f1';
        textColor = 'ffffff';
        break;
      case 'logo':
        size = '200x100';
        bgColor = 'f3f4f6';
        textColor = '374151';
        break;
      default:
        size = '300x200';
        bgColor = 'e5e7eb';
        textColor = '6b7280';
        break;
    }

    return `https://via.placeholder.com/${size}/${bgColor}/${textColor}?text=${encodedText}`;
  };

  const renderFallback = () => {
    const baseClasses = `flex items-center justify-center bg-gray-100 ${className}`;

    if (fallbackType === 'avatar') {
      return (
        <div className={`${baseClasses} rounded-full`}>
          <User className="w-1/3 h-1/3 text-gray-400" />
        </div>
      );
    }

    if (fallbackType === 'logo') {
      return (
        <div className={`${baseClasses} rounded-lg border border-gray-200`}>
          <Building2 className="w-1/3 h-1/3 text-gray-400" />
        </div>
      );
    }

    return (
      <div className={`${baseClasses} rounded-lg border border-gray-200`}>
        <div className="text-center p-4">
          <div className="text-gray-400 text-sm">Image not available</div>
          {fallbackText && <div className="text-gray-600 text-xs mt-1">{fallbackText}</div>}
        </div>
      </div>
    );
  };

  // If we have fallback text and the image failed, try to use a placeholder service
  if (imageError && fallbackText) {
    return (
      <img
        src={generatePlaceholderUrl(fallbackText, fallbackType)}
        alt={alt}
        className={className}
        width={width}
        height={height}
        style={style}
        loading={loading}
        onError={() => {
          // If even the placeholder fails, show the fallback component
          setImageError(true);
        }}
      />
    );
  }

  if (imageError) {
    return renderFallback();
  }

  return (
    <>
      {isLoading && (
        <div
          className={className}
          style={{
            width: width ? `${width}px` : undefined,
            height: height ? `${height}px` : undefined,
            aspectRatio: width && height ? `${width}/${height}` : undefined,
            backgroundColor: 'transparent',
            ...style,
          }}
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={`${className} ${isLoading ? 'absolute inset-0 opacity-0' : ''}`}
        width={width}
        height={height}
        style={style}
        loading={loading}
        fetchpriority={fetchpriority}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </>
  );
};

// Specific components for common use cases
export const TestimonialAvatar: React.FC<{
  src: string;
  name: string;
  className?: string;
}> = ({ src, name, className = 'w-16 h-16' }) => {
  return (
    <ImageWithFallback
      src={src}
      alt={`${name} profile picture`}
      className={`${className} rounded-full object-cover`}
      fallbackType="avatar"
      fallbackText={name
        .split(' ')
        .map((n) => n[0])
        .join('')}
    />
  );
};

export const ClientLogo: React.FC<{
  src: string;
  name: string;
  className?: string;
}> = ({ src, name, className = 'h-12 w-auto' }) => {
  return (
    <ImageWithFallback
      src={src}
      alt={`${name} logo`}
      className={`${className} object-contain`}
      fallbackType="logo"
      fallbackText={name}
    />
  );
};

export const ServiceImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = 'w-full h-64' }) => {
  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      className={`${className} object-cover rounded-lg`}
      fallbackType="generic"
      fallbackText={alt}
    />
  );
};

// Hook to preload images and check if they exist
export const useImagePreloader = (imageSources: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const preloadImage = (src: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });

  useEffect(() => {
    const preloadAllImages = async () => {
      setIsLoading(true);
      const loaded = new Set<string>();
      const failed = new Set<string>();

      await Promise.allSettled(
        imageSources.map(async (src) => {
          try {
            await preloadImage(src);
            loaded.add(src);
          } catch {
            failed.add(src);
          }
        })
      );

      setLoadedImages(loaded);
      setFailedImages(failed);
      setIsLoading(false);
    };

    if (imageSources.length > 0) {
      preloadAllImages();
    } else {
      setIsLoading(false);
    }
  }, [imageSources]);

  return { loadedImages, failedImages, isLoading };
};
