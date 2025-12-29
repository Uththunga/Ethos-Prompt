import { logEvent } from 'firebase/analytics';
import { analytics } from '../config/firebase';

export interface FeedbackData {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  type: FeedbackType;
  context: FeedbackContext;
  rating?: number; // 1-5 scale
  comment?: string;
  metadata: Record<string, unknown>;
}

export enum FeedbackType {
  SEARCH_RELEVANCE = 'search_relevance',
  SEARCH_SPEED = 'search_speed',
  UI_USABILITY = 'ui_usability',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  GENERAL_SATISFACTION = 'general_satisfaction',
  HYBRID_SEARCH_QUALITY = 'hybrid_search_quality',
  DOCUMENT_PROCESSING = 'document_processing',
  AI_RESPONSE_QUALITY = 'ai_response_quality'
}

export interface FeedbackContext {
  page: string;
  feature: string;
  searchQuery?: string;
  searchType?: 'semantic' | 'keyword' | 'hybrid';
  searchResults?: number;
  responseTime?: number;
  documentId?: string;
  promptId?: string;
  errorCode?: string;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  feedbackByType: Record<FeedbackType, number>;
  feedbackByRating: Record<number, number>;
  trendData: FeedbackTrend[];
  sentimentAnalysis: SentimentAnalysis;
  actionableInsights: ActionableInsight[];
}

export interface FeedbackTrend {
  date: string;
  averageRating: number;
  feedbackCount: number;
  topIssues: string[];
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  keywords: { word: string; frequency: number; sentiment: 'positive' | 'negative' | 'neutral' }[];
}

export interface ActionableInsight {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  impact: string;
  recommendation: string;
  affectedUsers: number;
  estimatedEffort: string;
}

export class UserFeedbackService {
  private feedbackQueue: FeedbackData[] = [];
  private readonly BATCH_SIZE = 20;
  private readonly FLUSH_INTERVAL = 10000; // 10 seconds

  constructor() {
    // Set up periodic flush
    setInterval(() => this.flushFeedback(), this.FLUSH_INTERVAL);
  }

  /**
   * Collect user feedback
   */
  async collectFeedback(
    type: FeedbackType,
    context: FeedbackContext,
    rating?: number,
    comment?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const feedback: FeedbackData = {
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      timestamp: new Date(),
      type,
      context,
      rating,
      comment,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href
      }
    };

    this.feedbackQueue.push(feedback);

