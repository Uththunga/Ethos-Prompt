import { Button } from '@/components/marketing/ui/button';
import {
    ArrowRight,
    Bot,
    User,
    Send,
    RotateCcw,
    MessageCircle,
    Clock,
    CheckCircle,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  typing?: boolean;
}

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  initialMessage: string;
  responses: Array<{
    trigger: string;
    response: string;
    delay?: number;
  }>;
}

const demoScenarios: DemoScenario[] = [
  {
    id: 'pricing',
    title: 'Pricing Inquiry',
    description: 'Customer asks about pricing and packages',
    initialMessage:
      "Hi, I'm interested in your premium service package. Can you tell me more about pricing and what's included?",
    responses: [
      {
        trigger: 'pricing',
        response:
          "I'd be happy to help you with our premium package! Our Premium Business Plan is $297/month and includes:\n\n• 24/7 AI customer support\n• Custom integrations with your CRM\n• Advanced analytics dashboard\n• Priority support from our team\n• Up to 5,000 customer interactions/month\n\nWould you like me to schedule a demo to show you how it works with your specific business?",
        delay: 2000,
      },
      {
        trigger: 'demo',
        response:
          'Perfect! I can schedule a personalized demo for you. What industry is your business in? This helps me tailor the demo to show relevant features for your specific needs.',
        delay: 1500,
      },
      {
        trigger: 'schedule',
        response:
          "Excellent! I've found some available slots this week:\n\n• Tomorrow at 2:00 PM EST\n• Thursday at 10:00 AM EST\n• Friday at 3:00 PM EST\n\nWhich time works best for you? I'll send you a calendar invite with all the details.",
        delay: 1800,
      },
    ],
  },
  {
    id: 'support',
    title: 'Technical Support',
    description: 'Customer needs help with a technical issue',
    initialMessage:
      "I'm having trouble integrating your API with our existing system. Can you help?",
    responses: [
      {
        trigger: 'api',
        response:
          'I can definitely help you with the API integration! Let me gather some details first:\n\n1. What platform are you trying to integrate with? (Salesforce, HubSpot, custom system, etc.)\n2. Are you getting any specific error messages?\n3. What programming language are you using?\n\nI can provide step-by-step guidance or connect you with our technical team for hands-on support.',
        delay: 2200,
      },
      {
        trigger: 'salesforce',
        response:
          "Great choice! Salesforce integration is one of our most popular setups. Here's what I can do right now:\n\n✅ Send you our Salesforce integration guide\n✅ Provide sample code snippets\n✅ Schedule a technical call with our integration specialist\n\nThe integration typically takes 2-3 hours and our team can handle it for you if needed. Would you prefer to try it yourself first or have our team assist?",
        delay: 2000,
      },
    ],
  },
  {
    id: 'afterhours',
    title: 'After-Hours Inquiry',
    description: 'Customer reaches out outside business hours',
    initialMessage: "Hi, I know it's late but I have an urgent question about my account billing.",
    responses: [
      {
        trigger: 'billing',
        response:
          "No problem at all! I'm available 24/7 to help with billing questions. Let me pull up your account information.\n\n🔍 I can see your account details and recent billing history. What specific billing question can I help you with?\n\n• View recent invoices\n• Update payment method\n• Explain charges\n• Process refunds\n• Upgrade/downgrade plans",
        delay: 1800,
      },
      {
        trigger: 'invoice',
        response:
          "I can see your recent invoices right here:\n\n📄 **Latest Invoice - $297.00**\n• Date: January 15, 2025\n• Service: Premium Business Plan\n• Status: Paid ✅\n• Next billing: February 15, 2025\n\nIs there something specific about this invoice you'd like me to explain? I can also email you a detailed breakdown if that would be helpful.",
        delay: 1600,
      },
    ],
  },
];

