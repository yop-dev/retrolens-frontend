import { apiClient } from './base';
import { API_ENDPOINTS } from '@/constants';
import type { 
  CreateUserData, 
  UpdateUserData, 
  UserProfile 
} from '@/types';

/**
 * User service for API operations
 */
export class UserService {
  /**
   * Sync user with backend (Clerk integration)
   */
  async syncUser(userData: any, token?: string): Promise<{
    message: string;
    user_id: string;
    clerk_id: string;
  }> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.USER_SYNC,
      token || null,
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string, token?: string): Promise<UserProfile> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.USER_BY_ID(userId),
      token || null
    );
  }

  /**
   * Get user by username
   */
  async getUserByUsername(
    username: string,
    token?: string
  ): Promise<UserProfile> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.USER_BY_USERNAME(username),
      token || null
    );
  }

  /**
   * Create new user
   */
  async createUser(
    userData: CreateUserData,
    token?: string
  ): Promise<UserProfile> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.USERS,
      token || null,
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    userData: UpdateUserData,
    token?: string
  ): Promise<UserProfile> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.USER_BY_ID(userId),
      token || null,
      {
        method: 'PATCH',
        body: JSON.stringify(userData),
      }
    );
  }

  /**
   * Get all users (with pagination support)
   */
  async getAllUsers(
    token?: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
    }
  ): Promise<UserProfile[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) {searchParams.append('page', params.page.toString());}
    if (params?.limit) {searchParams.append('limit', params.limit.toString());}
    if (params?.search) {searchParams.append('search', params.search);}

    const endpoint = params && Object.keys(params).length > 0
      ? `${API_ENDPOINTS.USERS}?${searchParams.toString()}`
      : API_ENDPOINTS.USERS;

    return apiClient.authenticatedRequest(endpoint, token || null);
  }

  /**
   * Follow a user
   */
  async followUser(
    userToFollowId: string,
    currentUserId: string,
    token?: string
  ): Promise<{ message: string }> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.USER_FOLLOW(userToFollowId),
      token || null,
      {
        method: 'POST',
        body: JSON.stringify({ follower_id: currentUserId }),
      }
    );
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(
    userToUnfollowId: string,
    currentUserId: string,
    token?: string
  ): Promise<{ message: string }> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.USER_UNFOLLOW(userToUnfollowId),
      token || null,
      {
        method: 'DELETE',
        body: JSON.stringify({ follower_id: currentUserId }),
      }
    );
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string, token?: string): Promise<void> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.USER_BY_ID(userId),
      token || null,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Search users
   */
  async searchUsers(
    query: string,
    token?: string,
    options?: {
      limit?: number;
      excludeUserId?: string;
    }
  ): Promise<UserProfile[]> {
    const params = new URLSearchParams({ search: query });
    
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const users = await this.getAllUsers(token, {
      search: query,
      limit: options?.limit,
    });

    // Filter out excluded user on frontend if specified
    if (options?.excludeUserId) {
      return users.filter(user => user.id !== options.excludeUserId);
    }

    return users;
  }

  /**
   * Get followers of a user
   */
  async getUserFollowers(userId: string, token?: string): Promise<UserProfile[]> {
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.USERS}${userId}/followers`,
      token || null
    );
  }

  /**
   * Get users that a user is following
   */
  async getUserFollowing(userId: string, token?: string): Promise<UserProfile[]> {
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.USERS}${userId}/following`,
      token || null
    );
  }
}

export const userService = new UserService();
