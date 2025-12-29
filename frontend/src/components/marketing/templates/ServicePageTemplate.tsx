import React, { memo } from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';
import { Button } from '@/components/marketing/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface ServicePageTemplateProps {
  // Hero Section
  heroTitle: React.ReactNode;
  heroSubtitle: string;
  heroDescription: React.ReactNode;
  heroImage?: string | React.ReactNode;
  heroImageDefault?: string; // Add default image prop
  heroImageAlt?: string;
  heroImageClassName?: string;
  showHeroCTA?: boolean; // Set to true to show the CTA button
  heroCTA?: {
    text: string;
    link: string;
  };

  // Problem Statement Section (optional)
  problemTitle?: React.ReactNode;
  problemDescription?: string;
  problemPoints?: Array<{
    icon: React.ReactNode;
    text: string;
  }>;

  // Solution Section
  solutionTitle: React.ReactNode;
  solutionDescription: string;
  solutionFeatures: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient?: string;
  }>;

  // Proof/Evidence Section
  proofTitle: React.ReactNode;
  proofDescription: string;
  proofItems: Array<{
    title?: string;
    metric: string;
    metricLabel?: string;
    description: string;
    icon: React.ReactNode;
    bgColor?: string;
    gradient?: string;
    iconBg?: string;
    stats?: Array<{ label: string; value: string }>;
  }>;

  // CTA Section
  ctaTitle?: React.ReactNode;
  ctaDescription?: React.ReactNode;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaSection?: React.ReactNode;

  // Additional content to be rendered after the main template sections but before footer
  additionalContent?: React.ReactNode;
}

