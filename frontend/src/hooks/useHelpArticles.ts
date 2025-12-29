/**
 * Custom hook for fetching help articles
 * Provides data fetching, caching, and error handling for help center content
 */

import { db } from '@/config/firebase';
import staticArticlesData from '@/data/help/articles.json';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';

// Cast static articles to HelpArticle[] type
const staticArticles = staticArticlesData as unknown as HelpArticle[];

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  content: string; // markdown content
  excerpt: string;
  category:
    | 'getting-started'
    | 'core-features'
    | 'account-settings'
    | 'troubleshooting'
    | 'api'
    | 'best-practices';
  subcategory?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
  views?: number;
  helpful?: number;
  rating?: number;
  estimatedReadTime?: number;
  featured?: boolean;
  prerequisites?: string[];
  relatedArticles?: string[];
  steps?: ArticleStep[];
  faqs?: FAQ[];
}

export interface ArticleStep {
  id: string;
  title: string;
  content: string;
  image?: string;
  code?: string;
  tips?: string[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  helpful: number;
}

/**
 * Fetch all help articles from Firestore
 * Falls back to static data if Firestore is unavailable
 */
export function useHelpArticles() {
  return useQuery({
    queryKey: ['help-articles'],
    queryFn: async () => {
      // In E2E mode, avoid emulator/network flakiness and return static content instantly
      if (import.meta.env.VITE_E2E_MODE === 'true') {
        return staticArticles;
      }
      try {
        const articlesRef = collection(db, 'helpArticles');
        const q = query(articlesRef, orderBy('lastUpdated', 'desc'));
        const snapshot = await getDocs(q);

        const articles = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HelpArticle[];

        // If Firestore has articles, return them; otherwise use static data
        if (articles.length > 0) {
          return articles;
        }

        console.info('No articles in Firestore, using static data');
        return staticArticles;
      } catch (error) {
        console.warn('Failed to fetch help articles from Firestore, using static data:', error);
        // Return static articles as fallback
        return staticArticles;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Fetch help articles by category
 */
export function useHelpArticlesByCategory(categoryId: string | null) {
  return useQuery({
    queryKey: ['help-articles', 'category', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];

      try {
        const articlesRef = collection(db, 'helpArticles');
        const q = query(
          articlesRef,
          where('category', '==', categoryId),
          orderBy('lastUpdated', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HelpArticle[];
      } catch (error) {
        console.warn('Failed to fetch articles by category:', error);
        return [];
      }
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch featured help articles
 */
export function useFeaturedHelpArticles() {
  return useQuery({
    queryKey: ['help-articles', 'featured'],
    queryFn: async () => {
      try {
        const articlesRef = collection(db, 'helpArticles');
        const q = query(articlesRef, where('featured', '==', true), orderBy('rating', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HelpArticle[];
      } catch (error) {
        console.warn('Failed to fetch featured articles:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for featured content
  });
}

/**
 * Search help articles by query
 */
export function useSearchHelpArticles(searchQuery: string) {
  return useQuery({
    queryKey: ['help-articles', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      try {
        // Note: Firestore doesn't support full-text search natively
        // This is a simple implementation - consider using Algolia or similar for production
        const articlesRef = collection(db, 'helpArticles');
        const snapshot = await getDocs(articlesRef);

        const query = searchQuery.toLowerCase();
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HelpArticle[];

        // Client-side filtering for search
        return results.filter(
          (article) =>
            article.title.toLowerCase().includes(query) ||
            article.content.toLowerCase().includes(query) ||
            article.excerpt?.toLowerCase().includes(query) ||
            article.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      } catch (error) {
        console.warn('Failed to search articles:', error);
        return [];
      }
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}

/**
 * Increment article view count
 */
export async function incrementArticleViews(articleId: string): Promise<void> {
  try {
    // This would typically be a Cloud Function to prevent client-side manipulation
    // For now, we'll just log it
    console.log('Article view tracked:', articleId);

    // In production, call a Cloud Function:
    // await httpsCallable(functions, 'incrementArticleViews')({ articleId });
  } catch (error) {
    console.error('Failed to increment article views:', error);
  }
}

/**
 * Submit article feedback
 */
export async function submitArticleFeedback(articleId: string, helpful: boolean): Promise<void> {
  try {
    // This would typically be a Cloud Function
    console.log('Article feedback submitted:', { articleId, helpful });

    // In production, call a Cloud Function:
    // await httpsCallable(functions, 'submitArticleFeedback')({ articleId, helpful });
  } catch (error) {
    console.error('Failed to submit article feedback:', error);
  }
}
