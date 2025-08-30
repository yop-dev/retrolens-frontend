import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { queryKeys } from '@/lib/react-query';
import { userService } from '@/services/api/users.service';
import { discussionService } from '@/services/api/discussions.service';
import { cameraService } from '@/services/api/cameras.service';
import type { UserProfile, Discussion, Camera } from '@/types';

// User hooks
export const useUser = (userId: string | undefined) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.users.byId(userId!),
    queryFn: async () => {
      const token = await getToken();
      return userService.getUserById(userId!, token || undefined);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

export const useUserByUsername = (username: string | undefined) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.users.byUsername(username!),
    queryFn: async () => {
      const token = await getToken();
      return userService.getUserByUsername(username!, token || undefined);
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
};

// Discussions hooks with pagination
export const useDiscussions = (options?: {
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.discussions.list(options),
    queryFn: async () => {
      const token = await getToken();
      return discussionService.getAllDiscussions(token || undefined, {
        limit: options?.limit || 10,
        sortBy: options?.sortBy as any,
        sortOrder: options?.sortOrder as any,
      });
    },
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (replaces cacheTime)
  });
};

export const useUserDiscussions = (userId: string | undefined) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.discussions.byUser(userId!),
    queryFn: async () => {
      const token = await getToken();
      return discussionService.getUserDiscussions(userId!, token || undefined);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

// Cameras hooks
export const useUserCameras = (userId: string | undefined) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.cameras.byUser(userId!),
    queryFn: async () => {
      const token = await getToken();
      const allCameras = await cameraService.getAllCameras(token || undefined);
      return allCameras.filter(camera => camera.user_id === userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// Followers/Following hooks
export const useFollowers = (userId: string | undefined) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.users.followers(userId!),
    queryFn: async () => {
      const token = await getToken();
      return userService.getUserFollowers(userId!, token || undefined);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useFollowing = (userId: string | undefined) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.users.following(userId!),
    queryFn: async () => {
      const token = await getToken();
      return userService.getUserFollowing(userId!, token || undefined);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

// Prefetch hooks for instant navigation
export const usePrefetchUser = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  
  return async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.users.byId(userId),
      queryFn: async () => {
        const token = await getToken();
        return userService.getUserById(userId, token || undefined);
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};

export const usePrefetchDiscussion = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  
  return async (discussionId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.discussions.byId(discussionId),
      queryFn: async () => {
        const token = await getToken();
        return discussionService.getDiscussionById(discussionId, token || undefined);
      },
      staleTime: 2 * 60 * 1000,
    });
  };
};
