import { ArrowRight, Briefcase, Clock, DollarSign, ShoppingCart, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

interface CaseStudy {
  title: string;
  industry: string;
  industryIcon: React.ReactNode;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    value: string;
    icon: React.ReactNode;
    gradient: string;
  }[];
  gradient: string;
}

export const CaseStudies: React.FC = () => {
  const caseStudies: CaseStudy[] = [
    {
      title: 'Retail Transformation',
      industry: 'E-commerce',
      industryIcon: <ShoppingCart className="w-6 h-6" />,
      challenge:
        'Slow WordPress site with 5-second load times, no mobile presence, and $3,000/month maintenance costs. Losing customers to faster competitors.',
      solution:
        'Complete React migration with PWA capabilities, AI-powered product recommendations, and mobile-first design. Integrated with existing inventory system.',
      results: [
        {
          metric: 'Cost Reduction',
          value: '60%',
          icon: <DollarSign className="w-5 h-5" />,
          gradient: 'from-green-500 to-emerald-600',
        },
        {
          metric: 'Conversion Increase',
          value: '3.5x',
          icon: <TrendingUp className="w-5 h-5" />,
          gradient: 'from-blue-500 to-indigo-600',
        },
        {
          metric: 'Load Time',
          value: '<1s',
          icon: <Zap className="w-5 h-5" />,
          gradient: 'from-purple-500 to-pink-600',
        },
      ],
      gradient: 'from-blue-50 to-indigo-50',
    },
    {
      title: 'Professional Services Modernization',
      industry: 'Legal/Consulting',
      industryIcon: <Briefcase className="w-6 h-6" />,
      challenge:
        'Outdated custom PHP platform with security vulnerabilities, poor mobile experience, and difficult content updates. High developer dependency.',
      solution:
        'Modern React application with headless CMS, mobile-first responsive design, automated security updates, and integrated client portal.',
      results: [
        {
          metric: 'Performance',
          value: '3x faster',
          icon: <Zap className="w-5 h-5" />,
          gradient: 'from-purple-500 to-pink-600',
        },
        {
          metric: 'Engagement',
          value: '+150%',
          icon: <TrendingUp className="w-5 h-5" />,
          gradient: 'from-green-500 to-emerald-600',
        },
        {
          metric: 'Security Incidents',
          value: 'Zero',
          icon: <Clock className="w-5 h-5" />,
          gradient: 'from-blue-500 to-cyan-600',
        },
      ],
      gradient: 'from-purple-50 to-pink-50',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">Real Results for </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Australian Businesses
            </span>
          </h2>
          <p className="text-body-large text-ethos-gray max-w-3xl mx-auto">
            See how we've helped businesses like yours achieve dramatic improvements in cost,
            performance, and growth through digital transformation.
          </p>
        </div>

        {/* Case Studies */}
        <div className="flex flex-col gap-8">
          {caseStudies.map((study, index) => (
            <motion.div
              key={study.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <div
                className={`p-6 sm:p-8 bg-gradient-to-br ${study.gradient} rounded-2xl border border-gray-200 shadow-lg`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white text-ethos-purple">
                        {study.industryIcon}
                      </div>
                      <span className="text-sm font-medium text-ethos-purple">
                        {study.industry}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-ethos-navy">
                      {study.title}
                    </h3>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Challenge */}
                  <div className="p-5 bg-white rounded-lg">
                    <h4 className="text-lg font-semibold text-ethos-navy mb-3 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                        !
                      </span>
                      Challenge
                    </h4>
                    <p className="text-ethos-gray leading-relaxed">{study.challenge}</p>
                  </div>

                  {/* Solution */}
                  <div className="p-5 bg-white rounded-lg">
                    <h4 className="text-lg font-semibold text-ethos-navy mb-3 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">
                        ✓
                      </span>
                      Solution
                    </h4>
                    <p className="text-ethos-gray leading-relaxed">{study.solution}</p>
                  </div>
                </div>

                {/* Results */}
                <div className="p-5 bg-white rounded-lg">
                  <h4 className="text-lg font-semibold text-ethos-navy mb-4">Results</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {study.results.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg bg-gradient-to-br ${result.gradient} text-white`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {result.icon}
                          <p className="text-sm font-medium opacity-90">{result.metric}</p>
                        </div>
                        <p className="text-3xl font-bold">{result.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-ethos-navy to-ethos-purple rounded-2xl text-white"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Average Results Across All Projects</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">60%</p>
              <p className="text-white/80">Cost Reduction</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">3x</p>
              <p className="text-white/80">Performance Improvement</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">150%</p>
              <p className="text-white/80">Engagement Increase</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">3.5x</p>
              <p className="text-white/80">Conversion Growth</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-body-default text-ethos-gray mb-6">
            Ready to achieve similar results for your business?
          </p>
          <a
            href="/contact?source=case-studies"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-ethos-purple to-ethos-navy text-white font-medium rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Start Your Transformation
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