export const InteractiveAIDemo: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<DemoScenario>(demoScenarios[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [demoStarted, setDemoStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startDemo = () => {
    setDemoStarted(true);
    const initialMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentScenario.initialMessage,
      timestamp: new Date(),
    };
    setMessages([initialMessage]);

    // AI responds after a delay
    setTimeout(() => {
      handleAIResponse(currentScenario.initialMessage);
    }, 1000);
  };

  const resetDemo = () => {
    setMessages([]);
    setInputValue('');
    setIsTyping(false);
    setDemoStarted(false);
  };

  const handleAIResponse = (userMessage: string) => {
    setIsTyping(true);

    // Find matching response
    const matchingResponse = currentScenario.responses.find((response) =>
      userMessage.toLowerCase().includes(response.trigger.toLowerCase())
    );

    const responseContent =
      matchingResponse?.response ||
      "I understand you're asking about that. Let me connect you with the right information. In a real implementation, I'd have access to your complete business knowledge base to provide specific answers.";

    const delay = matchingResponse?.delay || 1500;

    setTimeout(() => {
      setIsTyping(false);
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: responseContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, delay);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = inputValue;
    setInputValue('');

    // AI responds after a delay
    setTimeout(() => {
      handleAIResponse(messageContent);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Interactive Demo */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Demo Header */}
          <div className="bg-ethos-navy text-white p-4 flex items-center">
            <div className="w-8 h-8 bg-ethos-purple rounded-full flex items-center justify-center mr-3">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold">Your AI Assistant</div>
              <div className="text-xs text-gray-300 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                Online • Responds instantly
              </div>
            </div>
            <div className="ml-auto flex gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            </div>
          </div>

          {/* Demo Conversation */}
          <div className="p-6 h-96 overflow-y-auto bg-gray-50">
            {!demoStarted ? (
              <div className="text-center py-16">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">
                  Choose a scenario below to see your AI assistant in action
                </p>
                <Button onClick={startDemo} variant="ethos">
                  Start Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.type === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {message.type === 'ai' && (
                      <div className="w-8 h-8 bg-ethos-purple rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 max-w-xs ${
                        message.type === 'user'
                          ? 'bg-ethos-purple text-white ml-auto'
                          : 'bg-white shadow-sm border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <div
                        className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-ethos-purple rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-ethos-purple rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Demo Input */}
          <div className="border-t p-4 bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
                disabled={!demoStarted || isTyping}
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!demoStarted || !inputValue.trim() || isTyping}
                variant="ethos"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={resetDemo}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {demoStarted
                ? 'Try asking follow-up questions!'
                : 'Interactive demo - try different scenarios'}
            </div>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Try Different Scenarios:</h4>
          <div className="grid grid-cols-1 gap-2">
            {demoScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setCurrentScenario(scenario);
                  resetDemo();
                }}
                className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                  currentScenario.id === scenario.id
                    ? 'border-ethos-purple bg-ethos-purple/5 text-ethos-purple'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{scenario.title}</div>
                <div className="text-xs text-gray-500 mt-1">{scenario.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Features */}
      <div>
        <div>
          <h3 className="text-2xl font-bold text-ethos-navy mb-6">What Makes This Demo Special</h3>
          <div>
            {[
              {
                icon: <CheckCircle className="w-6 h-6 text-ethos-purple" />,
                title: 'Context-Aware Responses',
                description:
                  'Notice how the AI remembers previous parts of the conversation and provides relevant follow-ups based on your specific business context.',
              },
              {
                icon: <Clock className="w-6 h-6 text-ethos-purple" />,
                title: '24/7 Availability',
                description:
                  'Your AI assistant works around the clock, handling customer inquiries even when your team is offline, ensuring no leads are lost.',
              },
              {
                icon: <Bot className="w-6 h-6 text-ethos-purple" />,
                title: 'Custom Business Knowledge',
                description:
                  'Unlike generic chatbots, this AI is trained on YOUR specific products, services, pricing, and policies for accurate, helpful responses.',
              },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0">{feature.icon}</div>
                <div>
                  <h4 className="font-semibold text-ethos-navy mb-2">{feature.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-ethos-purple/5 to-ethos-navy/5 rounded-lg p-6 border border-ethos-purple/20">
          <h4 className="font-semibold text-ethos-navy mb-3">Ready for Your Custom Demo?</h4>
          <p className="text-gray-600 text-sm mb-4">
            This is just a sample. Your actual AI assistant will be trained on your specific
            business data, integrated with your systems, and customized for your industry.
          </p>
          <Button variant="ethos" size="lg">
            Build My Custom AI Assistant
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
