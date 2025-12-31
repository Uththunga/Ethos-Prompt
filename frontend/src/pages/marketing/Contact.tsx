import React, { useEffect, useMemo, useState } from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';
import ContactForm from '@/components/marketing/contact/ContactForm';
import { useLocation } from 'react-router-dom';
import ThankYouModal from '@/components/marketing/contact/ThankYouModal';


export const Contact = () => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sourceParam = searchParams.get('source') || '';

  const serviceKey = useMemo(() => {
    const s = sourceParam.toLowerCase();
    if (s.includes('smart-assistant')) return 'smart-assistant';
    if (s.includes('system-integration') || s.includes('integration')) return 'system-integration';
    if (
      s.includes('web-mobile') ||
      s.includes('web-mobile-applications') ||
      s.includes('applications')
    )
      return 'web-mobile-applications';
    return 'default';
  }, [sourceParam]);

  const hero = useMemo(() => {
    const map: Record<string, { line1: string; line2: string; subtitle: string; serviceValue?: string }> = {
      'smart-assistant': {
        line1: "Let's Talk",
        line2: 'AI Assistant',
        subtitle: 'Get your free assessment and see how much you could save',
        serviceValue: 'smart-assistant',
      },
      'system-integration': {
        line1: 'Connect Your',
        line2: 'Systems',
        subtitle: 'Get your free integration audit and cost savings report',
        serviceValue: 'system-integration',
      },
      'web-mobile-applications': {
        line1: 'Your',
        line2: 'App Project',
        subtitle: 'Submit your requirements for a detailed quotation',
        serviceValue: 'web-mobile-applications',
      },
      default: {
        line1: "Let's Build",
        line2: 'Together',
        subtitle: "Tell us about your project and we'll get back to you within 24 hours",
      },
    };
    return map[serviceKey as keyof typeof map] || map.default;
  }, [serviceKey]);

  const defaultServiceForForm = hero.serviceValue || '';

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'contact_page_view', {
        event_category: 'engagement',
        source: sourceParam || 'direct',
      });
    }
  }, [sourceParam]);

  // Thank you modal state
  const [showThanks, setShowThanks] = useState(false);



  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navigation />

      {/* Main Contact Section */}
      <main className="w-full bg-white" role="main" id="main-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-start">
            {/* Left Column - Content */}
            <section className="" aria-labelledby="contact-heading">
              {/* Main Heading */}
              <header className="mb-6 md:mb-8 lg:mb-10">
                <div className="mb-2 sm:mb-4">
                  <span className="inline-block px-4 py-2 text-ethos-purple text-body-small font-medium rounded-full" style={{
                    background: 'rgba(147, 51, 234, 0.08)',
                    border: '1px solid rgba(147, 51, 234, 0.15)'
                  }}>
                    <span className="relative z-10">Get in Touch</span>
                  </span>
                </div>
                <h1
                  id="contact-heading"
                  className="text-display-2xl font-semibold font-poppins"
                >
                  <span className="text-ethos-navy">
                    {hero.line1}
                  </span>
                  <br />
                  <span
                    style={{
                      fontFamily: 'Poppins',
                      wordWrap: 'break-word',
                      display: 'inline-block',
                      background: 'linear-gradient(90deg, var(--ethos-purple), #000, var(--ethos-purple))',
                      backgroundSize: '200% auto',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      paddingBottom: '0.1em',
                      lineHeight: '1.2',
                      animation: 'shine 10s linear infinite',
                    }}
                  >
                    {hero.line2}
                  </span>
                </h1>

                <p className="text-ethos-gray text-body-large font-normal leading-relaxed tracking-tight max-w-4xl break-words mt-4">
                  {hero.subtitle}
                </p>
              </header>

              {/* Discussion Points */}
              <section className="mb-6 md:mb-8 lg:mb-10" aria-labelledby="discussion-heading">
                <h2
                  id="discussion-heading"
                  className="text-h2 text-ethos-navy mb-6"
                >
                  Schedule a Consultation to Discuss:
                </h2>

                <div
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8"
                  role="list"
                >
                  {/* Left Column Points */}
                  <div>
                    <div className="flex items-start gap-4 mb-6" role="listitem">
                      <div className="relative w-7 h-7 flex-shrink-0 mt-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#6D6AED] to-[#7900E3]"></div>
                        <img
                          src={`${baseUrl}assets/marketing/images/check-icon.png`}
                          alt=""
                          className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="text-ethos-gray text-body-default font-normal leading-relaxed tracking-tight break-words">
                        ROI Optimization Strategies with EthosPrompt Enterprise Solutions
                      </p>
                    </div>

                    <div className="flex items-start gap-4 mb-6 last:mb-0" role="listitem">
                      <div className="relative w-7 h-7 flex-shrink-0 mt-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#6D6AED] to-[#7900E3]"></div>
                        <img
                          src={`${baseUrl}assets/marketing/images/check-icon.png`}
                          alt=""
                          className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="text-ethos-gray text-body-default font-normal leading-relaxed tracking-tight break-words">
                        Industry-Specific Implementation Strategies
                      </p>
                    </div>
                  </div>

                  {/* Right Column Points */}
                  <div>
                    <div className="flex items-start gap-4 mb-6" role="listitem">
                      <div className="relative w-7 h-7 flex-shrink-0 mt-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#6D6AED] to-[#7900E3]"></div>
                        <img
                          src={`${baseUrl}assets/marketing/images/check-icon.png`}
                          alt=""
                          className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="text-ethos-gray text-body-default font-normal leading-relaxed tracking-tight break-words">
                        Custom Enterprise Licensing and Support Plans
                      </p>
                    </div>

                    <div className="flex items-start gap-4 mb-6 last:mb-0" role="listitem">
                      <div className="relative w-7 h-7 flex-shrink-0 mt-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#6D6AED] to-[#7900E3]"></div>
                        <img
                          src={`${baseUrl}assets/marketing/images/check-icon.png`}
                          alt=""
                          className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="text-ethos-gray text-body-default font-normal leading-relaxed tracking-tight break-words">
                        Interactive Platform Demonstration and Use Case Analysis
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="mb-6 md:mb-8 lg:mb-10" aria-labelledby="contact-info-heading">
                <h3 id="contact-info-heading" className="sr-only">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <p className="text-ethos-gray text-body-default font-normal leading-relaxed tracking-tight break-words">
                    <span className="font-medium">Email:</span>{' '}
                    <a href="mailto:info@ethosprompt.com" className="text-ethos-purple hover:underline">
                      info@ethosprompt.com
                    </a>
                  </p>
                  <p className="text-ethos-gray text-body-default font-normal leading-relaxed tracking-tight break-words">
                    <span className="font-medium">Business Hours:</span> Monday-Friday, 9:00 AM -
                    6:00 PM AEST
                  </p>
                  <p className="text-ethos-gray text-body-small font-normal leading-relaxed tracking-tight break-words">
                    For immediate technical support, please visit our{' '}
                    <a href="/help" className="font-medium text-ethos-purple hover:underline">
                      Help Center
                    </a>{' '}
                    or review our{' '}
                    <a href="/faq" className="font-medium text-ethos-purple hover:underline">
                      FAQ
                    </a>
                    .
                  </p>
                </div>
              </section>
            </section>

            {/* Right Column - Contact Form */}
            <section
              className="w-full max-w-2xl xl:max-w-none"
              aria-labelledby="contact-form-heading"
            >
              <div
                className="bg-gradient-to-b from-[#FBF9F9] to-[#F3F3F3] rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-gray-100"
                style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}
              >
                <h2
                  id="contact-form-heading"
                  className="text-h2 font-semibold text-ethos-navy mb-6"
                >
                  Request a <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                  >Consultation</span>
                </h2>
                <ContactForm
                  defaultService={defaultServiceForForm}
                  source={sourceParam || 'direct'}
                  onSubmitted={() => setShowThanks(true)}
                />
              </div>
            </section>

          </div>
        </div>
      </main>



      <ThankYouModal open={showThanks} onClose={() => setShowThanks(false)} />

      <Footer />
    </div>
  );
};

export default Contact;
