/**
 * User profile information
 */
export interface UserProfile {
  readonly id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  expertise_level?: ExpertiseLevel;
  website_url?: string;
  instagram_url?: string;
  readonly created_at: string;
  camera_count: number;
  discussion_count: number;
  follower_count: number;
  following_count: number;
}

/**
 * User expertise levels
 */
export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * User creation data
 */
export interface CreateUserData {
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

/**
 * User sync data for Clerk integration
 */
export interface UserSyncData {
  clerk_id: string;
  email: string;
  username: string;
  full_name?: string;  // Made optional to preserve custom display name
  avatar_url?: string;  // Made optional to preserve custom uploaded avatars
  metadata: Record<string, unknown>;
}

/**
 * User update data
 */
export interface UpdateUserData {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  expertise_level?: ExpertiseLevel;
  website_url?: string;
  instagram_url?: string;
}

/**
 * User follow relationship
 */
export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

/**
 * User with follow status
 */
export interface UserWithFollowStatus extends UserProfile {
  is_following: boolean;
  is_followed_by: boolean;
}