    // Log to Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'user_feedback_collected', {
        feedback_type: type,
        rating: rating || 0,
        has_comment: !!comment,
        context_feature: context.feature,
        context_page: context.page
      });
    }

    // Immediate flush for high-priority feedback
    if (rating && rating <= 2) {
      await this.flushFeedback();
    }
  }

  /**
   * Collect search relevance feedback
   */
  async collectSearchFeedback(
    searchQuery: string,
    searchType: 'semantic' | 'keyword' | 'hybrid',
    resultsCount: number,
    responseTime: number,
    relevanceRating: number,
    comment?: string
  ): Promise<void> {
    await this.collectFeedback(
      FeedbackType.SEARCH_RELEVANCE,
      {
        page: 'search',
        feature: 'hybrid_search',
        searchQuery,
        searchType,
        searchResults: resultsCount,
        responseTime
      },
      relevanceRating,
      comment,
      {
        searchMetrics: {
          query: searchQuery,
          type: searchType,
          results: resultsCount,
          latency: responseTime
        }
      }
    );
  }

  /**
   * Collect implicit feedback from user behavior
   */
  async collectImplicitFeedback(
    action: string,
    context: FeedbackContext,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    // Convert user actions to implicit feedback
    let implicitRating: number | undefined;
    let feedbackType: FeedbackType;

    switch (action) {
      case 'search_result_clicked':
        implicitRating = 4; // Clicking suggests relevance
        feedbackType = FeedbackType.SEARCH_RELEVANCE;
        break;
      case 'search_refined':
        implicitRating = 2; // Refining suggests poor initial results
        feedbackType = FeedbackType.SEARCH_RELEVANCE;
        break;
      case 'document_downloaded':
        implicitRating = 5; // Downloading suggests high value
        feedbackType = FeedbackType.SEARCH_RELEVANCE;
        break;
      case 'quick_exit':
        implicitRating = 1; // Quick exit suggests poor experience
        feedbackType = FeedbackType.UI_USABILITY;
        break;
      case 'feature_used_repeatedly':
        implicitRating = 4; // Repeated use suggests satisfaction
        feedbackType = FeedbackType.GENERAL_SATISFACTION;
        break;
      default:
        feedbackType = FeedbackType.GENERAL_SATISFACTION;
    }

    await this.collectFeedback(
      feedbackType,
      context,
      implicitRating,
      undefined,
      {
        ...metadata,
        implicitAction: action,
        isImplicit: true
      }
    );
  }

  /**
   * Get feedback analytics for a time period
   */
  async getFeedbackAnalytics(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<FeedbackAnalytics> {
    const feedback = await this.queryFeedback(startDate, endDate, userId);

    const analytics: FeedbackAnalytics = {
      totalFeedback: feedback.length,
      averageRating: this.calculateAverageRating(feedback),
      feedbackByType: this.groupFeedbackByType(feedback),
      feedbackByRating: this.groupFeedbackByRating(feedback),
      trendData: this.calculateTrends(feedback),
      sentimentAnalysis: await this.analyzeSentiment(feedback),
      actionableInsights: await this.generateInsights(feedback)
    };

    return analytics;
  }

  /**
   * Generate actionable insights from feedback
   */
  private async generateInsights(feedback: FeedbackData[]): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    // Analyze low ratings
    const lowRatedFeedback = feedback.filter(f => f.rating && f.rating <= 2);
    if (lowRatedFeedback.length > feedback.length * 0.2) { // More than 20% low ratings
      insights.push({
        id: 'high_low_rating_volume',
        priority: 'high',
        category: 'User Satisfaction',
        issue: 'High volume of low ratings detected',
        impact: `${lowRatedFeedback.length} users (${((lowRatedFeedback.length / feedback.length) * 100).toFixed(1)}%) gave ratings of 2 or below`,
        recommendation: 'Investigate common issues in low-rated feedback and prioritize fixes',
        affectedUsers: lowRatedFeedback.length,
        estimatedEffort: '2-3 weeks'
      });
    }

    // Analyze search performance feedback
    const searchFeedback = feedback.filter(f => f.type === FeedbackType.SEARCH_RELEVANCE);
    const avgSearchRating = this.calculateAverageRating(searchFeedback);
    if (searchFeedback.length > 0 && avgSearchRating < 3.5) {
      insights.push({
        id: 'poor_search_performance',
        priority: 'high',
        category: 'Search Quality',
        issue: 'Search relevance ratings below target',
        impact: `Average search rating: ${avgSearchRating.toFixed(2)} (target: 4.0+)`,
        recommendation: 'Review and optimize hybrid search algorithm weights and ranking',
        affectedUsers: searchFeedback.length,
        estimatedEffort: '1-2 weeks'
      });
    }

    // Analyze feature requests
    const featureRequests = feedback.filter(f => f.type === FeedbackType.FEATURE_REQUEST);
    if (featureRequests.length > 0) {
      const topRequests = this.extractTopFeatureRequests(featureRequests);
      insights.push({
        id: 'feature_request_analysis',
        priority: 'medium',
        category: 'Product Development',
        issue: 'Users requesting new features',
        impact: `${featureRequests.length} feature requests received`,
        recommendation: `Consider implementing: ${topRequests.slice(0, 3).join(', ')}`,
        affectedUsers: featureRequests.length,
        estimatedEffort: '4-8 weeks'
      });
    }

    // Analyze UI usability issues
    const uiFeedback = feedback.filter(f => f.type === FeedbackType.UI_USABILITY && f.rating && f.rating <= 3);
    if (uiFeedback.length > 0) {
      insights.push({
        id: 'ui_usability_issues',
        priority: 'medium',
        category: 'User Experience',
        issue: 'UI usability concerns identified',
        impact: `${uiFeedback.length} users reported UI issues`,
        recommendation: 'Conduct UX review and implement usability improvements',
        affectedUsers: uiFeedback.length,
        estimatedEffort: '2-4 weeks'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Analyze sentiment of feedback comments
   */
  private async analyzeSentiment(feedback: FeedbackData[]): Promise<SentimentAnalysis> {
    const comments = feedback.filter(f => f.comment).map(f => f.comment!);

    if (comments.length === 0) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0,
        keywords: []
      };
    }

    // Simple sentiment analysis (in production, use a proper NLP service)
    const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'helpful', 'fast', 'easy'];
    const negativeWords = ['bad', 'terrible', 'slow', 'confusing', 'broken', 'frustrating', 'difficult'];

    let positive = 0;
    let negative = 0;
    let neutral = 0;
    const wordFrequency: Record<string, { count: number; sentiment: 'positive' | 'negative' | 'neutral' }> = {};

    comments.forEach(comment => {
      const words = comment.toLowerCase().split(/\W+/);
      let sentimentScore = 0;

      words.forEach(word => {
        if (positiveWords.includes(word)) {
          sentimentScore += 1;
          wordFrequency[word] = { count: (wordFrequency[word]?.count || 0) + 1, sentiment: 'positive' };
        } else if (negativeWords.includes(word)) {
          sentimentScore -= 1;
          wordFrequency[word] = { count: (wordFrequency[word]?.count || 0) + 1, sentiment: 'negative' };
        } else if (word.length > 3) {
          wordFrequency[word] = { count: (wordFrequency[word]?.count || 0) + 1, sentiment: 'neutral' };
        }
      });

      if (sentimentScore > 0) positive++;
      else if (sentimentScore < 0) negative++;
      else neutral++;
    });

    const keywords = Object.entries(wordFrequency)
      .map(([word, data]) => ({ word, frequency: data.count, sentiment: data.sentiment }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    return {
      positive: positive / comments.length,
      neutral: neutral / comments.length,
      negative: negative / comments.length,
      keywords
    };
  }

  /**
   * Calculate feedback trends over time
   */
  private calculateTrends(feedback: FeedbackData[]): FeedbackTrend[] {
    const trends: Record<string, { ratings: number[]; count: number; issues: string[] }> = {};

    feedback.forEach(f => {
      const date = f.timestamp.toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = { ratings: [], count: 0, issues: [] };
      }

      trends[date].count++;
      if (f.rating) trends[date].ratings.push(f.rating);
      if (f.rating && f.rating <= 2 && f.comment) {
        trends[date].issues.push(f.comment);
      }
    });

    return Object.entries(trends)
      .map(([date, data]) => ({
        date,
        averageRating: data.ratings.length > 0 ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length : 0,
        feedbackCount: data.count,
        topIssues: this.extractTopIssues(data.issues)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Helper methods
   */
  private calculateAverageRating(feedback: FeedbackData[]): number {
    const ratingsOnly = feedback.filter(f => f.rating).map(f => f.rating!);
    return ratingsOnly.length > 0 ? ratingsOnly.reduce((a, b) => a + b, 0) / ratingsOnly.length : 0;
  }

  private groupFeedbackByType(feedback: FeedbackData[]): Record<FeedbackType, number> {
    const grouped: Record<FeedbackType, number> = {} as Record<FeedbackType, number>;
    feedback.forEach(f => {
      grouped[f.type] = (grouped[f.type] || 0) + 1;
    });
    return grouped;
  }

  private groupFeedbackByRating(feedback: FeedbackData[]): Record<number, number> {
    const grouped: Record<number, number> = {};
    feedback.filter(f => f.rating).forEach(f => {
      grouped[f.rating!] = (grouped[f.rating!] || 0) + 1;
    });
    return grouped;
  }

  private extractTopFeatureRequests(feedback: FeedbackData[]): string[] {
    // Extract common feature requests from comments
    const requests: Record<string, number> = {};
    feedback.forEach(f => {
      if (f.comment) {
        // Simple keyword extraction (in production, use NLP)
        const keywords = f.comment.toLowerCase().match(/\b\w{4,}\b/g) || [];
        keywords.forEach(keyword => {
          requests[keyword] = (requests[keyword] || 0) + 1;
        });
      }
    });

    return Object.entries(requests)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  private extractTopIssues(issues: string[]): string[] {
    // Extract common issues from comments
    const issueKeywords: Record<string, number> = {};
    issues.forEach(issue => {
      const keywords = issue.toLowerCase().match(/\b\w{4,}\b/g) || [];
      keywords.forEach(keyword => {
        issueKeywords[keyword] = (issueKeywords[keyword] || 0) + 1;
      });
    });

    return Object.entries(issueKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([keyword]) => keyword);
  }

  private async flushFeedback(): Promise<void> {
    if (this.feedbackQueue.length === 0) return;

    const batch = [...this.feedbackQueue];
    this.feedbackQueue = [];

    try {
      // In production, send to backend API
      await this.sendFeedbackBatch(batch);
      console.log(`Sent ${batch.length} feedback items to backend`);
    } catch (error) {
      console.error('Failed to send feedback batch:', error);
      // Re-queue failed items
      this.feedbackQueue.unshift(...batch);
    }
  }

  private async sendFeedbackBatch(feedback: FeedbackData[]): Promise<void> {
    // Placeholder for backend API call
    // In production, this would send to your feedback collection endpoint
    console.log('Feedback batch:', feedback);
  }

  private async queryFeedback(_startDate: Date, _endDate: Date, _userId?: string): Promise<FeedbackData[]> {
    void _startDate; void _endDate; void _userId;
    // Placeholder for backend query
    // In production, this would query your feedback database
    return [];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getCurrentUserId(): string {
    // Get current user ID from auth context
    return 'current-user-id';
  }

  private getCurrentSessionId(): string {
    // Get current session ID
    return 'current-session-id';
  }
}

// Export singleton instance
export const userFeedbackService = new UserFeedbackService();

// React hook for easy feedback collection
export const useFeedbackCollection = () => {
  const collectFeedback = async (
    type: FeedbackType,
    context: FeedbackContext,
    rating?: number,
    comment?: string,
    metadata?: Record<string, unknown>
  ) => {
    await userFeedbackService.collectFeedback(type, context, rating, comment, metadata);
  };

  const collectSearchFeedback = async (
    searchQuery: string,
    searchType: 'semantic' | 'keyword' | 'hybrid',
    resultsCount: number,
    responseTime: number,
    relevanceRating: number,
    comment?: string
  ) => {
    await userFeedbackService.collectSearchFeedback(
      searchQuery,
      searchType,
      resultsCount,
      responseTime,
      relevanceRating,
      comment
    );
  };

  const collectImplicitFeedback = async (
    action: string,
    context: FeedbackContext,
    metadata?: Record<string, unknown>
  ) => {
    await userFeedbackService.collectImplicitFeedback(action, context, metadata);
  };

  return {
    collectFeedback,
    collectSearchFeedback,
    collectImplicitFeedback
  };
};
