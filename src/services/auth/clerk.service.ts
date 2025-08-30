import { handleApiError, logError } from '@/utils';
import type { UserResource } from '@clerk/types';
import type { UserProfile, UserSyncData } from '@/types';
import type { UserService } from '@/services/api/users.service';

/**
 * Clerk authentication service
 */
export class ClerkAuthService {
  private userServicePromise: Promise<UserService> | null = null;

  /**
   * Lazy load user service to avoid circular imports
   */
  private async getUserService(): Promise<UserService> {
    if (!this.userServicePromise) {
      this.userServicePromise = import('@/services/api/users.service')
        .then(module => module.userService);
    }
    return this.userServicePromise;
  }

  /**
   * Sync user data with backend after Clerk authentication
   */
  async syncUserToBackend(
    user: UserResource,
    token: string
  ): Promise<UserProfile | null> {
    if (!user || !token) {
      console.warn('Missing user or token for backend sync');
      return null;
    }

    try {
      const syncData: UserSyncData = {
        clerk_id: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        username: this.generateUsername(user),
        // Don't send full_name or avatar_url to preserve custom user data
        // full_name: this.getFullName(user),
        // avatar_url: user.imageUrl || '',
        metadata: {
          created_at: user.createdAt ? new Date(user.createdAt).getTime() : null,
          updated_at: user.updatedAt ? new Date(user.updatedAt).getTime() : null,
          last_sign_in: user.lastSignInAt ? new Date(user.lastSignInAt).getTime() : null,
          external_accounts: user.externalAccounts?.map(account => ({
            provider: account.provider,
            email: account.emailAddress || '',
          })) || [],
        },
      };

      console.log('Syncing user with backend:', { ...syncData, metadata: 'hidden' });

      // Get user service dynamically to avoid circular imports
      const userService = await this.getUserService();
      
      // Attempt to sync user
      const syncResult = await userService.syncUser(syncData, token);
      
      console.log('User sync successful:', syncResult);

      // Try to fetch the updated user profile
      try {
        const userProfile = await userService.getUserById(user.id, token);
        return userProfile;
      } catch (fetchError) {
        console.warn('Could not fetch user profile after sync:', fetchError);
        
        // Return a fallback profile based on Clerk data
        return this.createFallbackProfile(user, syncResult.user_id);
      }

    } catch (error) {
      const apiError = handleApiError(error);
      logError(apiError, 'syncUserToBackend');
      
      console.warn('Backend user sync failed, continuing with Clerk-only auth:', apiError.message);
      
      // Return fallback profile to allow the app to continue working
      return this.createFallbackProfile(user);
    }
  }

  /**
   * Generate username from Clerk user data
   */
  private generateUsername(user: UserResource): string {
    // Priority order: username -> firstName -> email prefix -> fallback
    if (user.username) {return user.username;}
    if (user.firstName) {return user.firstName.toLowerCase();}
    
    const email = user.primaryEmailAddress?.emailAddress;
    if (email) {
      return email.split('@')[0];
    }
    
    return `user_${user.id.slice(-8)}`;
  }

  /**
   * Get full name from Clerk user data
   */
  private getFullName(user: UserResource): string {
    if (user.fullName) {return user.fullName;}
    
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (parts.length > 0) {return parts.join(' ');}
    
    return this.generateUsername(user);
  }

  /**
   * Create fallback user profile when backend is unavailable
   */
  private createFallbackProfile(
    user: UserResource, 
    backendUserId?: string
  ): UserProfile {
    const username = this.generateUsername(user);
    
    return {
      id: backendUserId || user.id,
      username,
      display_name: this.getFullName(user),
      bio: '',
      avatar_url: user.imageUrl || '',
      location: '',
      expertise_level: 'beginner',
      website_url: '',
      instagram_url: '',
      created_at: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      camera_count: 0,
      discussion_count: 0,
      follower_count: 0,
      following_count: 0,
    };
  }

  /**
   * Handle user sign out cleanup
   */
  async handleSignOut(): Promise<void> {
    try {
      // Clear any cached user data
      this.clearUserCache();
      
      // You could also notify the backend about the sign out
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error during sign out cleanup:', error);
    }
  }

  /**
   * Clear cached user data from local storage
   */
  private clearUserCache(): void {
    try {
      // Clear user-specific data from localStorage
      const keysToRemove = [
        'retrolens-user-prefs',
        'retrolens-draft-discussion',
        'retrolens-search-history',
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Could not clear user cache:', error);
    }
  }

  /**
   * Check if user has completed onboarding
   */
  hasCompletedOnboarding(): boolean {
    try {
      return localStorage.getItem('retrolens-onboarding') === 'completed';
    } catch {
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  markOnboardingComplete(): void {
    try {
      localStorage.setItem('retrolens-onboarding', 'completed');
    } catch (error) {
      console.warn('Could not save onboarding status:', error);
    }
  }

  /**
   * Validate token expiration and refresh if needed
   */
  async validateAndRefreshToken(getToken: () => Promise<string | null>): Promise<string | null> {
    try {
      const token = await getToken();
      
      // Clerk handles token refresh automatically
      return token;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  /**
   * Get user permissions based on Clerk data
   */
  getUserPermissions(user: UserResource): {
    canCreateDiscussion: boolean;
    canUploadImages: boolean;
    canModerate: boolean;
    isVerified: boolean;
  } {
    const hasEmail = !!user.primaryEmailAddress?.emailAddress;
    const isVerified = !!user.emailAddresses.find(email => email.verification?.status === 'verified');
    
    // You can expand this logic based on your app's requirements
    return {
      canCreateDiscussion: hasEmail,
      canUploadImages: isVerified,
      canModerate: false, // This would typically come from backend roles
      isVerified,
    };
  }
}

// Create singleton instance
export const clerkAuthService = new ClerkAuthService();
