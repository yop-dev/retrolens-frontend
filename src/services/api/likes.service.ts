import { apiClient } from './base';

export interface LikeRequest {
  discussion_id?: string;
  camera_id?: string;
  comment_id?: string;
}

export interface LikeResponse {
  message: string;
  like_id?: string;
}

export interface LikeStatusResponse {
  is_liked: boolean;
}

export interface LikeCountResponse {
  like_count: number;
}

class LikeService {
  /**
   * Create a like for content
   */
  async createLike(data: LikeRequest, token?: string): Promise<LikeResponse> {
    return apiClient.post<LikeResponse>('/api/v1/likes/', data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  /**
   * Remove a like from content
   */
  async removeLike(data: LikeRequest, token?: string): Promise<LikeResponse> {
    return apiClient.delete<LikeResponse>('/api/v1/likes/', {
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  /**
   * Check if current user has liked content
   */
  async checkLikeStatus(params: LikeRequest, token?: string): Promise<LikeStatusResponse> {
    const queryParams = new URLSearchParams();
    if (params.discussion_id) queryParams.set('discussion_id', params.discussion_id);
    if (params.camera_id) queryParams.set('camera_id', params.camera_id);
    if (params.comment_id) queryParams.set('comment_id', params.comment_id);

    return apiClient.get<LikeStatusResponse>(`/api/v1/likes/check?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  /**
   * Get like count for content
   */
  async getLikeCount(params: LikeRequest): Promise<LikeCountResponse> {
    const queryParams = new URLSearchParams();
    if (params.discussion_id) queryParams.set('discussion_id', params.discussion_id);
    if (params.camera_id) queryParams.set('camera_id', params.camera_id);
    if (params.comment_id) queryParams.set('comment_id', params.comment_id);

    return apiClient.get<LikeCountResponse>(`/api/v1/likes/count?${queryParams.toString()}`);
  }
}

export const likeService = new LikeService();