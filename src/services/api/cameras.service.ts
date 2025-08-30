import { apiClient } from './base';
import { API_ENDPOINTS } from '@/constants';
import type {
  Camera,
  CameraFilters,
  CameraSortBy,
  CreateCameraData,
  SortOrder,
} from '@/types';

/**
 * Camera service for API operations
 */
export class CameraService {
  /**
   * Get all cameras with optional filtering and sorting
   */
  async getAllCameras(
    token?: string,
    options?: {
      page?: number;
      limit?: number;
      filters?: CameraFilters;
      sortBy?: CameraSortBy;
      sortOrder?: SortOrder;
    }
  ): Promise<Camera[]> {
    const params = new URLSearchParams();

    if (options?.page) {params.append('page', options.page.toString());}
    if (options?.limit) {params.append('limit', options.limit.toString());}
    if (options?.sortBy) {params.append('sortBy', options.sortBy);}
    if (options?.sortOrder) {params.append('sortOrder', options.sortOrder);}

    // Add filter parameters
    if (options?.filters) {
      const { filters } = options;
      if (filters.brand_name) {params.append('brand_name', filters.brand_name);}
      if (filters.camera_type) {params.append('camera_type', filters.camera_type);}
      if (filters.film_format) {params.append('film_format', filters.film_format);}
      if (filters.condition) {params.append('condition', filters.condition);}
      if (filters.min_year) {params.append('min_year', filters.min_year.toString());}
      if (filters.max_year) {params.append('max_year', filters.max_year.toString());}
      if (filters.is_for_sale !== undefined) {
        params.append('is_for_sale', filters.is_for_sale.toString());
      }
      if (filters.is_for_trade !== undefined) {
        params.append('is_for_trade', filters.is_for_trade.toString());
      }
    }

    const endpoint = params.toString()
      ? `${API_ENDPOINTS.CAMERAS}?${params.toString()}`
      : API_ENDPOINTS.CAMERAS;

    return apiClient.authenticatedRequest(endpoint, token || null);
  }

  /**
   * Get camera by ID
   */
  async getCameraById(cameraId: string, token?: string): Promise<Camera> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.CAMERA_BY_ID(cameraId),
      token || null
    );
  }

  /**
   * Get cameras owned by a specific user
   */
  async getUserCameras(
    userId: string,
    token?: string,
    options?: {
      sortBy?: CameraSortBy;
      sortOrder?: SortOrder;
    }
  ): Promise<Camera[]> {
    // Get all cameras and filter by user_id
    // In a real implementation, the backend should support user-specific endpoints
    const allCameras = await this.getAllCameras(token, {
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
    });

    return allCameras.filter(camera => camera.user_id === userId);
  }

  /**
   * Create new camera
   */
  async createCamera(
    cameraData: CreateCameraData,
    token?: string
  ): Promise<Camera> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.CAMERAS,
      token || null,
      {
        method: 'POST',
        body: JSON.stringify(cameraData),
      }
    );
  }

  /**
   * Update camera
   */
  async updateCamera(
    cameraId: string,
    cameraData: Partial<CreateCameraData>,
    token?: string
  ): Promise<Camera> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.CAMERA_BY_ID(cameraId),
      token || null,
      {
        method: 'PATCH',
        body: JSON.stringify(cameraData),
      }
    );
  }

  /**
   * Delete camera
   */
  async deleteCamera(cameraId: string, token?: string): Promise<void> {
    return apiClient.authenticatedRequest(
      API_ENDPOINTS.CAMERA_BY_ID(cameraId),
      token || null,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Search cameras
   */
  async searchCameras(
    query: string,
    token?: string,
    options?: {
      limit?: number;
      filters?: CameraFilters;
    }
  ): Promise<Camera[]> {
    const allCameras = await this.getAllCameras(token, {
      limit: options?.limit,
      filters: options?.filters,
    });

    // Client-side search filtering
    const searchTerm = query.toLowerCase();
    return allCameras.filter(camera =>
      camera.brand_name.toLowerCase().includes(searchTerm) ||
      camera.model.toLowerCase().includes(searchTerm) ||
      (camera.year && camera.year.includes(query))
    );
  }

  /**
   * Get cameras for sale
   */
  async getCamerasForSale(
    token?: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: CameraSortBy;
      sortOrder?: SortOrder;
    }
  ): Promise<Camera[]> {
    return this.getAllCameras(token, {
      ...options,
      filters: { is_for_sale: true },
    });
  }

  /**
   * Get cameras for trade
   */
  async getCamerasForTrade(
    token?: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: CameraSortBy;
      sortOrder?: SortOrder;
    }
  ): Promise<Camera[]> {
    return this.getAllCameras(token, {
      ...options,
      filters: { is_for_trade: true },
    });
  }

  /**
   * Like/unlike a camera
   */
  async toggleCameraLike(
    cameraId: string,
    token?: string
  ): Promise<{ liked: boolean; like_count: number }> {
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.CAMERA_BY_ID(cameraId)}/like`,
      token || null,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Get camera statistics
   */
  async getCameraStats(
    cameraId: string,
    token?: string
  ): Promise<{
    view_count: number;
    like_count: number;
    comment_count: number;
  }> {
    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.CAMERA_BY_ID(cameraId)}/stats`,
      token || null
    );
  }

  /**
   * Upload camera images
   */
  async uploadCameraImages(
    cameraId: string,
    images: File[],
    token?: string
  ): Promise<{ uploaded_images: Array<{ id: string; url: string }> }> {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });

    return apiClient.authenticatedRequest(
      `${API_ENDPOINTS.CAMERA_BY_ID(cameraId)}/images`,
      token || null,
      {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it for FormData
      }
    );
  }
}

export const cameraService = new CameraService();
