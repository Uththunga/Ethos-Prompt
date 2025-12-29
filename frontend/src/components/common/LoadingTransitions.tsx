import React, { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';

interface FadeInProps {
  children: React.ReactNode;
  show?: boolean;
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * Fade in transition component
 */
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  show = true,
  delay = 0,
  duration = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(show);
    }, delay);

    return () => clearTimeout(timer);
  }, [show, delay]);

  return (
    <Transition
      show={isVisible}
      enter={`transition-opacity duration-${duration}`}
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave={`transition-opacity duration-${duration}`}
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      className={className}
    >
      {children}
    </Transition>
  );
};

/**
 * Slide up transition component
 */
export const SlideUp: React.FC<FadeInProps> = ({
  children,
  show = true,
  delay = 0,
  duration = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(show);
    }, delay);

    return () => clearTimeout(timer);
  }, [show, delay]);

  return (
    <Transition
      show={isVisible}
      enter={`transition-all duration-${duration}`}
      enterFrom="opacity-0 transform translate-y-4"
      enterTo="opacity-100 transform translate-y-0"
      leave={`transition-all duration-${duration}`}
      leaveFrom="opacity-100 transform translate-y-0"
      leaveTo="opacity-0 transform translate-y-4"
      className={className}
    >
      {children}
    </Transition>
  );
};

/**
 * Scale in transition component
 */
export const ScaleIn: React.FC<FadeInProps> = ({
  children,
  show = true,
  delay = 0,
  duration = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(show);
    }, delay);

    return () => clearTimeout(timer);
  }, [show, delay]);

  return (
    <Transition
      show={isVisible}
      enter={`transition-all duration-${duration}`}
      enterFrom="opacity-0 transform scale-95"
      enterTo="opacity-100 transform scale-100"
      leave={`transition-all duration-${duration}`}
      leaveFrom="opacity-100 transform scale-100"
      leaveTo="opacity-0 transform scale-95"
      className={className}
    >
      {children}
    </Transition>
  );
};

/**
 * Staggered list animation
 */
export const StaggeredList: React.FC<{
  children: React.ReactNode[];
  show?: boolean;
  staggerDelay?: number;
  className?: string;
}> = ({ children, show = true, staggerDelay = 100, className = '' }) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn
          key={index}
          show={show}
          delay={index * staggerDelay}
          duration={300}
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

/**
 * Loading spinner with smooth transitions
 */
export const SmoothSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}> = ({ size = 'md', color = 'ethos-purple', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-200 border-t-${color} ${sizeClasses[size]}`}
        style={{
          animation: 'spin 1s linear infinite'
        }}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

/**
 * Progress bar with smooth animation
 */
export const ProgressBar: React.FC<{
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  className?: string;
}> = ({
  progress,
  height = 4,
  color = 'bg-blue-500',
  backgroundColor = 'bg-gray-200',
  animated = true,
  className = ''
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animated]);

  return (
    <div className={`w-full ${backgroundColor} rounded-full overflow-hidden ${className}`} style={{ height }}>
      <div
        className={`h-full ${color} transition-all duration-500 ease-out rounded-full`}
        style={{ width: `${Math.min(100, Math.max(0, animatedProgress))}%` }}
      />
    </div>
  );
};

/**
 * Shimmer effect for loading states
 */
export const Shimmer: React.FC<{
  width?: string | number;
  height?: string | number;
  className?: string;
}> = ({ width = '100%', height = '1rem', className = '' }) => {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

/**
 * Page transition wrapper
 */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  show?: boolean;
  type?: 'fade' | 'slide' | 'scale';
}> = ({ children, show = true, type = 'fade' }) => {
  const transitions = {
    fade: {
      enter: "transition-opacity duration-300",
      enterFrom: "opacity-0",
      enterTo: "opacity-100",
      leave: "transition-opacity duration-300",
      leaveFrom: "opacity-100",
      leaveTo: "opacity-0"
    },
    slide: {
      enter: "transition-all duration-300",
      enterFrom: "opacity-0 transform translate-x-4",
      enterTo: "opacity-100 transform translate-x-0",
      leave: "transition-all duration-300",
      leaveFrom: "opacity-100 transform translate-x-0",
      leaveTo: "opacity-0 transform -translate-x-4"
    },
    scale: {
      enter: "transition-all duration-300",
      enterFrom: "opacity-0 transform scale-95",
      enterTo: "opacity-100 transform scale-100",
      leave: "transition-all duration-300",
      leaveFrom: "opacity-100 transform scale-100",
      leaveTo: "opacity-0 transform scale-95"
    }
  };

  const transition = transitions[type];

  return (
    <Transition
      show={show}
      enter={transition.enter}
      enterFrom={transition.enterFrom}
      enterTo={transition.enterTo}
      leave={transition.leave}
      leaveFrom={transition.leaveFrom}
      leaveTo={transition.leaveTo}
    >
      {children}
    </Transition>
  );
};

/**
 * Loading overlay with smooth transitions
 */
export const LoadingOverlay: React.FC<{
  show: boolean;
  message?: string;
  progress?: number;
  className?: string;
}> = ({ show, message = 'Loading...', progress, className = '' }) => {
  return (
    <Transition
      show={show}
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg border border-gray-200">
          <div className="text-center">
            <SmoothSpinner size="lg" className="mb-4" />
            <p className="text-ethos-navy mb-4">{message}</p>
            {typeof progress === 'number' && (
              <ProgressBar progress={progress} animated />
            )}
          </div>
        </div>
      </div>
    </Transition>
  );
};

/**
 * Content placeholder with animation
 */
export const ContentPlaceholder: React.FC<{
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ lines = 3, showAvatar = false, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        {showAvatar && (
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
        )}
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>

      <div >
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 bg-gray-300 rounded"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
};
