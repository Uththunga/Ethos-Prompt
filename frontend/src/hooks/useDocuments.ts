import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { invalidateQueries, queryKeys } from '../lib/queryClient';
import { DocumentService } from '../services/documentService';
import { optimizedFirestore, PaginatedResult } from '../services/optimizedFirestore';
import type { RAGDocument } from '../types';

/**
 * Hook for fetching user documents with caching
 */
export function useDocuments(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { currentUser } = useAuth();
  const { enabled = true, refetchInterval } = options || {};

  return useQuery({
    queryKey: queryKeys.documents.list(currentUser?.uid || ''),
    queryFn: () => {
      if (!currentUser) throw new Error('User not authenticated');
      return DocumentService.getUserDocuments(currentUser.uid);
    },
    enabled: enabled && !!currentUser,
    staleTime: 2 * 60 * 1000, // 2 minutes for documents
    refetchInterval,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for infinite scrolling documents with pagination
 */
type DocumentFilters = { status?: RAGDocument['status'] };
export function useInfiniteDocuments(options?: {
  enabled?: boolean;
  pageSize?: number;
  filters?: DocumentFilters;
}) {
  const { currentUser } = useAuth();
  const { enabled = true, pageSize = 20, filters } = options || {};

  return useInfiniteQuery({
    queryKey: queryKeys.documents.list(currentUser?.uid || '', { pageSize, filters }),
    queryFn: async ({ pageParam }) => {
      if (!currentUser) throw new Error('User not authenticated');

      return optimizedFirestore.getPaginatedDocuments<RAGDocument>('rag_documents', {
        filters: [
          { field: 'uploadedBy', operator: '==', value: currentUser.uid },
          ...(filters?.status ? [{ field: 'status', operator: '==', value: filters.status }] : []),
        ],
        orderByField: 'uploadedAt',
        orderDirection: 'desc',
        pagination: {
          pageSize,
          cursor: pageParam,
          direction: 'next'
        }
      });
    },
    enabled: enabled && !!currentUser,
    getNextPageParam: (lastPage: PaginatedResult<RAGDocument>) => {
      return lastPage.hasNextPage ? lastPage.nextCursor : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching a single document
 */
export function useDocument(documentId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: queryKeys.documents.detail(documentId),
    queryFn: () => DocumentService.getDocument(documentId),
    enabled: enabled && !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual documents
  });
}

/**
 * Hook for fetching multiple documents by IDs
 */
export function useDocumentsBatch(documentIds: string[], options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ['documents', 'batch', documentIds.sort()],
    queryFn: () => DocumentService.getDocumentsBatch(documentIds),
    enabled: enabled && documentIds.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes for batch requests
  });
}

/**
 * Hook for document search with debouncing
 */
export function useDocumentSearch(
  query: string,
  filters?: DocumentFilters,
  options?: { enabled?: boolean; debounceMs?: number }
) {
  const { currentUser } = useAuth();
  const { enabled = true, debounceMs = 300 } = options || {};

  // Simple debouncing - in a real app, you might want to use a more sophisticated approach
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: queryKeys.documents.search(debouncedQuery, filters),
    queryFn: async () => {
      if (!currentUser) throw new Error('User not authenticated');
      if (!debouncedQuery.trim()) return [];

      // Implement search functionality
      const allDocuments = await DocumentService.getUserDocuments(currentUser.uid);
      return allDocuments.filter(doc =>
        doc.filename.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        doc.originalName.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    },
    enabled: enabled && !!currentUser && debouncedQuery.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute for search results
  });
}

/**
 * Hook for uploading documents
 */
export function useUploadDocument() {
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!currentUser) throw new Error('User not authenticated');
      return DocumentService.uploadDocument(file, currentUser.uid);
    },
    onSuccess: () => {
      // Invalidate and refetch documents list
      if (currentUser) {
        invalidateQueries.documents.list(currentUser.uid);
      }
    },
    onError: (error) => {
      console.error('Document upload failed:', error);
    },
  });
}

