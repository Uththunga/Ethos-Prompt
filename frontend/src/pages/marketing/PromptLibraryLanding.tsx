import { memo } from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';
import { Button } from '@/components/marketing/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle, Lightbulb, Zap } from 'lucide-react';

const features = [
  {
    title: 'Intelligent Prompt Management',
    description:
      'AI-assisted prompt creation with templates, versioning, and variables. Build a reusable library with our smart editor.',
  },
  {
    title: 'Document Intelligence',
    description:
      'Upload documents (PDF, DOCX, TXT, MD) up to 10MB. Automatic processing and indexing makes your documents instantly searchable.',
  },
  {
    title: 'RAG Technology',
    description:
      'Hybrid search combining BM25 and semantic understanding. Get accurate, context-aware responses from your knowledge base.',
  },
  {
    title: 'Multi-Model Execution',
    description:
      '10+ free AI models plus premium options (GPT-4, Claude, Gemini). Compare responses across models with no vendor lock-in.',
  },
  {
    title: 'Real-time Analytics',
    description:
      'Track costs per model, monitor performance metrics, and analyze success rates to optimize AI spending and quality.',
  },
  {
    title: 'Team Collaboration',
    description:
      'Share prompts with your team and collaborate in real-time. Build shared libraries and workspaces for seamless teamwork.',
  },
];

const benefits = [
  {
    title: 'Build Faster',
    description:
      'Stop rewriting prompts. Reuse templates for common tasks and ship AI features in days, not months.'
  },
  {
    title: 'Get Smarter Answers',
    description:
      'Give your AI access to the latest data for accurate, context-aware responses that understand your business.'
  },
  {
    title: 'Automate Workflows',
    description:
      'Turn complex, multi-step tasks into automated workflows. Chain prompts together for sophisticated AI operations.'
  },
  {
    title: 'Empower Teams',
    description:
      'Allow non-technical users to run powerful AI tasks without writing code. Democratize AI across your organization.'
  }
];

