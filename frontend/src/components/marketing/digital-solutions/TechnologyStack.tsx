import { Bot, Cloud, Code, Database, Layers, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

interface Technology {
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  benefits: string[];
}

export const TechnologyStack: React.FC = () => {
  const technologies: Technology[] = [
    {
      name: 'React 18',
      description: 'Modern UI framework for fast, interactive user experiences',
      icon: <Code className="w-8 h-8" />,
      gradient: 'from-blue-500 to-cyan-600',
      benefits: ['Component-based architecture', 'Virtual DOM for performance', 'Rich ecosystem'],
    },
    {
      name: 'TypeScript',
      description: 'Type-safe development for fewer bugs and better maintainability',
      icon: <Code className="w-8 h-8" />,
      gradient: 'from-blue-600 to-indigo-700',
      benefits: ['Catch errors early', 'Better IDE support', 'Self-documenting code'],
    },
    {
      name: 'Tailwind CSS',
      description: 'Utility-first styling for rapid, consistent design implementation',
      icon: <Layers className="w-8 h-8" />,
      gradient: 'from-cyan-500 to-teal-600',
      benefits: ['Rapid development', 'Consistent design', 'Optimized bundle size'],
    },
    {
      name: 'Firebase',
      description: 'Serverless backend with auto-scaling and real-time capabilities',
      icon: <Database className="w-8 h-8" />,
      gradient: 'from-orange-500 to-yellow-600',
      benefits: ['Zero server management', 'Auto-scaling', 'Real-time sync'],
    },
    {
      name: 'PWA',
      description: 'Progressive Web App capabilities for offline access and native feel',
      icon: <Smartphone className="w-8 h-8" />,
      gradient: 'from-purple-500 to-pink-600',
      benefits: ['Offline functionality', 'Push notifications', 'App-like experience'],
    },
    {
      name: 'AI Integration',
      description: 'OpenRouter & LangGraph for intelligent automation and personalization',
      icon: <Bot className="w-8 h-8" />,
      gradient: 'from-green-500 to-emerald-600',
      benefits: ['Smart automation', 'Personalization', 'Predictive analytics'],
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">Built with </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Modern Technology
            </span>
          </h2>
          <p className="text-body-large text-ethos-gray max-w-3xl mx-auto">
            We use the latest, most reliable technologies to build fast, secure, and scalable
            digital solutions that stand the test of time.
          </p>
        </div>

        {/* Technology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div
                className="h-full p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 transition-all duration-300 hover:shadow-xl hover:border-ethos-purple/30"
                style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}
              >
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${tech.gradient} text-white transition-transform duration-300 group-hover:scale-110`}
                >
                  {tech.icon}
                </div>

                {/* Name */}
                <h3 className="text-xl font-semibold text-ethos-navy mb-2">{tech.name}</h3>

                {/* Description */}
                <p className="text-ethos-gray mb-4 leading-relaxed">{tech.description}</p>

                {/* Benefits */}
                <ul className="flex flex-col gap-2">
                  {tech.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start text-sm text-ethos-gray">
                      <svg
                        className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Why Modern Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5 rounded-2xl border border-ethos-purple/20"
        >
          <h3 className="text-2xl font-bold text-ethos-navy mb-4 text-center">
            Why Our Modern Stack Matters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Cloud className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-ethos-navy mb-2">Lower Costs</h4>
              <p className="text-sm text-ethos-gray">
                Serverless architecture eliminates server management and reduces hosting costs by
                60%
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-ethos-navy mb-2">Better Performance</h4>
              <p className="text-sm text-ethos-gray">
                Modern frameworks deliver 3x faster load times and 100% Google PageSpeed scores
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-ethos-navy mb-2">Future-Proof</h4>
              <p className="text-sm text-ethos-gray">
                Active communities and regular updates ensure your tech stack stays current
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 text-center"
        >
          <p className="text-body-default text-ethos-gray mb-6">
            Want to learn more about our technology choices and how they benefit your business?
          </p>
          <a
            href="/contact?source=technology-stack"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-ethos-purple to-ethos-navy text-white font-medium rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Schedule a Technical Consultation
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
};
