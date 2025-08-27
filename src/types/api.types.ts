/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
  timestamp: string;
}

/**
 * API error structure
 */
export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * API request status
 */
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  url: string;
  method: HttpMethod;
  requiresAuth: boolean;
}
