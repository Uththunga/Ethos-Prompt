import { Button } from '@/components/marketing/ui/button';
import React, { useState } from 'react';
import { MarketingChatModal } from '@/components/marketing/MarketingChatModal';

export const ServiceFailuresSection = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const aiImagePath = `${baseUrl}assets/marketing/images/ai 3 1.png`;

  return (
    <section
      className="w-full py-12 sm:py-16 lg:py-20 xl:py-24"
      style={{ background: '#F2F2F2' }}
      aria-labelledby="service-failures-title"
      role="region"
    >
      <div className="container-standard">
        {/* Section Header */}
        <div className="mb-8 sm:mb-10 lg:mb-12 text-left">
          <h2
            id="service-failures-title"
            className="heading-hero font-medium leading-[1.13] tracking-[-0.03em] max-w-7xl"
          >
            <span style={{ color: '#0F1345' }}>Stop Losing Customers</span>
            <br />
            <span style={{ color: '#0F1345' }}>Because </span>
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
            >
              You're Too Slow
            </span>
          </h2>
        </div>

        {/* Main Content Area with Cards and Image */}
        <div className="mb-8 sm:mb-10 lg:mb-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_auto_minmax(300px,1fr)] gap-4 sm:gap-5 md:gap-6 lg:gap-4 xl:gap-5 items-center justify-items-center min-h-[380px] md:min-h-[360px] lg:min-h-[400px]">
            {/* Left Card - Purple */}
            <div className="relative order-2 lg:order-1 group w-full max-w-md xl:max-w-lg mx-auto lg:mx-0">
              {/* Background Shape */}
              <div
                className="absolute inset-0 rounded-2xl transition-all duration-300 group-hover:scale-[1.02] shadow-lg hover:shadow-xl"
                style={{ background: '#6D6AED' }}
              />

              {/* Content */}
              <div className="relative z-10 p-5 sm:p-6 lg:p-7 flex flex-col justify-center">
                <h3 className="text-white text-xl sm:text-2xl font-medium leading-tight tracking-tight mb-3 sm:mb-4 text-center">
                  Our AI solutions excel when you face
                </h3>

                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 group/item">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#6D6AED] to-[#7900E3]" />
                    </div>
                    <p className="text-white text-body-small leading-relaxed tracking-[-0.03em] transition-opacity duration-200 group-hover/item:opacity-90">
                      High employee turnover and engagement challenges
                    </p>
                  </div>

                  <div className="h-px bg-white/20 transition-opacity duration-300 hover:bg-white/40" />

                  <div className="flex items-start gap-2 group/item">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#6D6AED] to-[#7900E3]" />
                    </div>
                    <p className="text-white text-body-small leading-relaxed tracking-[-0.03em] transition-opacity duration-200 group-hover/item:opacity-90">
                      Need to scale operations without increasing overhead
                    </p>
                  </div>

                  <div className="h-px bg-white/20 transition-opacity duration-300 hover:bg-white/40" />

                  <div className="flex items-start gap-2 group/item">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#6D6AED] to-[#7900E3]" />
                    </div>
                    <p className="text-white text-body-small leading-relaxed tracking-[-0.03em] transition-opacity duration-200 group-hover/item:opacity-90">
                      Losing clients due to slow response times
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Image */}
            <div className="order-1 lg:order-2 flex justify-center items-center w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[450px] xl:max-w-[500px] mx-auto">
              <img
                src={aiImagePath}
                alt="Professional AI Agent Representative providing 24/7 customer service"
                className="w-full h-auto object-contain"
                width={500}
                height={500}
                loading="lazy"
                role="img"
              />
            </div>

            {/* Right Card - Dark Blue */}
            <div className="relative order-3 lg:order-3 group w-full max-w-md xl:max-w-lg mx-auto lg:mx-0">
              {/* Background Shape */}
              <div
                className="absolute inset-0 rounded-2xl transition-all duration-300 group-hover:scale-[1.02] shadow-lg hover:shadow-xl"
                style={{ background: '#2E3D88' }}
              />

              {/* Content */}
              <div className="relative z-10 p-5 sm:p-6 lg:p-7 flex items-center justify-center">
                <div className="w-full text-center">
                  <p className="text-white text-base sm:text-lg font-normal leading-relaxed tracking-tight transition-opacity duration-300 group-hover:opacity-95">
                    Our AI answers customer questions 24/7. Every response is fast, accurate, and professional. No bad days, no slow Mondays.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <footer className="text-center">
          <h2
            className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight mb-4 sm:mb-5"
            style={{ color: '#484848' }}
          >
            Experience our solutions in action
          </h2>
          <div className="flex justify-center">
            <Button
              onClick={() => setIsChatOpen(true)}
              variant="ethos"
              size="lg"
              aria-label="Schedule a demonstration of our AI agent services"
            >
              Ask molē
            </Button>
            <MarketingChatModal
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              pageContext="demo"
            />
          </div>
        </footer>
      </div>
    </section>
  );
};

// Add display name for better React DevTools experience
ServiceFailuresSection.displayName = 'ServiceFailuresSection';
