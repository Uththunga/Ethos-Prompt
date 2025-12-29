import React from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/marketing/ui/button';
import {
    MessageSquare,
    Phone,
    Mail,
    Clock,
    FileText,
    Settings,
    Shield,
    Zap,
    Users,
    HelpCircle,
    BookOpen,
    Search,
} from 'lucide-react';

export const HelpCenter = () => {
  const supportCategories = [
    {
      icon: <Zap className="w-8 h-8 text-ethos-purple" />,
      title: 'Getting Started',
      description: 'Learn the basics of our AI solutions and how to get up and running quickly.',
      articles: [
        'Setting up your first AI solution',
        'Understanding our service offerings',
        'Initial consultation process',
        'Account setup and configuration',
      ],
    },
    {
      icon: <Settings className="w-8 h-8 text-ethos-purple" />,
      title: 'AI Solutions & Integration',
      description: 'Comprehensive guides for implementing and customizing our AI services.',
      articles: [
        'Custom AI solution deployment',
        'System integration best practices',
        'API documentation and usage',
        'Troubleshooting common issues',
      ],
    },
    {
      icon: <Users className="w-8 h-8 text-ethos-purple" />,
      title: 'Account Management',
      description: 'Manage your account, billing, and service preferences.',
      articles: [
        'Managing your account settings',
        'Billing and payment information',
        'Adding team members and permissions',
        'Service plan upgrades and changes',
      ],
    },
    {
      icon: <Shield className="w-8 h-8 text-ethos-purple" />,
      title: 'Security & Privacy',
      description: 'Information about data protection, security measures, and privacy compliance.',
      articles: [
        'Data security and encryption',
        'Privacy policy and compliance',
        'GDPR and Australian Privacy Act',
        'Security best practices',
      ],
    },
  ];

  const contactMethods = [
    {
      icon: <MessageSquare className="w-6 h-6 text-ethos-purple" />,
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      availability: 'Mon-Fri, 9 AM - 6 PM AEST',
      action: 'Start Chat',
    },
    {
      icon: <Mail className="w-6 h-6 text-ethos-purple" />,
      title: 'Email Support',
      description: 'Send us a detailed message about your issue',
      availability: 'Response within 24 hours',
      action: 'Send Email',
      link: 'mailto:support@ethosprompt.com',
    },
    {
      icon: <Phone className="w-6 h-6 text-ethos-purple" />,
      title: 'Phone Support',
      description: 'Speak directly with our technical experts',
      availability: 'Mon-Fri, 9 AM - 5 PM AEST',
      action: 'Call Now',
      link: 'tel:+61123456789',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="w-full bg-white" role="main" id="main-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
          {/* Header */}
          <header className="text-center mb-16">
            <h1 className="heading-hero font-semibold font-poppins leading-tight tracking-tight mb-6">
              <span className="bg-gradient-to-r from-ethos-navy-light to-ethos-gray-light bg-clip-text text-transparent">
                Help Center
              </span>
            </h1>
            <p className="text-ethos-gray text-body-large leading-relaxed max-w-3xl mx-auto mb-8">
              Find answers to your questions, learn about our AI solutions, and get the support you
              need to maximize your business potential with EthosPrompt.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for help articles, guides, and solutions..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent text-body-large"
                />
              </div>
            </div>
          </header>

          {/* Quick Actions */}
          <section className="mb-16">
            <h2 className="text-h2 text-ethos-navy mb-8 text-center">
              Popular Help Topics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/faq"
                className="group bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <HelpCircle className="w-8 h-8 text-ethos-purple mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-body-large font-semibold text-ethos-navy-light mb-2">
                  Frequently Asked Questions
                </h3>
                <p className="text-ethos-gray text-body-small">
                  Quick answers to common questions about our services
                </p>
              </Link>

              <Link
                to="/prompting-guide"
                className="group bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <BookOpen className="w-8 h-8 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-body-large font-semibold text-ethos-navy-light mb-2">
                  Prompting Guide
                </h3>
                <p className="text-ethos-gray text-body-small">
                  Learn how to create effective AI prompts and optimize results
                </p>
              </Link>

              <Link
                to="/contact"
                className="group bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <MessageSquare className="w-8 h-8 text-green-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-body-large font-semibold text-ethos-navy-light mb-2">
                  Contact Support
                </h3>
                <p className="text-ethos-gray text-body-small">
                  Get personalized help from our expert support team
                </p>
              </Link>
            </div>
          </section>

          {/* Support Categories */}
          <section className="mb-16">
            <h2 className="text-h2 text-ethos-navy mb-8 text-center">
              Browse by Category
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {supportCategories.map((category, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0">{category.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-ethos-navy-light mb-2">
                        {category.title}
                      </h3>
                      <p className="text-ethos-gray">{category.description}</p>
                    </div>
                  </div>

                  <div>
                    {category.articles.map((article, articleIndex) => (
                      <div
                        key={articleIndex}
                        className="flex items-center gap-3 text-ethos-gray hover:text-ethos-purple cursor-pointer transition-colors mb-3"
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{article}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Support */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-ethos-purple to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">Still Need Help?</h2>
              <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
                Our expert support team is here to help you succeed with your AI implementation.
                Choose the contact method that works best for you.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {contactMethods.map((method, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="flex justify-center mb-4">{method.icon}</div>
                    <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                    <p className="text-purple-100 text-sm mb-3">{method.description}</p>
                    <div className="flex items-center justify-center gap-2 text-xs text-purple-200 mb-4">
                      <Clock className="w-3 h-3" />
                      <span>{method.availability}</span>
                    </div>
                    {method.link ? (
                      <a
                        href={method.link}
                        className="inline-block bg-white text-ethos-purple px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                      >
                        {method.action}
                      </a>
                    ) : (
                      <Button variant="ethos" size="sm" className="rounded-lg">
                        {method.action}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Additional Resources */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-ethos-navy-light mb-8 text-center">
              Additional Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <FileText className="w-8 h-8 text-ethos-purple mx-auto mb-4" />
                <h3 className="font-semibold text-ethos-navy-light mb-2">Documentation</h3>
                <p className="text-ethos-gray text-sm">
                  Technical documentation and API references
                </p>
              </div>

              <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <BookOpen className="w-8 h-8 text-ethos-purple mx-auto mb-4" />
                <h3 className="font-semibold text-ethos-navy-light mb-2">Tutorials</h3>
                <p className="text-ethos-gray text-sm">Step-by-step guides and video tutorials</p>
              </div>

              <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <Users className="w-8 h-8 text-ethos-purple mx-auto mb-4" />
                <h3 className="font-semibold text-ethos-navy-light mb-2">Community</h3>
                <p className="text-ethos-gray text-sm">
                  Connect with other users and share experiences
                </p>
              </div>

              <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <Zap className="w-8 h-8 text-ethos-purple mx-auto mb-4" />
                <h3 className="font-semibold text-ethos-navy-light mb-2">Best Practices</h3>
                <p className="text-ethos-gray text-sm">
                  Tips and strategies for optimal AI implementation
                </p>
              </div>
            </div>
          </section>

          {/* Service Status */}
          <section className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-800 font-semibold">All Systems Operational</span>
              </div>
              <p className="text-green-700 text-sm">
                All EthosPrompt services are running normally. Last updated:{' '}
                {new Date().toLocaleString('en-AU')}
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpCenter;
