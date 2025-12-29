/* eslint-disable react-refresh/only-export-components */

/**
 * Comprehensive Feedback Collection System
 * Handles in-app feedback, surveys, user interviews, and analytics
 */

import {
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon,
    StarIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';

import { Button } from '../marketing/ui/button';

// Feedback Types
type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general' | 'rating';
type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';
type FeedbackCategory = 'ui' | 'performance' | 'functionality' | 'content' | 'other';

interface FeedbackData {
  type: FeedbackType;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  title: string;
  description: string;
  rating?: number;
  email?: string;
  screenshot?: File;
  userAgent: string;
  url: string;
  timestamp: number;
  userId?: string;
}

interface FeedbackContextType {
  showFeedbackWidget: boolean;
  toggleFeedbackWidget: () => void;
  submitFeedback: (feedback: FeedbackData) => Promise<void>;
  showQuickRating: (context: string) => void;
}

// Feedback Context
const FeedbackContext = React.createContext<FeedbackContextType | null>(null);

export const useFeedback = () => {
  const context = React.useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
};

// Main Feedback Provider
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showFeedbackWidget, setShowFeedbackWidget] = useState(false);
  const [quickRatingContext, setQuickRatingContext] = useState<string | null>(null);

  const toggleFeedbackWidget = () => {
    setShowFeedbackWidget((prev) => !prev);
  };

  const submitFeedback = async (feedback: FeedbackData) => {
    try {
      // In a real app, this would send to your backend
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Show success message
      console.log('Feedback submitted successfully');
      setShowFeedbackWidget(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const showQuickRating = (context: string) => {
    setQuickRatingContext(context);
  };

  const contextValue: FeedbackContextType = {
    showFeedbackWidget,
    toggleFeedbackWidget,
    submitFeedback,
    showQuickRating,
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <FeedbackWidget />
      <FeedbackButton />
      {quickRatingContext && (
        <QuickRating context={quickRatingContext} onClose={() => setQuickRatingContext(null)} />
      )}
    </FeedbackContext.Provider>
  );
};

// Feedback Widget Component
const FeedbackWidget: React.FC = () => {
  const { showFeedbackWidget, toggleFeedbackWidget, submitFeedback } = useFeedback();
  const [formData, setFormData] = useState<Partial<FeedbackData>>({
    type: 'general',
    category: 'functionality',
    priority: 'medium',
    title: '',
    description: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);

  if (!showFeedbackWidget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        ...(formData as FeedbackData),
        screenshot: screenshot || undefined,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
      };

      await submitFeedback(feedbackData);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScreenshot = async () => {
    try {
      // In a real app, you'd use a library like html2canvas
      console.log('Screenshot functionality would be implemented here');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Send Feedback</h2>
            <button onClick={toggleFeedbackWidget} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Feedback Type */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as FeedbackType })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement Suggestion</option>
              </select>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as FeedbackCategory })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="functionality">Functionality</option>
                <option value="ui">User Interface</option>
                <option value="performance">Performance</option>
                <option value="content">Content</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as FeedbackPriority })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of your feedback"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please provide detailed information..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium mb-2">Email (optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll only use this to follow up on your feedback
              </p>
            </div>

            {/* Screenshot */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium mb-2">Screenshot (optional)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleScreenshot}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Capture Screenshot
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="flex-1 text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={toggleFeedbackWidget}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-ethos-purple text-white px-4 py-2 rounded-md hover:bg-ethos-purple/90 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Feedback Button Component
const FeedbackButton: React.FC = () => {
  const { toggleFeedbackWidget } = useFeedback();

  return (
    <Button
      onClick={toggleFeedbackWidget}
      variant="ethos"
      size="icon"
      className="fixed bottom-4 left-4 rounded-full shadow-lg hover:bg-ethos-purple/90 transition-colors z-40"
      title="Send Feedback"
    >
      <ChatBubbleLeftRightIcon className="h-6 w-6" />
    </Button>
  );
};

// Quick Rating Component
const QuickRating: React.FC<{
  context: string;
  onClose: () => void;
}> = ({ context, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { submitFeedback } = useFeedback();

  const handleSubmit = async () => {
    if (rating === 0) return;

    try {
      await submitFeedback({
        type: 'rating',
        category: 'other',
        priority: 'low',
        title: `Rating for ${context}`,
        description: feedback || `User rated ${context} ${rating}/5 stars`,
        rating,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
      });

      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  if (submitted) {
    return (
      <div className="fixed bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
        <div className="text-center">
          <div className="text-green-600 font-medium">Thank you!</div>
          <div className="text-sm text-gray-600">Your feedback helps us improve</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">How was {context}?</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="text-yellow-400 hover:text-yellow-500"
          >
            {star <= (hoveredRating || rating) ? (
              <StarIconSolid className="h-6 w-6" />
            ) : (
              <StarIcon className="h-6 w-6" />
            )}
          </button>
        ))}
      </div>

      {rating > 0 && (
        <>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us more (optional)"
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-ethos-purple text-white py-2 rounded-md hover:bg-ethos-purple/90 text-sm"
          >
            Submit Rating
          </button>
        </>
      )}
    </div>
  );
};

// Context-specific feedback triggers
export const FeedbackTrigger: React.FC<{
  context: string;
  trigger?: 'auto' | 'manual';
  delay?: number;
}> = ({ context, trigger = 'manual', delay = 5000 }) => {
  const { showQuickRating } = useFeedback();

  useEffect(() => {
    if (trigger === 'auto') {
      const timer = setTimeout(() => {
        showQuickRating(context);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [context, trigger, delay, showQuickRating]);

  if (trigger === 'manual') {
    return (
      <button
        onClick={() => showQuickRating(context)}
        className="text-sm text-ethos-purple hover:text-ethos-purple/80"
      >
        Rate this experience
      </button>
    );
  }

  return null;
};

export default FeedbackSystem;
