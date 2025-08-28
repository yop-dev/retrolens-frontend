import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus (can be disabled for better performance)
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect
      refetchOnReconnect: false,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  users: {
    all: ['users'] as const,
    byId: (id: string) => ['users', id] as const,
    byUsername: (username: string) => ['users', 'username', username] as const,
    followers: (id: string) => ['users', id, 'followers'] as const,
    following: (id: string) => ['users', id, 'following'] as const,
  },
  discussions: {
    all: ['discussions'] as const,
    list: (filters?: any) => ['discussions', 'list', filters] as const,
    byId: (id: string) => ['discussions', id] as const,
    byUser: (userId: string) => ['discussions', 'user', userId] as const,
  },
  cameras: {
    all: ['cameras'] as const,
    byUser: (userId: string) => ['cameras', 'user', userId] as const,
    byId: (id: string) => ['cameras', id] as const,
  },
  comments: {
    byDiscussion: (discussionId: string) => ['comments', 'discussion', discussionId] as const,
  },
};
