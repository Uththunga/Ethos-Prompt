import React, { useState } from 'react';
import { FeedbackContext, FeedbackType, useFeedbackCollection } from '../../services/userFeedbackService';

interface FeedbackCollectorProps {
  type: FeedbackType;
  context: FeedbackContext;
  trigger?: 'button' | 'modal' | 'inline';
  title?: string;
  placeholder?: string;
  showRating?: boolean;
  showComment?: boolean;
  onSubmit?: (rating?: number, comment?: string) => void;
  className?: string;
}

export const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({
  type,
  context,
  trigger = 'button',
  title,
  placeholder = 'Please share your feedback...',
  showRating = true,
  showComment = true,
  onSubmit,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number | undefined>();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { collectFeedback } = useFeedbackCollection();

  const handleSubmit = async () => {
    if (!rating && !comment.trim()) return;

    setIsSubmitting(true);
    try {
      await collectFeedback(type, context, rating, comment.trim() || undefined);
      setIsSubmitted(true);
      onSubmit?.(rating, comment.trim() || undefined);

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setRating(undefined);
        setComment('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium text-gray-700">Rating:</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(star)}
          className={`text-2xl transition-colors ${
            rating && star <= rating
              ? 'text-yellow-400 hover:text-yellow-500'
              : 'text-gray-300 hover:text-yellow-300'
          }`}
        >
          ★
        </button>
      ))}
      {rating && (
        <span className="ml-2 text-sm text-gray-600">
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </span>
      )}
    </div>
  );

  const renderFeedbackForm = () => (
    <div >
      {title && (
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      )}

      {showRating && renderStarRating()}

      {showComment && (
        <div>
          <label htmlFor="feedback-comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comments (optional)
          </label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-transparent"
          />
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!rating && !comment.trim())}
          className="px-4 py-2 text-sm font-medium text-white bg-ethos-purple rounded-md hover:bg-ethos-purple-light disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );

  const renderSuccessMessage = () => (
    <div className="text-center py-4">
      <div className="text-green-600 text-4xl mb-2">✓</div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">Thank you!</h3>
      <p className="text-sm text-gray-600">Your feedback has been submitted.</p>
    </div>
  );

  if (trigger === 'inline') {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        {isSubmitted ? renderSuccessMessage() : renderFeedbackForm()}
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ethos-purple ${className}`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
        </svg>
        Give Feedback
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal panel */}
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              {isSubmitted ? renderSuccessMessage() : renderFeedbackForm()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Quick feedback components for specific use cases
export const SearchFeedbackCollector: React.FC<{
  searchQuery: string;
  searchType: 'semantic' | 'keyword' | 'hybrid';
  resultsCount: number;
  responseTime: number;
  className?: string;
}> = ({ searchQuery, searchType, resultsCount, responseTime, className }) => {
  const { collectSearchFeedback } = useFeedbackCollection();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRatingClick = async (selectedRating: number) => {
    setIsSubmitted(true);

    await collectSearchFeedback(
      searchQuery,
      searchType,
      resultsCount,
      responseTime,
      selectedRating
    );

    // Reset after a delay
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
        <span>✓</span>
        <span>Thank you for your feedback!</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">How relevant were these results?</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRatingClick(star)}
          className="text-lg text-gray-300 hover:text-yellow-400 transition-colors"
          title={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// Floating feedback button
export const FloatingFeedbackButton: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <FeedbackCollector
        type={FeedbackType.GENERAL_SATISFACTION}
        context={{
          page: window.location.pathname,
          feature: 'general'
        }}
        title="How is your experience?"
        className="bg-ethos-purple text-white border-ethos-purple hover:bg-ethos-purple-light shadow-lg"
      />
    </div>
  );
};

// Implicit feedback tracker (no UI, just tracks user behavior)
export const ImplicitFeedbackTracker: React.FC<{
  children: React.ReactNode;
  action: string;
  context: FeedbackContext;
  metadata?: Record<string, string | number | boolean>;
}> = ({ children, action, context, metadata }) => {
  const { collectImplicitFeedback } = useFeedbackCollection();

  const handleInteraction = () => {
    collectImplicitFeedback(action, context, metadata);
  };

  return (
    <div onClick={handleInteraction}>
      {children}
    </div>
  );
};
