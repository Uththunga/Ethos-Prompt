import { CheckCircle, ClipboardCheck, Code, Gauge, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

interface ProcessStep {
  number: string;
  title: string;
  timeline: string;
  icon: React.ReactNode;
  deliverables: string[];
  gradient: string;
}

export const TransformationProcess: React.FC = () => {
  const steps: ProcessStep[] = [
    {
      number: '01',
      title: 'ASSESS',
      timeline: 'Week 1-2',
      icon: <Search className="w-6 h-6" />,
      deliverables: [
        'Comprehensive audit of current systems',
        'Migration roadmap and architecture design',
        'ROI analysis and timeline planning',
      ],
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      number: '02',
      title: 'PLAN',
      timeline: 'Week 2-4',
      icon: <ClipboardCheck className="w-6 h-6" />,
      deliverables: [
        'Detailed project plan with milestones',
        'Technology stack selection',
        'Risk mitigation strategies',
      ],
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      number: '03',
      title: 'TRANSFORM',
      timeline: 'Week 4-16',
      icon: <Code className="w-6 h-6" />,
      deliverables: [
        'Zero-downtime migration',
        'Modern development with best practices',
        'Rigorous testing and QA',
      ],
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      number: '04',
      title: 'OPTIMIZE',
      timeline: 'Ongoing',
      icon: <Gauge className="w-6 h-6" />,
      deliverables: [
        'Performance monitoring and tuning',
        'Continuous improvements',
        'Support and maintenance',
      ],
      gradient: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">Our Proven </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Transformation Process
            </span>
          </h2>
          <p className="text-body-large text-ethos-gray max-w-3xl mx-auto">
            A structured, four-phase approach that ensures successful digital transformation with
            minimal risk and maximum results.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-orange-500 opacity-20"></div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Step Card */}
                <div className="relative h-full p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 transition-all duration-300 hover:shadow-xl hover:border-ethos-purple/30">
                  {/* Step Number Badge */}
                  <div
                    className={`absolute -top-4 -left-4 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} text-white font-bold text-xl shadow-lg z-10`}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 mb-4 mt-8 rounded-lg bg-gradient-to-br ${step.gradient} text-white`}
                  >
                    {step.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-semibold text-ethos-navy mb-2">{step.title}</h3>

                  {/* Timeline */}
                  <div className="inline-block px-3 py-1 mb-4 rounded-full bg-ethos-purple/10 text-ethos-purple text-sm font-semibold">
                    {step.timeline}
                  </div>

                  {/* Deliverables */}
                  <ul className="flex flex-col gap-2">
                    {step.deliverables.map((deliverable, idx) => (
                      <li key={idx} className="flex items-start text-sm text-ethos-gray">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Decorative Bottom Border */}
                  <div
                    className={`absolute bottom-0 left-0 w-full h-1 rounded-b-2xl bg-gradient-to-r ${step.gradient}`}
                  ></div>
                </div>

                {/* Arrow Connector (Desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-3 z-20">
                    <svg
                      className="w-6 h-6 text-ethos-purple"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 p-6 bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5 rounded-2xl border border-ethos-purple/20"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-ethos-purple mb-1">Total Timeline</p>
              <p className="text-2xl font-bold text-ethos-navy">12-16 Weeks</p>
              <p className="text-sm text-ethos-gray">From assessment to launch</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-ethos-purple mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-ethos-navy">98%</p>
              <p className="text-sm text-ethos-gray">On-time, on-budget delivery</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-ethos-purple mb-1">Zero Downtime</p>
              <p className="text-2xl font-bold text-ethos-navy">100%</p>
              <p className="text-sm text-ethos-gray">Guaranteed uptime during migration</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-body-default text-ethos-gray mb-6">
            Ready to start your digital transformation journey?
          </p>
          <a
            href="/contact?source=transformation-process"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-ethos-purple to-ethos-navy text-white font-medium rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Get Your Free Assessment
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
