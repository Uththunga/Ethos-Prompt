import React, { useState } from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '@/components/marketing/ui/button';
import { MarketingChatModal } from '@/components/marketing/MarketingChatModal';

export const Faq = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const faqCategories = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'What is EthosPrompt and what services do you offer?',
          answer:
            'EthosPrompt is an enterprise AI solutions company specializing in custom web and mobile application development, AI chatbots and automation, and system integration. We help businesses build modern applications, automate processes, and connect their business tools through advanced technologies.',
        },
        {
          question: "How do I get started with EthosPrompt's AI solutions?",
          answer:
            "Getting started is simple: 1) Contact us for a free consultation, 2) We'll assess your business needs and current systems, 3) Our team will design a custom AI solution tailored to your requirements, 4) We implement and integrate the solution with full support and training.",
        },
        {
          question: 'What industries do you serve?',
          answer:
            'We serve businesses across various industries including retail, healthcare, finance, manufacturing, professional services, and technology. Our AI solutions are adaptable to any industry that can benefit from automation, improved customer service, or operational efficiency.',
        },
        {
          question: 'How long does it take to implement an AI solution?',
          answer:
            'Implementation timelines vary based on complexity and scope. Simple AI chatbots can be deployed in 2-4 weeks, while comprehensive system integrations may take 8-16 weeks. We provide detailed project timelines during the consultation phase.',
        },
      ],
    },
    {
      category: 'AI Solutions & Technology',
      questions: [
        {
          question: 'What types of AI solutions do you develop?',
          answer:
            'We develop custom AI chatbots for customer service, sales automation systems, intelligent document processing, predictive analytics tools, workflow automation, and AI-powered web and mobile applications. All solutions are tailored to your specific business needs.',
        },
        {
          question: 'Can you integrate AI with our existing systems?',
          answer:
            'Yes, we specialize in seamless system integration. Our AI solutions can connect with your existing CRM, ERP, databases, websites, and other business applications through APIs and custom integrations, ensuring minimal disruption to your current workflows.',
        },
        {
          question: 'What AI technologies do you use?',
          answer:
            'We work with leading AI platforms including OpenAI GPT models, Google AI, Microsoft Azure AI, and other cutting-edge technologies. We select the best technology stack based on your specific requirements, budget, and performance needs.',
        },
        {
          question: 'How accurate and reliable are your AI solutions?',
          answer:
            'Our AI solutions are designed for enterprise-grade reliability with accuracy rates typically exceeding 95%. We implement continuous learning mechanisms, regular model updates, and comprehensive testing to ensure consistent performance and improvement over time.',
        },
      ],
    },
    {
      category: 'Pricing & Plans',
      questions: [
        {
          question: 'How much do your AI solutions cost?',
          answer:
            'Pricing varies based on solution complexity, features, and scale. We offer flexible pricing models including one-time development fees, monthly subscriptions, and usage-based pricing. Contact us for a personalized quote based on your specific requirements.',
        },
        {
          question: 'Do you offer different service packages?',
          answer:
            'Yes, we offer various service packages from basic AI chatbot implementation to comprehensive custom application development. Each package includes development, integration, training, and ongoing support tailored to different business sizes and needs.',
        },
        {
          question: "What's included in your ongoing support?",
          answer:
            'Our support includes system monitoring, regular updates, performance optimization, technical support during business hours, monthly performance reports, and access to our knowledge base and training resources.',
        },
        {
          question: 'Do you offer free trials or demos?',
          answer:
            'We provide free consultations and can create proof-of-concept demonstrations for qualified prospects. This allows you to see how our AI solutions would work with your specific use case before making a commitment.',
        },
      ],
    },
    {
      category: 'Security & Compliance',
      questions: [
        {
          question: 'How do you ensure data security and privacy?',
          answer:
            'We implement enterprise-grade security measures including data encryption, secure APIs, access controls, and compliance with Australian Privacy Act 1988. All data is processed and stored according to strict security protocols and industry best practices.',
        },
        {
          question: 'Are your solutions compliant with Australian regulations?',
          answer:
            'Yes, all our solutions comply with Australian privacy laws, consumer protection regulations, and industry-specific requirements. We ensure GDPR compliance for international operations and can meet specific regulatory requirements for your industry.',
        },
        {
          question: 'Where is our data stored and processed?',
          answer:
            'Data can be stored in Australian data centers or your preferred location to meet compliance requirements. We offer flexible deployment options including cloud, on-premises, or hybrid solutions based on your security and compliance needs.',
        },
        {
          question: 'Can we maintain control over our data?',
          answer:
            'Absolutely. You retain full ownership and control of your data. We provide transparent data handling practices, clear data retention policies, and the ability to export or delete your data at any time.',
        },
      ],
    },
    {
      category: 'Support & Maintenance',
      questions: [
        {
          question: 'What kind of support do you provide after implementation?',
          answer:
            'We provide comprehensive ongoing support including technical assistance, system monitoring, regular updates, performance optimization, user training, and access to our support team during Australian business hours.',
        },
        {
          question: 'How do you handle system updates and improvements?',
          answer:
            'We provide regular system updates, security patches, and feature enhancements. Major updates are scheduled with advance notice, and we continuously monitor and optimize performance to ensure your AI solutions evolve with your business needs.',
        },
        {
          question: 'What if we need changes or additional features?',
          answer:
            'We offer flexible modification and enhancement services. Our team can add new features, modify existing functionality, or scale your solution as your business grows. We provide transparent pricing for additional development work.',
        },
        {
          question: 'Do you provide training for our team?',
          answer:
            'Yes, we provide comprehensive training for your team including user guides, video tutorials, live training sessions, and ongoing support. We ensure your team is fully equipped to maximize the benefits of your AI solution.',
        },
      ],
    },
  ];

  // Flatten all questions for search
  const allQuestions = faqCategories.flatMap((category, categoryIndex) =>
    category.questions.map((q, questionIndex) => ({
      ...q,
      categoryIndex,
      questionIndex,
      category: category.category,
    }))
  );

  // Filter questions based on search term
  const filteredQuestions = searchTerm
    ? allQuestions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="w-full bg-white" role="main" id="main-content">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
          {/* Header */}
          <header className="text-center mb-16">
            <h1 className="heading-hero font-medium relative inline-block mx-auto text-center leading-tight tracking-tight mb-6">
              <span
                className="block"
                style={{
                  color: '#0F1345',
                }}
              >
                Frequently Asked
              </span>
              <span
                className="block"
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: 500,
                  wordWrap: 'break-word',
                  background: 'linear-gradient(90deg, var(--ethos-purple), #000000, var(--ethos-purple))',
                  backgroundSize: '200% auto',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shine 10s linear infinite',
                }}
              >
                Questions
              </span>
            </h1>
            <p className="text-ethos-gray text-base leading-relaxed max-w-3xl mx-auto mb-8">
              Find quick answers to common questions about our AI solutions, services, and support.
              Can't find what you're looking for? Contact our support team for personalized
              assistance.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search frequently asked questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent text-base"
                />
              </div>
            </div>
          </header>

          {/* Search Results */}
          {searchTerm && (
            <section className="mb-12">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Search Results ({filteredQuestions.length} found)
              </h2>
              {filteredQuestions.length > 0 ? (
                <div>
                  {filteredQuestions.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow mb-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-ethos-purple text-white px-2 py-1 rounded-full">
                              {item.category}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-ethos-navy-light mb-3">
                            {item.question}
                          </h3>
                          <p className="text-ethos-gray text-base">{item.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-ethos-gray mb-4">No questions found matching your search.</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-ethos-purple hover:underline"
                  >
                    Clear search and browse all questions
                  </button>
                </div>
              )}
            </section>
          )}

          {/* FAQ Categories */}
          {!searchTerm && (
            <section>
              {faqCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="mb-12">
                  <h2 className="text-h2 text-ethos-navy mb-6 pb-2 border-b border-gray-200">
                    {category.category}
                  </h2>
                  <div>
                    {category.questions.map((item, questionIndex) => {
                      const globalIndex = categoryIndex * 100 + questionIndex;
                      const isOpen = openItems.includes(globalIndex);

                      return (
                        <div
                          key={questionIndex}
                          className="border border-gray-200 rounded-lg overflow-hidden mb-4"
                        >
                          <button
                            onClick={() => toggleItem(globalIndex)}
                            className="w-full px-4 sm:px-6 py-4 text-left flex items-start sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                          >
                            <h3 className="text-base sm:text-lg font-semibold text-ethos-navy-light break-words flex-1">
                              {item.question}
                            </h3>
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5 text-ethos-purple flex-shrink-0 mt-0.5 sm:mt-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-ethos-purple flex-shrink-0 mt-0.5 sm:mt-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-4 sm:px-6 pb-6">
                              <p className="text-ethos-gray text-sm sm:text-base leading-relaxed break-words">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="text-center py-12 px-4 sm:px-6 lg:px-8 bg-ethos-light-gray/30 rounded-lg my-12">
            <h3 className="text-2xl font-semibold text-ethos-navy mb-4">Can't find what you're looking for?</h3>
            <p className="text-ethos-gray mb-6 max-w-2xl mx-auto">
              Ask our AI Assistant directly! Get instant answers to your specific questions about our services and solutions.
            </p>
            <Button
              onClick={() => setIsChatOpen(true)}
              variant="ethos"
              size="lg"
              aria-label="Ask our AI Assistant"
            >
              Ask molē
            </Button>
            <MarketingChatModal
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              pageContext="faq"
            />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Faq;
