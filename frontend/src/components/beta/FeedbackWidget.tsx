import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorToast, useSuccessToast } from '../common/Toast';
import { Button } from '../marketing/ui/button';

interface FeedbackData {
  category: string;
  rating: number;
  comment: string;
  feature?: string;
  page?: string;
}

interface BetaStatus {
  isBetaUser: boolean;
  features: Record<string, boolean>;
}

const FeedbackWidget: React.FC = () => {
  const { user } = useAuth();
  const showSuccessToast = useSuccessToast();
  const showErrorToast = useErrorToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isBetaUser, setIsBetaUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    category: '',
    rating: 0,
    comment: '',
    feature: '',
    page: window.location.pathname,
  });

  const checkBetaStatus = useCallback(async () => {
    if (!user?.accessToken) return;

    try {
      const response = await fetch('/api/beta/status', {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      if (response.ok) {
        const data: BetaStatus = await response.json();
        setIsBetaUser(data.isBetaUser);
      }
    } catch (error) {
      console.error('Failed to check beta status:', error);
    }
  }, [user?.accessToken]);

  useEffect(() => {
    checkBetaStatus();
  }, [user, checkBetaStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackData.category || !feedbackData.comment || feedbackData.rating === 0) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/beta/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.accessToken}`,
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        showSuccessToast('Thank you for your feedback!');
        setIsOpen(false);
        setFeedbackData({
          category: '',
          rating: 0,
          comment: '',
          feature: '',
          page: window.location.pathname,
        });
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch {
      showErrorToast('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFeedbackData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (rating: number) => {
    setFeedbackData((prev) => ({ ...prev, rating }));
  };

  // Only show for beta users
  if (!isBetaUser) {
    return null;
  }

  return (
    <>
      {/* Feedback Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="ethos"
          size="default"
          className="p-3 rounded-full shadow-lg transition-colors duration-200 flex items-center gap-2"
          title="Share Beta Feedback"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="hidden sm:inline">Beta Feedback</span>
        </Button>
      </div>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-ethos-navy">Beta Feedback</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-ethos-navy mb-2"
                  >
                    Feedback Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={feedbackData.category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-ethos-purple focus:border-ethos-purple bg-white text-ethos-navy"
                  >
                    <option value="">Select a category</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                    <option value="performance">Performance Issue</option>
                    <option value="ui">User Interface</option>
                    <option value="documentation">Documentation</option>
                    <option value="general">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="feature"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Specific Feature (Optional)
                  </label>
                  <input
                    type="text"
                    id="feature"
                    name="feature"
                    value={feedbackData.feature}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-ethos-purple focus:border-ethos-purple dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Prompt Editor, Document Upload, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ethos-navy mb-2">
                    Overall Rating *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className={`text-2xl transition-colors duration-200 ${
                          star <= feedbackData.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    1 = Poor, 5 = Excellent
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Your Feedback *
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    required
                    rows={4}
                    value={feedbackData.comment}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-ethos-purple focus:border-ethos-purple dark:bg-gray-700 dark:text-white"
                    placeholder="Please share your thoughts, suggestions, or report any issues you've encountered..."
                  />
                </div>

                <div className="bg-ethos-purple-light dark:bg-ethos-purple-dark p-3 rounded-md">
                  <p className="text-sm text-ethos-purple-dark dark:text-ethos-purple-light">
                    <strong>Thank you for being a beta user!</strong> Your feedback is invaluable in
                    helping us improve the platform. We review all feedback and will follow up if we
                    need more information.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="ethos"
                    size="sm"
                    className="flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
