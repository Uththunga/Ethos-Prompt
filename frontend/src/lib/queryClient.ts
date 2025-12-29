import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

// Custom error handler for queries
const handleQueryError = (error: unknown) => {
  console.error('Query error:', error);

  // You can add global error handling here
  // For example, show toast notifications, redirect to login, etc.
  if (error instanceof Error) {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      // Handle authentication errors
      console.warn('Authentication error detected');
    }
  }
};

// Custom error handler for mutations
const handleMutationError = (error: unknown) => {
  console.error('Mutation error:', error);

  // Handle mutation-specific errors
  if (error instanceof Error) {
    // You can show user-friendly error messages here
    console.warn('Mutation failed:', error.message);
  }
};

// Create query client with optimized configuration
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: how long data stays in cache after becoming unused
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: false, // Don't refetch on window focus by default
      refetchOnReconnect: true, // Refetch when reconnecting to internet
      refetchOnMount: 'if-stale', // Only refetch on mount if data is stale

      // Network mode
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      // Retry mutations once
      retry: 1,

      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Query key factory for consistent key generation
export const queryKeys = {
  // User-related queries
  user: {
    all: ['user'] as const,
    profile: (userId: string) => [...queryKeys.user.all, 'profile', userId] as const,
    settings: (userId: string) => [...queryKeys.user.all, 'settings', userId] as const,
  },

  // Document-related queries
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (userId: string, filters?: unknown) =>
      [...queryKeys.documents.lists(), userId, filters] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
    search: (query: string, filters?: unknown) =>
      [...queryKeys.documents.all, 'search', query, filters] as const,
  },

  // Prompt-related queries
  prompts: {
    all: ['prompts'] as const,
    lists: () => [...queryKeys.prompts.all, 'list'] as const,
    list: (userId: string, filters?: unknown) =>
      [...queryKeys.prompts.lists(), userId, filters] as const,
    details: () => [...queryKeys.prompts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.prompts.details(), id] as const,
    categories: () => [...queryKeys.prompts.all, 'categories'] as const,
    tags: () => [...queryKeys.prompts.all, 'tags'] as const,
  },

  // Execution-related queries
  executions: {
    all: ['executions'] as const,
    lists: () => [...queryKeys.executions.all, 'list'] as const,
    list: (userId: string, filters?: unknown) =>
      [...queryKeys.executions.lists(), userId, filters] as const,
    details: () => [...queryKeys.executions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.executions.details(), id] as const,
    history: (promptId: string) => [...queryKeys.executions.all, 'history', promptId] as const,
  },

  // Workspace-related queries
  workspaces: {
    all: ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.workspaces.lists(), userId] as const,
    details: () => [...queryKeys.workspaces.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workspaces.details(), id] as const,
    members: (id: string) => [...queryKeys.workspaces.detail(id), 'members'] as const,
  },

  // Analytics-related queries
  analytics: {
    all: ['analytics'] as const,
    usage: (userId: string, period: string) =>
      [...queryKeys.analytics.all, 'usage', userId, period] as const,
    performance: (period: string) => [...queryKeys.analytics.all, 'performance', period] as const,
    costs: (userId: string, period: string) =>
      [...queryKeys.analytics.all, 'costs', userId, period] as const,
  },
} as const;

// Cache invalidation utilities
export const invalidateQueries = {
  // Invalidate all user-related data
  user: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.profile(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.user.settings(userId) });
  },

  // Invalidate document-related data
  documents: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.documents.all }),
    list: (userId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.list(userId) }),
    detail: (id: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(id) }),
  },

  // Invalidate prompt-related data
  prompts: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all }),
    list: (userId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.list(userId) }),
    detail: (id: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.detail(id) }),
  },

  // Invalidate execution-related data
  executions: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.executions.all }),
    list: (userId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.executions.list(userId) }),
    detail: (id: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.executions.detail(id) }),
  },

  // Invalidate workspace-related data
  workspaces: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all }),
    list: (userId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list(userId) }),
    detail: (id: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(id) }),
  },
};

// Prefetch utilities for better UX
export const prefetchQueries = {

  prompts: {
    list: async (userId: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.prompts.list(userId),
        queryFn: () =>
          import('../services/firestore').then((m) => m.promptService.getUserPrompts(userId)),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
  },
};

// Background sync for offline support
export const backgroundSync = {
  enable: () => {
    // Sync when coming back online
    window.addEventListener('online', () => {
      queryClient.resumePausedMutations();
      queryClient.invalidateQueries();
    });
  },

  disable: () => {
    window.removeEventListener('online', backgroundSync.enable);
  },
};
