import { apiClient } from './base';

export interface Comment {
  id: string;
  user_id: string;
  discussion_id?: string;
  camera_id?: string;
  parent_id?: string;
  body: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author_username?: string;
  author_avatar?: string;
  like_count: number;
  is_liked: boolean;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  body: string;
  discussion_id?: string;
  camera_id?: string;
  parent_id?: string;
}

export interface UpdateCommentRequest {
  body: string;
}

export interface CommentListParams {
  discussion_id?: string;
  camera_id?: string;
  limit?: number;
  offset?: number;
}

class CommentService {
  /**
   * Get comments for a discussion or camera
   */
  async getComments(params: CommentListParams): Promise<Comment[]> {
    const queryParams = new URLSearchParams();
    if (params.discussion_id) queryParams.set('discussion_id', params.discussion_id);
    if (params.camera_id) queryParams.set('camera_id', params.camera_id);
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset) queryParams.set('offset', params.offset.toString());

    return apiClient.get<Comment[]>(`/api/v1/comments/?${queryParams.toString()}`);
  }

  /**
   * Create a new comment
   */
  async createComment(data: CreateCommentRequest, token?: string): Promise<Comment> {
    return apiClient.post<Comment>('/api/v1/comments/', data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, data: UpdateCommentRequest, token?: string): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/api/v1/comments/${commentId}`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, token?: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/v1/comments/${commentId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }
}

export const commentService = new CommentService();