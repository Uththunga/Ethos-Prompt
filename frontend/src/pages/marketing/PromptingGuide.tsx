import React from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';
import { Button } from '@/components/marketing/ui/button';
import { Link } from 'react-router-dom';

export const PromptingGuide = () => {
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
          className="bg-gradient-to-b from-white to-[#FEFEFE] relative overflow-hidden py-16 md:py-20 lg:py-24 xl:py-28"
          aria-labelledby="hero-heading"
        >
          <div className="max-w-7xl mx-auto relative h-full px-4 sm:px-6 lg:px-8">
            {/* Title Text - positioned at the top */}
            <header className="text-center">
              <h1 id="hero-heading" className="text-display-xl font-semibold font-poppins">
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
                  Master the art of
                </span>
                <br />
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
                  AI Communication
                </span>
              </h1>
            </header>

            {/* Hero Image - positioned below the title */}
            <div className="w-full max-w-7xl mx-auto mb-8 lg:mb-12 px-4 sm:px-6 -mt-12 sm:-mt-16">
              <img
                src={withBase('assets/marketing/images/ai-communication-illustration.webp')}
                alt=""
                className="w-full h-auto object-contain"
                style={{ maxHeight: '70vh', width: '100%' }}
                aria-hidden="true"
                loading="lazy"
              />
            </div>

            {/* Subtitle - positioned at bottom */}
            <div className="text-center">
              <p className="text-ethos-gray font-normal leading-relaxed text-body-large w-full text-center whitespace-normal sm:whitespace-nowrap overflow-visible sm:overflow-hidden sm:text-ellipsis">
                Master the art of communicating with AI through strategic prompting. Learn to craft
                precise instructions that transform your ideas into exceptional results, whether
                you're coding, writing, or solving complex problems.
              </p>
            </div>
          </div>
        </section>

        {/* Journey Section */}
        <section
          className="bg-gradient-to-b from-[#FEFEFE] via-[#FEFEFE] to-[#E8E8E8] py-16 md:py-20 lg:py-24 xl:py-28"
          aria-labelledby="journey-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-8 lg:mb-12">
              <div>
                <h2
                  id="journey-heading"
                  className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6"
                >
                  <span className="text-ethos-navy">Your Journey to Becoming a </span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                  >
                    Prompt Expert
                  </span>
                </h2>
              </div>
            </header>

            {/* Three Step Cards - redesigned to match new layout */}
            <div
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 mb-8 lg:mb-12 max-w-5xl mx-auto"
              role="list"
              aria-label="Learning journey steps"
            >
              {/* Step 1 */}
              <article
                className="bg-white rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                role="listitem"
              >
                <div className="flex items-start gap-5 mb-3">
                  <div
                    className="text-6xl sm:text-7xl font-bold bg-gradient-to-b from-[#7A71DF] to-[#442785] bg-clip-text text-transparent drop-shadow-[0_18px_28.5px_rgba(0,0,0,0.25)] -mt-1"
                    aria-hidden="true"
                  >
                    1
                  </div>
                  <div className="flex-1 pt-2 text-left">
                    <h3 className="text-2xl sm:text-3xl font-medium bg-gradient-to-b from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent">
                      Understand the<br />basics
                    </h3>
                  </div>
                </div>
                <p className="text-gray-800 text-body-large leading-relaxed text-center">
                  Learn the core principles of AI interpretation and requests.
                </p>
              </article>

              {/* Step 2 */}
              <article
                className="bg-white rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                role="listitem"
              >
                <div className="flex items-start gap-5 mb-3">
                  <div
                    className="text-6xl sm:text-7xl font-bold bg-gradient-to-b from-[#7A71DF] to-[#442785] bg-clip-text text-transparent drop-shadow-[0_18px_28.5px_rgba(0,0,0,0.25)] -mt-1"
                    aria-hidden="true"
                  >
                    2
                  </div>
                  <div className="flex-1 pt-2 text-left">
                    <h3 className="text-2xl sm:text-3xl font-medium bg-gradient-to-b from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent">
                      Master advanced<br />techniques
                    </h3>
                  </div>
                </div>
                <p className="text-gray-800 text-body-large leading-relaxed text-center">
                  Explore advanced methods like zero-shot, few-shot, and chain-of-thought prompting.
                </p>
              </article>

              {/* Step 3 */}
              <article
                className="bg-white rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                role="listitem"
              >
                <div className="flex items-start gap-5 mb-3">
                  <div
                    className="text-6xl sm:text-7xl font-bold bg-gradient-to-b from-[#7A71DF] to-[#442785] bg-clip-text text-transparent drop-shadow-[0_18px_28.5px_rgba(0,0,0,0.25)] -mt-1"
                    aria-hidden="true"
                  >
                    3
                  </div>
                  <div className="flex-1 pt-2 text-left">
                    <h3 className="text-2xl sm:text-3xl font-medium bg-gradient-to-b from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent">
                      Transform ideas<br />into reality
                    </h3>
                  </div>
                </div>
                <p className="text-gray-800 text-body-large leading-relaxed text-center">
                  Apply your skills to solve complex problems and create results.
                </p>
              </article>
            </div>

            {/* What is Prompting Section */}
            <section
              className="pt-16 md:pt-20 lg:pt-24 xl:pt-28 pb-8 md:pb-12 lg:pb-16"
              aria-labelledby="what-is-prompting-heading"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Responsive Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">
                  {/* Text Content Column */}
                  <div className="order-2 lg:order-1">
                    {/* Section Header - Left Aligned */}
                    <header className="mb-6 md:mb-8 lg:mb-10">
                      <h2
                        id="what-is-prompting-heading"
                        className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6"
                      >
                        <span className="text-ethos-navy">What is </span>
                        <span
                          className="bg-clip-text text-transparent"
                          style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                        >
                          Prompting?
                        </span>
                      </h2>
                    </header>

                    {/* Content */}
                    <div>
                      <p className="text-ethos-gray text-body-large font-normal leading-relaxed mb-4 md:mb-5 lg:mb-6">
                        Think of prompting as having a conversation with an AI. It's the art of
                        giving clear, specific instructions to guide the AI towards the exact result
                        you want. In essence, you're not just asking a question; you're programming
                        the AI with words.
                      </p>

                      <p className="text-ethos-gray text-body-large font-normal leading-relaxed mb-4 md:mb-5 lg:mb-6 last:mb-0">
                        A great prompt is like a good recipe—it gives the AI all the right
                        ingredients and steps to create something amazing for you.
                      </p>

                      {/* CTA Button */}
                      <div className="pt-6 md:pt-8 lg:pt-10">
                        <Link to="/prompt-library" className="inline-block">
                          <Button
                            variant="ethos"
                            size="lg"
                            className="group"
                          >
                            Go to Playground
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Image Column */}
                  <div className="order-1 lg:order-2 relative w-full">
                    <div className="flex justify-center w-full">
                      <img
                        src={withBase('assets/marketing/images/prompting-illustration.webp')}
                        alt="Interactive prompting illustration demonstrating AI conversation principles"
                        className="w-full max-w-none h-auto object-contain"
                        style={{ maxHeight: '56vh', width: 'auto' }}
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* AI vs Human Conversation Section */}
        <section className="bg-gray-100 py-16 md:py-20 lg:py-24 xl:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
                <span className="text-ethos-navy">AI vs. Human </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Conversation
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-10">
              {/* Talking to Human */}
              <div className="bg-white rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] p-6 sm:p-8 lg:p-10 xl:p-12 shadow-[30px_30px_50px_0_rgba(0,39,80,0.05)_inset,-30px_-30px_50px_0_rgba(255,255,255,0.70)_inset,0_4px_4px_0_rgba(0,0,0,0.25)] min-h-[240px] sm:min-h-[260px] lg:min-h-[310px] flex flex-col justify-center">
                <h3 className="text-3xl font-bold leading-tight text-center mb-6 lg:mb-8">
                  <span className="text-ethos-gray">Talking to a </span>
                  <span className="text-ethos-purple">Human</span>
                </h3>

                <div>
                  <p className="text-ethos-gray text-base font-normal leading-relaxed mb-4 sm:mb-6">
                    Humans understand context, read between the lines, and use shared experiences to
                    fill in the gaps. You can be vague, and they'll likely still get what you mean.
                  </p>

                  <p className="text-ethos-gray text-base font-bold leading-relaxed mb-4 sm:mb-6 last:mb-0">
                    "Hey, can you suggest a dinner spot? Something not too fancy."
                  </p>
                </div>
              </div>

              {/* Talking to AI */}
              <div className="bg-white rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] p-6 sm:p-8 lg:p-10 xl:p-12 shadow-[30px_30px_50px_0_rgba(0,39,80,0.05)_inset,-30px_-30px_50px_0_rgba(255,255,255,0.70)_inset,0_4px_4px_0_rgba(0,0,0,0.25)] min-h-[240px] sm:min-h-[260px] lg:min-h-[310px] flex flex-col justify-center">
                <h3 className="text-3xl font-bold leading-tight text-center mb-6 lg:mb-8">
                  <span className="text-ethos-gray">Talking to an </span>
                  <span className="text-ethos-purple">AI</span>
                </h3>

                <div>
                  <p className="text-ethos-gray text-base font-normal leading-relaxed mb-4 sm:mb-6">
                    AI needs clear, direct instructions. It doesn't have personal experiences or
                    intuition, so you need to provide all the necessary details for it to give you
                    the best response.
                  </p>

                  <p className="text-ethos-gray text-base font-bold leading-relaxed mb-4 sm:mb-6 last:mb-0">
                    "Suggest 3 casual Italian restaurants in San Francisco suitable for a date
                    night, with an average price under $50 per person."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Let's Break Down a Prompt Section */}
        <section className="bg-[#030823]" aria-labelledby="prompt-breakdown-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-end">
              {/* Text Content Column - Always on top on mobile, left on desktop */}
              <div className="order-1 lg:order-1 my-12 lg:my-16 flex flex-col justify-center">
                {/* Section Header - Left Aligned */}
                <header className="mb-8 md:mb-10 lg:mb-12">
                  <h2
                    id="prompt-breakdown-heading"
                    className="text-4xl sm:text-5xl lg:text-5xl font-bold leading-tight tracking-tight mb-3"
                  >
                    <span
                      style={{
                        fontFamily: 'Poppins',
                        background: 'linear-gradient(to right, #ffffff, #a0aec0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        display: 'inline',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Let's break down a prompt
                    </span>
                  </h2>
                  <p className="text-gray-200 text-body-large leading-relaxed max-w-2xl mb-4 mt-1">
                    A good prompt is made of several key parts. Let's look at an example and see how
                    they work together.
                  </p>
                </header>

                {/* Content Points */}
                <div className="-mt-2">
                  {/* Point 1 */}
                  <article className="flex items-start gap-4 mb-6">
                    <div className="w-6 h-6 bg-[#E16D00] rounded flex-shrink-0 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="text-[#E16D00] text-lg font-bold leading-tight tracking-tight mb-2">
                        The Role: Set the Persona
                      </h3>
                      <p className="text-gray-200 text-base leading-relaxed">
                        Tells the AI who to be. This sets the tone, style, and expertise.
                      </p>
                    </div>
                  </article>

                  {/* Point 2 */}
                  <article className="flex items-start gap-4 mb-6">
                    <div className="w-6 h-6 bg-[#399703] rounded flex-shrink-0 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="text-[#399703] text-lg font-bold leading-tight tracking-tight mb-2">
                        The Task: Define the Goal
                      </h3>
                      <p className="text-gray-200 text-base leading-relaxed">
                        This is the core instruction—what you want the AI to do.
                      </p>
                    </div>
                  </article>

                  {/* Point 3 */}
                  <article className="flex items-start gap-4 mb-6">
                    <div className="w-6 h-6 bg-[#008A9D] rounded flex-shrink-0 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="text-[#008A9D] text-lg font-bold leading-tight tracking-tight mb-2">
                        The Context: Provide the Details
                      </h3>
                      <p className="text-gray-200 text-base leading-relaxed">
                        This gives the AI the 'who, what, where' to work with.
                      </p>
                    </div>
                  </article>

                  {/* Point 4 */}
                  <article className="flex items-start gap-4 mb-6">
                    <div className="w-6 h-6 bg-[#D50072] rounded flex-shrink-0 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="text-[#D50072] text-lg font-bold leading-tight tracking-tight mb-2">
                        The Constraint: Set the Rules
                      </h3>
                      <p className="text-gray-200 text-base leading-relaxed">
                        These are boundaries that guide the output.
                      </p>
                    </div>
                  </article>
                </div>
              </div>

              {/* Image Column - Always below text on mobile, right on desktop */}
              <div className="order-2 lg:order-2 relative h-full min-h-[40vh] lg:min-h-[70vh] bg-gradient-to-br from-ethos-navy/50 via-ethos-navy/30 to-ethos-navy/10 rounded-2xl overflow-visible">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 flex justify-center items-center opacity-20 pointer-events-none">
                  <img
                    src={withBase('assets/marketing/images/background-grid-pattern.webp')}
                    alt=""
                    className="w-full max-w-[300px] md:max-w-[400px] lg:max-w-[600px] xl:max-w-[700px] h-auto transform -rotate-45"
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>

                {/* Main Illustration */}
                <div className="relative z-50 flex justify-start items-end h-full w-full p-0 overflow-visible pl-8">
                  <img
                    src={withBase('assets/marketing/images/prompting-guide/Group 281.webp')}
                    alt="AI prompt breakdown illustration showing the components of effective prompting"
                    className="h-auto w-auto max-h-[60vh] max-w-[92vw] md:max-h-[70vh] md:max-w-[80vw] object-contain object-bottom"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Start Your Learning Journey Section */}
        <section
          className="bg-white py-16 md:py-20 lg:py-24 xl:py-28 relative overflow-hidden"
          aria-labelledby="learning-journey-heading"
        >
          {/* Full-width background image */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <img
              src={withBase('assets/marketing/images/prompting-guide/Group 216.webp')}
              alt="Learning journey background illustration"
              className="w-full h-full object-contain opacity-80"
              loading="lazy"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <header className="text-center mb-8 md:mb-10 lg:mb-12">
              <h2
                id="learning-journey-heading"
                className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6"
              >
                <span className="text-ethos-navy">Start your </span>
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

                {/* Explore Techniques Tile */}
                <article className="group h-full" role="listitem">
                  <Link
                    to="/guides/techniques"
                    className="block h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#7409C5] focus:ring-offset-2 animate-star-border rounded-2xl sm:rounded-3xl"
                    aria-label="Explore advanced prompt engineering techniques"
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
                          Explore Techniques
                        </h3>

                        <p className="text-base text-gray-600 leading-relaxed">
                          Dive into practical techniques to enhance your prompt engineering skills — master
                          advanced methods like zero-shot, few-shot, and chain-of-thought prompting to achieve
                          more sophisticated AI interactions.
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
