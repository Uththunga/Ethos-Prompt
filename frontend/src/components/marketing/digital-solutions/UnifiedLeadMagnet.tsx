import { CheckCircle, Download, FileText, Shield, Smartphone, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

interface UnifiedLeadMagnetProps {
  onSubmit?: (data: LeadMagnetFormData) => void;
}

interface LeadMagnetFormData {
  name: string;
  email: string;
  company: string;
  currentPlatform: string;
  primaryGoal: string;
}

export const UnifiedLeadMagnet: React.FC<UnifiedLeadMagnetProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<LeadMagnetFormData>({
    name: '',
    email: '',
    company: '',
    currentPlatform: '',
    primaryGoal: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const benefits = [
    {
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      title: 'Security & Performance Audit',
      description: 'Comprehensive analysis of your current system vulnerabilities and bottlenecks',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-purple-500" />,
      title: 'Mobile Optimization Analysis',
      description: 'Detailed report on mobile performance and user experience improvements',
    },
    {
      icon: <FileText className="w-6 h-6 text-green-500" />,
      title: 'Migration Roadmap',
      description: 'Step-by-step plan for zero-downtime transition to modern architecture',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-orange-500" />,
      title: 'Cost Savings Analysis',
      description: 'Projected maintenance cost reductions and efficiency gains',
    },
    {
      icon: <Download className="w-6 h-6 text-pink-500" />,
      title: 'Revenue Growth Projections',
      description: 'Expected conversion improvements and revenue impact analysis',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call parent onSubmit if provided
      if (onSubmit) {
        onSubmit(formData);
      }

      // Track with Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'lead_magnet_download', {
          event_category: 'lead_generation',
          event_label: 'digital_solutions_assessment',
          service_type: 'digital-solutions',
        });
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting lead magnet form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isSubmitted) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-medium text-ethos-navy mb-4">
              Thank You! Check Your Email
            </h2>
            <p className="text-body-large text-ethos-gray mb-6">
              We've sent your comprehensive Digital Transformation Assessment to{' '}
              <strong className="text-ethos-navy">{formData.email}</strong>. Our team will also
              reach out within 24 hours to discuss your specific needs.
            </p>
            <div className="p-6 bg-white rounded-2xl border border-green-200 shadow-lg">
              <h3 className="text-xl font-semibold text-ethos-navy mb-3">
                What's Included in Your Assessment:
              </h3>
              <ul className="flex flex-col gap-2 text-left">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {benefit.icon}
                    <div>
                      <p className="font-medium text-ethos-navy">{benefit.title}</p>
                      <p className="text-sm text-ethos-gray">{benefit.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
              <span className="text-ethos-navy">Get Your Free </span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)',
                }}
              >
                Digital Transformation Assessment
              </span>
            </h2>
            <p className="text-body-large text-ethos-gray max-w-3xl mx-auto">
              Receive a comprehensive analysis of your digital opportunities, including cost
              savings, performance improvements, and revenue growth potential.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Benefits List */}
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl font-semibold text-ethos-navy mb-6">
                Your Assessment Includes:
              </h3>
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex-shrink-0">{benefit.icon}</div>
                  <div>
                    <h4 className="font-semibold text-ethos-navy mb-1">{benefit.title}</h4>
                    <p className="text-sm text-ethos-gray">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-6 sm:p-8 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-ethos-navy mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-ethos-navy mb-2">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
                      placeholder="john@company.com.au"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-ethos-navy mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
                      placeholder="Your Company Pty Ltd"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="currentPlatform"
                      className="block text-sm font-medium text-ethos-navy mb-2"
                    >
                      Current Platform *
                    </label>
                    <select
                      id="currentPlatform"
                      name="currentPlatform"
                      required
                      value={formData.currentPlatform}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
                    >
                      <option value="">Select your platform</option>
                      <option value="wordpress">WordPress</option>
                      <option value="custom-php">Custom PHP/Legacy</option>
                      <option value="shopify">Shopify</option>
                      <option value="wix">Wix/Squarespace</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="primaryGoal"
                      className="block text-sm font-medium text-ethos-navy mb-2"
                    >
                      Primary Goal *
                    </label>
                    <select
                      id="primaryGoal"
                      name="primaryGoal"
                      required
                      value={formData.primaryGoal}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
                    >
                      <option value="">Select your goal</option>
                      <option value="reduce-costs">Reduce Maintenance Costs</option>
                      <option value="improve-performance">Improve Performance</option>
                      <option value="increase-conversions">Increase Conversions</option>
                      <option value="modernize">Modernize Technology</option>
                      <option value="all">All of the Above</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-gradient-to-r from-ethos-purple to-ethos-navy text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Get My Free Assessment'}
                  </button>

                  <p className="text-xs text-ethos-gray text-center">
                    By submitting, you agree to receive communications from EthosPrompt. We respect
                    your privacy and will never share your information.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
