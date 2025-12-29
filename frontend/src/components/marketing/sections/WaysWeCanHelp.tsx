import React from 'react';
import { Link } from 'react-router-dom';
import { setServiceReferrer } from '@/utils/navigationUtils';

export const WaysWeCanHelp = () => {
  // Animation style for the floating effect
  const animationStyle = `
    @keyframes floatMole {
      0% { transform: translateY(0); }
      50% { transform: translateY(-1mm); }
      100% { transform: translateY(0); }
    }
    @keyframes shine {
      to {
        background-position: 200% center;
      }
    }
    .animate-float-mole {
      animation: floatMole 4s ease-in-out infinite;
    }

    @keyframes star-border {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    .animate-star-border {
      position: relative;
      z-index: 0;
      overflow: hidden;
    }
    .animate-star-border::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: -12px;
      background: conic-gradient(
        from 0deg,
        transparent,
        rgba(116, 9, 197, 0.4),
        rgba(116, 9, 197, 0.6),
        rgba(116, 9, 197, 0.6),
        transparent 180deg,
        rgba(116, 9, 197, 0.4),
        rgba(116, 9, 197, 0.6),
        rgba(116, 9, 197, 0.6),
        transparent 360deg
      );
      border-radius: inherit;
      opacity: 0;
      transform: rotate(0deg);
      transition: opacity 0.3s ease;
    }
    .animate-star-border:hover::before {
      opacity: 0.25;
      animation: star-border 12s linear infinite;
    }
    .animate-star-border::after {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 1px;
      background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
      border-radius: inherit;
    }
  `;

  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const moleImagePath = `${baseUrl}assets/marketing/images/mole1.png`;

  const services = [
    {
      title: 'Smart Business Assistant',
      subtitle:
        'AI assistant that handles customer service, qualifies leads, and automates routine tasks.',
      link: '/smart-business-assistant',
    },
    {
      title: 'System Integration & Automation',
      subtitle:
        'Connect your business tools and automate workflows. No coding required.',
      link: '/system-integration',
    },
    {
      title: 'Intelligent Applications',
      subtitle:
        'Modern web and mobile apps with AI-powered features that adapt to your users.',
      link: '/intelligent-applications',
    },
  ];

  const features = [
    {
      number: 1,
      title: 'Sounds Actually Human',
      description:
        'Your customers get help from AI that sounds human. Natural conversations that build trust, not robotic scripts.',
    },
    {
      number: 2,
      title: 'Automate the Boring Stuff',
      description:
        'Your team focuses on what matters while AI handles scheduling, confirmations, updates, and follow-ups. The busywork just disappears.',
    },
    {
      number: 3,
      title: 'Always Up-to-Date',
      description:
        'Instant, accurate answers about products, services, availability, and policies. No more outdated information or customer confusion.',
    },
    {
      number: 4,
      title: 'Detect Problems Early',
      description:
        'The AI anticipates needs, spots issues before they become headaches, and fixes them automatically. Fewer fires to put out.',
    },
  ];

  return (
    <section
      className="w-full py-12 sm:py-16 lg:py-20 xl:py-24"
      style={{ background: 'linear-gradient(180deg, #FFF 37.11%, #E8E8E8 100%)' }}
      aria-labelledby="ai-agent-heading"
    >
      <style dangerouslySetInnerHTML={{ __html: animationStyle }} />
      <div className="container-standard">
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6 md:gap-8 lg:gap-10 mb-12 sm:mb-16 lg:mb-20">
          {/* Left Side - AI Agent Image - Hidden on mobile and tablet */}
          <div className="hidden lg:flex justify-start items-start relative">
            <div className="relative -mt-16 sm:-mt-24 md:-mt-32 lg:-mt-40 -ml-12 sm:-ml-16 md:-ml-20 lg:-ml-28">
              <img
                src={moleImagePath}
                alt="AI Agent"
                className="w-full max-w-[700px] sm:max-w-[900px] md:max-w-[1000px] lg:max-w-[1200px] xl:max-w-[1400px] h-auto object-contain animate-float-mole"
                loading="lazy"
                style={{ transform: 'translateY(-5px)' }}
              />
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex flex-col justify-center w-full">
            {/* Main Heading */}
            <header className="mb-4 sm:mb-5 lg:mb-6">
              <h2
                id="ai-agent-heading"
                className="heading-hero font-medium leading-tight tracking-tight mb-3 sm:mb-4"
              >
                <span className="text-ethos-navy-light">
                  AI Tools That Make Your{' '}
                </span>
                <span className="text-gradient-shine font-poppins font-medium inline-block">
                  Business Run Better
                </span>
              </h2>
              <p className="text-body-large font-normal leading-relaxed tracking-tight text-ethos-gray">
                AI that works for you 24/7. It handles customer service, automates your busywork, and never takes a day off. Your team focuses on growth while AI handles everything else.
              </p>
            </header>

            {/* Features List */}
            <div>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 mb-3 sm:mb-4 last:mb-0"
                >
                  <div className="relative w-7 h-7 flex-shrink-0 mt-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#6D6AED] to-[#7900E3]" />
                    <img
                      src={`${baseUrl}assets/marketing/images/check-icon.png`}
                      alt=""
                      className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ways We Can Help Section */}
        <section id="core-services" aria-labelledby="ways-help-heading">
          {/* Section Header */}
          <header className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h3
              id="ways-help-heading"
              className="heading-section font-medium leading-tight tracking-tight"
            >
              <span className="text-ethos-navy-light font-poppins font-medium">
                Ways We Can
              </span>
              <span className="ml-2">
                <span className="text-gradient-shine font-poppins font-medium inline-block">
                  Help You
                </span>
              </span>
            </h3>
          </header>

          {/* Service Cards Grid */}
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {services.map((service, index) => (
                <Link
                  key={index}
                  to={service.link}
                  onClick={() => setServiceReferrer('home')}
                  className="group w-full h-full flex flex-col bg-gradient-to-b from-white to-gray-50 rounded-2xl p-4 sm:p-5 md:p-6 text-center transition-all duration-500 animate-star-border cursor-pointer hover:shadow-lg"
                  role="article"
                  aria-labelledby={`service-${index}`}
                  style={{
                    boxShadow:
                      '0 4px 4px rgba(116, 9, 197, 0.1), inset -30px -30px 50px rgba(255, 255, 255, 0.9), inset 30px 30px 50px rgba(116, 9, 197, 0.05)',
                    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                    transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                  onMouseMove={(e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = (y - centerY) / 20;
                    const rotateY = (centerX - x) / 20;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                  }}
                >
                  <h4
                    id={`service-${index}`}
                    className="heading-card font-medium mb-2 sm:mb-3 bg-gradient-to-r from-ethos-purple-gradient-start to-ethos-purple-gradient-end bg-clip-text text-transparent tracking-tight leading-snug min-h-[2.5rem] flex items-center justify-center transform transition-transform duration-500 group-hover:scale-105"
                    style={{
                      background:
                        'linear-gradient(to right, var(--ethos-purple-gradient-start), var(--ethos-purple-gradient-end))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {service.title}
                  </h4>
                  <p className="text-body-default font-normal text-gray-800 leading-relaxed tracking-tight flex-grow flex items-center transform transition-all duration-500 group-hover:text-gray-900 mb-4">
                    {service.subtitle}
                  </p>
                  <div className="flex items-center justify-center text-ethos-purple font-semibold mt-auto">
                    <svg
                      className="w-8 h-6 group-hover:scale-110 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 6"
                      aria-label="More options"
                    >
                      <circle cx="3" cy="3" r="1.5" />
                      <circle cx="12" cy="3" r="1.5" />
                      <circle cx="21" cy="3" r="1.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </section>
  );
};

export default WaysWeCanHelp;
