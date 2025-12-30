import { Button } from '@/components/marketing/ui/button';
import { ImageWithFallback } from '@/components/marketing/ui/image-with-fallback';
import { memo } from 'react';
import { Link } from 'react-router-dom';
// Use a relative path that works in all environments
const groupHeroPath = '/assets/marketing/images/Group%20282.webp';

export const Hero = memo(() => {
  // Removed loading state tracking - images now render immediately with reserved space

  // Add animation style in a style tag to ensure it's scoped
  const animationStyle = `
    @keyframes float {
      0% { transform: translate(-50%, -50%) translateY(0); }
      50% { transform: translate(-50%, -50%) translateY(-1mm); }
      100% { transform: translate(-50%, -50%) translateY(0); }
    }
    .animate-float-slow {
      animation: float 4s ease-in-out infinite;
    }

    @keyframes shine {
      to {
        background-position: 200% center;
      }
    }

    @keyframes brainPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-brain-pulse {
      animation: brainPulse 2s ease-in-out infinite;
    }

    .animate-fade-in {
      animation: fadeIn 0.6s ease-out forwards;
    }

    @keyframes hero-star-border {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Sequential animation with staggered delays */
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.2; }
      33% { opacity: 0.8; }
      66% { opacity: 0.2; }
    }

    ul[aria-label="Business results statistics"] li:nth-child(1) .animate-star-border::before {
      animation:
        hero-star-border 4s linear 0s infinite,
        fadeInOut 9s ease-in-out 0s infinite;
    }

    ul[aria-label="Business results statistics"] li:nth-child(2) .animate-star-border::before {
      animation:
        hero-star-border 4s linear 0s infinite,
        fadeInOut 9s ease-in-out -3s infinite;
    }

    ul[aria-label="Business results statistics"] li:nth-child(3) .animate-star-border::before {
      animation:
        hero-star-border 4s linear 0s infinite,
        fadeInOut 9s ease-in-out -6s infinite;
    }

    /* Specific to Hero section cards */
    .animate-star-border {
      position: relative;
      z-index: 0;
      overflow: hidden;
    }

    ul[aria-label="Business results statistics"] .animate-star-border::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: -10px;
      background: conic-gradient(
        from 0deg,
        rgba(99, 102, 241, 0.1),      /* Indigo */
        rgba(56, 189, 248, 0.2),     /* Light Blue */
        rgba(124, 58, 237, 0.3),     /* Purple */
        rgba(96, 165, 250, 0.4),     /* Lighter Blue */
        rgba(139, 92, 246, 0.5),     /* Brighter Purple */
        rgba(167, 139, 250, 0.4),    /* Lavender */
        transparent 180deg,
        rgba(99, 102, 241, 0.1),     /* Indigo */
        rgba(56, 189, 248, 0.2),     /* Light Blue */
        rgba(124, 58, 237, 0.3),     /* Purple */
        rgba(96, 165, 250, 0.4),     /* Lighter Blue */
        rgba(139, 92, 246, 0.5),     /* Brighter Purple */
        rgba(167, 139, 250, 0.4),    /* Lavender */
        transparent 360deg
      );
      border-radius: inherit;
      opacity: 0.2;
      filter: blur(2.5px);
    }

    ul[aria-label="Business results statistics"] .animate-star-border.animate::before {
      opacity: 0.7;
    }
    ul[aria-label="Business results statistics"] .animate-star-border::after {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 1.5px;
      background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
      border-radius: inherit;
      box-shadow: inset 0 0 25px rgba(99, 102, 241, 0.1);
    }
  `;

  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const group282Path = `${baseUrl}assets/marketing/images/Group 288.webp`;
  const botPath = `${baseUrl}assets/marketing/images/bot.webp`;
  const group287Path = `${baseUrl}assets/marketing/images/Group 287.svg`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyle }} />

      <main
        className="relative w-full overflow-hidden min-h-screen bg-white"
        role="main"
        id="main-content"
      >
        {/* Main Hero Content */}
        <div className="relative z-10 container-standard pt-16 lg:pt-24">
          {/* Hero Banner */}
          <section
            className="relative z-10 text-center mb-16 lg:mb-20"
            aria-labelledby="hero-heading"
          >
            <div className="relative z-30">
              {/* Desktop/Tablet Title - Hidden on mobile */}
              <h1 id="hero-heading" className="hidden md:block text-display-2xl font-semibold font-poppins">
                <span
                  style={{
                    fontFamily: 'Poppins',
                    background:
                      'linear-gradient(to right, var(--ethos-navy-light), var(--ethos-gray-light))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block',
                    paddingBottom: '0.1em',
                  }}
                >
                  The Intelligent System
                </span>
                <br />
                <span
                  style={{
                    fontFamily: 'Poppins',
                    background:
                      'linear-gradient(to right, var(--ethos-navy-light), var(--ethos-gray-light))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block',
                  }}
                >
                  for
                </span>{' '}
                <span
                  style={{
                    fontFamily: 'Poppins',
                    wordWrap: 'break-word',
                    display: 'inline-block',
                    background:
                      'linear-gradient(90deg, #524fb0 0%, #a850a0 20%, #000 40%, #000 60%, #a850a0 80%, #524fb0 100%)',
                    backgroundSize: '200% auto',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    paddingBottom: '0.1em',
                    lineHeight: '1.2',
                    animation: 'shine 10s linear infinite',
                  }}
                >
                  Modern Business Growth
                </span>
              </h1>

              {/* Mobile Title - Visible only on mobile */}
              <h1 aria-hidden="true" className="md:hidden text-display-2xl font-semibold font-poppins">
                <span
                  style={{
                    fontFamily: 'Poppins',
                    background:
                      'linear-gradient(to right, var(--ethos-navy-light), var(--ethos-gray-light))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block',
                    paddingBottom: '0.1em',
                  }}
                >
                  Intelligence for
                </span>
                <br />
                <span
                  style={{
                    fontFamily: 'Poppins',
                    wordWrap: 'break-word',
                    display: 'inline-block',
                    background:
                      'linear-gradient(90deg, #524fb0 0%, #a850a0 20%, #000 40%, #000 60%, #a850a0 80%, #524fb0 100%)',
                    backgroundSize: '200% auto',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    paddingBottom: '0.1em',
                    lineHeight: '1.2',
                    animation: 'shine 10s linear infinite',
                  }}
                >
                  Business Growth
                </span>
              </h1>
            </div>
          </section>

          {/* Hero Image with Overlay */}
          <figure
            className="relative z-1 flex justify-center mt-0 lg:mt-12 min-h-[250px] lg:min-h-[500px]"
            aria-label="AI Agent interface demonstration"
          >
            {/* Desktop Images Container - Reserve space with aspect ratio to prevent CLS */}
            <div className="relative w-full hidden lg:block" style={{ aspectRatio: '1200/708' }}>
              {/* Base Image - Always visible with reserved space */}
              <ImageWithFallback
                src={group282Path}
                alt="Interactive AI agent dashboard interface showing workflow automation"
                className="w-full h-auto object-contain scale-110 -translate-x-4 -translate-y-24"
                width={1200}
                height={708}
                loading="eager"
                fallbackType="generic"
                fallbackText="AI Dashboard"
              />

              {/* SVG Overlay - Positioned absolutely with reserved space */}
              <div
                className="absolute top-[45%] left-[52%] transform -translate-x-1/2 -translate-y-1/2 w-[70%]"
                style={{
                  zIndex: 25,
                  aspectRatio: '840/496',
                }}
              >
                <ImageWithFallback
                  src={group287Path}
                  alt="Decorative SVG graphic"
                  className="w-full h-auto"
                  width={840}
                  height={496}
                  loading="eager"
                  fallbackType="generic"
                  fallbackText="Decoration"
                />
              </div>

              {/* Bot Image - Positioned absolutely with reserved space */}
              <div
                className="absolute top-[73%] left-[77%] transform -translate-x-1/2 -translate-y-1/2 w-[42%]"
                style={{
                  zIndex: 20,
                  aspectRatio: '504/297',
                }}
              >
                <ImageWithFallback
                  src={botPath}
                  alt="Animated AI assistant character"
                  className="w-full h-auto animate-float-slow"
                  width={504}
                  height={297}
                  loading="eager"
                  fallbackType="generic"
                  fallbackText="AI Bot"
                />
              </div>
            </div>

            {/* Mobile/Tablet Image - shown on screens smaller than lg */}
            <div className="lg:hidden w-full" style={{ aspectRatio: '1090/642' }}>
              <ImageWithFallback
                src={groupHeroPath}
                alt="Interactive AI agent dashboard interface"
                className="w-full h-auto object-contain -mt-10"
                width={1090}
                height={642}
                loading="eager"
                fallbackType="generic"
                fallbackText="AI Interface"
                onError={(e) => {
                  console.error('Error loading hero image:', e);
                  console.log('Image path:', groupHeroPath);
                }}
                onLoad={() => console.log('Hero image loaded successfully')}
              />
            </div>
          </figure>
        </div>

        {/* Proven Results Section */}
        <section
          className="relative z-10 container-standard pb-16 sm:pb-20 lg:pb-24 xl:pb-28 mt-4 lg:mt-12"
          aria-labelledby="results-heading"
        >
          {/* Section Header */}
          <header className="mb-12 lg:mb-16 text-left">
            <h2
              id="results-heading"
              className="heading-section font-medium leading-[1.13] tracking-[-0.03em] max-w-7xl"
            >
              <span className="md:inline-block">Proven Results for</span>{' '}
              <span
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: '500',
                  wordWrap: 'break-word',
                  display: 'inline-block',
                  background:
                    'linear-gradient(90deg, var(--ethos-purple), #000, var(--ethos-purple))',
                  backgroundSize: '200% auto',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shine 10s linear infinite',
                }}
                className="block md:inline-block mt-2 md:mt-0"
              >
                Businesses That Don't Settle
              </span>
            </h2>
          </header>

          {/* Feature Cards and CTA - 4 column layout */}
          <ul
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4"
            aria-label="Business results statistics"
          >
            {/* Card 1 - 30% */}
            <li>
              <article
                className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 transition-all duration-300 animate-star-border"
                style={{
                  boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)',
                }}
              >
                <div className="mb-4 flex justify-start w-full">
                  <div className="bg-white rounded-full px-3 py-0 sm:px-4 sm:py-0">
                    <span
                      className="block text-4xl font-bold"
                      style={{
                        background:
                          'linear-gradient(to right, var(--ethos-purple-gradient-start), var(--ethos-purple-gradient-end))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      30%
                    </span>
                  </div>
                </div>
                <h3 className="heading-card mb-3 sm:mb-4">Revenue Growth</h3>
                <p className="text-body-default">
                  Intelligent agents qualify leads 24/7, ensuring high-value prospects are prioritized instantly
                </p>
              </article>
            </li>

            {/* Card 2 - 80% */}
            <li>
              <article
                className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 transition-all duration-300 animate-star-border"
                style={{
                  boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)',
                }}
              >
                <div className="mb-4 flex justify-start w-full">
                  <div className="bg-white rounded-full px-3 py-0 sm:px-4 sm:py-0">
                    <span
                      className="block text-4xl font-bold"
                      style={{
                        background:
                          'linear-gradient(to right, var(--ethos-purple-gradient-start), var(--ethos-purple-gradient-end))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      80%
                    </span>
                  </div>
                </div>
                <h3 className="heading-card mb-3 sm:mb-4">Operational Efficiency</h3>
                <p className="text-body-default">
                  Connected systems handle complex workflows, freeing your team to focus on strategic growth
                </p>
              </article>
            </li>

            {/* Card 3 - 40% */}
            <li>
              <article
                className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 transition-all duration-300 animate-star-border"
                style={{
                  boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)',
                }}
              >
                <div className="mb-4 flex justify-start w-full">
                  <div className="bg-white rounded-full px-3 py-0 sm:px-4 sm:py-0">
                    <span
                      className="block text-4xl font-bold"
                      style={{
                        background:
                          'linear-gradient(to right, var(--ethos-purple-gradient-start), var(--ethos-purple-gradient-end))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      40%
                    </span>
                  </div>
                </div>
                <h3 className="heading-card mb-3 sm:mb-4">Cost Reduction</h3>
                <p className="text-body-default">
                  Smart integration eliminates redundancy and overhead, delivering superior results at a fraction of the cost
                </p>
              </article>
            </li>

            {/* CTA Card */}
            <li
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                boxShadow: 'none',
                borderRadius: 30,
              }}
              className="flex flex-col justify-center items-center text-center p-4 pb-1 sm:p-6 sm:pb-3 lg:p-8 xl:p-10 w-full max-w-[320px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto"
            >
              <h3 className="heading-card font-medium mb-3 sm:mb-4 lg:mb-6">
                Discover how your organization can achieve these outcomes
              </h3>
              <div className="w-full flex justify-center mt-4 sm:mt-0">
                <Link to="/contact">
                  <Button
                    variant="ethos"
                    size="lg"
                    aria-label="Schedule consultation to discuss business results"
                  >
                    Talk to Expert
                  </Button>
                </Link>
              </div>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
});
Hero.displayName = 'Hero';