export const PromptLibraryLanding = memo(function PromptLibraryLanding() {
  const baseUrl = import.meta.env.BASE_URL || '/';

  const withBase = (path: string) => {
    const cleanPath = path.replace(/^\/+/, '');
    return baseUrl.endsWith('/') ? `${baseUrl}${cleanPath}` : `${baseUrl}/${cleanPath}`;
  };

  const handleGetStarted = () => {
    // Dashboard removed - show coming soon message
    alert('Dashboard Coming Soon! We\'re preparing an exciting new experience.');
  };

  const animationStyle = `
    @keyframes shine {
      to {
        background-position: 200% center;
      }
    }

    @keyframes float {
      0% { transform: translate(-50%, -50%) translateY(0); }
      50% { transform: translate(-50%, -50%) translateY(-1mm); }
      100% { transform: translate(-50%, -50%) translateY(0); }
    }
    .animate-float-slow {
      animation: float 4s ease-in-out infinite;
    }

    @keyframes hero-star-border {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Sequential animation with staggered delays for features */
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.2; }
      16.67% { opacity: 0.8; }
      33.33% { opacity: 0.2; }
    }

    [role="list"][aria-label="Prompt Library Features"] > div:nth-child(1) .animate-star-border::before {
      animation:
        hero-star-border 4s linear 0s infinite,
        fadeInOut 18s ease-in-out 0s infinite;
    }

    [role="list"][aria-label="Prompt Library Features"] > div:nth-child(2) .animate-star-border::before {
      animation:
        hero-star-border 4s linear 0s infinite,
        fadeInOut 18s ease-in-out -3s infinite;
    }

    [role="list"][aria-label="Prompt Library Features"] > div:nth-child(3) .animate-star-border::before {
      animation:
        hero-star-border 4s linear 0s infinite,
        fadeInOut 18s ease-in-out -6s infinite;
    }

    [role="list"][aria-label="Prompt Library Features"] > div:nth-child(4) .animate-star-border::before {
      animation:
        hero-star-border 4s linear 0s infinite,
        fadeInOut 18s ease-in-out -9s infinite;
    }

    [role="list"][aria-label="Prompt Library Features"] > div:nth-child(5) .animate-star-border::before {
      animation:
        hero-star-border 4s linear 0s infinite,
        fadeInOut 18s ease-in-out -12s infinite;
    }

    [role="list"][aria-label="Prompt Library Features"] > div:nth-child(6) .animate-star-border::before {
      animation:
        hero-star-border 4s linear 0s infinite,
        fadeInOut 18s ease-in-out -15s infinite;
    }

    /* Specific to Hero section cards */
    .animate-star-border {
      position: relative;
      z-index: 0;
      overflow: hidden;
    }

    [role="list"][aria-label="Prompt Library Features"] .animate-star-border::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: -10px;
      background: conic-gradient(
        from 0deg,
        rgba(139, 92, 246, 0.1),
        rgba(139, 92, 246, 0.4),
        rgba(168, 85, 247, 0.6),
        rgba(192, 132, 252, 0.7),
        rgba(216, 180, 254, 0.6),
        rgba(139, 92, 246, 0.1) 180deg,
        rgba(139, 92, 246, 0.4),
        rgba(168, 85, 247, 0.6),
        rgba(192, 132, 252, 0.7),
        rgba(216, 180, 254, 0.6),
        rgba(139, 92, 246, 0.1) 360deg
      );
      border-radius: inherit;
      opacity: 0.2;
      filter: blur(2.5px);
    }

    [role="list"][aria-label="Prompt Library Features"] .animate-star-border.animate::before {
      opacity: 0.8;
    }

    [role="list"][aria-label="Prompt Library Features"] .animate-star-border::after {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 1.5px;
      background: linear-gradient(to bottom, #ffffff, #f9fafb);
      border-radius: inherit;
      box-shadow: inset 0 0 25px rgba(139, 92, 246, 0.08);
    }
  `;

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: animationStyle }} />
      <Navigation />
      <main role="main" id="main-content" className="font-sans antialiased">
        {/* Hero Section */}
        <section
          className="bg-gradient-to-b from-[#FEFEFE] to-[#FEFEFE] py-16 md:py-20 lg:py-24 xl:py-28"
          aria-labelledby="hero-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile Layout */}
            <div className="flex flex-col gap-4 md:!hidden" aria-labelledby="hero-heading-mobile">
              {/* Title */}
              <div>
                <header className="text-center">
                  <h1 id="hero-heading-mobile" className="text-display-xl font-semibold font-poppins">
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
                      The Complete AI
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
                      Prompt Engine
                    </span>
                  </h1>
                </header>
              </div>

              {/* Image */}
              <div className="w-full h-full flex items-center justify-center overflow-visible -mt-4">
                <div className="relative w-full max-w-5xl">
                  <img
                    src={withBase('assets/marketing/images/Group 303.webp')}
                    alt="AI Prompt Library Dashboard showing prompt management, document intelligence, and RAG technology"
                    className="w-full h-auto mx-auto scale-110 origin-center"
                    decoding="async"
                    loading="lazy"
                    style={{
                      filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15)) brightness(1.05) saturate(1.1) contrast(1.05) hue-rotate(-5deg)',
                    }}
                    onError={(e) => {
                      e.currentTarget.src = withBase('assets/marketing/images/Group 303.webp');
                    }}
                  />
                </div>
              </div>

              {/* Key Stats Bar */}
              <div>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 mb-4">
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                    <CheckCircle className="w-5 h-5 text-ethos-purple" />
                    <span className="font-medium">10+ Free AI Models</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                    <Zap className="w-5 h-5 text-ethos-purple" />
                    <span className="font-medium">RAG-Enhanced</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                    <CheckCircle className="w-5 h-5 text-ethos-purple" />
                    <span className="font-medium">Real-time Collaboration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                    <CheckCircle className="w-5 h-5 text-ethos-purple" />
                    <span className="font-medium">Enterprise Security</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="w-full flex items-center justify-center mt-8 mb-4 px-4">
                <Button
                  variant="ethos"
                  size="lg"
                  className="group"
                  aria-label="Coming Soon"
                  onClick={handleGetStarted}
                >
                  Coming Soon
                </Button>
              </div>
            </div>

            {/* Desktop Layout - Original Structure */}
            <div className="!hidden md:!grid md:grid-cols-2 gap-8 items-center" aria-labelledby="hero-heading">
              <div>
                {/* Main Heading */}
                <header className="text-center md:text-left">
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
                      The Complete AI
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
                      Prompt Engine
                    </span>
                  </h1>

                  {/* Key Stats Bar */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 mt-6 mb-4">
                    <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                      <CheckCircle className="w-5 h-5 text-ethos-purple" />
                      <span className="font-medium">10+ Free AI Models</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                      <Zap className="w-5 h-5 text-ethos-purple" />
                      <span className="font-medium">RAG-Enhanced</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                      <CheckCircle className="w-5 h-5 text-ethos-purple" />
                      <span className="font-medium">Real-time Collaboration</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
                      <CheckCircle className="w-5 h-5 text-ethos-purple" />
                      <span className="font-medium">Enterprise Security</span>
                    </div>
                  </div>
                </header>

                {/* CTA Button with increased top spacing */}
                <div className="w-full flex items-center justify-center md:justify-start mt-16 mb-8 md:mt-24 md:mb-10">
                  <Button
                    variant="ethos"
                    size="lg"
                    className="w-full sm:w-auto group"
                    aria-label="Coming Soon"
                    onClick={handleGetStarted}
                  >
                    Coming Soon
                  </Button>
                </div>

              </div>

              {/* Right: Image */}
              <div className="w-full h-full flex items-center justify-center overflow-visible">
                <div className="relative w-full max-w-5xl xl:max-w-7xl 2xl:max-w-8xl">
                  <img
                    src={withBase('assets/marketing/images/Group 303.webp')}
                    alt="AI Prompt Library Dashboard showing prompt management, document intelligence, and RAG technology"
                    className="w-full h-auto mx-auto md:ml-0 scale-110 md:scale-125 lg:scale-150 xl:scale-175 2xl:scale-200 origin-center"
                    decoding="async"
                    loading="lazy"
                    style={{
                      filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15)) brightness(1.05) saturate(1.1) contrast(1.05) hue-rotate(-5deg)',
                    }}
                    onError={(e) => {
                      // Fallback to PNG if WebP fails to load
                      e.currentTarget.src = withBase('assets/marketing/images/Group 303.webp');
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="w-full py-16 md:py-20 lg:py-24"
          style={{ background: 'linear-gradient(180deg, #FFF 37.11%, #E8E8E8 100%)' }}
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.header
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 id="features-heading" className="heading-section">
                <span className="text-ethos-navy">Enterprise-Grade Prompt Engine </span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                  >
                    Capabilities
                  </span>
              </h2>
              <p className="text-body-large text-ethos-gray font-light leading-relaxed tracking-normal max-w-3xl mx-auto mt-4">
                Everything you need to build, manage, and scale AI-powered applications with RAG
                intelligence
              </p>
            </motion.header>

            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto"
              role="list"
              aria-label="Prompt Library Features"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="w-full rounded-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 * index,
                    ease: 'easeOut',
                  }}
                >
                  <div className="group h-full">
                    <div className="h-full bg-white rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-star-border">
                      <h3 className="text-xl font-semibold text-ethos-navy mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-20 lg:py-24 bg-white" aria-labelledby="benefits-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.header
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 id="benefits-heading" className="heading-section mb-4">
                <span className="text-ethos-navy">Why Choose </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Prompt Engine?
                </span>
              </h2>
              <p className="text-body-large text-gray-600 max-w-3xl mx-auto">
                Transform how your team works with AI. From developers to business users, everyone
                benefits from intelligent prompt management.
              </p>
            </motion.header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-gradient-to-br from-ethos-purple/5 to-white rounded-2xl p-8 border border-ethos-purple/10 hover:border-ethos-purple/30 transition-all duration-300 h-full">
                    <div>
                      <h3 className="text-2xl font-semibold text-ethos-navy mb-3">{benefit.title}</h3>
                      <p className="text-gray-700 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
          aria-labelledby="how-it-works-heading"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ethos-purple/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ethos-navy/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.header
              className="text-center mb-16 md:mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 id="how-it-works-heading" className="heading-section mb-4">
                <span className="text-ethos-navy">How </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Prompt Engine Works
                </span>
              </h2>
              <p className="text-body-large text-gray-600 max-w-3xl mx-auto">
                From upload to optimization—get started in minutes with our intelligent workflow
              </p>
            </motion.header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
              {/* Animated connection line for desktop */}
              <div className="hidden lg:block absolute top-20 left-[12.5%] right-[12.5%] h-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-ethos-purple/20 via-ethos-purple/40 to-ethos-purple/20" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-ethos-purple to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>

              {[
                {
                  step: '01',
                  title: 'Upload & Organize',
                  description:
                    'Upload documents and create prompt templates. Build your knowledge base and prompt library.',
                                color: 'from-violet-500 to-purple-600',
                },
                {
                  step: '02',
                  title: 'Enhance with AI',
                  description:
                    'Use AI-assisted prompt creation. RAG technology automatically injects relevant context from your documents.',
                                color: 'from-purple-500 to-indigo-600',
                },
                {
                  step: '03',
                  title: 'Execute Anywhere',
                  description:
                    'Run prompts across 10+ AI models. Compare responses, stream results, and choose the best model for each task.',
                                color: 'from-indigo-500 to-blue-600',
                },
                {
                  step: '04',
                  title: 'Analyze & Optimize',
                  description:
                    'Track costs, monitor performance, and analyze success rates. Make data-driven decisions to improve quality.',
                                color: 'from-blue-500 to-cyan-600',
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative group"
                >
                  {/* Card */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="relative bg-white rounded-2xl p-6 md:p-8 shadow-md border border-gray-100 hover:border-ethos-purple/30 hover:shadow-2xl transition-all duration-300 h-full"
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-ethos-purple/0 to-ethos-navy/0 group-hover:from-ethos-purple/5 group-hover:to-ethos-navy/5 transition-all duration-300" />

                    {/* Step number badge */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white border border-ethos-purple/40 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-ethos-purple font-bold text-xl">{step.step}</span>
                    </div>

                    {/* Removed icon container to keep only numbers */}
                    <div className="mb-6" />

                    {/* Content */}
                    <div className="text-center relative z-10">
                      <h3 className="text-xl md:text-2xl font-semibold text-ethos-navy mb-3 group-hover:text-ethos-purple transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow indicator for next step (desktop only) */}
                    {index < 3 && (
                      <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-20">
                        <CheckCircle className="w-6 h-6 text-ethos-purple/40 group-hover:text-ethos-purple group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Call to action */}
            <motion.div
              className="text-center mt-12 md:mt-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <p className="text-gray-600 mb-6">
                Ready to streamline your AI workflow?
              </p>
              <Button
                variant="ethos"
                size="lg"
                className="group"
                onClick={handleGetStarted}
              >
                Coming Soon
              </Button>
            </motion.div>
          </div>
        </section>

        {/* AI Models Section - Interactive Redesign */}
        <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden" aria-labelledby="models-heading">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-ethos-purple/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.header
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 id="models-heading" className="heading-section mb-4">
                <span className="text-ethos-navy">Multi-Model Comparison </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Made Simple
                </span>
              </h2>
              <p className="text-body-large text-gray-600 max-w-3xl mx-auto mb-6">
                Add any LLM and get responses instantly. Compare free and paid models side-by-side with your own API keys.
              </p>

              {/* Key Features Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="inline-flex items-center gap-2 bg-white border-2 border-ethos-purple/20 rounded-full px-4 py-2 shadow-sm hover:shadow-md hover:border-ethos-purple/40 transition-all"
                >
                  <CheckCircle className="w-4 h-4 text-ethos-purple" />
                  <span className="text-sm font-medium text-gray-700">Side-by-Side Comparison</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-white border-2 border-green-500/20 rounded-full px-4 py-2 shadow-sm hover:shadow-md hover:border-green-500/40 transition-all"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Add Any LLM</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="inline-flex items-center gap-2 bg-white border-2 border-blue-500/20 rounded-full px-4 py-2 shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all"
                >
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Your API Keys</span>
                </motion.div>
              </div>
            </motion.header>

            {/* Interactive Model Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
              {/* Free Models Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden"
              >
                {/* Animated gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="text-xl font-semibold text-ethos-navy">Free Models</h3>
                        <p className="text-xs text-gray-500">No API key needed</p>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                      FREE
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Start instantly with powerful free models. Perfect for testing and development.
                  </p>

                  <div className="flex flex-col gap-2 mb-4">
                    {[
                      { name: 'Grok 4 Fast', tag: 'Fast' },
                      { name: 'GLM 4.5 Air', tag: 'Smart' },
                      { name: 'DeepSeek Chat', tag: 'Versatile' },
                      { name: 'Llama 3.3 70B', tag: 'Powerful' },
                      { name: 'Mistral 7B', tag: 'Efficient' },
                    ].map((model, idx) => (
                      <motion.div
                        key={model.name}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">{model.name}</span>
                        </div>
                        <span className="text-xs text-green-600 font-medium">{model.tag}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>5+ more models available</span>
                  </div>
                </div>
              </motion.div>

              {/* Premium Models Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-white rounded-2xl p-6 border-2 border-ethos-purple/30 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden"
              >
                {/* Animated gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-ethos-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-ethos-purple" />
                      <div>
                        <h3 className="text-xl font-semibold text-ethos-navy">Premium Models</h3>
                        <p className="text-xs text-gray-500">Your API keys</p>
                      </div>
                    </div>
                    <div className="bg-ethos-purple/10 text-ethos-purple text-xs font-bold px-3 py-1 rounded-full">
                      BYOK
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Use your own API keys for premium models. Full control, transparent pricing.
                  </p>

                  <div className="flex flex-col gap-2 mb-4">
                    {[
                      { name: 'GPT-4 Turbo', tag: 'OpenAI' },
                      { name: 'Claude 3.5 Sonnet', tag: 'Anthropic' },
                      { name: 'Gemini Pro', tag: 'Google' },
                      { name: 'GPT-4o', tag: 'OpenAI' },
                      { name: 'Claude 3 Opus', tag: 'Anthropic' },
                    ].map((model, idx) => (
                      <motion.div
                        key={model.name}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-ethos-purple/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-ethos-purple mr-2" />
                          <span className="text-sm text-gray-700">{model.name}</span>
                        </div>
                        <span className="text-xs text-ethos-purple font-medium">{model.tag}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>5+ more models available</span>
                  </div>
                </div>
              </motion.div>

              {/* Multi-Model Comparison Feature Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-white border-2 border-ethos-purple/30 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all group relative"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-ethos-purple" />
                    <div>
                      <h3 className="text-xl font-semibold text-ethos-navy">Compare Models</h3>
                      <p className="text-xs text-gray-600">Side-by-side analysis</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-6">
                    Run the same prompt across multiple models and compare responses in real-time.
                  </p>

                  <div className="flex flex-col gap-3 mb-6">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <CheckCircle className="w-4 h-4 text-ethos-purple mr-2" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">Mix & Match</h4>
                        <p className="text-xs text-gray-600">Combine free and premium models in one comparison</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <CheckCircle className="w-4 h-4 text-ethos-purple mr-2" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">Real-Time Streaming</h4>
                        <p className="text-xs text-gray-600">Watch responses generate simultaneously</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <CheckCircle className="w-4 h-4 text-ethos-purple mr-2" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">Quality Analysis</h4>
                        <p className="text-xs text-gray-600">Compare accuracy, speed, and cost metrics</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-ethos-purple/10 rounded-lg p-3 border border-ethos-purple/20">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4 text-ethos-purple flex-shrink-0" />
                      <p className="text-xs text-ethos-purple font-medium text-center">
                        No vendor lock-in • Full flexibility • Your choice
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>


          </div>
        </section>

        {/* Use Cases Section - Redesigned */}
        <section
          className="py-16 md:py-20 lg:py-24 relative overflow-hidden"
          aria-labelledby="use-cases-heading"
          style={{ backgroundColor: 'var(--bg-gray-section)' }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-ethos-purple/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.header
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 id="use-cases-heading" className="heading-section mb-4">
                <span className="text-ethos-navy">Built for </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Every AI Use Case
                </span>
              </h2>
              <p className="text-body-large text-gray-600 max-w-3xl mx-auto">
                From customer support to code generation, Prompt Engine powers diverse AI applications with intelligent automation
              </p>
            </motion.header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  title: 'Customer Support',
                  description: 'Automate intelligent responses with context from your knowledge base',
                  features: [
                    'Instant answers from your docs',
                    'Context-aware responses',
                    '24/7 automated support',
                  ],
                  color: 'from-blue-500 to-cyan-500',
                  bgColor: 'bg-blue-50',
                  textColor: 'text-blue-600',
                  borderColor: 'border-blue-200',
                  example: 'Help customers instantly with accurate, document-backed answers',
                },
                {
                  title: 'Content Generation',
                  description: 'Create high-quality content at scale with AI assistance',
                  features: [
                    'Blog posts & articles',
                    'Marketing copy & emails',
                    'Social media content',
                  ],
                  color: 'from-purple-500 to-pink-500',
                  bgColor: 'bg-purple-50',
                  textColor: 'text-purple-600',
                  borderColor: 'border-purple-200',
                  example: 'Generate engaging content that resonates with your audience',
                },
                {
                  title: 'Code Generation',
                  description: 'Accelerate development with AI-powered coding assistance',
                  features: [
                    'Generate code snippets',
                    'Debug & optimize code',
                    'Write documentation',
                  ],
                  color: 'from-green-500 to-emerald-500',
                  bgColor: 'bg-green-50',
                  textColor: 'text-green-600',
                  borderColor: 'border-green-200',
                  example: 'Build faster with intelligent code suggestions and debugging',
                },
                {
                  title: 'Data Analysis',
                  description: 'Extract insights and visualize data with natural language',
                  features: [
                    'Query data in plain English',
                    'Generate insights & reports',
                    'Visualize trends',
                  ],
                  color: 'from-orange-500 to-red-500',
                  bgColor: 'bg-orange-50',
                  textColor: 'text-orange-600',
                  borderColor: 'border-orange-200',
                  example: 'Turn complex data into actionable insights effortlessly',
                },
                {
                  title: 'Education & Training',
                  description: 'Enhance learning with personalized AI-powered tutoring',
                  features: [
                    'Personalized explanations',
                    'Interactive Q&A',
                    'Study guides & summaries',
                  ],
                  color: 'from-indigo-500 to-blue-500',
                  bgColor: 'bg-indigo-50',
                  textColor: 'text-indigo-600',
                  borderColor: 'border-indigo-200',
                  example: 'Create adaptive learning experiences for any subject',
                },
                {
                  title: 'Team Collaboration',
                  description: 'Share and manage prompts across your organization',
                  features: [
                    'Shared prompt libraries',
                    'Team workspaces',
                    'Version control',
                  ],
                  color: 'from-teal-500 to-cyan-500',
                  bgColor: 'bg-teal-50',
                  textColor: 'text-teal-600',
                  borderColor: 'border-teal-200',
                  example: 'Collaborate seamlessly with centralized prompt management',
                },
              ].map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  className={`group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border-2 ${useCase.borderColor} hover:border-opacity-50 overflow-hidden`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Header with gradient accent */}
                    <div className="mb-4">
                      <div className={`inline-block px-3 py-1 rounded-full ${useCase.bgColor} ${useCase.textColor} text-xs font-semibold mb-3`}>
                        Use Case
                      </div>
                      <h3 className="text-xl font-semibold text-ethos-navy mb-2 group-hover:text-ethos-purple transition-colors">
                        {useCase.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="flex flex-col gap-2 mb-4">
                      {useCase.features.map((feature, idx) => (
                        <motion.div
                          key={idx}
                          className="flex items-start gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: index * 0.1 + idx * 0.1 }}
                        >
                          <CheckCircle className={`w-4 h-4 ${useCase.textColor} flex-shrink-0 mt-0.5`} />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Example use case */}
                    <div className={`mt-4 pt-4 border-t ${useCase.borderColor} border-opacity-30`}>
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-500 italic">
                          {useCase.example}
                        </p>
                      </div>
                    </div>

                    {/* Hover indicator */}
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-ethos-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Learn more</span>
                      <CheckCircle className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Decorative corner accent */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${useCase.color} opacity-10 rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500`} />
                </motion.div>
              ))}
            </div>

            {/* Call to Action */}
            <motion.div
              className="text-center mt-12 md:mt-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="bg-gradient-to-r from-ethos-purple/10 to-blue-500/10 rounded-2xl p-8 border border-ethos-purple/20">
                <h3 className="text-2xl font-semibold text-ethos-navy mb-3">
                  Ready to Transform Your Workflow?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Join thousands of teams using Prompt Engine to automate tasks, boost productivity, and unlock the full potential of AI
                </p>
                <Button
                  onClick={handleGetStarted}
                  variant="ethos"
                  size="lg"
                  className="group"
                >
                  Coming Soon
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-white" aria-labelledby="faq-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.header
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 id="faq-heading" className="heading-section mb-4">
                <span className="text-ethos-navy">Frequently Asked </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Questions
                </span>
              </h2>
              <p className="text-body-large text-gray-600">
                Everything you need to know about Prompt Engine
              </p>
            </motion.header>

            <div className="flex flex-col gap-6">
              {[
                {
                  question: 'What is RAG technology and why does it matter?',
                  answer:
                    "RAG (Retrieval-Augmented Generation) combines AI models with your own documents to provide accurate, context-aware responses. Instead of relying solely on the AI's training data, RAG retrieves relevant information from your knowledge base, making responses more accurate and up-to-date.",
                },
                {
                  question: 'Which AI models are available for free?',
                  answer:
                    'We offer 10+ free AI models including Grok 4 Fast, GLM 4.5 Air, DeepSeek Chat, Qwen3 Coder, Llama 3.3 70B, and Mistral 7B. No API key required—just sign up and start building.',
                },
                {
                  question: 'Can I use my own API keys for premium models?',
                  answer:
                    'Yes! Bring your own OpenRouter API key to access premium models like GPT-4, Claude 3.5 Sonnet, and Gemini Pro. You only pay for what you use directly to the provider.',
                },
                {
                  question: 'What file formats can I upload?',
                  answer:
                    'Prompt Engine supports PDF, DOCX, TXT, and MD files up to 10MB each. Documents are automatically processed, chunked, and indexed for RAG-enhanced prompts.',
                },
                {
                  question: 'How does cost tracking work?',
                  answer:
                    'We track token usage and costs for every prompt execution. View detailed analytics by model, user, and time period. Optimize your AI spending with real-time insights.',
                },
                {
                  question: 'Is my data secure?',
                  answer:
                    'Yes. We use Firebase Authentication for secure access, role-based permissions, and encrypted API key storage. Your documents and prompts are stored securely and never shared.',
                },
              ].map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 sm:p-6 border border-gray-200"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-ethos-navy mb-3 break-words">{faq.question}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed break-words">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Standardized */}
        <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-medium text-ethos-navy mb-6">
            Ready to Build Smarter <span className="text-ethos-purple">Artificial Intelligence?</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join teams using Prompt Engine to build intelligent AI applications with RAG technology. Start free—no credit card required.
          </p>
          <Button
            onClick={handleGetStarted}
            variant="ethos"
            size="lg"
            className="group"
          >
            Coming Soon
          </Button>
        </div>
      </main>

      <Footer />


    </div>
  );
});
