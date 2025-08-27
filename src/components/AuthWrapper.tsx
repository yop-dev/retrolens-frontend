import React, { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

import { clerkAuthService } from '@/services/auth';
import { handleApiError, logError } from '@/utils';
import type { BaseComponentProps } from '@/types';

/**
 * Authentication wrapper component that syncs user data with backend
 */
export const AuthWrapper: React.FC<BaseComponentProps> = ({ children }) => {
  const { user, isLoaded: userIsLoaded } = useUser();
  const { getToken, isLoaded: authIsLoaded } = useAuth();

  useEffect(() => {
    const syncUser = async (): Promise<void> => {
      // Wait for both Clerk hooks to be loaded
      if (!userIsLoaded || !authIsLoaded) {
        return;
      }

      // Only sync if user is signed in
      if (!user) {
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          console.warn('No authentication token available for user sync');
          return;
        }

        console.log('AuthWrapper: Syncing user with backend...');
        await clerkAuthService.syncUserToBackend(user, token);
        console.log('AuthWrapper: User sync completed successfully');

      } catch (error) {
        const apiError = handleApiError(error);
        logError(apiError, 'AuthWrapper.syncUser');
        
        // Don't throw error to avoid breaking the app
        console.warn('AuthWrapper: User sync failed, app will continue with Clerk-only auth:', apiError.message);
      }
    };

    syncUser();
  }, [user?.id, userIsLoaded, authIsLoaded, getToken]);

  return <>{children}</>;
};
