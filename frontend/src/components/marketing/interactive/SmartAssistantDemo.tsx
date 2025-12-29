import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    User,
    MessageSquare,
    CheckCircle,
    TrendingUp,
    BarChart3,
    Calendar,
    Zap,
    Send,
    Play,
    RotateCcw,
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    action?: string;
    data?: Record<string, unknown>;
    typing?: boolean;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
  };
  avatar?: string;
}

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  industry?: string;
  color?: string;
  messages: Omit<Message, 'id' | 'timestamp'>[];
  interactiveResponses?: {
    [key: string]: Omit<Message, 'id' | 'timestamp'>[];
  };
}

interface DemoSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  autoPlay: boolean;
  typingSpeed: 'slow' | 'normal' | 'fast';
}

const demoScenarios: DemoScenario[] = [
  {
    id: 'customer-support',
    title: 'Customer Support',
    description: 'Handle customer inquiries instantly',
    icon: <MessageSquare className="w-5 h-5" />,
    industry: 'E-commerce',
    color: 'blue',
    messages: [
      {
        type: 'user',
        content:
          "Hi, I need help with my recent order. It was supposed to arrive yesterday but I haven't received it yet.",
      },
      {
        type: 'assistant',
        content:
          "I'd be happy to help you track your order! Let me look that up for you right away.",
        metadata: { action: 'searching' },
      },
      {
        type: 'assistant',
        content:
          "I found your order #12345. I can see it's currently in transit and should arrive today by 6 PM. The delay was due to weather conditions in your area. I've also applied a 10% discount to your next order as an apology for the inconvenience. Is there anything else I can help you with?",
        metadata: { action: 'order_found', data: { discount: '10%', eta: 'Today 6 PM' } },
      },
      {
        type: 'user',
        content: "That's great, thank you! Can you send me tracking updates?",
      },
      {
        type: 'assistant',
        content:
          "Absolutely! I've set up automatic tracking notifications for your email and phone. You'll receive updates when your package is out for delivery and when it's delivered. Have a great day!",
        metadata: { action: 'notifications_enabled' },
      },
    ],
  },
  {
    id: 'lead-qualification',
    title: 'Lead Qualification',
    description: 'Qualify and nurture leads automatically',
    icon: <TrendingUp className="w-5 h-5" />,
    messages: [
      {
        type: 'user',
        content: "I'm interested in your business automation services. Can you tell me more?",
      },
      {
        type: 'assistant',
        content:
          "I'd love to help you explore how our automation solutions can transform your business! To provide the most relevant information, could you tell me a bit about your company? What industry are you in and roughly how many employees do you have?",
      },
      {
        type: 'user',
        content:
          "We're a mid-size accounting firm with about 25 employees. We handle a lot of repetitive client communications.",
      },
      {
        type: 'assistant',
        content:
          "Perfect! Accounting firms like yours typically see 40-60% time savings with our Smart Business Assistant. Based on your size, you could potentially save $180,000 annually while improving client satisfaction. I'd like to schedule a personalized demo to show you exactly how this would work for your firm. What's your preferred time this week?",
        metadata: {
          action: 'qualified_lead',
          data: { industry: 'accounting', size: '25 employees', savings: '$180,000' },
        },
      },
      {
        type: 'user',
        content: 'Thursday afternoon works well for me.',
      },
      {
        type: 'assistant',
        content:
          "Excellent! I've scheduled a 30-minute personalized demo for Thursday at 2 PM. I'll send you a calendar invite with a preparation checklist so we can maximize your time. You'll also receive our \"Accounting Firm Automation Guide\" via email in the next few minutes. Looking forward to showing you how we can transform your client communications!",
        metadata: { action: 'demo_scheduled', data: { time: 'Thursday 2 PM' } },
      },
    ],
  },
  {
    id: 'appointment-booking',
    title: 'Appointment Booking',
    description: 'Schedule appointments seamlessly',
    icon: <Calendar className="w-5 h-5" />,
    messages: [
      {
        type: 'user',
        content: 'I need to schedule a consultation for next week.',
      },
      {
        type: 'assistant',
        content:
          "I'd be happy to help you schedule a consultation! Let me check our availability for next week.",
        metadata: { action: 'checking_calendar' },
      },
      {
        type: 'assistant',
        content:
          'I have several time slots available next week:\n\n• Tuesday, March 12th at 10:00 AM or 2:00 PM\n• Wednesday, March 13th at 9:00 AM or 3:00 PM\n• Friday, March 15th at 11:00 AM or 4:00 PM\n\nWhich time works best for you?',
      },
      {
        type: 'user',
        content: 'Wednesday at 2:00 PM would be perfect.',
      },
      {
        type: 'assistant',
        content:
          "Great choice! I've booked your consultation for Wednesday, March 13th at 2:00 PM. You'll receive a confirmation email with:\n\n✓ Calendar invite with video call link\n✓ Pre-consultation questionnaire\n✓ Preparation materials\n\nI've also set up reminder notifications for 24 hours and 1 hour before your appointment. Is there anything specific you'd like to discuss during the consultation?",
        metadata: { action: 'appointment_booked', data: { date: 'March 13th', time: '2:00 PM' } },
      },
    ],
  },
  {
    id: 'healthcare-support',
    title: 'Healthcare Support',
    description: 'Patient inquiries and appointment management',
    icon: <MessageSquare className="w-5 h-5" />,
    industry: 'Healthcare',
    color: 'green',
    messages: [
      {
        type: 'user',
        content: 'Hi, I need to reschedule my appointment with Dr. Smith next Tuesday.',
      },
      {
        type: 'assistant',
        content:
          "I'd be happy to help you reschedule your appointment with Dr. Smith. Let me check his availability.",
        metadata: { action: 'checking_calendar' },
      },
      {
        type: 'assistant',
        content:
          'I can offer you these alternative times:\n\n• Thursday, March 14th at 2:30 PM\n• Friday, March 15th at 10:00 AM\n• Monday, March 18th at 3:00 PM\n\nAll appointments include a pre-visit health screening. Which works best for you?',
      },
      {
        type: 'user',
        content: 'Friday at 10:00 AM works perfectly.',
      },
      {
        type: 'assistant',
        content:
          "Perfect! I've rescheduled your appointment for Friday, March 15th at 10:00 AM with Dr. Smith. You'll receive:\n\n✓ Confirmation text and email\n✓ Pre-visit health questionnaire\n✓ Parking and check-in instructions\n✓ Insurance verification confirmation\n\nIs there anything specific you'd like Dr. Smith to focus on during your visit?",
        metadata: {
          action: 'appointment_rescheduled',
          data: { date: 'March 15th', time: '10:00 AM' },
        },
      },
    ],
  },
  {
    id: 'ecommerce-sales',
    title: 'E-commerce Sales',
    description: 'Product recommendations and order processing',
    icon: <MessageSquare className="w-5 h-5" />,
    industry: 'Retail',
    color: 'purple',
    messages: [
      {
        type: 'user',
        content: "I'm looking for a laptop for my college student. Budget is around $800.",
      },
      {
        type: 'assistant',
        content:
          "Great! I'd love to help you find the perfect laptop for your college student. Let me ask a few quick questions to narrow down the best options.",
        metadata: { action: 'product_search' },
      },
      {
        type: 'assistant',
        content:
          'Based on your budget, I recommend these top-rated student laptops:\n\n🎓 **Dell Inspiron 15** - $749\n• 8GB RAM, 256GB SSD\n• 10-hour battery life\n• Perfect for coursework\n\n🎓 **HP Pavilion 14** - $799\n• 16GB RAM, 512GB SSD\n• Lightweight design\n• Great for programming\n\nBoth come with student discounts and free shipping. Would you like detailed specs on either?',
        metadata: { action: 'recommendations_provided' },
      },
      {
        type: 'user',
        content: 'The HP Pavilion sounds perfect! Can I order it now?',
      },
      {
        type: 'assistant',
        content:
          "Excellent choice! I've added the HP Pavilion 14 to your cart with the student discount applied - final price $759.\n\n✓ Free 2-day shipping\n✓ 1-year warranty included\n✓ 30-day return policy\n✓ Free setup support\n\nReady to checkout? I can also set up extended warranty options if interested.",
        metadata: { action: 'cart_updated', data: { product: 'HP Pavilion 14', price: '$759' } },
      },
    ],
  },
];

