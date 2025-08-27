import { API_CONFIG } from '@/constants';
import { handleApiError, withRetry, type AppApiError } from '@/utils';
import type { ApiResponse } from '@/types';

/**
 * HTTP client configuration
 */
export interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Base API client class
 */
export class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || API_CONFIG.BASE_URL;
    this.defaultTimeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Make HTTP request with error handling and retries
   */
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retry = { maxAttempts: 1, backoffMs: 1000 },
      ...fetchConfig
    } = config;

    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...fetchConfig,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchConfig.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    if (retry.maxAttempts > 1) {
      return withRetry(makeRequest, retry);
    }

    try {
      return await makeRequest();
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * Make authenticated request
   */
  async authenticatedRequest<T>(
    endpoint: string,
    token: string | null,
    config: RequestConfig = {}
  ): Promise<T> {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    return this.request<T>(endpoint, {
      ...config,
      headers: {
        ...authHeaders,
        ...config.headers,
      },
      retry: {
        maxAttempts: API_CONFIG.MAX_RETRY_ATTEMPTS,
        backoffMs: 1000,
        ...config.retry,
      },
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.HEALTH_CHECK_TIMEOUT);

      const response = await fetch(`${this.baseURL}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