export const ServicePageTemplate = memo(function ServicePageTemplate({
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroImage = 'assets/marketing/images/digitaltransformation.png',
  heroImageAlt = 'Digital Transformation',
  heroImageClassName,
  showHeroCTA = false, // Default to false to hide the button on all service pages
  heroCTA,
  problemTitle,
  ctaSection,
  problemDescription,
  problemPoints,
  solutionTitle,
  solutionDescription,
  solutionFeatures,
  proofTitle,
  proofDescription,
  proofItems,
  ctaTitle,
  ctaDescription,
  ctaButtonText,
  ctaButtonLink = '/contact',
  additionalContent,
}: ServicePageTemplateProps) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const withBase = (path: string) => {
    // If it's already an absolute URL or starts with /, return as is
    if (path.startsWith('http') || path.startsWith('//') || path.startsWith('/')) {
      return path.startsWith('/') ? `${path}` : path;
    }
    // Otherwise, prepend the base URL
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${base}${path.replace(/^\/+/, '')}`;
  };


  // Add shine animation style for gradient text effects
  const animationStyle = `
    @keyframes shine {
      to {
        background-position: 200% center;
      }
    }

    @keyframes border-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .animate-border-shine {
      position: relative;
      z-index: 0;
      overflow: hidden;
    }

    .animate-border-shine::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: -100%;
      width: 300%;
      height: 300%;
      top: -100%;
      left: -100%;
      background: conic-gradient(
        from 0deg,
        rgba(99, 102, 241, 0.1),
        rgba(56, 189, 248, 0.2),
        rgba(124, 58, 237, 0.3),
        rgba(96, 165, 250, 0.4),
        rgba(139, 92, 246, 0.5),
        rgba(167, 139, 250, 0.4),
        transparent 180deg,
        rgba(99, 102, 241, 0.1),
        rgba(56, 189, 248, 0.2),
        rgba(124, 58, 237, 0.3),
        rgba(96, 165, 250, 0.4),
        rgba(139, 92, 246, 0.5),
        rgba(167, 139, 250, 0.4),
        transparent 360deg
      );
      animation: border-spin 4s linear infinite;
    }

    .animate-border-shine::after {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 1.5px;
      background: #F8F4FF;
      border-radius: 9999px;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyle }} />
      <div className="min-h-screen bg-white">
        <Navigation />
        <main role="main" id="main-content" className="font-sans antialiased">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden bg-gradient-to-b from-[#FEFEFE] to-[#FEFEFE] pt-16 lg:pt-20 pb-8"
          aria-labelledby="service-hero-heading"
        >
          <div className="container-standard relative z-10">
            <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-2 sm:gap-4 items-start mb-8 lg:mb-12">
              {/* Left Column - Content */}
              <div className="sm:relative z-10">
                <header className="sm:">
                  <div className="mb-2 sm:mb-4">
                    <span className="inline-block px-4 py-2 text-ethos-purple text-body-small font-medium rounded-full animate-border-shine">
                      <span className="relative z-10">{heroSubtitle}</span>
                    </span>
                  </div>
                  <h1
                    id="service-hero-heading"
                    className="text-display-2xl font-semibold font-poppins"
                  >
                    {heroTitle}
                  </h1>
                </header>
                <div className="text-ethos-gray text-body-large font-light leading-relaxed tracking-normal max-w-3xl px-2 sm:px-0 pt-2 sm:pt-0">
                  {typeof heroDescription === 'string' ? (
                    <div dangerouslySetInnerHTML={{ __html: heroDescription }} />
                  ) : (
                    <div>{heroDescription}</div>
                  )}
                </div>
                {showHeroCTA && (
                  <div className="pt-4">
                    <Link to={ctaButtonLink} className="inline-block">
                      <Button
                        variant="ethos"
                        size="lg"
                        className="px-6 py-4 sm:px-8 sm:py-6 text-button-default font-medium rounded-full group whitespace-normal sm:whitespace-nowrap"
                        aria-label="Request a Consultation"
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          {heroCTA?.text || 'Request a Consultation'}
                        </span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Column - Image */}
              {heroImage && (
                <div
                  className="relative w-full lg:w-[140%] lg:-mr-[5%] text-right z-0 ml-auto"
                >
                  {typeof heroImage === 'string' ? (
                    <img
                      src={withBase(heroImage)}
                      alt={heroImageAlt || 'Service illustration'}
                      className={`${heroImageClassName || 'w-full h-auto max-h-[400px] sm:max-h-[500px] md:max-h-[550px] lg:max-h-[600px] xl:max-h-[650px] max-w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl'} mx-auto object-contain mix-blend-multiply`}
                      loading="eager"
                      decoding="async"
                      style={{ background: 'transparent' }}
                    />
                  ) : (
                    heroImage
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Problem Statement Section - Compact Layout (Optional) */}
        {problemPoints && problemPoints.length > 0 && (
          <section
            className="pt-2 pb-12 md:pt-4 lg:pt-6 bg-gradient-to-b from-white to-gray-50"
            aria-labelledby="problem-heading"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <header className="mb-10">
                  {problemTitle && <div className="heading-section mb-6">{problemTitle}</div>}
                  {problemDescription && (
                    <p className="text-ethos-gray text-body-large font-light leading-relaxed">
                      {problemDescription}
                    </p>
                  )}
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {problemPoints.map((point, index) => (
                    <motion.div
                      key={point.text}
                      className="group"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="bg-white rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">{point.icon}</div>
                          <p className="text-gray-700 text-body-small leading-relaxed">{point.text}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Solution Section - Compact 2-Row Layout */}
        <section
          className="py-12 md:py-16 lg:py-20"
          style={{ background: '#F2F2F2' }}
          aria-labelledby="solution-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-12">
              <div className="mb-6">{solutionTitle}</div>
              {solutionDescription && (
                <p className="text-ethos-gray text-body-large font-light leading-relaxed max-w-4xl mx-auto">
                  {solutionDescription}
                </p>
              )}
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {solutionFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`bg-gradient-to-br ${
                    feature.gradient || 'from-gray-50 to-gray-100'
                  } rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1`} style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="heading-subsection font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-body-small leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Proof/Evidence Section - Compact & Clear */}
        <section
          className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50"
          aria-labelledby="proof-heading"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-10 md:mb-12">
              <div className="mb-4">{proofTitle}</div>
              {proofDescription && (
                <p className="text-gray-600 text-body-base leading-relaxed max-w-2xl mx-auto">
                  {proofDescription}
                </p>
              )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 max-w-5xl mx-auto">
              {proofItems.map((item, index) => (
                <motion.div
                  key={item.title ?? `${item.metric}-${item.description}`}
                  className="group transform-gpu"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: index * 0.06 } }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4, transition: { type: 'spring', stiffness: 700, damping: 24, mass: 0.45 } }}
                >
                  <div className="relative bg-white rounded-2xl h-full transition-shadow duration-150 hover:shadow-xl border border-gray-200 hover:border-gray-300" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)', willChange: 'transform' }}>
                  <div className="p-5 md:p-6">
                    {/* Top Row: Title (left) + Metric (right) */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      {item.title && (
                        <h3 className="heading-card m-0">
                          {item.title}
                        </h3>
                      )}
                      {/* Metric */}
                      <div className="text-right">
                        <div
                          className="text-3xl font-bold bg-clip-text text-transparent"
                          style={{
                            background:
                              'linear-gradient(to right, var(--ethos-purple-gradient-start), var(--ethos-purple-gradient-end))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {item.metric}
                        </div>
                        {item.metricLabel && (
                          <div className="text-xs text-gray-500 font-medium">
                            {item.metricLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-body-default">{item.description}</p>

                    {/* Stats Row */}
                    {item.stats && item.stats.length > 0 && (
                      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                        {item.stats.map((stat) => (
                          <div key={`${stat.label}-${stat.value}`} className="flex-1">
                            <div className="text-base font-bold text-ethos-navy">{stat.value}</div>
                            <div className="text-xs text-gray-500">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Content */}
        {additionalContent}

        {/* CTA Section - Positioned immediately before footer */}
        {ctaSection || (
          <section className="py-16 bg-gradient-to-br from-ethos-light-gray to-ethos-light-gray/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-ethos-navy rounded-2xl p-6 sm:p-8 md:p-12 lg:p-16 text-center">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8">
                    {ctaTitle}
                    {ctaDescription && (
                      <div className="mt-6 heading-section text-white/80">{ctaDescription}</div>
                    )}
                  </div>
                  {ctaButtonText && ctaButtonLink && (
                    <Link to={ctaButtonLink} className="inline-block">
                      <Button
                        variant="ethos"
                        size="lg"
                        className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl min-h-[48px] px-6 py-4 sm:px-8 sm:py-6 text-button-large touch-manipulation whitespace-normal sm:whitespace-nowrap"
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          {ctaButtonText}
                        </span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <Footer />
      </main>
    </div>
    </>
  );
});