export const SmartAssistantDemo: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string>(demoScenarios[0].id);
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isInteractiveMode, setIsInteractiveMode] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [settings] = useState<DemoSettings>({
    soundEnabled: false,
    darkMode: false,
    autoPlay: false,
    typingSpeed: 'normal',
  });
  const [analytics, setAnalytics] = useState({
    scenarioViews: {} as Record<string, number>,
    completionRate: 0,
    userInteractions: 0,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentScenario = demoScenarios.find((s) => s.id === activeScenario) || demoScenarios[0];

  // Helper functions
  const getTypingDelay = useCallback(() => {
    const delays = { slow: 3000, normal: 2000, fast: 1000 };
    return delays[settings.typingSpeed];
  }, [settings.typingSpeed]);

  const playNotificationSound = useCallback(() => {
    if (settings.soundEnabled) {
      // Create a simple notification sound
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }, [settings.soundEnabled]);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  const trackAnalytics = useCallback(
    (event: string, data?: Record<string, unknown>) => {
      setAnalytics((prev) => ({
        ...prev,
        userInteractions: prev.userInteractions + 1,
        scenarioViews: {
          ...prev.scenarioViews,
          [activeScenario]: (prev.scenarioViews[activeScenario] || 0) + 1,
        },
      }));

      // Track with Google Analytics if available
      if (typeof window !== 'undefined') {
        const windowWithGtag = window as Window & {
          gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void;
        };
        if (windowWithGtag.gtag) {
          windowWithGtag.gtag('event', event, {
            event_category: 'Smart Assistant Demo',
            event_label: activeScenario,
            ...data,
          });
        }
      }
    },
    [activeScenario]
  );

  useEffect(() => {
    setCurrentMessageIndex(0);
    setDisplayedMessages([]);
    setIsPlaying(false);
    setIsInteractiveMode(false);
    trackAnalytics('scenario_changed', { scenario: activeScenario });
  }, [activeScenario, trackAnalytics]);

  useEffect(() => {
    if (isPlaying && currentMessageIndex < currentScenario.messages.length) {
      setIsTyping(true);
      const delay =
        currentScenario.messages[currentMessageIndex].type === 'user' ? 1000 : getTypingDelay();

      const timer = setTimeout(() => {
        const newMessage: Message = {
          id: `${activeScenario}-${currentMessageIndex}`,
          timestamp: new Date(),
          ...currentScenario.messages[currentMessageIndex],
        };

        setDisplayedMessages((prev) => [...prev, newMessage]);
        setCurrentMessageIndex((prev) => prev + 1);
        setIsTyping(false);
        playNotificationSound();
        scrollToBottom();
      }, delay);

      return () => clearTimeout(timer);
    } else if (currentMessageIndex >= currentScenario.messages.length) {
      setIsPlaying(false);
      setIsTyping(false);
      trackAnalytics('demo_completed', { scenario: activeScenario });
    }
  }, [
    isPlaying,
    currentMessageIndex,
    activeScenario,
    currentScenario.messages,
    getTypingDelay,
    playNotificationSound,
    scrollToBottom,
    trackAnalytics,
  ]);

  // Auto-scroll when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages, scrollToBottom]);

  const startDemo = () => {
    setCurrentMessageIndex(0);
    setDisplayedMessages([]);
    setIsPlaying(true);
    setIsInteractiveMode(false);
    trackAnalytics('demo_started', { scenario: activeScenario });
  };

  const resetDemo = () => {
    setCurrentMessageIndex(0);
    setDisplayedMessages([]);
    setIsPlaying(false);
    setIsInteractiveMode(false);
    setUserInput('');
    trackAnalytics('demo_reset', { scenario: activeScenario });
  };

  const enableInteractiveMode = () => {
    setIsInteractiveMode(true);
    setIsPlaying(false);
    trackAnalytics('interactive_mode_enabled', { scenario: activeScenario });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleUserMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setDisplayedMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);

    trackAnalytics('user_message_sent', {
      scenario: activeScenario,
      message_length: userInput.length,
    });

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's a great question! Let me help you with that.",
        "I understand your concern. Here's what I can do for you...",
        "Thanks for that information. Based on what you've told me, I recommend...",
        "I'd be happy to assist you with that. Let me look into this right away.",
        "That's exactly the kind of situation our Smart Assistant excels at handling!",
      ];

      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        metadata: { action: 'interactive_response' },
      };

      setDisplayedMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
      playNotificationSound();
      scrollToBottom();
    }, getTypingDelay());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserMessage();
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-ethos-navy/5 to-ethos-purple/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6">
            <span className="text-ethos-navy">See Your </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              Smart Business Assistant in Action
            </span>
          </h2>
          <p className="text-body-large text-ethos-gray max-w-3xl mx-auto">
            Watch how our AI handles real business scenarios with the intelligence and efficiency of
            your best employee—available 24/7.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Scenario Selection */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-ethos-navy">Choose a Scenario</h3>
            </div>

            <div className="flex flex-col gap-3">
              {demoScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setActiveScenario(scenario.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    activeScenario === scenario.id
                      ? 'border-ethos-purple bg-ethos-purple/10'
                      : 'border-gray-200 hover:border-ethos-purple/50 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        activeScenario === scenario.id
                          ? 'bg-ethos-purple text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {scenario.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{scenario.title}</h4>
                        {scenario.industry && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {scenario.industry}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                      {Boolean(analytics.scenarioViews[scenario.id]) && (
                        <p className="text-xs text-gray-500 mt-1">
                          Viewed {analytics.scenarioViews[scenario.id]} times
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={startDemo}
                  disabled={isPlaying || isInteractiveMode}
                  className="flex items-center justify-center bg-ethos-purple text-white px-4 py-3 rounded-lg font-semibold hover:bg-ethos-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isPlaying ? 'Playing...' : 'Start Demo'}
                </button>
                <button
                  onClick={resetDemo}
                  className="flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </button>
              </div>

              <button
                onClick={enableInteractiveMode}
                disabled={isPlaying}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Zap className="w-4 h-4 mr-2 inline" />
                Try Interactive Mode
              </button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-ethos-navy to-ethos-purple p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Smart Business Assistant</h4>
                    <p className="text-white/80 text-sm">Online • Responds instantly</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/80 text-sm">Live Demo</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={chatContainerRef} className="h-96 overflow-y-auto p-4">
                <AnimatePresence>
                  {displayedMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex mb-4 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-ethos-purple text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.type === 'assistant' && (
                            <Bot className="w-4 h-4 mt-1 text-ethos-purple" />
                          )}
                          {message.type === 'user' && <User className="w-4 h-4 mt-1 text-white" />}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-line">{message.content}</p>
                            {message.metadata?.action && (
                              <div className="mt-2 text-xs opacity-75">
                                {message.metadata.action === 'searching' && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                    <span>Searching database...</span>
                                  </div>
                                )}
                                {message.metadata.action === 'order_found' && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Order located • Discount applied</span>
                                  </div>
                                )}
                                {message.metadata.action === 'qualified_lead' && (
                                  <div className="flex items-center gap-1">
                                    <BarChart3 className="w-3 h-3" />
                                    <span>Lead qualified • ROI calculated</span>
                                  </div>
                                )}
                                {message.metadata.action === 'appointment_booked' && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Calendar updated • Reminders set</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {(isPlaying && currentMessageIndex < currentScenario.messages.length) ||
                isTyping ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-ethos-purple" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-ethos-purple rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-ethos-purple rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-ethos-purple rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {isTyping ? 'AI is thinking...' : 'Loading next message...'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                {isInteractiveMode ? (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <Zap className="w-4 h-4" />
                      <span>Interactive Mode Active - Type your own messages!</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message here..."
                        disabled={isTyping}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ethos-purple focus:border-transparent disabled:opacity-50"
                      />
                      <button
                        onClick={handleUserMessage}
                        disabled={!userInput.trim() || isTyping}
                        className="bg-ethos-purple text-white px-4 py-2 rounded-lg hover:bg-ethos-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Press Enter to send • Shift+Enter for new line</span>
                      <span>{userInput.length}/500</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder={
                        isPlaying
                          ? 'Demo is running...'
                          : 'Choose a scenario and start the demo, or try Interactive Mode!'
                      }
                      disabled
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <button
                      disabled
                      className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed flex items-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Stats */}
        <div className="mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <motion.div
              className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-3xl font-bold text-ethos-purple">87%</div>
              <div className="text-sm text-gray-600">Faster Response Times</div>
            </motion.div>
            <motion.div
              className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-3xl font-bold text-ethos-purple">12x</div>
              <div className="text-sm text-gray-600">Cost Reduction</div>
            </motion.div>
            <motion.div
              className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-3xl font-bold text-ethos-purple">35%</div>
              <div className="text-sm text-gray-600">More Conversions</div>
            </motion.div>
            <motion.div
              className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-3xl font-bold text-ethos-purple">24/7</div>
              <div className="text-sm text-gray-600">Always Available</div>
            </motion.div>
          </div>

          {/* Interactive Analytics */}
          {analytics.userInteractions > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-ethos-navy mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Your Demo Activity
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-ethos-purple">
                    {analytics.userInteractions}
                  </div>
                  <div className="text-sm text-gray-600">Total Interactions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-ethos-purple">
                    {Object.keys(analytics.scenarioViews).length}
                  </div>
                  <div className="text-sm text-gray-600">Scenarios Explored</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-ethos-purple">
                    {Math.round((analytics.userInteractions / 10) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Engagement Score</div>
                </div>
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-ethos-navy to-ethos-purple p-8 rounded-lg text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h3>
            <p className="text-lg mb-6 opacity-90">
              See how our Smart Business Assistant can revolutionize your customer interactions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.open('/contact?source=smart-assistant-demo', '_blank')}
                className="bg-white text-ethos-navy px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Free Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
