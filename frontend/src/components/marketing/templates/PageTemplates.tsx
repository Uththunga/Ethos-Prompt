/* eslint-disable react-refresh/only-export-components */

import { Footer } from '@/components/marketing/layout/Footer';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { HeroSection, SectionContainer, SectionHeader } from '@/components/marketing/templates/SectionTemplates';
import React, { type ReactNode } from 'react';

// =============================================================================
// BASE PAGE LAYOUT
// =============================================================================

interface BasePageLayoutProps {
  children: ReactNode;
  className?: string;
  showNavigation?: boolean;
  showFooter?: boolean;
}

export const BasePageLayout: React.FC<BasePageLayoutProps> = ({
  children,
  className = '',
  showNavigation = true,
  showFooter = true
}) => {
  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {showNavigation && <Navigation />}
      <main id="main-content" role="main" aria-label="Main content">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

// =============================================================================
// HERO PAGE TEMPLATE
// =============================================================================

interface HeroPageTemplateProps {
  heroTitle: string;
  heroTitleAccent?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
  heroOverlayImageSrc?: string;
  heroOverlayImageAlt?: string;
  heroStats?: Array<{
    value: string;
    title: string;
    description: string;
  }>;
  children: ReactNode;
  showStats?: boolean;
}

export const HeroPageTemplate: React.FC<HeroPageTemplateProps> = ({
  heroTitle,
  heroTitleAccent,
  heroImageSrc,
  heroImageAlt,
  heroOverlayImageSrc,
  heroOverlayImageAlt,
  heroStats = [],
  children,
  showStats = false
}) => {
  return (
    <BasePageLayout>
      {/* Hero Section */}
      <HeroSection
        title={heroTitle}
        titleAccent={heroTitleAccent}
        imageSrc={heroImageSrc}
        imageAlt={heroImageAlt}
        overlayImageSrc={heroOverlayImageSrc}
        overlayImageAlt={heroOverlayImageAlt}
        showStats={showStats}
        stats={heroStats}
      />

      {/* Page Content */}
      {children}
    </BasePageLayout>
  );
};

// =============================================================================
// STANDARD PAGE TEMPLATE
// =============================================================================

interface StandardPageTemplateProps {
  pageTitle?: string;
  pageTitleAccent?: string;
  pageSubtitle?: string;
  headerBackground?: 'white' | 'gray' | 'gradient-ways' | 'gradient-testimonials';
  children: ReactNode;
  showHeader?: boolean;
}

export const StandardPageTemplate: React.FC<StandardPageTemplateProps> = ({
  pageTitle,
  pageTitleAccent,
  pageSubtitle,
  headerBackground = 'white',
  children,
  showHeader = true
}) => {
  return (
    <BasePageLayout>
      {/* Page Header */}
      {showHeader && (pageTitle || pageTitleAccent) && (
        <SectionContainer background={headerBackground} padding="large">
          <SectionHeader
            title={pageTitle || ''}
            titleAccent={pageTitleAccent}
            subtitle={pageSubtitle}
            alignment="center"
          />
        </SectionContainer>
      )}

      {/* Page Content */}
      {children}
    </BasePageLayout>
  );
};

// =============================================================================
// CONTENT PAGE TEMPLATE (with sidebar-like layout)
// =============================================================================

interface ContentPageTemplateProps {
  pageTitle: string;
  pageSubtitle?: string;
  sidebar?: ReactNode;
  children: ReactNode;
  sidebarPosition?: 'left' | 'right';
  contentRatio?: string;
}

export const ContentPageTemplate: React.FC<ContentPageTemplateProps> = ({
  pageTitle,
  pageSubtitle,
  sidebar,
  children,
  sidebarPosition = 'right',
  contentRatio = 'lg:grid-cols-[1fr_300px]'
}) => {
  const gridOrder = sidebarPosition === 'left'
    ? { content: 'lg:order-2', sidebar: 'lg:order-1' }
    : { content: 'lg:order-1', sidebar: 'lg:order-2' };

  return (
    <StandardPageTemplate
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
    >
      <SectionContainer padding="large">
        <div className={`grid grid-cols-1 ${contentRatio} gap-8 lg:gap-12`}>
          <div className={gridOrder.content}>
            {children}
          </div>
          {sidebar && (
            <div className={gridOrder.sidebar}>
              {sidebar}
            </div>
          )}
        </div>
      </SectionContainer>
    </StandardPageTemplate>
  );
};

// =============================================================================
// SECTION-BASED PAGE TEMPLATE
// =============================================================================

interface Section {
  id?: string;
  background?: 'white' | 'gray' | 'gradient-ways' | 'gradient-testimonials';
  padding?: 'standard' | 'large' | 'hero';
  content: ReactNode;
}

interface SectionBasedPageTemplateProps {
  pageTitle?: string;
  pageTitleAccent?: string;
  pageSubtitle?: string;
  sections: Section[];
  showHeader?: boolean;
}

export const SectionBasedPageTemplate: React.FC<SectionBasedPageTemplateProps> = ({
  pageTitle,
  pageTitleAccent,
  pageSubtitle,
  sections,
  showHeader = true
}) => {
  return (
    <BasePageLayout>
      {/* Page Header */}
      {showHeader && (pageTitle || pageTitleAccent) && (
        <SectionContainer background="white" padding="large">
          <SectionHeader
            title={pageTitle || ''}
            titleAccent={pageTitleAccent}
            subtitle={pageSubtitle}
            alignment="center"
          />
        </SectionContainer>
      )}

      {/* Sections */}
      {sections.map((section, index) => (
        <SectionContainer
          key={section.id || index}
          id={section.id}
          background={section.background}
          padding={section.padding}
        >
          {section.content}
        </SectionContainer>
      ))}
    </BasePageLayout>
  );
};

// =============================================================================
// LANDING PAGE TEMPLATE
// =============================================================================

interface LandingPageSection {
  id?: string;
  background?: 'white' | 'gray' | 'gradient-ways' | 'gradient-testimonials';
  padding?: 'standard' | 'large' | 'hero';
  content: ReactNode;
}

interface LandingPageTemplateProps {
  heroTitle: string;
  heroTitleAccent?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
  heroOverlayImageSrc?: string;
  heroOverlayImageAlt?: string;
  heroStats?: Array<{
    value: string;
    title: string;
    description: string;
  }>;
  sections: LandingPageSection[];
  showHeroStats?: boolean;
}

export const LandingPageTemplate: React.FC<LandingPageTemplateProps> = ({
  heroTitle,
  heroTitleAccent,
  heroImageSrc,
  heroImageAlt,
  heroOverlayImageSrc,
  heroOverlayImageAlt,
  heroStats = [],
  sections,
  showHeroStats = false
}) => {
  return (
    <BasePageLayout>
      {/* Hero Section */}
      <HeroSection
        title={heroTitle}
        titleAccent={heroTitleAccent}
        imageSrc={heroImageSrc}
        imageAlt={heroImageAlt}
        overlayImageSrc={heroOverlayImageSrc}
        overlayImageAlt={heroOverlayImageAlt}
        showStats={showHeroStats}
        stats={heroStats}
      />

      {/* Content Sections */}
      {sections.map((section, index) => (
        <SectionContainer
          key={section.id || index}
          id={section.id}
          background={section.background}
          padding={section.padding}
        >
          {section.content}
        </SectionContainer>
      ))}
    </BasePageLayout>
  );
};

// =============================================================================
// FEATURE PAGE TEMPLATE (for feature-rich pages)
// =============================================================================

interface FeatureSection {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  features: Array<{
    number?: number;
    title: string;
    description: string;
  }>;
  imageSrc?: string;
  imageAlt?: string;
  imageAnimation?: boolean;
  reverse?: boolean;
  background?: 'white' | 'gray' | 'gradient-ways' | 'gradient-testimonials';
}

interface FeaturePageTemplateProps {
  pageTitle: string;
  pageTitleAccent?: string;
  pageSubtitle?: string;
  featureSections: FeatureSection[];
  ctaSection?: {
    title: string;
    buttonText: string;
    onButtonClick?: () => void;
    buttonHref?: string;
  };
}

export const FeaturePageTemplate: React.FC<FeaturePageTemplateProps> = ({
  pageTitle,
  pageTitleAccent,
  pageSubtitle,
  featureSections,
  ctaSection
}) => {
  return (
    <StandardPageTemplate
      pageTitle={pageTitle}
      pageTitleAccent={pageTitleAccent}
      pageSubtitle={pageSubtitle}
    >
      {featureSections.map((section, index) => (
        <SectionContainer
          key={index}
          background={section.background || 'white'}
          padding="large"
        >
          {section.imageSrc ? (
            // Content with image layout
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 ${section.reverse ? 'lg:flex-row-reverse' : ''}`}>
              <div className={section.reverse ? 'lg:order-2' : 'lg:order-1'}>
                <img
                  src={section.imageSrc}
                  alt={section.imageAlt || ''}
                  className={`w-full h-auto object-contain ${section.imageAnimation ? 'animate-float-mole' : ''}`}
                />
              </div>
              <div className={`flex flex-col justify-center sm:lg:${section.reverse ? 'lg:order-1' : 'lg:order-2'}`}>
                <SectionHeader
                  title={section.title}
                  titleAccent={section.titleAccent}
                  subtitle={section.subtitle}
                  alignment="left"
                />
                <div className="sm:lg:">
                  {section.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-6">
                      {feature.number && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm lg:text-base bg-ethos-purple">
                          {feature.number}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base lg:text-lg font-medium text-ethos-navy mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-sm lg:text-base text-ethos-gray leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Text-only layout
            <div className="max-w-4xl mx-auto">
              <SectionHeader
                title={section.title}
                titleAccent={section.titleAccent}
                subtitle={section.subtitle}
                alignment="center"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {section.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-4">
                    {feature.number && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm bg-ethos-purple">
                        {feature.number}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base lg:text-lg font-medium text-ethos-navy mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm lg:text-base text-ethos-gray leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionContainer>
      ))}

      {/* CTA Section */}
      {ctaSection && (
        <SectionContainer background="white" padding="large">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-normal leading-snug tracking-tight mb-8 sm:mb-10 lg:mb-12 text-ethos-gray">
              {ctaSection.title}
            </h3>
            <div className="flex justify-center">
              <button
                className="bg-ethos-purple-light hover:bg-ethos-purple text-white rounded-full font-medium transition-colors duration-300 h-auto px-8 lg:px-12 py-3 lg:py-4 text-base sm:text-lg lg:text-xl"
                onClick={ctaSection.onButtonClick}
              >
                {ctaSection.buttonText}
              </button>
            </div>
          </div>
        </SectionContainer>
      )}
    </StandardPageTemplate>
  );
};

// =============================================================================
// UTILITY FUNCTIONS FOR PAGE TEMPLATES
// =============================================================================

export const createSection = (
  content: ReactNode,
  options?: {
    id?: string;
    background?: 'white' | 'gray' | 'gradient-ways' | 'gradient-testimonials';
    padding?: 'standard' | 'large' | 'hero';
  }
): Section => ({
  content,
  ...options
});

export const createFeatureSection = (
  title: string,
  features: Array<{ number?: number; title: string; description: string }>,
  options?: {
    titleAccent?: string;
    subtitle?: string;
    imageSrc?: string;
    imageAlt?: string;
    imageAnimation?: boolean;
    reverse?: boolean;
    background?: 'white' | 'gray' | 'gradient-ways' | 'gradient-testimonials';
  }
): FeatureSection => ({
  title,
  features,
  ...options
});
