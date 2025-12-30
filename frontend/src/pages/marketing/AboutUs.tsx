import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';
import { ServiceCTA } from '@/components/marketing/services/ServiceCTA';
import {
    Brain,
    Heart,
    Leaf,
    Lightbulb,
    Code,
    Zap, Factory,
    RefreshCw,
    Shield,
    Flame,
    MapPin,
    Award,
    Building2, Eye,
    Compass, UserCheck,
    Handshake, TrendingUp,
    Clock,
    Globe
} from 'lucide-react';

// Animated Counter Component for scroll-triggered number animation
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  prefix = '',
  duration = 2
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Easing function for smooth finish
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count}{suffix}
    </span>
  );
};

// Enhanced stagger animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main role="main" id="main-content" className="font-sans antialiased">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden bg-gradient-to-b from-[#FEFEFE] to-[#FEFEFE] pt-16 lg:pt-20 pb-8"
          aria-labelledby="about-hero-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-start mb-8 lg:mb-12">
              {/* Left Column - Content */}
              <div className="sm:relative z-10">
                <header>
                  <div className="mb-2 sm:mb-4">
                    <span className="inline-block px-4 py-2 text-ethos-purple text-body-small font-medium rounded-full" style={{
                      background: 'rgba(147, 51, 234, 0.08)',
                      border: '1px solid rgba(147, 51, 234, 0.15)'
                    }}>
                      <span className="relative z-10">Intelligent Solutions Company</span>
                    </span>
                  </div>
                  <h1
                    id="about-hero-heading"
                    className="text-display-2xl font-semibold font-poppins"
                  >
                    <span className="text-ethos-navy">
                      Where Human
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
                      Meets Machine
                    </span>
                  </h1>
                </header>
                <div className="text-ethos-gray text-body-large font-light leading-relaxed tracking-normal max-w-2xl px-2 sm:px-0 pt-4 sm:pt-4">
                  <p className="mb-4">
                    We understand both worlds: <strong className="font-medium text-ethos-navy">the human mind</strong> and
                    <strong className="font-medium text-ethos-navy"> the program</strong>. This unique perspective
                    allows us to create AI solutions that truly work.
                  </p>
                  <p>
                    AI is a powerful tool, but its output depends entirely on you, the human.
                    We help you use this power productively and responsibly.
                  </p>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="relative w-full z-0">
                <img
                  src="/assets/marketing/images/b2b-partnership-hero.webp"
                  alt="B2B Partnership - Human collaboration enhanced by AI technology"
                  className="w-full h-auto max-h-[400px] sm:max-h-[500px] md:max-h-[550px] lg:max-h-[600px] xl:max-h-[650px] max-w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl -mt-8 sm:-mt-12 md:-mt-16 lg:-mt-20 mx-auto object-contain mix-blend-multiply"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>



        {/* Our Mission Section */}
        <section
          className="py-12 md:py-16 lg:py-20"
          style={{ background: '#F2F2F2' }}
          aria-labelledby="mission-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >

              <h2 id="mission-heading" className="heading-section font-medium leading-tight tracking-[-0.02em] mb-4">
                <span className="text-ethos-navy">Our </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Mission
                </span>
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
                We harness the power of artificial intelligence to develop intelligent solutions for industrial use cases,
                while never forgetting the human element and our responsibility to future generations.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Compass className="w-7 h-7 text-purple-600" />,
                  title: 'Human-Centered AI',
                  description: 'Every solution begins with human insight and ends with human value. AI amplifies our capabilities, it never replaces our judgment.',
                  gradient: 'from-purple-50 to-violet-50',
                  borderColor: 'border-purple-100',
                },
                {
                  icon: <Leaf className="w-7 h-7 text-green-600" />,
                  title: 'Sustainable Innovation',
                  description: 'We prioritize energy efficiency in every solution we build. Powerful AI should not come at the cost of our planet.',
                  gradient: 'from-green-50 to-emerald-50',
                  borderColor: 'border-green-100',
                },
                {
                  icon: <Eye className="w-7 h-7 text-blue-600" />,
                  title: 'Transparent Technology',
                  description: 'We build AI solutions that industrial professionals understand and trust. No black boxes, just clear, explainable intelligence.',
                  gradient: 'from-blue-50 to-indigo-50',
                  borderColor: 'border-blue-100',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`bg-gradient-to-br ${item.gradient} rounded-2xl p-6 h-full border ${item.borderColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`} style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.2)' }}>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>



        {/* Stored Intelligence */}
        <section
          className="py-12 md:py-16 lg:py-20 bg-white"
          aria-labelledby="stored-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 id="stored-heading" className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
                  <span className="text-ethos-navy">Store Your </span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                  >
                    Intelligence
                  </span>
                </h2>
                <div className="space-y-4 text-gray-700 text-body-large leading-relaxed">
                  <p>
                    Think about the things you remember and think about <strong className="font-medium text-ethos-navy">every single day</strong>.
                    The same decisions, the same processes, the same patterns.
                  </p>
                  <p>
                    We create Artificial Intelligence that captures this thinking, <strong className="font-medium text-ethos-navy">storing
                    intelligence with data</strong> so it can be used again and again, compounding value over time.
                  </p>
                  <p>
                    Your best thinking, preserved forever. That's the power of stored intelligence.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                {[
                  { icon: <RefreshCw className="w-7 h-7 text-ethos-purple" />, label: 'Reusable Patterns', desc: 'Use again and again' },
                  { icon: <Lightbulb className="w-7 h-7 text-ethos-purple" />, label: 'Captured Thinking', desc: 'Your best ideas stored' },
                  { icon: <Factory className="w-7 h-7 text-ethos-purple" />, label: 'Industrial Solutions', desc: 'Real-world use cases' },
                  { icon: <Zap className="w-7 h-7 text-ethos-purple" />, label: 'Productive Power', desc: 'Solve real problems' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 border border-purple-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    style={{ boxShadow: '0 10px 25px -5px rgba(128, 128, 128, 0.15)' }}
                  >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                      {item.icon}
                    </div>
                    <p className="font-semibold text-ethos-navy mb-1">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* How We Work Section */}
        <section
          className="py-12 md:py-16 lg:py-20"
          style={{ background: '#F2F2F2' }}
          aria-labelledby="how-we-work-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >

              <h2 id="how-we-work-heading" className="heading-section font-medium leading-tight tracking-[-0.02em] mb-4">
                <span className="text-ethos-navy">How We </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Work
                </span>
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
                Our approach puts people first. Every AI solution we create maintains meaningful human oversight
                because we understand that artificial intelligence is a tool, powerful but only as good as the
                guidance it receives.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  icon: <UserCheck className="w-6 h-6 text-ethos-purple" />,
                  title: 'Listen First',
                  description: 'We understand your unique challenges, workflows, and goals before proposing any solution.',
                },
                {
                  step: '02',
                  icon: <Brain className="w-6 h-6 text-ethos-purple" />,
                  title: 'Design Together',
                  description: 'We collaborate with your team to design AI that augments, never replaces, human expertise.',
                },
                {
                  step: '03',
                  icon: <Code className="w-6 h-6 text-ethos-purple" />,
                  title: 'Build Responsibly',
                  description: 'We develop solutions with clear boundaries, safety checks, and energy-conscious architecture.',
                },
                {
                  step: '04',
                  icon: <Handshake className="w-6 h-6 text-ethos-purple" />,
                  title: 'Partner for Success',
                  description: 'We provide ongoing support, ensuring your team remains confident and in control.',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="bg-white rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.2)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold text-purple-200">{item.step}</span>
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-ethos-navy mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-12 bg-white rounded-2xl p-8 border-2 border-ethos-purple/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ boxShadow: '0 20px 40px -10px rgba(147, 51, 234, 0.1)' }}
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-ethos-purple" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-ethos-navy mb-2">Human Oversight is Non-Negotiable</h3>
                  <p className="text-gray-600 leading-relaxed">
                    AI programs are designed to process data and identify patterns, but they cannot feel, empathize, or
                    understand context the way humans do. That's why every solution we build includes clear checkpoints
                    for human review and decision-making. The final call always rests with you.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Our Team Section */}
        <section
          className="py-12 md:py-16 lg:py-20 bg-white"
          aria-labelledby="team-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >

              <h2 id="team-heading" className="heading-section font-medium leading-tight tracking-[-0.02em] mb-4">
                <span className="text-ethos-navy">Our </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Team
                </span>
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
                We're a team of technology professionals who understand both the technical side of AI and the
                practical needs of industrial operations. Our human-centered approach means we never lose sight
                of who we're building for and why.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-100"
                style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}
              >
                <h3 className="text-2xl font-semibold text-ethos-navy mb-6 flex items-center gap-3">
                  <Brain className="w-7 h-7 text-ethos-purple" />
                  Technical Excellence
                </h3>
                <ul className="space-y-4">
                  {[
                    'Deep expertise in machine learning, natural language processing, and data engineering',
                    'Experience building solutions for manufacturing, logistics, and operational environments',
                    'A commitment to writing clean, maintainable, and well-documented code',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-ethos-purple rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-rose-50 to-white rounded-2xl p-8 border border-rose-100"
                style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}
              >
                <h3 className="text-2xl font-semibold text-ethos-navy mb-6 flex items-center gap-3">
                  <Heart className="w-7 h-7 text-rose-500" />
                  Human Understanding
                </h3>
                <ul className="space-y-4">
                  {[
                    'We listen to the people who will use our solutions every day',
                    'We design interfaces that are intuitive and workflows that feel natural',
                    'We believe the best technology is invisible. It just works',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-rose-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Research and Development Section */}
        <section
          className="py-12 md:py-16 lg:py-20"
          style={{ background: '#F2F2F2' }}
          aria-labelledby="rnd-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >

                <h2 id="rnd-heading" className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
                  <span className="text-ethos-navy">Research & </span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                  >
                    Development
                  </span>
                </h2>
                <div className="space-y-4 text-gray-700 text-body-large leading-relaxed">
                  <p>
                    Our ongoing research focuses on a simple but important goal: <strong className="font-medium text-ethos-navy">maximum capability with
                    minimum energy consumption</strong>. Every AI query uses electricity. Every model
                    generates heat. We take this seriously.
                  </p>
                  <p>
                    We explore techniques like model optimization, efficient prompting strategies, and intelligent
                    caching—all aimed at delivering powerful results while respecting the environmental cost of
                    computation.
                  </p>
                  <p>
                    Our R&D isn't just about making AI faster or smarter. It's about making AI <strong className="font-medium text-ethos-navy">sustainable
                    for the long term</strong>.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  {
                    icon: <TrendingUp className="w-7 h-7 text-green-600" />,
                    label: 'Performance Optimization',
                    desc: 'Same power, less energy',
                    gradient: 'from-green-50 to-emerald-50',
                    borderColor: 'border-green-100',
                  },
                  {
                    icon: <Clock className="w-7 h-7 text-blue-600" />,
                    label: 'Smart Caching',
                    desc: 'Reduce redundant processing',
                    gradient: 'from-blue-50 to-indigo-50',
                    borderColor: 'border-blue-100',
                  },
                  {
                    icon: <Zap className="w-7 h-7 text-amber-500" />,
                    label: 'Efficient Prompting',
                    desc: 'Better results, fewer tokens',
                    gradient: 'from-amber-50 to-yellow-50',
                    borderColor: 'border-amber-100',
                  },
                  {
                    icon: <Leaf className="w-7 h-7 text-emerald-600" />,
                    label: 'Sustainable AI',
                    desc: 'Built for the future',
                    gradient: 'from-emerald-50 to-teal-50',
                    borderColor: 'border-emerald-100',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`bg-gradient-to-br ${item.gradient} rounded-2xl p-5 border ${item.borderColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                    style={{ boxShadow: '0 10px 25px -5px rgba(128, 128, 128, 0.15)' }}
                  >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                      {item.icon}
                    </div>
                    <p className="font-semibold text-ethos-navy mb-1">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Energy Responsibility */}
        <section
          className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50"
          aria-labelledby="energy-heading"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-4">
                <span className="text-ethos-navy">Use AI </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Carefully & Responsibly
                </span>
              </h2>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                Yes, AI is a powerful tool. But every prompt uses energy and generates heat to nature.
                We believe in <strong className="font-medium text-ethos-navy">generational responsibility</strong>.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Flame className="w-7 h-7 text-orange-500" />,
                  title: 'Energy Awareness',
                  description: 'Every prompt consumes energy. Every query generates heat. We never forget the environmental cost of AI.',
                  gradient: 'from-orange-50 to-amber-50',
                  borderColor: 'border-orange-100',
                },
                {
                  icon: <Leaf className="w-7 h-7 text-green-600" />,
                  title: 'Minimum Waste',
                  description: 'We research how to create the most powerful and productive solutions using minimum energy, without wasting resources.',
                  gradient: 'from-green-50 to-emerald-50',
                  borderColor: 'border-green-100',
                },
                {
                  icon: <Shield className="w-7 h-7 text-blue-600" />,
                  title: 'Generational Thinking',
                  description: 'Our responsibility extends beyond today. We build AI solutions that respect future generations and our planet.',
                  gradient: 'from-blue-50 to-indigo-50',
                  borderColor: 'border-blue-100',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`bg-gradient-to-br ${item.gradient} rounded-2xl p-6 h-full border ${item.borderColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`} style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.2)' }}>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The Name Meaning */}
        <section
          className="py-12 md:py-16 lg:py-20 bg-white"
          aria-labelledby="name-heading"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-8">
                <span className="text-ethos-navy">Why </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  EthosPrompt?
                </span>
              </h2>

              <div className="inline-flex items-center gap-4 mb-8">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-ethos-purple mb-1">Ethos</div>
                  <div className="text-sm text-gray-500">Ethics · Character · Values</div>
                </div>
                <div className="text-3xl text-gray-300">+</div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-ethos-navy mb-1">Prompt</div>
                  <div className="text-sm text-gray-500">Human Input · Guidance</div>
                </div>
              </div>

              <p className="text-xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
                Ethical, human-guided AI solutions for industrial use cases.
                We make AI work for you, productively, responsibly, and sustainably.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Animated Statistics Section */}
        <section
          className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white via-purple-50/30 to-white"
          aria-labelledby="stats-heading"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 id="stats-heading" className="heading-section font-medium leading-tight tracking-[-0.02em] mb-4">
                <span className="text-ethos-navy">Our </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Commitment in Numbers
                </span>
              </h2>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              {[
                {
                  value: 70,
                  suffix: '%',
                  label: 'More Efficient',
                  description: 'Energy savings from optimized AI prompting',
                  icon: <TrendingUp className="w-8 h-8" />,
                  color: 'text-green-500',
                  bgColor: 'bg-green-50',
                },
                {
                  value: 24,
                  suffix: '/7',
                  label: 'Human Oversight',
                  description: 'Always maintained in every solution',
                  icon: <Eye className="w-8 h-8" />,
                  color: 'text-blue-500',
                  bgColor: 'bg-blue-50',
                },
                {
                  value: 100,
                  suffix: '%',
                  label: 'Australian',
                  description: 'Proudly owned & operated',
                  icon: <Globe className="w-8 h-8" />,
                  color: 'text-ethos-purple',
                  bgColor: 'bg-purple-50',
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  className="text-center p-8 bg-white rounded-3xl border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group"
                  style={{ boxShadow: '0 10px 40px -10px rgba(128, 128, 128, 0.15)' }}
                >
                  <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                    {stat.icon}
                  </div>
                  <div className="text-5xl md:text-6xl font-bold text-ethos-navy mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-lg font-semibold text-gray-800 mb-2">
                    {stat.label}
                  </div>
                  <p className="text-gray-500">{stat.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Trusted Section */}
        <section
          className="py-12 md:py-16 lg:py-20"
          style={{ background: '#F2F2F2' }}
          aria-labelledby="trusted-heading"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-10">
                <span className="text-ethos-navy">Trusted & </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
                >
                  Registered
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <MapPin className="w-8 h-8 text-ethos-purple" />,
                    title: 'Adelaide, Australia',
                    description: 'Proudly based in South Australia',
                  },
                  {
                    icon: <Building2 className="w-8 h-8 text-ethos-purple" />,
                    title: 'Government Registered',
                    description: 'Australian registered company',
                  },
                  {
                    icon: <Award className="w-8 h-8 text-ethos-purple" />,
                    title: 'Ethical Standards',
                    description: 'Committed to responsible AI',
                  },
                ].map((item) => (
                  <motion.div
                    key={item.title}
                    className="bg-white rounded-2xl p-6 text-center"
                    style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.2)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-ethos-navy mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <ServiceCTA
          titlePart1="Ready to Use AI"
          titlePart2="The Right Way?"
          description="Let's create intelligent solutions together, powered by understanding, guided by ethics, built to last."
          buttonText="Start a Conversation"
          buttonLink="/contact"
        />
      </main>

      <Footer />
    </div>
  );
}
