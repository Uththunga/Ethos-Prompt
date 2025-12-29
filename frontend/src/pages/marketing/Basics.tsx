import React from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';
import { Button } from '@/components/marketing/ui/button';
import { Link } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export const Basics = () => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';

  // State to control chevron visibility
  const [showChevron] = useState(true);

  // Scroll to next section function
  const scrollToNextSection = () => {
    const nextSection = document.getElementById('ai-to-llm-heading');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main role="main" id="main-content" className="pt-4">
        <section
          className="bg-gradient-to-b from-white via-white to-[#E8E8E8] relative overflow-hidden py-16 md:py-20 lg:py-24 xl:py-28"
          aria-labelledby="hero-heading"
        >
          {/* Background Image */}
          <div className="absolute right-96 top-0 bottom-0 w-1/2 pointer-events-none opacity-80 hidden md:block">
            <img
              src={`${baseUrl}assets/marketing/images/basics/Group 287.png`}
              alt=""
              className="h-[120%] w-auto object-contain object-right-bottom"
              style={{ transform: 'translateY(-5%)' }}
              aria-hidden="true"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 items-center min-h-[350px] sm:min-h-[400px] lg:min-h-[450px] xl:min-h-[500px]">
              {/* Left Content */}
              <div className="flex flex-col justify-center relative z-10">
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
                      The Story of
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
                      Prompting
                    </span>
                  </h1>
                </header>

                {/* Description */}
                <div className="mb-3 md:mb-4 lg:mb-5">
                  <p className="text-[#313131] text-body-large font-normal leading-relaxed tracking-tight max-w-xl">
                    Explore how artificial intelligence learns to communicate like humans in this
                    engaging, interactive journey that unpacks machine learning, language models,
                    and the evolving relationship between AI and natural conversation.
                  </p>
                </div>
              </div>

              {/* Hero section chevron */}
              {showChevron && (
                <div
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 cursor-pointer"
                  onClick={scrollToNextSection}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToNextSection()}
                  role="button"
                  tabIndex={0}
                >
                  <div className="animate-bounce p-2 transition-all duration-300 hover:scale-110">
                    <ChevronDownIcon className="h-8 w-8 text-gray-700 hover:text-gray-900" aria-hidden="true" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* From AI to LLM Section */}
        <section
          id="ai-to-llm-heading"
          className="bg-gradient-to-b from-white via-white to-[#E8E8E8] py-16 md:py-20 lg:py-24 xl:py-28"
          aria-labelledby="ai-to-llm-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Title */}
            <header className="text-center mb-8 lg:mb-12">
              <h2
                id="ai-to-llm-heading"
                className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6"
              >
                <span className="text-ethos-navy">Understanding </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Language Models
                </span>
              </h2>

              <p className="text-ethos-gray text-body-large font-normal leading-relaxed max-w-6xl mx-auto">
                While often called "AI" tools, these systems are specifically Large Language Models
                (LLMs) - sophisticated programs designed to understand and generate human language.
                Understanding how LLMs work is essential for prompt engineering, as it helps you
                communicate more effectively with these models and achieve better results.
              </p>
            </header>

            {/* What is an LLM Really? */}
            <section className="mb-16 lg:mb-20" aria-labelledby="what-is-llm-heading">
              <h3
                id="what-is-llm-heading"
                className="heading-section font-medium leading-tight tracking-[-0.02em] text-center mb-6"
              >
                <span className="text-ethos-navy">What is an </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  LLM Really?
                </span>
              </h3>

              <p className="text-[#313131] text-body-large font-normal leading-relaxed text-center mx-auto mb-8 lg:mb-12">
                Think of a Large Language Model (LLM) like a super-smart student who has read every
                book in the world's biggest library. Just like how a student learns by reading
                books, an LLM learns by processing vast amounts of text from the internet.
              </p>

              {/* L-L-M Breakdown Cards */}
              <div
                className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 mb-8 lg:mb-12 max-w-5xl mx-auto"
                role="list"
                aria-label="LLM component breakdown"
              >
                {/* Large Card */}
                <article
                  className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                  role="listitem"
                >
                  <div className="text-center mb-3">
                    <h3 className="text-2xl sm:text-3xl font-medium bg-gradient-to-b from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent">
                      Large
                    </h3>
                  </div>
                  <p className="text-gray-800 text-body-large leading-relaxed text-center">
                    Vast knowledge bank - like having read millions of books!
                  </p>
                </article>

                {/* Language Card */}
                <article
                  className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                  role="listitem"
                >
                  <div className="text-center mb-3">
                    <h3 className="text-2xl sm:text-3xl font-medium bg-gradient-to-b from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent">
                      Language
                    </h3>
                  </div>
                  <p className="text-gray-800 text-body-large leading-relaxed text-center">
                    Understand and respond in human languages!
                  </p>
                </article>

                {/* Model Card */}
                <article
                  className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                  role="listitem"
                >
                  <div className="text-center mb-3">
                    <h3 className="text-2xl sm:text-3xl font-medium bg-gradient-to-b from-[#7471E0] to-[#EA73D4] bg-clip-text text-transparent">
                      Model
                    </h3>
                  </div>
                  <p className="text-gray-800 text-body-large leading-relaxed text-center">
                    The intelligent part that processes patterns and thinks!
                  </p>
                </article>
              </div>
            </section>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h3 id="llm-description-heading" className="sr-only">
                What is a Large Language Model?
              </h3>
              <p className="text-ethos-gray text-body-large font-normal leading-relaxed max-w-5xl mx-auto">
                Large Language Models are AI systems trained by processing vast amounts of text from
                diverse sources, including PhD-level knowledge in specific subjects, enabling them to
                understand, apply, and recreate expert-level content.
              </p>
            </div>
          </div>
        </section>

        {/* Pre-Training, Fine-Tuning, Prompting Section */}
        <section className="bg-gradient-to-b from-[#E9EBEB] to-white py-16 md:py-20 lg:py-24 xl:py-28 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16 md:mb-20 lg:mb-24">
              {/* Main Content */}
              <div className="text-center">
                {/* Pre-Training */}
                <div className="mb-12 lg:mb-16">
                  <h3 className="heading-section font-medium leading-tight tracking-[-0.02em] text-center mb-6">
                    <span className="text-ethos-navy">What is </span>
                    <span
                      className="bg-clip-text text-transparent"
                      style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                    >
                      Pre-Training?
                    </span>
                  </h3>
                  <p className="text-[#313131] text-body-large font-normal leading-relaxed">
                    This is where the "L" (Large) in LLM comes to life! Pre-training is the
                    foundational phase where an AI model acquires its vast knowledge by processing
                    enormous amounts of text data - like a student speed-reading through millions of
                    books, articles, and documents simultaneously.
                  </p>
                </div>

                {/* Fine-Tuning */}
                <div className="mb-12 lg:mb-16">
                  <h3 className="heading-section font-medium leading-tight tracking-[-0.02em] text-center mb-6">
                    <span className="text-ethos-navy">What is </span>
                    <span
                      className="bg-clip-text text-transparent"
                      style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                    >
                      Fine-Tuning?
                    </span>
                  </h3>
                  <p className="text-[#313131] text-body-large font-normal leading-relaxed">
                    This is where the "M" (Model) in LLM truly comes to life! While pre-training
                    provides vast knowledge, fine-tuning transforms this raw knowledge into
                    sophisticated thinking and decision-making abilities - it's like transforming a
                    medical student who has memorized textbooks into a skilled doctor who can
                    diagnose and treat patients effectively.
                  </p>
                </div>

                {/* Prompting */}
                <div>
                  <h3 className="heading-section font-medium leading-tight tracking-[-0.02em] text-center mb-6">
                    <span className="text-ethos-navy">What is </span>
                    <span
                      className="bg-clip-text text-transparent"
                      style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                    >
                      Prompting?
                    </span>
                  </h3>
                  <p className="text-[#313131] text-body-large font-normal leading-relaxed">
                    This is where the second "L" (Language) in LLM comes to life! Prompting is like
                    having a conversation with a highly knowledgeable assistant - you communicate
                    your needs in plain language, and the AI understands and responds accordingly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 20+ LLMs Available Section */}
        <section
          className="py-16 md:py-20 lg:py-24 xl:py-28 relative overflow-hidden"
          aria-labelledby="llms-available-heading"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={`${baseUrl}assets/marketing/images/basics/Image.png`}
              alt=""
              className="w-full h-full object-cover opacity-40"
              aria-hidden="true"
            />
          </div>
          <div className="max-w-7xl mx-auto">
            {/* Content */}
            <div className="relative z-10 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center min-h-[300px] md:min-h-[350px] lg:min-h-[400px]">
                {/* Left Column - App Logos Image */}
                <div className="flex justify-center items-center">
                  <img
                    src={`${baseUrl}assets/marketing/images/basics/App Logos.png`}
                    alt="Collection of LLM logos and AI platforms"
                    className="w-full h-auto max-w-[500px]"
                  />
                </div>

                {/* Right Column - Content */}
                <div className="lg:pl-8 xl:pl-16 text-center lg:text-left">

                  <div className="flex flex-col gap-6 mb-6 md:mb-8">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight text-center mb-6">
                      <span className="text-ethos-navy">The world of AI offers many different types of </span>
                      <span
                        className="bg-clip-text text-transparent"
                        style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                      >
                        Large Language Models
                      </span>
                      <span className="text-ethos-navy">, each with unique strengths:</span>
                    </h3>

                    <div className="flex flex-col gap-4 text-left">
                      <div>
                        <h4 className="text-xl font-semibold text-ethos-purple mb-2">Closed-Source LLMs</h4>
                        <p className="text-gray-800 text-body-large leading-relaxed">
                          Proprietary models developed by companies. Examples: <strong>GPT-4</strong> (OpenAI), <strong>Claude</strong> (Anthropic), <strong>Gemini</strong> (Google).
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xl font-semibold text-ethos-purple mb-2">Open-Source LLMs</h4>
                        <p className="text-gray-800 text-body-large leading-relaxed">
                          Freely available models anyone can use and modify. Examples: <strong>Llama</strong> (Meta), <strong>Mistral</strong>, <strong>Falcon</strong>.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xl font-semibold text-ethos-purple mb-2">General vs Specialized</h4>
                        <p className="text-gray-800 text-body-large leading-relaxed">
                          <strong>General models</strong> handle various tasks, while <strong>specialized models</strong> excel at specific areas like coding (CodeLlama), medical analysis, or legal documents.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps - Advanced Techniques Section */}
        <section className="bg-gradient-to-b from-[#E9EBEB] to-white py-16 md:py-20 lg:py-24 xl:py-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl sm:text-5xl lg:text-5xl font-medium leading-tight mb-6 md:mb-8 text-center">
                <span className="text-ethos-navy">Ready for </span>
                <span
                  className="font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Advanced Techniques?
                </span>
              </h2>

              <p className="text-ethos-gray text-body-large font-normal leading-relaxed max-w-3xl mx-auto">
                Now that you understand the basics, take your prompting skills to the next level.
                Discover advanced techniques like Chain of Thought, Role Playing, and Context
                Engineering.
              </p>

              <div className="pt-6 md:pt-8">
                <Button
                  variant="ethos"
                  size="lg"
                  className="group"
                  asChild
                  aria-label="Explore advanced prompt engineering techniques"
                >
                  <Link to="/guides/techniques">Explore Advanced Techniques</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
};
