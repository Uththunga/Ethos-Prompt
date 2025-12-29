/* eslint-disable react-refresh/only-export-components */

import { Button } from '@/components/marketing/ui/button';
import { ChevronUp, MessageCircle, Phone, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface StickyMobileCTAProps {
  primaryText: string;
  primaryLink: string;
  secondaryText?: string;
  secondaryLink?: string;
  phoneNumber?: string;
  service:
    | 'ai-solutions'
    | 'system-integration'
    | 'web-mobile'
    | 'digital-transformation'
    | 'smart-assistant'
    | 'digital-solutions';
  showAfterScroll?: number; // Show after scrolling X pixels
}

const serviceColors = {
  'ai-solutions': 'bg-ethos-purple hover:bg-ethos-purple/90',
  'system-integration': 'bg-ethos-navy hover:bg-ethos-navy/90',
  'web-mobile':
    'bg-gradient-to-r from-ethos-purple to-ethos-navy hover:from-ethos-purple/90 hover:to-ethos-navy/90',
  'digital-transformation': 'bg-red-600 hover:bg-red-700',
  'smart-assistant': 'bg-ethos-purple hover:bg-ethos-purple/90',
  'digital-solutions':
    'bg-gradient-to-r from-ethos-purple to-ethos-navy hover:from-ethos-purple/90 hover:to-ethos-navy/90',
};

export const StickyMobileCTA: React.FC<StickyMobileCTAProps> = ({
  primaryText,
  primaryLink,
  secondaryText,
  secondaryLink,
  phoneNumber = '+1 (555) 123-4567',
  service,
  showAfterScroll = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setIsVisible(scrolled > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

  const handlePrimaryClick = () => {
    // Track CTA click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sticky_cta_click', {
        event_category: 'conversion',
        event_label: service,
        service_type: service,
      });
    }
  };

  const handleSecondaryClick = () => {
    // Track secondary CTA click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sticky_cta_secondary_click', {
        event_category: 'engagement',
        event_label: service,
        service_type: service,
      });
    }
  };

  const handlePhoneClick = () => {
    // Track phone click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'phone_click', {
        event_category: 'conversion',
        event_label: service,
        service_type: service,
      });
    }
  };

  if (!isVisible || isMinimized) {
    return isMinimized ? (
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 rounded-full bg-ethos-purple hover:bg-ethos-purple/90 text-white shadow-lg touch-manipulation"
          aria-label="Show contact options"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      </div>
    ) : null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop for expanded state */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Main CTA Bar */}
      <div className="relative bg-white border-t border-gray-200 shadow-lg">
        {/* Expanded Options */}
        {isExpanded && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="p-4 flex flex-col gap-3">
              {/* Phone Option */}
              <a
                href={`tel:${phoneNumber}`}
                onClick={handlePhoneClick}
                className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors min-h-[48px] touch-manipulation"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Call Now</div>
                  <div className="text-sm text-gray-600">{phoneNumber}</div>
                </div>
              </a>

              {/* Secondary CTA */}
              {secondaryText && secondaryLink && (
                <Link
                  to={secondaryLink}
                  onClick={handleSecondaryClick}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors min-h-[48px] touch-manipulation"
                >
                  <div className="w-10 h-10 bg-ethos-purple/10 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-ethos-purple" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{secondaryText}</div>
                    <div className="text-sm text-gray-600">Get instant answers</div>
                  </div>
                </Link>
              )}

              {/* Minimize Option */}
              <button
                onClick={() => setIsMinimized(true)}
                className="w-full text-center text-sm text-gray-500 py-2"
              >
                Hide for now
              </button>
            </div>
          </div>
        )}

        {/* Main CTA Content */}
        <div className="flex items-center p-3">
          {/* Primary CTA Button */}
          <Link to={primaryLink} className="flex-1 mr-3" onClick={handlePrimaryClick}>
            <Button
              variant="ethos"
              className={`w-full h-14 text-white font-semibold text-base ${serviceColors[service]} rounded-full touch-manipulation`}
              size="lg"
            >
              {primaryText}
            </Button>
          </Link>

          {/* More Options Button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            className="w-14 h-14 border-2 border-gray-300 hover:border-ethos-purple hover:bg-ethos-purple/5 touch-manipulation"
            aria-label="More contact options"
          >
            {isExpanded ? (
              <X className="w-5 h-5" />
            ) : (
              <div className="flex flex-col.5">
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Hook to manage sticky CTA visibility and behavior
export const useStickyMobileCTA = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrolled / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollProgress };
};

// Service-specific CTA configurations
export const getServiceCTAConfig = (service: string) => {
  const configs = {
    'system-integration': {
      primaryText: 'Free Integration Audit',
      primaryLink: '/contact?source=integration-mobile',
      secondaryText: 'View Integrations',
      secondaryLink: '/contact?source=integration-info-mobile',
      service: 'system-integration' as const,
    },
    'web-mobile': {
      primaryText: 'Get Mobile Audit',
      primaryLink: '/contact?source=mobile-audit',
      secondaryText: 'View Portfolio',
      secondaryLink: '/contact?source=portfolio-mobile',
      service: 'web-mobile' as const,
    },
    'digital-transformation': {
      primaryText: 'Free Security Scan',
      primaryLink: '/contact?source=security-scan-mobile',
      secondaryText: 'Migration Guide',
      secondaryLink: '/contact?source=migration-mobile',
      service: 'digital-transformation' as const,
    },
    'smart-assistant': {
      primaryText: 'Get Free ROI Report',
      primaryLink: '/contact?source=smart-assistant-mobile',
      secondaryText: 'View Demo',
      secondaryLink: '/services/smart-assistant#demo',
      service: 'smart-assistant' as const,
    },
    'digital-solutions': {
      primaryText: 'Get Free Assessment',
      primaryLink: '/contact?source=digital-solutions-mobile',
      secondaryText: 'Calculate ROI',
      secondaryLink: '#roi-calculator',
      service: 'digital-solutions' as const,
    },
  };

  return (
    configs[service as keyof typeof configs] || {
      primaryText: 'Get Free Consultation',
      primaryLink: '/contact?source=ai-solutions-mobile',
      secondaryText: 'Learn More',
      secondaryLink: '/solutions',
      service: 'ai-solutions' as const,
    }
  );
};
