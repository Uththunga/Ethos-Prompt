import { Footer } from '@/components/marketing/layout/Footer';
import { Navigation } from '@/components/marketing/layout/Navigation';
import React from 'react';
import { Link } from 'react-router-dom';

import { LearningMaterialSection } from '@/components/marketing/sections/LearningMaterialSection';

export const Techniques = () => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const withBase = (path: string) => {
    // Remove leading slashes and ensure proper path construction
    const cleanPath = path.replace(/^\/+/, '');
    return baseUrl.endsWith('/') ? `${baseUrl}${cleanPath}` : `${baseUrl}/${cleanPath}`;
  };

  // Animation styles for star border effect - simplified and more visible
  const animationStyle = `
    @keyframes hero-star-border {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .animate-star-border {
      position: relative;
      z-index: 0;
      overflow: hidden;
      box-shadow: 0 0 0 2px rgba(116, 9, 197, 0.3), 0 15px 35px -5px rgba(128, 128, 128, 0.25);
      border-radius: 16px;
    }

    @media (min-width: 640px) {
      .animate-star-border {
        border-radius: 20px;
      }
    }

    @media (min-width: 1024px) {
      .animate-star-border {
        border-radius: 24px;
      }
    }

    .animate-star-border::before {
      content: '' !important;
      position: absolute !important;
      z-index: -1 !important;
      top: -12px !important;
      left: -12px !important;
      right: -12px !important;
      bottom: -12px !important;
      background: conic-gradient(
        from 0deg,
        rgba(116, 9, 197, 0.8),
        rgba(168, 85, 247, 0.9),
        rgba(192, 132, 252, 1),
        rgba(216, 180, 254, 1),
        rgba(192, 132, 252, 1),
        rgba(168, 85, 247, 0.9),
        rgba(116, 9, 197, 0.8) 180deg,
        rgba(116, 9, 197, 0.8),
        rgba(168, 85, 247, 0.9),
        rgba(192, 132, 252, 1),
        rgba(216, 180, 254, 1),
        rgba(192, 132, 252, 1),
        rgba(168, 85, 247, 0.9),
        rgba(116, 9, 197, 0.8) 360deg
      ) !important;
      border-radius: 16px !important;
      opacity: 1 !important;
      animation: hero-star-border 4s linear infinite !important;
    }

    @media (min-width: 640px) {
      .animate-star-border::before {
        border-radius: 20px !important;
      }
    }

    @media (min-width: 1024px) {
      .animate-star-border::before {
        border-radius: 24px !important;
      }
    }

    .animate-star-border:hover::before {
      opacity: 1 !important;
      animation: hero-star-border 2s linear infinite !important;
    }

    .animate-star-border::after {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 1.5px;
      background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
      border-radius: inherit;
      box-shadow: inset 0 0 25px rgba(139, 92, 246, 0.08), 0 15px 35px -5px rgba(128, 128, 128, 0.25);
    }
  `;

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: animationStyle }} />
      <Navigation />

      {/* Hero Section */}
      <main role="main" id="main-content">
        <section
          className="bg-gradient-to-b from-white via-white to-[#E8E8E8] relative overflow-hidden py-6 md:py-8 lg:py-10"
          aria-labelledby="hero-heading"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{
              backgroundImage: `url(${baseUrl}assets/marketing/images/techniques-hero-image.jpg)`,
              backgroundPosition: 'right center',
            }}
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 items-center min-h-[150px] sm:min-h-[180px] lg:min-h-[220px]">
              {/* Left Content */}
              <div className="flex flex-col justify-center">
                {/* Title */}
                <header className="mb-3 md:mb-4 lg:mb-5">
                  <h1
                    id="hero-heading"
                    className="heading-hero font-semibold font-poppins"
                  >
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
                      Practical
                    </span>
                    <span
                      style={{
                        fontFamily: 'Poppins',
                        wordWrap: 'break-word',
                        display: 'inline-block',
                        background:
                          'linear-gradient(90deg, var(--ethos-purple), #000, var(--ethos-purple))',
                        backgroundSize: '200% auto',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        paddingBottom: '0.1em',
                        lineHeight: '1.2',
                        animation: 'shine 10s linear infinite',
                      }}
                    >
                      Prompt Engineering
                    </span>
                  </h1>
                </header>

                {/* Subtitle */}
                <div className="mb-3 md:mb-4 lg:mb-5">
                  <p className="text-[#313131] text-body-large font-normal leading-relaxed tracking-tight max-w-xl">
                    Master the Art of Crafting Effective Prompts
                  </p>
                </div>

              </div>

              {/* Right Side - Image */}
              <div className="hidden lg:flex items-center justify-center">
                <img
                  src={`${baseUrl}assets/marketing/images/techniques/Group 205.png`}
                  alt="Prompt Engineering Illustration"
                  className="max-w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* The Core Techniques Section */}
        <section
          className="bg-gradient-to-b from-ethos-light to-ethos-offwhite py-6 sm:py-8 md:py-12 lg:py-16 xl:py-20"
          aria-labelledby="core-techniques-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-left">
              <h2
                id="core-techniques-heading"
                className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6"
              >
                <span className="text-ethos-navy">The </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Core techniques
                </span>
              </h2>

              <p className="text-ethos-gray text-body-large font-normal leading-relaxed tracking-tight max-w-2xl text-left">
                Master these fundamental techniques to transform your interactions with AI. Each
                approach serves a specific purpose and, when combined effectively, enables you to
                achieve more accurate, creative, and reliable results from AI models.
              </p>
            </header>

            {/* Four Technique Cards */}
            <div
              className="w-full px-4 sm:px-6 lg:px-8"
              role="list"
              aria-label="Core prompt engineering techniques"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                {/* Role Setting */}
                <div
                  className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300"
                  role="article"
                  aria-labelledby="role-setting"
                  style={{
                    boxShadow:
                      '0 4px 4px rgba(0, 0, 0, 0.25), inset -30px -30px 50px rgba(255, 255, 255, 0.7), inset 30px 30px 50px rgba(0, 39, 80, 0.05)',
                  }}
                >
                  <h4
                    id="role-setting"
                    className="heading-subsection font-medium mb-2 sm:mb-3 bg-gradient-to-r from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent tracking-tight leading-snug min-h-[2.5rem] flex items-center"
                  >
                    Role Setting
                  </h4>
                  <p className="text-body-small font-normal text-gray-600 leading-relaxed tracking-tight flex-grow flex items-center">
                    Give the AI a specific role to guide its responses. Roles help set expectations
                    and context for the interaction.
                  </p>
                </div>

                {/* Context Providing */}
                <div
                  className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300"
                  role="article"
                  aria-labelledby="context-providing"
                  style={{
                    boxShadow:
                      '0 4px 4px rgba(0, 0, 0, 0.25), inset -30px -30px 50px rgba(255, 255, 255, 0.7), inset 30px 30px 50px rgba(0, 39, 80, 0.05)',
                  }}
                >
                  <h4
                    id="context-providing"
                    className="heading-subsection font-medium mb-2 sm:mb-3 bg-gradient-to-r from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent tracking-tight leading-snug min-h-[2.5rem] flex items-center"
                  >
                    Context Providing
                  </h4>
                  <p className="text-body-small font-normal text-gray-600 leading-relaxed tracking-tight flex-grow flex items-center">
                    Set the background and requirements clearly. More context leads to more relevant
                    responses.
                  </p>
                </div>

                {/* Task Breakdown */}
                <div
                  className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300"
                  role="article"
                  aria-labelledby="task-breakdown"
                  style={{
                    boxShadow:
                      '0 4px 4px rgba(0, 0, 0, 0.25), inset -30px -30px 50px rgba(255, 255, 255, 0.7), inset 30px 30px 50px rgba(0, 39, 80, 0.05)',
                  }}
                >
                  <h4
                    id="task-breakdown"
                    className="heading-subsection font-medium mb-2 sm:mb-3 bg-gradient-to-r from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent tracking-tight leading-snug min-h-[2.5rem] flex items-center"
                  >
                    Task Breakdown
                  </h4>
                  <p className="text-body-small font-normal text-gray-600 leading-relaxed tracking-tight flex-grow flex items-center">
                    Split complex requests into clear steps. Breaking down tasks improves clarity
                    and quality.
                  </p>
                </div>

                {/* Output Formatting */}
                <div
                  className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300"
                  role="article"
                  aria-labelledby="output-formatting"
                  style={{
                    boxShadow:
                      '0 4px 4px rgba(0, 0, 0, 0.25), inset -30px -30px 50px rgba(255, 255, 255, 0.7), inset 30px 30px 50px rgba(0, 39, 80, 0.05)',
                  }}
                >
                  <h4
                    id="output-formatting"
                    className="heading-subsection font-medium mb-2 sm:mb-3 bg-gradient-to-r from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent tracking-tight leading-snug min-h-[2.5rem] flex items-center"
                  >
                    Output Formatting
                  </h4>
                  <p className="text-body-small font-normal text-gray-600 leading-relaxed tracking-tight flex-grow flex items-center">
                    Specify how you want the response structured. Clear formats make responses more
                    useful and actionable.
                  </p>
                </div>

                {/* Zero-Shot Learning */}
                <div
                  className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300"
                  role="article"
                  aria-labelledby="zero-shot-learning"
                  style={{
                    boxShadow:
                      '0 4px 4px rgba(0, 0, 0, 0.25), inset -30px -30px 50px rgba(255, 255, 255, 0.7), inset 30px 30px 50px rgba(0, 39, 80, 0.05)',
                  }}
                >
                  <h4
                    id="zero-shot-learning"
                    className="heading-subsection font-medium mb-2 sm:mb-3 bg-gradient-to-r from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent tracking-tight leading-snug min-h-[2.5rem] flex items-center"
                  >
                    Zero-Shot Learning
                  </h4>
                  <p className="text-body-small font-normal text-gray-600 leading-relaxed tracking-tight flex-grow flex items-center">
                    Ask directly without providing examples. Relies on the AI's broad pre-existing knowledge to get a response.
                  </p>
                </div>

                {/* Prompt Templates */}
                <div
                  className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300"
                  role="article"
                  aria-labelledby="prompt-templates"
                  style={{
                    boxShadow:
                      '0 4px 4px rgba(0, 0, 0, 0.25), inset -30px -30px 50px rgba(255, 255, 255, 0.7), inset 30px 30px 50px rgba(0, 39, 80, 0.05)',
                  }}
                >
                  <h4
                    id="prompt-templates"
                    className="heading-subsection font-medium mb-2 sm:mb-3 bg-gradient-to-r from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent tracking-tight leading-snug min-h-[2.5rem] flex items-center"
                  >
                    Prompt Templates
                  </h4>
                  <p className="text-body-small font-normal text-gray-600 leading-relaxed tracking-tight flex-grow flex items-center">
                    Create reusable prompt structures for consistent and efficient results across similar tasks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chain of Thoughts Section */}
        <section className="bg-gradient-to-b from-ethos-offwhite to-ethos-light pt-6 md:pt-8 lg:pt-12 pb-12 md:pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 items-center">
              <div>
                <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
                  <span className="text-ethos-navy">Chain of Thoughts </span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                  >
                    Prompting
                  </span>
                </h2>

                <div>
                  <p className="text-ethos-gray text-body-default font-normal leading-normal tracking-tight mb-3 lg:mb-4">
                    Chain of Thought (CoT) prompting is a powerful technique that guides AI models
                    to break down complex problems into logical steps, similar to human reasoning.
                    Instead of jumping to conclusions, the AI explains its thinking process, making
                    its responses more accurate and transparent. This approach is particularly
                    effective for tasks requiring multi-step reasoning or complex problem-solving.
                  </p>

                  <p className="text-ethos-gray text-body-default font-normal leading-normal tracking-tight">
                    This technique excels in complex scenarios like mathematical problem-solving,
                    code debugging, logical analysis, and multi-step decision making. By encouraging
                    the AI to show its work, you can verify its reasoning, catch potential errors,
                    and ensure the final output aligns with your expectations. It's like having a
                    collaborative partner that explains their thinking at each step.
                  </p>

                  <p className="text-ethos-gray text-body-default font-normal leading-normal tracking-tight">
                    In essence, Chain of Thought transforms AI from a tool that simply provides
                    answers into a system that can demonstrate reasoning, justify conclusions, and
                    reveal the logic behind its outputs—making it not only more effective but also
                    more trustworthy and interpretable in fields like education, research, customer
                    service, and beyond.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <img
                  src={`${baseUrl}assets/marketing/images/techniques/technique-33d3874838600fa90097bf09b02e6fa049405c93.jpg`}
                  alt="Chain of Thoughts illustration"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices Section */}
        <section className="bg-gradient-to-b from-[#F3F3F3] to-[#E8E8E8] py-12 md:py-16 lg:py-20 xl:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-8 lg:mb-12">
              <h2
                id="best-practices-heading"
                className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6"
              >
                <span className="text-ethos-navy">Best Practices and </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Common Pitfalls
                </span>
              </h2>
            </header>

            {/* Main content with three columns: Best Practices | Image | Common Pitfalls */}
            <div className="mb-8 lg:mb-12 relative">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_auto_minmax(300px,1fr)] gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center justify-items-center min-h-[480px] md:min-h-[450px] lg:min-h-[500px]">
                {/* Left Card - Best Practices - Purple */}
                <div className="relative order-2 lg:order-1 group w-full max-w-md xl:max-w-lg mx-auto lg:-ml-6 px-4 sm:px-6 lg:px-0">
                  {/* Background Shape */}
                  <div
                    className="absolute inset-0 rounded-2xl transition-all duration-300 group-hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    style={{ background: '#6D6AED' }}
                  />

                  {/* Content */}
                  <div className="relative z-10 p-6 sm:p-6 lg:p-8 xl:p-10 min-h-[240px] sm:min-h-[280px] lg:min-h-[320px] flex flex-col justify-center">
                    <h3 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium leading-tight tracking-tight mb-4 sm:mb-6 lg:mb-8 text-center">
                      Best Practices
                    </h3>

                    <div>
                      <div className="flex items-start gap-2 sm:gap-3 group/item mb-4 sm:mb-5 lg:mb-6">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0 mt-1 transition-transform duration-200 group-hover/item:scale-110"
                          style={{ background: '#7900E3' }}
                          role="presentation"
                          aria-hidden="true"
                        />
                        <p className="text-white text-body-small leading-relaxed tracking-[-0.03em] transition-opacity duration-200 group-hover/item:opacity-90">
                          Instead of "make it better," say "improve the performance by reducing
                          database calls"
                        </p>
                      </div>

                      <div className="h-px bg-white/20 my-2 sm:my-3 transition-opacity duration-300 hover:bg-white/40" />

                      <div className="flex items-start gap-3 sm:gap-4 group/item">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0 mt-1.5 transition-transform duration-200 group-hover/item:scale-110"
                          style={{ background: '#7900E3' }}
                          role="presentation"
                          aria-hidden="true"
                        />
                        <p className="text-white text-body-small leading-relaxed tracking-[-0.03em] transition-opacity duration-200 group-hover/item:opacity-90">
                          Include relevant background information and constraints
                        </p>
                      </div>

                      <div className="h-px bg-white/20 my-2 sm:my-3 transition-opacity duration-300 hover:bg-white/40" />

                      <div className="flex items-start gap-3 sm:gap-4 group/item">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0 mt-1.5 transition-transform duration-200 group-hover/item:scale-110"
                          style={{ background: '#7900E3' }}
                          role="presentation"
                          aria-hidden="true"
                        />
                        <p className="text-white text-body-small leading-relaxed tracking-[-0.03em] transition-opacity duration-200 group-hover/item:opacity-90">
                          Show what good output looks like with concrete examples
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Image */}
                <div className="order-1 lg:order-2 flex justify-center items-center w-full max-w-[240px] sm:max-w-[300px] md:max-w-[360px] lg:max-w-[400px] xl:max-w-[440px] mx-auto h-full min-h-[200px] lg:min-h-[300px] my-auto">
                  <img
                    src={`${baseUrl}assets/marketing/images/techniques/ai5.png`}
                    alt="Best practices illustration"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    role="img"
                  />
                </div>

                {/* Right Card - Common Pitfalls - Dark Blue */}
                <div className="relative order-3 lg:order-3 group w-full max-w-md xl:max-w-lg mx-auto lg:-mr-6 px-4 sm:px-6 lg:px-0">
                  {/* Background Shape */}
                  <div
                    className="absolute inset-0 rounded-2xl transition-all duration-300 group-hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    style={{ background: '#2E3D88' }}
                  />

                  {/* Content */}
                  <div className="relative z-10 p-6 sm:p-6 lg:p-8 xl:p-10 min-h-[240px] sm:min-h-[280px] lg:min-h-[320px] flex flex-col justify-center">
                    <h3 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium leading-tight tracking-tight mb-4 sm:mb-6 lg:mb-8 text-center">
                      Common Pitfalls
                    </h3>

                    <div>
                      <div className="flex items-start gap-2 sm:gap-3 group/item mb-4 sm:mb-5 lg:mb-6">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0 mt-1 transition-transform duration-200 group-hover/item:scale-110"
                          style={{ background: '#7900E3' }}
                          role="presentation"
                          aria-hidden="true"
                        />
                        <p className="text-white text-body-small leading-relaxed tracking-[-0.03em] transition-opacity duration-200 group-hover/item:opacity-90">
                          "Make it good" vs "Optimize the function for readability and performance"
                        </p>
                      </div>

                      <div className="h-px bg-white/20 my-2 sm:my-3 transition-opacity duration-300 hover:bg-white/40" />

                      <div className="flex items-start gap-3 sm:gap-4 group/item">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0 mt-1.5 transition-transform duration-200 group-hover/item:scale-110"
                          style={{ background: '#7900E3' }}
                          role="presentation"
                          aria-hidden="true"
                        />
                        <p className="text-white text-body-small leading-relaxed tracking-[-0.03em] transition-opacity duration-200 group-hover/item:opacity-90">
                          Break complex tasks into smaller, manageable prompts
                        </p>
                      </div>

                      <div className="h-px bg-white/20 my-2 sm:my-3 transition-opacity duration-300 hover:bg-white/40" />

                      <div className="flex items-start gap-3 sm:gap-4 group/item">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0 mt-1.5 transition-transform duration-200 group-hover/item:scale-110"
                          style={{ background: '#7900E3' }}
                          role="presentation"
                          aria-hidden="true"
                        />
                        <p className="text-white text-body-small leading-relaxed tracking-[-0.03em] transition-opacity duration-200 group-hover/item:opacity-90">
                          Always provide necessary background, even if it seems obvious
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Evaluation and Testing Section */}
        <section className="bg-gradient-to-b from-[#E8E8E8] to-white relative overflow-hidden py-12 md:py-16 lg:py-20 xl:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
            {/* Header Content */}
            <header className="text-center mb-8 lg:mb-12">
              <h2
                id="evaluation-testing-heading"
                className="heading-section font-medium leading-tight tracking-tight mb-3 sm:mb-4"
              >
                <span className="text-ethos-gray">Evaluation and </span>
                <span className="text-ethos-purple">Testing</span>
              </h2>

              <p className="text-ethos-gray text-body-large font-normal leading-relaxed tracking-tight max-w-5xl mx-auto">
                Just like software testing, prompt engineering requires systematic evaluation to
                ensure reliability and effectiveness.
              </p>
            </header>

            {/* Desktop: Show diagram image */}
            <div className="hidden md:block relative z-10 flex justify-center">
              <img
                src={`${baseUrl}assets/marketing/images/techniques/Group 281.png`}
                alt="Prompt Engineering Process Diagram"
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Mobile/Tablet: Show detailed cards */}
            <div className="lg:hidden">
              {/* Subtitle */}
              <div className="mb-6">
                <h3 className="text-ethos-gray text-body-large font-semibold leading-[1.2] tracking-[-0.72px] text-left">
                  Things to keep in mind..
                </h3>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Testing Strategies Card */}
                <div className="bg-white rounded-2xl p-8 shadow-[0_4px_4px_0_rgba(0,0,0,0.25),30px_30px_50px_0_rgba(0,39,80,0.05)_inset,-30px_-30px_50px_0_rgba(255,255,255,0.70)_inset] min-h-[320px] flex flex-col">
                  <h4 className="text-ethos-gray text-body-large font-medium leading-[1.1] tracking-[-0.6px] text-center mb-4">
                    Testing Strategies
                  </h4>

                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 17" fill="none">
                          <path
                            d="M13.4743 5.88693C15.4749 7.04151 15.4749 9.92903 13.4743 11.0836L5.24113 15.8351C3.24113 16.9893 0.74159 15.5459 0.74159 13.2367V3.73382C0.74159 1.42466 3.24113 -0.0187476 5.24113 1.13548L13.4743 5.88693Z"
                            fill="url(#paint0_linear_589_13)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_13"
                              x1="6.48658"
                              y1="-3"
                              x2="6.48658"
                              y2="19.9705"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.1] tracking-[-0.54px] mb-1">
                          Edge Cases
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.1] tracking-[-0.54px]">
                          Test with unusual or extreme inputs
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 17" fill="none">
                          <path
                            d="M13.4821 5.88693C15.4827 7.04151 15.4827 9.92903 13.4821 11.0836L5.24894 15.8351C3.24894 16.9893 0.749403 15.5459 0.749403 13.2367V3.73382C0.749403 1.42466 3.24894 -0.0187476 5.24894 1.13548L13.4821 5.88693Z"
                            fill="url(#paint0_linear_589_14)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_14"
                              x1="6.49439"
                              y1="-3"
                              x2="6.49439"
                              y2="19.9705"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.1] tracking-[-0.54px] mb-1">
                          Variations
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.1] tracking-[-0.54px]">
                          Try different phrasings of the same prompt
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 17" fill="none">
                          <path
                            d="M13.4801 5.88693C15.4807 7.04151 15.4807 9.92903 13.4801 11.0836L5.24699 15.8351C3.24699 16.9893 0.74745 15.5459 0.74745 13.2367V3.73382C0.74745 1.42466 3.24699 -0.0187476 5.24699 1.13548L13.4801 5.88693Z"
                            fill="url(#paint0_linear_589_15)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_15"
                              x1="6.49244"
                              y1="-3"
                              x2="6.49244"
                              y2="19.9705"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.1] tracking-[-0.54px] mb-1">
                          Cross-Validation
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.1] tracking-[-0.54px]">
                          Test across different AI models if possible
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Iteration Process Card */}
                <div className="bg-white rounded-2xl p-8 shadow-[0_4px_4px_0_rgba(0,0,0,0.25),30px_30px_50px_0_rgba(0,39,80,0.05)_inset,-30px_-30px_50px_0_rgba(255,255,255,0.70)_inset] min-h-[320px] flex flex-col">
                  <h4 className="text-ethos-gray text-body-large font-medium leading-[1.1] tracking-[-0.6px] text-center mb-4">
                    Iteration Process
                  </h4>

                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 17" fill="none">
                          <path
                            d="M13.3047 6.05739C15.3047 7.21209 15.3047 10.0988 13.3047 11.2535L4.82149 16.1513C2.82149 17.306 0.321495 15.8626 0.321495 13.5532V3.75769C0.321495 1.44828 2.8215 0.00491142 4.8215 1.15961L13.3047 6.05739Z"
                            fill="url(#paint0_linear_589_19)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_19"
                              x1="6.14923"
                              y1="-3"
                              x2="6.14923"
                              y2="20.3109"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.45] tracking-[-0.54px] mb-1">
                          Initial Testing
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.45] tracking-[-0.54px]">
                          Start with the simple test cases
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 17" fill="none">
                          <path
                            d="M13.3086 6.05739C15.3086 7.21209 15.3086 10.0988 13.3086 11.2535L4.8254 16.1513C2.8254 17.306 0.325401 15.8626 0.325401 13.5532V3.75769C0.325401 1.44828 2.8254 0.00491142 4.8254 1.15961L13.3086 6.05739Z"
                            fill="url(#paint0_linear_589_20)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_20"
                              x1="6.15313"
                              y1="-3"
                              x2="6.15313"
                              y2="20.3109"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.45] tracking-[-0.54px] mb-1">
                          Analyze Results
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.45] tracking-[-0.54px]">
                          Identify patterns in response
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 17" fill="none">
                          <path
                            d="M13.3086 6.05739C15.3086 7.21209 15.3086 10.0988 13.3086 11.2535L4.8254 16.1513C2.8254 17.306 0.325401 15.8626 0.325401 13.5532V3.75769C0.325401 1.44828 2.8254 0.00491142 4.8254 1.15961L13.3086 6.05739Z"
                            fill="url(#paint0_linear_589_21)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_21"
                              x1="6.15313"
                              y1="-3"
                              x2="6.15313"
                              y2="20.3109"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.45] tracking-[-0.54px] mb-1">
                          Refine Prompt
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.45] tracking-[-0.54px]">
                          Adjust based on findings
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 17" fill="none">
                          <path
                            d="M13.3047 6.05739C15.3047 7.21209 15.3047 10.0988 13.3047 11.2535L4.82149 15.8351C2.82149 16.9893 0.321495 15.5459 0.321495 13.2367V3.73382C0.321495 1.42466 2.8215 0.00491142 4.8215 1.15961L13.3047 6.05739Z"
                            fill="url(#paint0_linear_589_22)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_22"
                              x1="6.14923"
                              y1="-3"
                              x2="6.14923"
                              y2="20.3109"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.45] tracking-[-0.54px] mb-1">
                          Validate Changes
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.45] tracking-[-0.54px]">
                          Re-test the refined prompt
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success Matrix Card */}
                <div className="bg-white rounded-2xl p-8 shadow-[0_4px_4px_0_rgba(0,0,0,0.25),30px_30px_50px_0_rgba(0,39,80,0.05)_inset,-30px_-30px_50px_0_rgba(255,255,255,0.70)_inset] min-h-[320px] flex flex-col">
                  <h4 className="text-ethos-gray text-body-large font-medium leading-[1.1] tracking-[-0.6px] text-center mb-4">
                    Success Matrix
                  </h4>

                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 16" fill="none">
                          <path
                            d="M12.5898 5.44692C14.5898 6.60162 14.5898 9.48838 12.5898 10.6431L5.02234 15.0122C3.02234 16.1669 0.522343 14.7235 0.522343 12.4141V3.6759C0.522343 1.3665 3.02234 -0.076875 5.02234 1.07783L12.5898 5.44692Z"
                            fill="url(#paint0_linear_589_28)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_28"
                              x1="6.04484"
                              y1="-3"
                              x2="6.04484"
                              y2="19.09"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.45] tracking-[-0.54px] mb-1">
                          Accuracy
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.45] tracking-[-0.54px]">
                          Are the responses correct and relevant?
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 16" fill="none">
                          <path
                            d="M12.5898 5.44692C14.5898 6.60162 14.5898 9.48838 12.5898 10.6431L5.02234 15.0122C3.02234 16.1669 0.522343 14.7235 0.522343 12.4141V3.6759C0.522343 1.3665 3.02234 -0.076875 5.02234 1.07783L12.5898 5.44692Z"
                            fill="url(#paint0_linear_589_29)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_29"
                              x1="6.04484"
                              y1="-3"
                              x2="6.04484"
                              y2="19.09"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.45] tracking-[-0.54px] mb-1">
                          Consistency
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.45] tracking-[-0.54px]">
                          Do similar prompts get similar responses?
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rotate-90 flex-shrink-0 mt-1">
                        <svg viewBox="0 0 15 16" fill="none">
                          <path
                            d="M12.5898 5.44692C14.5898 6.60162 14.5898 9.48838 12.5898 10.6431L5.02234 15.0122C3.02234 16.1669 0.522343 14.7235 0.522343 12.4141V3.6759C0.522343 1.3665 3.02234 -0.076875 5.02234 1.07783L12.5898 5.44692Z"
                            fill="url(#paint0_linear_589_30)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_589_30"
                              x1="6.04484"
                              y1="-3"
                              x2="6.04484"
                              y2="19.09"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#FFD5AC" />
                              <stop offset="1" stopColor="#FF0037" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-ethos-purple text-body-large font-normal leading-[1.45] tracking-[-0.54px] mb-1">
                          Usability
                        </h5>
                        <p className="text-ethos-gray text-body-large font-normal leading-[1.45] tracking-[-0.54px]">
                          Is the output format practical and useful?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentation Card */}
                <div className="bg-white rounded-2xl p-8 shadow-[0_4px_4px_0_rgba(0,0,0,0.25),30px_30px_50px_0_rgba(0,39,80,0.05)_inset,-30px_-30px_50px_0_rgba(255,255,255,0.70)_inset] min-h-[320px] flex flex-col">
                  <h4 className="text-ethos-gray text-body-large font-medium leading-[1.1] tracking-[-0.6px] text-center mb-4">
                    Documentation
                  </h4>

                  <div className="flex-1">
                    <div className="mb-4">
                      <h5 className="text-ethos-purple text-body-large font-normal leading-[1.45] tracking-[-0.54px] mb-4">
                        Keep track of your prompt engineering process
                      </h5>
                      <div className="text-ethos-gray text-body-large font-normal leading-[1.45] tracking-[-0.54px]">
                        <p className="text-body-large mb-2">• Record successful patterns</p>
                        <p className="text-body-large mb-2">• Document edge cases</p>
                        <p className="text-body-large mb-2">• Note model-specific behaviors</p>
                        <p className="text-body-large mb-2 last:mb-0">• Share learnings with team</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <LearningMaterialSection baseUrl={baseUrl} />

        {/* Start Your Learning Journey Section */}
        <section
          className="bg-white py-16 md:py-20 lg:py-24 xl:py-28 relative overflow-hidden"
          aria-labelledby="learning-journey-heading"
        >
          {/* Full-width background image */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <img
              src={withBase('assets/marketing/images/prompting-guide/Group 216.png')}
              alt="Learning journey background illustration"
              className="w-full h-full object-contain opacity-80"
              loading="lazy"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <header className="text-center mb-8 md:mb-10 lg:mb-12">
              <h2
                id="learning-journey-heading"
                className="text-4xl sm:text-5xl lg:text-5xl font-medium leading-tight tracking-[-0.02em] mb-6"
              >
                <span className="text-ethos-navy">Continue your </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  learning journey
                </span>
              </h2>
            </header>

            {/* Learning Tiles */}
            <div className="flex justify-center">
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 max-w-6xl mx-auto"
                role="list"
                aria-label="Learning paths"
              >
                {/* Learn the Basics Tile */}
                <article className="group h-full" role="listitem">
                  <Link
                    to="/guides/basics"
                    className="block h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#7409C5] focus:ring-offset-2 animate-star-border rounded-2xl sm:rounded-3xl"
                    aria-label="Learn the basics of prompt engineering"
                  >
                    <div className="bg-white p-6 md:p-7 lg:p-8 h-full flex flex-col">
                      {/* Icon in content area like ServiceCard */}
                      <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full shadow-sm border-2 border-white/30 absolute top-4 right-4" style={{ background: 'linear-gradient(135deg, #A200FF 0%, #7938A4 50%, #5A189A 100%)' }}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 17L17 7M17 7H7M17 7V17"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{
                          background: 'linear-gradient(to right, #7409C5, #A200FF)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}>
                          Learn the Basics
                        </h3>

                        <p className="text-base text-gray-600 leading-relaxed">
                          Learn the foundational skills of prompt engineering — how to craft clear,
                          effective prompts to get accurate, creative, and useful responses from AI
                          systems and applications.
                        </p>
                      </div>
                    </div>
                  </Link>
                </article>

                {/* Practice in Prompt Library Tile */}
                <article className="group h-full" role="listitem">
                  <Link
                    to="/prompt-library"
                    className="block h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#7409C5] focus:ring-offset-2 animate-star-border rounded-2xl sm:rounded-3xl"
                    aria-label="Explore the Prompt Library"
                  >
                    <div className="bg-white p-6 md:p-7 lg:p-8 h-full flex flex-col">
                      {/* Icon in content area like ServiceCard */}
                      <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full shadow-sm border-2 border-white/30 absolute top-4 right-4" style={{ background: 'linear-gradient(135deg, #A200FF 0%, #7938A4 50%, #5A189A 100%)' }}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 17L17 7M17 7H7M17 7V17"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{
                          background: 'linear-gradient(to right, #7409C5, #A200FF)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}>
                          Practice in Prompt Library
                        </h3>

                        <p className="text-base text-gray-600 leading-relaxed">
                          Put your skills into practice with our curated collection of prompts. Explore,
                          customize, and master real-world prompting scenarios to become an expert in AI
                          communication.
                        </p>
                      </div>
                    </div>
                  </Link>
                </article>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
};
