/**
 * Rating Service
 * Client-side service for managing execution ratings
 */

import {
    collection,
    limit as firestoreLimit,
    getDocs,
    orderBy,
    query,
    Timestamp,
    where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';

export interface RatingSubmission {
  executionId: string;
  rating: number; // 1-5
  thumbsUpDown?: boolean;
  textFeedback?: string;
  promptId?: string;
  modelUsed?: string;
}

export interface Rating {
  id: string;
  executionId: string;
  userId: string;
  rating: number;
  thumbsUpDown?: boolean;
  textFeedback?: string;
  timestamp: Date;
  promptId?: string;
  modelUsed?: string;
}

export interface RatingAggregates {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  thumbsUpCount: number;
  thumbsDownCount: number;
  feedbackCount: number;
}

export interface RatingFilters {
  executionId?: string;
  promptId?: string;
  userId?: string;
  modelUsed?: string;
  limit?: number;
}

/**
 * Submit a rating for an execution
 */
export async function submitRating(ratingData: RatingSubmission): Promise<{ success: boolean; ratingId: string }> {
  try {
    const submitRatingFn = httpsCallable(functions, 'submit_rating');
    const result = await submitRatingFn(ratingData);
    const data = result.data as { success: boolean; ratingId: string; message: string };

    if (!data.success) {
      throw new Error(data.message || 'Failed to submit rating');
    }

    return {
      success: true,
      ratingId: data.ratingId,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error submitting rating:', errorMessage);
    throw new Error(errorMessage || 'Failed to submit rating');
  }
}

/**
 * Get ratings with filters
 */
export async function getRatings(filters: RatingFilters = {}): Promise<Rating[]> {
  try {
    const getRatingsFn = httpsCallable(functions, 'get_ratings');
    const result = await getRatingsFn(filters);
    const data = result.data as { success: boolean; ratings: any[]; count: number };

    if (!data.success) {
      throw new Error('Failed to fetch ratings');
    }

    // Convert timestamps
    return data.ratings.map(rating => ({
      ...rating,
      timestamp: rating.timestamp ? new Date(rating.timestamp) : new Date(),
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching ratings:', errorMessage);
    throw new Error(errorMessage || 'Failed to fetch ratings');
  }
}

/**
 * Get rating aggregates with filters
 */
export async function getRatingAggregates(filters: Omit<RatingFilters, 'limit'> = {}): Promise<RatingAggregates> {
  try {
    const getAggregatesFn = httpsCallable(functions, 'get_rating_aggregates');
    const result = await getAggregatesFn(filters);
    const data = result.data as { success: boolean; aggregates: RatingAggregates };

    if (!data.success) {
      throw new Error('Failed to fetch rating aggregates');
    }

    return data.aggregates;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching rating aggregates:', errorMessage);
    throw new Error(errorMessage || 'Failed to fetch rating aggregates');
  }
}

/**
 * Get rating for a specific execution by current user
 */
export async function getUserRatingForExecution(executionId: string, userId: string): Promise<Rating | null> {
  try {
    const ratingsRef = collection(db, 'execution_ratings');
    const q = query(
      ratingsRef,
      where('executionId', '==', executionId),
      where('userId', '==', userId),
      firestoreLimit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      executionId: data.executionId,
      userId: data.userId,
      rating: data.rating,
      thumbsUpDown: data.thumbsUpDown,
      textFeedback: data.textFeedback,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
      promptId: data.promptId,
      modelUsed: data.modelUsed,
    };
  } catch (error) {
    console.error('Error fetching user rating:', error);
    return null;
  }
}

/**
 * Get top-rated prompts
 */
export async function getTopRatedPrompts(limitCount: number = 10): Promise<Array<{ promptId: string; averageRating: number; totalRatings: number }>> {
  try {
    const ratingsRef = collection(db, 'execution_ratings');
    const snapshot = await getDocs(ratingsRef);

    // Group by promptId and calculate averages
    const promptRatings = new Map<string, { sum: number; count: number }>();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.promptId) {
        const current = promptRatings.get(data.promptId) || { sum: 0, count: 0 };
        promptRatings.set(data.promptId, {
          sum: current.sum + data.rating,
          count: current.count + 1,
        });
      }
    });

    // Convert to array and sort
    const results = Array.from(promptRatings.entries())
      .map(([promptId, stats]) => ({
        promptId,
        averageRating: stats.sum / stats.count,
        totalRatings: stats.count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limitCount);

    return results;
  } catch (error) {
    console.error('Error fetching top-rated prompts:', error);
    return [];
  }
}

/**
 * Get rating trends over time
 */
export async function getRatingTrends(
  filters: Omit<RatingFilters, 'limit'> = {},
  days: number = 30
): Promise<Array<{ date: string; averageRating: number; count: number }>> {
  try {
    const ratingsRef = collection(db, 'execution_ratings');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let q = query(
      ratingsRef,
      where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('timestamp', 'asc')
    );

    // Apply additional filters
    if (filters.promptId) {
      q = query(q, where('promptId', '==', filters.promptId));
    }
    if (filters.modelUsed) {
      q = query(q, where('modelUsed', '==', filters.modelUsed));
    }
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }

    const snapshot = await getDocs(q);

    // Group by date
    const dailyRatings = new Map<string, { sum: number; count: number }>();

    snapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp);
      const dateKey = timestamp.toISOString().split('T')[0];

      const current = dailyRatings.get(dateKey) || { sum: 0, count: 0 };
      dailyRatings.set(dateKey, {
        sum: current.sum + data.rating,
        count: current.count + 1,
      });
    });

    // Convert to array and calculate averages
    return Array.from(dailyRatings.entries())
      .map(([date, stats]) => ({
        date,
        averageRating: stats.sum / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching rating trends:', error);
    return [];
  }
}

/**
 * Get model performance comparison based on ratings
 */
export async function getModelRatingComparison(): Promise<Array<{ model: string; averageRating: number; totalRatings: number }>> {
  try {
    const ratingsRef = collection(db, 'execution_ratings');
    const snapshot = await getDocs(ratingsRef);

    // Group by model
    const modelRatings = new Map<string, { sum: number; count: number }>();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.modelUsed) {
        const current = modelRatings.get(data.modelUsed) || { sum: 0, count: 0 };
        modelRatings.set(data.modelUsed, {
          sum: current.sum + data.rating,
          count: current.count + 1,
        });
      }
    });

    // Convert to array and sort
    return Array.from(modelRatings.entries())
      .map(([model, stats]) => ({
        model,
        averageRating: stats.sum / stats.count,
        totalRatings: stats.count,
      }))
      .filter(item => item.totalRatings >= 5) // Only include models with 5+ ratings
      .sort((a, b) => b.averageRating - a.averageRating);
  } catch (error) {
    console.error('Error fetching model rating comparison:', error);
    return [];
  }
}
