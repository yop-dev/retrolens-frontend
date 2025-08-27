/**
 * Discussion information
 */
export interface Discussion {
  readonly id: string;
  user_id: string;
  category_id?: string;
  title: string;
  body: string;
  tags: string[];
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  readonly created_at: string;
  readonly updated_at: string;
  author_username?: string;
  author_avatar?: string;
  category_name?: string;
  comment_count: number;
  like_count: number;
  is_liked: boolean;
  last_comment_at?: string;
}

/**
 * Discussion category
 */
export interface DiscussionCategory {
  readonly id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  discussion_count: number;
  readonly created_at: string;
}

/**
 * Discussion comment
 */
export interface DiscussionComment {
  readonly id: string;
  discussion_id: string;
  user_id: string;
  parent_comment_id?: string;
  body: string;
  like_count: number;
  is_liked: boolean;
  readonly created_at: string;
  readonly updated_at: string;
  author_username?: string;
  author_avatar?: string;
  replies?: DiscussionComment[];
}

/**
 * Discussion creation data
 */
export interface CreateDiscussionData {
  category_id?: string;
  title: string;
  body: string;
  tags?: string[];
}

/**
 * Discussion update data
 */
export interface UpdateDiscussionData {
  title?: string;
  body?: string;
  tags?: string[];
  category_id?: string;
}

/**
 * Comment creation data
 */
export interface CreateCommentData {
  discussion_id: string;
  body: string;
  parent_comment_id?: string;
}

/**
 * Comment update data
 */
export interface UpdateCommentData {
  body: string;
}

/**
 * Discussion filters
 */
export interface DiscussionFilters {
  category_id?: string;
  tags?: string[];
  author_id?: string;
  is_pinned?: boolean;
  created_after?: string;
  created_before?: string;
}

/**
 * Discussion sort options
 */
export type DiscussionSortBy = 
  | 'created_at'
  | 'updated_at'
  | 'last_comment_at'
  | 'view_count'
  | 'like_count'
  | 'comment_count'
  | 'title';

/**
 * Discussion with extended information
 */
export interface DiscussionWithDetails extends Discussion {
  comments: DiscussionComment[];
  category?: DiscussionCategory;
}
