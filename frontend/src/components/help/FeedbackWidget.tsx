/**
 * FeedbackWidget Component
 *
 * Thumbs up/down feedback widget with React Query mutation and Firestore integration.
 * Tracks user feedback on help articles.
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import {
    HandThumbUpIcon as HandThumbUpSolidIcon,
    HandThumbDownIcon as HandThumbDownSolidIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export interface FeedbackWidgetProps {
  articleId: string;
  onFeedbackSubmit?: (articleId: string, helpful: boolean) => void;
  className?: string;
  'data-testid'?: string;
}

interface FeedbackData {
  articleId: string;
  helpful: boolean;
  timestamp: Date;
}

/**
 * Submit feedback to Firestore
 */
async function submitFeedback(data: FeedbackData): Promise<void> {
  try {
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { getAuth } = await import('firebase/auth');

    const db = getFirestore();
    const auth = getAuth();

    await addDoc(collection(db, 'helpFeedback'), {
      articleId: data.articleId,
      helpful: data.helpful,
      timestamp: serverTimestamp(),
      userId: auth.currentUser?.uid || null,
      userAgent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to submit feedback to Firestore:', error);
    throw error;
  }
}

/**
 * FeedbackWidget Component
 *
 * Displays thumbs up/down buttons for article feedback.
 */
export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  articleId,
  onFeedbackSubmit,
  className,
  'data-testid': testId = 'feedback-widget',
}) => {
  const [userFeedback, setUserFeedback] = useState<boolean | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  // Mutation for submitting feedback
  const feedbackMutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      setShowThankYou(true);
      setTimeout(() => setShowThankYou(false), 3000);
    },
    onError: (error) => {
      console.error('Failed to submit feedback:', error);
      // Reset feedback on error
      setUserFeedback(null);
    },
  });

  const handleFeedback = (helpful: boolean) => {
    // Prevent duplicate submissions
    if (userFeedback !== null) {
      return;
    }

    setUserFeedback(helpful);

    // Submit feedback
    feedbackMutation.mutate({
      articleId,
      helpful,
      timestamp: new Date(),
    });

    // Call optional callback
    if (onFeedbackSubmit) {
      onFeedbackSubmit(articleId, helpful);
    }
  };

  return (
    <div className={cn('text-center', className)} data-testid={testId}>
      {showThankYou ? (
        // Thank you message
        <div className="py-4">
          <p className="text-primary font-medium">Thank you for your feedback! 🎉</p>
        </div>
      ) : (
        <>
          <p className="text-foreground font-medium mb-4">Was this helpful?</p>

          <div className="flex items-center justify-center gap-4">
            {/* Thumbs Up Button */}
            <button
              onClick={() => handleFeedback(true)}
              disabled={userFeedback !== null || feedbackMutation.isPending}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg',
                'border transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                userFeedback === true
                  ? 'bg-green-100 text-green-700 border-green-300 focus:ring-green-500'
                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 focus:ring-green-500',
                userFeedback === false && 'opacity-50 cursor-not-allowed',
                feedbackMutation.isPending && 'opacity-50 cursor-wait'
              )}
              aria-label="Yes, this was helpful"
              aria-pressed={userFeedback === true}
            >
              {userFeedback === true ? (
                <HandThumbUpSolidIcon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <HandThumbUpIcon className="w-5 h-5" aria-hidden="true" />
              )}
              <span>Yes</span>
            </button>

            {/* Thumbs Down Button */}
            <button
              onClick={() => handleFeedback(false)}
              disabled={userFeedback !== null || feedbackMutation.isPending}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg',
                'border transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                userFeedback === false
                  ? 'bg-red-100 text-red-700 border-red-300 focus:ring-red-500'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 focus:ring-red-500',
                userFeedback === true && 'opacity-50 cursor-not-allowed',
                feedbackMutation.isPending && 'opacity-50 cursor-wait'
              )}
              aria-label="No, this was not helpful"
              aria-pressed={userFeedback === false}
            >
              {userFeedback === false ? (
                <HandThumbDownSolidIcon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <HandThumbDownIcon className="w-5 h-5" aria-hidden="true" />
              )}
              <span>No</span>
            </button>
          </div>

          {/* Error message */}
          {feedbackMutation.isError && (
            <p className="text-sm text-destructive mt-3">
              Failed to submit feedback. Please try again.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default FeedbackWidget;
