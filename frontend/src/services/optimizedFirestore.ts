/**
 * Optimized Firestore Service
 * Provides optimized queries with pagination, indexing, and offline support
 */

import type { DocumentData, Transaction, WhereFilterOp } from 'firebase/firestore';
import {
    clearIndexedDbPersistence,
    collection,
    disableNetwork,
    doc,

    enableIndexedDbPersistence,
    enableNetwork,
    endBefore,
    getDocs,
    limit,
    limitToLast,
    onSnapshot,
    orderBy,
    query,
    QueryConstraint,
    QueryDocumentSnapshot,
    runTransaction,
    startAfter,
    Timestamp,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types for pagination
export interface PaginationOptions {
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData>;
  direction?: 'next' | 'previous';
}

export interface PaginatedResult<T> {
  data: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: QueryDocumentSnapshot<DocumentData>;
  previousCursor?: QueryDocumentSnapshot<DocumentData>;
  totalCount?: number;
}

export interface QueryOptions {
  filters?: Array<{
    field: string;
    operator: WhereFilterOp;
    value: unknown;
  }>;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  pagination?: PaginationOptions;
}

class OptimizedFirestoreService {
  private offlineEnabled = false;

  constructor() {
    this.initializeOfflineSupport();
  }

  /**
   * Initialize offline support and persistence
   */
  private async initializeOfflineSupport() {
    try {
      await enableIndexedDbPersistence(db);
      this.offlineEnabled = true;
      console.log('Firestore offline persistence enabled');
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time');
      } else if (code === 'unimplemented') {
        console.warn('The current browser does not support offline persistence');
      } else {
        console.error('Error enabling offline persistence:', error);
      }
    }
  }

  /**
   * Get paginated documents with optimized queries
   */
  async getPaginatedDocuments<T>(
    collectionName: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<T>> {
    const {
      filters = [],
      orderByField = 'createdAt',
      orderDirection = 'desc',
      pagination = { pageSize: 20 }
    } = options;

    const { pageSize = 20, cursor, direction = 'next' } = pagination;

    try {
      // Build query constraints
      const constraints: QueryConstraint[] = [];

      // Add filters
      filters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });

      // Add ordering
      constraints.push(orderBy(orderByField, orderDirection));

      // Add pagination
      if (cursor) {
        if (direction === 'next') {
          constraints.push(startAfter(cursor));
          constraints.push(limit(pageSize + 1)); // Get one extra to check if there's a next page
        } else {
          constraints.push(endBefore(cursor));
          constraints.push(limitToLast(pageSize + 1));
        }
      } else {
        constraints.push(limit(pageSize + 1));
      }

      // Execute query
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const docs = querySnapshot.docs;
      const hasExtraDoc = docs.length > pageSize;
      const actualDocs = hasExtraDoc ? docs.slice(0, pageSize) : docs;

      // Convert to data
      const data = actualDocs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      // Determine pagination state
      const hasNextPage = direction === 'next' ? hasExtraDoc : true; // Simplified logic
      const hasPreviousPage = direction === 'previous' ? hasExtraDoc : !!cursor;

      const result: PaginatedResult<T> = {
        data,
        hasNextPage,
        hasPreviousPage,
        nextCursor: actualDocs.length > 0 ? actualDocs[actualDocs.length - 1] : undefined,
        previousCursor: actualDocs.length > 0 ? actualDocs[0] : undefined,
      };

      return result;
    } catch (error) {
      console.error('Error getting paginated documents:', error);
      throw error;
    }
  }

  /**
   * Get documents with real-time updates
   */
  subscribeToDocuments<T>(
    collectionName: string,
    options: QueryOptions,
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    const {
      filters = [],
      orderByField = 'createdAt',
      orderDirection = 'desc',
      pagination = { pageSize: 50 }
    } = options;

    try {
      // Build query constraints
      const constraints: QueryConstraint[] = [];

      // Add filters
      filters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });

      // Add ordering
      constraints.push(orderBy(orderByField, orderDirection));

      // Add limit for real-time queries
      constraints.push(limit(pagination.pageSize || 50));

      // Create query
      const q = query(collection(db, collectionName), ...constraints);

      // Subscribe to changes
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          callback(data);
        },
        (error) => {
          console.error('Error in real-time subscription:', error);
          errorCallback?.(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      throw error;
    }
  }

  /**
   * Batch write operations for better performance
   */
  async batchWrite(operations: Array<
    | { type: 'set'; collection: string; docId: string; data: DocumentData }
    | { type: 'update'; collection: string; docId: string; data: DocumentData }
    | { type: 'delete'; collection: string; docId: string }
  >): Promise<void> {
    const batch = writeBatch(db);

    operations.forEach(operation => {
      const docRef = doc(db, operation.collection, operation.docId);

      switch (operation.type) {
        case 'set':
          batch.set(docRef, operation.data);
          break;
        case 'update':
          batch.update(docRef, operation.data);
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('Error in batch write:', error);
      throw error;
    }
  }

  /**
   * Transaction for atomic operations
   */
  async runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    try {
      return await runTransaction(db, updateFunction);
    } catch (error) {
      console.error('Error in transaction:', error);
      throw error;
    }
  }

  /**
   * Search documents with text matching
   */
  async searchDocuments<T>(
    collectionName: string,
    searchField: string,
    searchTerm: string,
    options: Omit<QueryOptions, 'filters'> = {}
  ): Promise<T[]> {
    const {
      pagination = { pageSize: 50 }
    } = options;

    try {
      // For text search, we need to use array-contains or prefix matching
      // This is a simplified implementation - for full-text search, consider using Algolia
      const searchTermLower = searchTerm.toLowerCase();

      const constraints: QueryConstraint[] = [
        where(searchField, '>=', searchTermLower),
        where(searchField, '<=', searchTermLower + '\uf8ff'),
        orderBy(searchField),
        limit(pagination.pageSize || 50)
      ];

      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Get document count efficiently
   */
  async getDocumentCount(
    collectionName: string,
    filters: Array<{ field: string; operator: WhereFilterOp; value: unknown }> = []
  ): Promise<number> {
    try {
      const constraints: QueryConstraint[] = [];

      filters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });

      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting document count:', error);
      throw error;
    }
  }

  /**
   * Enable/disable network for offline testing
   */
  async setNetworkEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        await enableNetwork(db);
      } else {
        await disableNetwork(db);
      }
    } catch (error) {
      console.error('Error setting network state:', error);
      throw error;
    }
  }

  /**
   * Clear offline cache
   */
  async clearOfflineCache(): Promise<void> {
    try {
      await clearIndexedDbPersistence(db);
    } catch (error) {
      console.error('Error clearing offline cache:', error);
      throw error;
    }
  }

  /**
   * Check if offline persistence is enabled
   */
  isOfflineEnabled(): boolean {
    return this.offlineEnabled;
  }
}

// Export singleton instance
export const optimizedFirestore = new OptimizedFirestoreService();

// Export utility functions for common operations
export const firestoreUtils = {
  /**
   * Convert Firestore timestamp to Date
   */
  timestampToDate: (timestamp: Timestamp | { seconds?: number; toDate?: () => Date } | string | number | Date): Date => {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && typeof (timestamp as { seconds?: number }).seconds === 'number') {
      return new Date((timestamp as { seconds: number }).seconds * 1000);
    }
    return new Date(timestamp as string | number | Date);
  },

  /**
   * Create a compound query key for caching
   */
  createQueryKey: (collectionName: string, options: QueryOptions): string => {
    return `${collectionName}:${JSON.stringify(options)}`;
  },

  /**
   * Validate query constraints for proper indexing
   */
  validateQuery: (): boolean => {
    // Add validation logic for query constraints
    // This helps ensure queries will work with Firestore indexes
    return true;
  },
};
