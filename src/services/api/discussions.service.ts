import { apiClient } from './base';
import { API_ENDPOINTS } from '@/constants';
import type {
  CreateCommentData,
  CreateDiscussionData,
  Discussion,
  DiscussionCategory,
  DiscussionComment,
  DiscussionFilters,
  DiscussionSortBy,
  DiscussionWithDetails,
  SortOrder,
  UpdateCommentData,
  UpdateDiscussionData
} from '@/types';

/**
 * Discussion service for API operations
 */
export class DiscussionService {
  /**
   * Get all discussions with optional filtering and sorting
   */
  async getAllDiscussions(
    token?: string,
    options?: {
      page?: number;
      limit?: number;
      filters?: DiscussionFilters;
      sortBy?: DiscussionSortBy;
      sortOrder?: SortOrder;
    }
  ): Promise<Discussion[]> {
    const params = new URLSearchParams();

    if (options?.page) {params.append('page', options.page.toString());}
    if (options?.limit) {params.append('limit', options.limit.toString());}
    if (options?.sortBy) {params.append('sortBy', options.sortBy);}
    if (options?.sortOrder) {params.append('sortOrder', options.sortOrder);}

    // Add filter parameters
    if (options?.filters) {
      const { filters } = options;
      if (filters.category_id) {params.append('category_id', filters.category_id);}
      if (filters.author_id) {params.append('author_id', filters.author_id);}
      if (filters.is_pinned !== undefined) {
        params.append('is_pinned', filters.is_pinned.toString());
      }
      if (filters.tags?.length) {
        filters.tags.forEach(tag => params.append('tags[]', tag));
      }
      if (filters.created_after) {params.append('created_after', filters.created_after);}
      if (filters.created_before) {params.append('created_before', filters.created_before);}
    }

    const endpoint = params.toString()
      ? `${API_ENDPOINTS.DISCUSSIONS}?${params.toString()}`
      : API_ENDPOINTS.DISCUSSIONS;

    return apiClient.authenticatedRequest(endpoint, token || null);
  }

  /**
   * Get discussion by ID with comments
   */
  async getDiscussionById(
    discussionId: string,
    token?: string
  ): Promise<DiscussionWithDetails> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.DISCUSSION_BY_ID(discussionId),
      token || null
    );
  }

  /**
   * Get discussions by a specific user
   */
  async getUserDiscussions(
    userId: string,
    token?: string,
    options?: {
      sortBy?: DiscussionSortBy;
      sortOrder?: SortOrder;
    }
  ): Promise<Discussion[]> {
    // Get all discussions and filter by user_id
    const allDiscussions = await this.getAllDiscussions(token, {
      filters: { author_id: userId },
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
    });

    return allDiscussions.filter(discussion => discussion.user_id === userId);
  }

  /**
   * Create new discussion
   */
  async createDiscussion(
    discussionData: CreateDiscussionData,
    token?: string
  ): Promise<Discussion> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.DISCUSSIONS,
      token || null,
      {
        method: 'POST',
        body: JSON.stringify(discussionData),
      }
    );
  }

  /**
   * Update discussion
   */
  async updateDiscussion(
    discussionId: string,
    userId: string,
    discussionData: UpdateDiscussionData,
    token?: string
  ): Promise<Discussion> {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.DISCUSSION_BY_ID(discussionId)}?${params.toString()}`,
      token || null,
      {
        method: 'PUT',
        body: JSON.stringify(discussionData),
      }
    );
  }

  /**
   * Delete discussion
   */
  async deleteDiscussion(
    discussionId: string, 
    userId: string,
    token?: string
  ): Promise<void> {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.DISCUSSION_BY_ID(discussionId)}?${params.toString()}`,
      token || null,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Search discussions
   */
  async searchDiscussions(
    query: string,
    token?: string,
    options?: {
      limit?: number;
      filters?: DiscussionFilters;
    }
  ): Promise<Discussion[]> {
    const allDiscussions = await this.getAllDiscussions(token, {
      limit: options?.limit,
      filters: options?.filters,
    });

    // Client-side search filtering
    const searchTerm = query.toLowerCase();
    return allDiscussions.filter(discussion =>
      discussion.title.toLowerCase().includes(searchTerm) ||
      discussion.body.toLowerCase().includes(searchTerm) ||
      discussion.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get discussion comments
   */
  async getDiscussionComments(
    discussionId: string,
    token?: string
  ): Promise<DiscussionComment[]> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.DISCUSSION_COMMENTS(discussionId),
      token || null
    );
  }

  /**
   * Create discussion comment
   */
  async createComment(
    commentData: CreateCommentData,
    token?: string
  ): Promise<DiscussionComment> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.COMMENTS,
      token || null,
      {
        method: 'POST',
        body: JSON.stringify(commentData),
      }
    );
  }

  /**
   * Update comment
   */
  async updateComment(
    commentId: string,
    commentData: UpdateCommentData,
    token?: string
  ): Promise<DiscussionComment> {
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.COMMENTS}/${commentId}`,
      token || null,
      {
        method: 'PATCH',
        body: JSON.stringify(commentData),
      }
    );
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, token?: string): Promise<void> {
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.COMMENTS}/${commentId}`,
      token || null,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Like/unlike a discussion
   */
  async toggleDiscussionLike(
    discussionId: string,
    token?: string
  ): Promise<{ liked: boolean; like_count: number }> {
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.DISCUSSION_BY_ID(discussionId)}/like`,
      token || null,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Like/unlike a comment
   */
  async toggleCommentLike(
    commentId: string,
    token?: string
  ): Promise<{ liked: boolean; like_count: number }> {
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.COMMENTS}/${commentId}/like`,
      token || null,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Get discussion categories
   */
  async getCategories(token?: string): Promise<DiscussionCategory[]> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.CATEGORIES,
      token || null
    );
  }

  /**
   * Get popular/trending discussions
   */
  async getTrendingDiscussions(
    token?: string,
    limit: number = 10
  ): Promise<Discussion[]> {
    return this.getAllDiscussions(token, {
      limit,
      sortBy: 'view_count',
      sortOrder: 'desc',
    });
  }

  /**
   * Get pinned discussions
   */
  async getPinnedDiscussions(token?: string): Promise<Discussion[]> {
    return this.getAllDiscussions(token, {
      filters: { is_pinned: true },
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  }

  /**
   * Get recent discussions
   */
  async getRecentDiscussions(
    token?: string,
    limit: number = 20
  ): Promise<Discussion[]> {
    return this.getAllDiscussions(token, {
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  }
}

export const discussionService = new DiscussionService();
