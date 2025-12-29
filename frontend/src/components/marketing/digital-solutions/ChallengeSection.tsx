import { AlertTriangle, Clock, DollarSign, Shield, TrendingDown, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

interface Challenge {
  icon: React.ReactNode;
  text: string;
  category: 'legacy' | 'capability';
}

export const ChallengeSection: React.FC = () => {
  const challenges: Challenge[] = [
    {
      icon: <DollarSign className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />,
      text: 'Legacy WordPress sites cost businesses $2,500+ monthly in maintenance, security patches, and downtime (WP Engine Study 2024)',
      category: 'legacy',
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />,
      text: '43% of cyberattacks target small businesses using outdated CMS platforms, with average breach costs of $4.45M (IBM Security)',
      category: 'legacy',
    },
    {
      icon: <Clock className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />,
      text: 'Legacy systems cause 67% more downtime than modern platforms, costing $5,600 per minute for mid-size businesses (Gartner)',
      category: 'legacy',
    },
    {
      icon: <TrendingDown className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />,
      text: '53% of mobile site visits are abandoned if pages take longer than 3 seconds to load, directly impacting your bottom line',
      category: 'capability',
    },
    {
      icon: <Users className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />,
      text: 'Mobile commerce now accounts for 72.9% of total e-commerce sales, making mobile optimization a revenue imperative',
      category: 'capability',
    },
    {
      icon: <Shield className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />,
      text: '42% of Australian business leaders are concerned about cyber risks, while 39% need to reduce costs while improving capabilities (KPMG 2025)',
      category: 'capability',
    },
  ];

  const legacyChallenges = challenges.filter((c) => c.category === 'legacy');
  const capabilityChallenges = challenges.filter((c) => c.category === 'capability');

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-red-50/50 to-orange-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">The High Cost of </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Digital Stagnation
            </span>
          </h2>
          <p className="text-body-large text-ethos-gray max-w-3xl mx-auto">
            Australian businesses face mounting pressure from outdated technology and digital
            capability gaps. According to KPMG's 2025 CEO Outlook,{' '}
            <strong className="text-ethos-navy">
              53% of business leaders cite digital transformation as their #1 challenge
            </strong>
            . The cost of inaction is staggering:
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Legacy System Challenges */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-full p-6 sm:p-8 bg-white rounded-2xl border-2 border-red-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 text-white">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-ethos-navy">Legacy System Challenges</h3>
              </div>

              <ul className="flex flex-col gap-4">
                {legacyChallenges.map((challenge, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-red-50/50 rounded-lg"
                  >
                    {challenge.icon}
                    <span className="text-ethos-gray leading-relaxed">{challenge.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Digital Capability Gaps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-full p-6 sm:p-8 bg-white rounded-2xl border-2 border-orange-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-600 text-white">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-ethos-navy">Digital Capability Gaps</h3>
              </div>

              <ul className="flex flex-col gap-4">
                {capabilityChallenges.map((challenge, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-lg"
                  >
                    {challenge.icon}
                    <span className="text-ethos-gray leading-relaxed">{challenge.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* KPMG Stat Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-ethos-navy to-ethos-purple rounded-2xl text-white text-center"
        >
          <p className="text-sm font-medium text-white/80 mb-2">KPMG 2025 CEO Outlook</p>
          <p className="text-4xl sm:text-5xl font-bold mb-3">53%</p>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
            of Australian business leaders cite digital transformation as their{' '}
            <strong className="text-white">#1 challenge in 2025</strong>
          </p>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-body-default text-ethos-gray mb-6">
            Don't let outdated technology hold your business back. See how much you could save and
            earn with modern digital solutions.
          </p>
          <a
            href="#roi-calculator"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-ethos-purple to-ethos-navy text-white font-medium rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Calculate Your Savings
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
