import { Gauge, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

interface Pillar {
  title: string;
  icon: React.ReactNode;
  metric: string;
  description: string;
  gradient: string;
}

export const ThreePillarSection: React.FC = () => {
  const pillars: Pillar[] = [
    {
      title: 'MODERNIZE',
      icon: <RefreshCw className="w-8 h-8" />,
      metric: '60% cost reduction',
      description:
        'Migrate from legacy systems with zero downtime. Modern architecture reduces maintenance costs and eliminates technical debt.',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'OPTIMIZE',
      icon: <Gauge className="w-8 h-8" />,
      metric: '3x performance',
      description:
        'Lightning-fast load times (<1s), mobile-first design, and PWA capabilities that work offline and feel native.',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      title: 'INNOVATE',
      icon: <Sparkles className="w-8 h-8" />,
      metric: '150% engagement ↑, 3.5x conversion',
      description:
        'AI-powered personalization, intelligent automation, and predictive analytics create competitive advantages.',
      gradient: 'from-green-500 to-emerald-600',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">Our Three-Pillar Approach to </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Digital Transformation
            </span>
          </h2>
          <p className="text-body-large text-ethos-gray max-w-3xl mx-auto">
            We combine modernization, optimization, and innovation to deliver complete digital
            solutions that reduce costs, improve performance, and drive growth.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div
                className="h-full p-6 sm:p-8 bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:shadow-xl hover:border-ethos-purple/30"
                style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}
              >
                {/* Icon with Gradient Background */}
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${pillar.gradient} text-white transition-transform duration-300 group-hover:scale-110`}
                >
                  {pillar.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold text-ethos-navy mb-3">{pillar.title}</h3>

                {/* Metric */}
                <div
                  className={`inline-block px-4 py-2 mb-4 rounded-full bg-gradient-to-r ${pillar.gradient} text-white text-sm font-semibold`}
                >
                  {pillar.metric}
                </div>

                {/* Description */}
                <p className="text-ethos-gray leading-relaxed">{pillar.description}</p>

                {/* Decorative Element */}
                <div
                  className={`absolute bottom-0 left-0 w-full h-1 rounded-b-2xl bg-gradient-to-r ${pillar.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                ></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-body-default text-ethos-gray mb-6">
            Ready to transform your business with our proven three-pillar approach?
          </p>
          <a
            href="#roi-calculator"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-ethos-purple to-ethos-navy text-white font-medium rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Calculate Your ROI
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
