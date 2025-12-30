import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/marketing/ui/button';

interface PromptManagementBannerProps {
  onGetStarted?: () => void;
}

export const PromptManagementBanner: React.FC<PromptManagementBannerProps> = ({ onGetStarted }) => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const bannerBackgroundPath = `${baseUrl}assets/marketing/images/banner-background.webp`;

  return (
    <section
      className="w-full relative overflow-hidden bg-white z-50"
      aria-labelledby="prompt-management-heading"
    >
      {/* Main Banner Container */}
      <div className="relative">
        {/* Background Section with Navy */}
        <div className="relative flex flex-col">
          {/* Banner Background Image - positioned behind content */}
          <div className="absolute inset-0 overflow-hidden bg-gray-900">
            <img
              src={bannerBackgroundPath}
              alt=""
              className="w-full h-full object-cover object-center sm:object-right transition-all duration-300"
              aria-hidden="true"
            />
          </div>

          {/* Content Section */}
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-20 xl:py-24 relative">
            {/* Dark Transparent Overlay across images */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none z-20"></div>
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 sm:gap-10 lg:gap-12 items-center">
                {/* Text Content - Left Side */}
                <div className="flex flex-col justify-center relative z-30">
                  {/* Section Subheader */}
                  <p className="text-lg sm:text-xl font-medium text-gray-300 tracking-wide mb-4 sm:mb-6">
                    Introducing
                  </p>

                  {/* Main Header */}
                  <h2
                    id="prompt-management-heading"
                    className="heading-hero font-medium leading-tight tracking-tight mb-4 sm:mb-6"
                  >
                    <span
                      style={{
                        fontFamily: 'Poppins',
                        background: 'linear-gradient(to right, #ffffff, #a0aec0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        display: 'inline',
                      }}
                    >
                      Your Complete AI Prompt Engine
                    </span>
                  </h2>

                  {/* Description */}
                  <p className="text-gray-200 text-base sm:text-lg lg:text-xl leading-relaxed mb-6 sm:mb-8 max-w-xl">
                    Build, execute, and optimize AI prompts with intelligent document search. Works
                    with any AI model—start with 10+ free models or bring your own.
                  </p>

                  {/* Button */}
                  <div>
                    <Button variant="ethos" size="lg" asChild>
                      <Link
                        to="/prompt-library"
                        onClick={onGetStarted}
                        aria-label="Explore Prompt Engine"
                      >
                        Explore Prompt Engine
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Image - Right Side - Pinned to Bottom - Desktop Only */}
                <div className="hidden lg:flex relative z-10 w-full h-full items-end justify-end pt-[40px]">
                  <div className="relative w-full max-w-[95%]" style={{ marginBottom: '0', marginTop: '0' }}>
                    <img
                      src={`${baseUrl}assets/marketing/images/promptmole.webp`}
                      alt=""
                      className="w-full h-auto"
                      style={{
                        maxHeight: '480px',
                        width: 'auto',
                        maxWidth: '90%',
                        margin: '0 auto',
                        display: 'block',
                        objectFit: 'contain',
                        objectPosition: 'bottom',
                        position: 'relative',
                        bottom: '-100px',
                        verticalAlign: 'bottom',
                        transform: 'scale(1.5)',
                        transformOrigin: 'bottom center',
                      }}
                      loading="lazy"
                      aria-hidden="true"
                      onError={(e) => console.error('Image failed to load:', e)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
