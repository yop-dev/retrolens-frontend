import { useCallback, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { clerkAuthService } from '@/services/auth';
import { handleApiError, logError } from '@/utils';
import type { UserProfile } from '@/types';

/**
 * Enhanced authentication hook with backend integration
 */
export const useAuth = () => {
  const { getToken, isLoaded: clerkIsLoaded, signOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: userIsLoaded } = useUser();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Sync user data with backend
   */
  const syncUserData = useCallback(async (): Promise<void> => {
    if (!clerkUser || !userIsLoaded || isSyncing) {
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Syncing user data with backend...');
      const profile = await clerkAuthService.syncUserToBackend(clerkUser, token);
      
      if (profile) {
        setUserProfile(profile);
        console.log('User profile synchronized successfully');
      } else {
        console.warn('User sync returned no profile');
      }

    } catch (err) {
      const apiError = handleApiError(err);
      logError(apiError, 'useAuth.syncUserData');
      
      setError(apiError.message);
      
      // Create fallback profile to keep app functional
      if (clerkUser) {
        const fallbackProfile: UserProfile = {
          id: clerkUser.id,
          username: clerkUser.username || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${clerkUser.id.slice(-8)}`,
          display_name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
          bio: '',
          avatar_url: clerkUser.imageUrl || '',
          location: '',
          expertise_level: 'beginner',
          website_url: '',
          instagram_url: '',
          created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString(),
          camera_count: 0,
          discussion_count: 0,
          follower_count: 0,
          following_count: 0,
        };
        setUserProfile(fallbackProfile);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [clerkUser, userIsLoaded, getToken, isSyncing]);

  /**
   * Handle user sign out
   */
  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      await clerkAuthService.handleSignOut();
      setUserProfile(null);
      setError(null);
      await signOut();
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  }, [signOut]);

  /**
   * Get fresh authentication token
   */
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      return await clerkAuthService.validateAndRefreshToken(getToken);
    } catch (err) {
      console.error('Error getting auth token:', err);
      return null;
    }
  }, [getToken]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback((updatedProfile: Partial<UserProfile>): void => {
    if (userProfile) {
      setUserProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
    }
  }, [userProfile]);

  /**
   * Check user permissions
   */
  const getUserPermissions = useCallback(() => {
    if (!clerkUser) {
      return {
        canCreateDiscussion: false,
        canUploadImages: false,
        canModerate: false,
        isVerified: false,
      };
    }

    return clerkAuthService.getUserPermissions(clerkUser);
  }, [clerkUser]);

  // Initialize user data when Clerk is loaded
  useEffect(() => {
    if (clerkIsLoaded && userIsLoaded) {
      setIsLoading(false);
      
      if (clerkUser) {
        syncUserData();
      } else {
        setUserProfile(null);
      }
    }
  }, [clerkIsLoaded, userIsLoaded, clerkUser, syncUserData]);

  const isAuthenticated = clerkIsLoaded && userIsLoaded && !!clerkUser;
  const isFullyLoaded = clerkIsLoaded && userIsLoaded && !isSyncing;

  return {
    // Authentication status
    isAuthenticated,
    isLoading: isLoading || isSyncing,
    isFullyLoaded,
    
    // User data
    clerkUser,
    userProfile,
    error,
    
    // Actions
    signOut: handleSignOut,
    syncUserData,
    getAuthToken,
    updateProfile,
    
    // Permissions
    permissions: getUserPermissions(),
    
    // Onboarding
    hasCompletedOnboarding: clerkAuthService.hasCompletedOnboarding(),
    markOnboardingComplete: clerkAuthService.markOnboardingComplete,
  };
};
