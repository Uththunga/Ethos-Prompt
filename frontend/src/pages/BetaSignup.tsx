import React from 'react';
import { BetaApplicationForm } from '../components/beta/BetaApplicationForm';
import {
  SparklesIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  HeartIcon,
  CheckCircleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

export const BetaSignup: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium">
                <SparklesIcon className="h-4 w-4" />
                <span>Limited Beta Access</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Join the Future of
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {' '}
                AI Content Creation
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Be among the first 100 users to experience RAG Prompt Library - the revolutionary
              platform that combines intelligent prompt management with cutting-edge RAG technology.
            </p>

            <div className="flex justify-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">100</div>
                <div className="text-sm text-gray-500">Beta Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">Free</div>
                <div className="text-sm text-gray-500">During Beta</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">8 Weeks</div>
                <div className="text-sm text-gray-500">Beta Program</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Join Our Beta Program?</h2>

            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <RocketLaunchIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Early Access</h3>
                  <p className="text-gray-600">
                    Get exclusive access to cutting-edge AI features before public launch.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Shape the Product</h3>
                  <p className="text-gray-600">
                    Your feedback directly influences product development and feature priorities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <HeartIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Premium Support</h3>
                  <p className="text-gray-600">
                    Direct access to our team with priority support and personalized guidance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6 last:mb-0">
                <div className="flex-shrink-0">
                  <StarIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Lifetime Benefits</h3>
                  <p className="text-gray-600">
                    Exclusive discounts, early access to new features, and beta alumni status.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">What You'll Get</h3>
            <div>
              {[
                'Full access to all premium features',
                'Advanced RAG document processing',
                'Multi-LLM integration (GPT-4, Claude, etc.)',
                'Team collaboration tools',
                'Priority customer support',
                'Weekly feedback sessions',
                'Exclusive beta community access',
                '50% lifetime discount on future plans',
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 mb-4">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-gray-600">
              Fill out the application below and we'll review it within 2-3 business days.
            </p>
          </div>

          <BetaApplicationForm />
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Early Users Are Saying</h2>
            <p className="text-lg text-gray-600">Feedback from our alpha testing phase</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  'This platform has revolutionized how I create content. The RAG integration is game-changing.',
                author: 'Sarah Chen',
                role: 'Content Marketing Manager',
                company: 'TechCorp',
              },
              {
                quote:
                  'Finally, a tool that understands context. My prompts are 10x more effective now.',
                author: 'Marcus Rodriguez',
                role: 'AI Researcher',
                company: 'Innovation Labs',
              },
              {
                quote:
                  'The team collaboration features are exactly what we needed. Seamless workflow integration.',
                author: 'Emily Johnson',
                role: 'Product Manager',
                company: 'StartupXYZ',
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-4">"{testimonial.quote}"</blockquote>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        </div>

        <div>
          {[
            {
              question: 'How long does the beta program last?',
              answer:
                'The beta program runs for 8 weeks, giving you plenty of time to explore all features and provide comprehensive feedback.',
            },
            {
              question: 'What happens after the beta ends?',
              answer:
                'Beta users receive a 50% lifetime discount on all future plans and continued early access to new features.',
            },
            {
              question: 'How much time commitment is required?',
              answer:
                'We recommend 2-3 hours per week using the platform and participating in weekly feedback surveys (5 minutes each).',
            },
            {
              question: 'Can I invite team members?',
              answer:
                'Yes! Beta users can invite up to 3 team members to test collaboration features together.',
            },
          ].map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