/**
 * Hook for deleting documents
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (documentId: string) => {
      if (!currentUser) throw new Error('User not authenticated');
      return DocumentService.deleteDocument(currentUser.uid, documentId);
    },
    onSuccess: (_, documentId) => {
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: queryKeys.documents.detail(documentId) });
      if (currentUser) {
        invalidateQueries.documents.list(currentUser.uid);
      }
    },
    onError: (error) => {
      console.error('Document deletion failed:', error);
    },
  });
}

/**
 * Hook for updating document metadata
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ documentId, updates }: { documentId: string; updates: Partial<RAGDocument> }) => {
      if (!currentUser) throw new Error('User not authenticated');
      return DocumentService.updateDocument(documentId, updates);
    },
    onSuccess: (updatedDocument, { documentId }) => {
      // Update the document in cache
      queryClient.setQueryData(
        queryKeys.documents.detail(documentId),
        updatedDocument
      );

      // Update the document in the list cache
      if (currentUser) {
        queryClient.setQueryData(
          queryKeys.documents.list(currentUser.uid),
          (oldData: RAGDocument[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(doc =>
              doc.id === documentId ? { ...doc, ...updatedDocument } : doc
            );
          }
        );
      }
    },
    onError: (error) => {
      console.error('Document update failed:', error);
    },
  });
}

/**
 * Hook for downloading documents
 */
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ documentId, userId }: { documentId: string; userId: string }) => {
      return DocumentService.downloadDocument(userId, documentId);
    },
    onError: (error) => {
      console.error('Document download failed:', error);
    },
  });
}

/**
 * Hook for optimistic updates when processing documents
 */
export function useOptimisticDocumentUpdate() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const updateDocumentOptimistically = React.useCallback((
    documentId: string,
    updates: Partial<RAGDocument>
  ) => {
    if (!currentUser) return;

    // Optimistically update the document
    queryClient.setQueryData(
      queryKeys.documents.detail(documentId),
      (oldData: RAGDocument | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updates };
      }
    );

    // Also update in the list
    queryClient.setQueryData(
      queryKeys.documents.list(currentUser.uid),
      (oldData: RAGDocument[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(doc =>
          doc.id === documentId ? { ...doc, ...updates } : doc
        );
      }
    );
  }, [queryClient, currentUser]);

  return { updateDocumentOptimistically };
}

/**
 * Hook for real-time document updates
 */
export function useRealTimeDocuments(options?: {
  enabled?: boolean;
  filters?: DocumentFilters;
  pageSize?: number;
}) {
  const { currentUser } = useAuth();
  const { enabled = true, filters, pageSize = 50 } = options || {};
  const [documents, setDocuments] = React.useState<RAGDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!enabled || !currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = optimizedFirestore.subscribeToDocuments<RAGDocument>(
      'rag_documents',
      {
        filters: [
          { field: 'uploadedBy', operator: '==', value: currentUser.uid },
          ...(filters?.status ? [{ field: 'status', operator: '==', value: filters.status }] : []),
        ],
        orderByField: 'uploadedAt',
        orderDirection: 'desc',
        pagination: { pageSize }
      },
      (data) => {
        setDocuments(data);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [enabled, currentUser, filters, pageSize]);

  return { documents, loading, error };
}

/**
 * Hook for optimized document search with Firestore
 */
export function useOptimizedDocumentSearch(
  searchTerm: string,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
    pageSize?: number;
  }
) {
  const { currentUser } = useAuth();
  const { enabled = true, debounceMs = 300, pageSize = 20 } = options || {};

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useQuery({
    queryKey: ['documents', 'search', 'optimized', debouncedSearchTerm, currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error('User not authenticated');
      if (!debouncedSearchTerm.trim()) return [];

      // Use optimized Firestore search
      return optimizedFirestore.searchDocuments<RAGDocument>(
        'rag_documents',
        'filename', // Search by filename
        debouncedSearchTerm,
        {
          pagination: { pageSize }
        }
      );
    },
    enabled: enabled && !!currentUser && debouncedSearchTerm.length > 0,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
}

// Re-export React for hooks
