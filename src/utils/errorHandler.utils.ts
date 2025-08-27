import type { ApiError } from '@/types';

/**
 * Custom error class for API errors
 */
export class AppApiError extends Error {
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppApiError';
    this.status = status;
    this.details = details;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppApiError);
    }
  }
}

/**
 * Handle API errors and convert to standardized format
 */
export const handleApiError = (error: unknown): AppApiError => {
  // If it's already our custom error, return as is
  if (error instanceof AppApiError) {
    return error;
  }

  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppApiError(0, 'Network error: Unable to connect to server');
  }

  // Handle Response object errors
  if (error && typeof error === 'object' && 'response' in error) {
    const responseError = error as { response?: { status?: number; data?: { message?: string; details?: Record<string, unknown> } } };
    
    if (responseError.response) {
      const { status = 500, data } = responseError.response;
      const message = data?.message || getDefaultErrorMessage(status);
      
      return new AppApiError(status, message, data?.details);
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return new AppApiError(500, error.message);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppApiError(500, error);
  }

  // Fallback for unknown error types
  return new AppApiError(500, 'An unexpected error occurred');
};

/**
 * Get default error message based on HTTP status code
 */
export const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return 'Bad request - please check your input';
    case 401:
      return 'Authentication required - please sign in';
    case 403:
      return 'Access forbidden - you don\'t have permission';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Conflict - resource already exists';
    case 429:
      return 'Too many requests - please try again later';
    case 500:
      return 'Internal server error - please try again later';
    case 502:
      return 'Bad gateway - service temporarily unavailable';
    case 503:
      return 'Service unavailable - please try again later';
    case 504:
      return 'Request timeout - please try again';
    default:
      return 'An error occurred - please try again';
  }
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: AppApiError): boolean => {
  return error.status === 0 || error.message.includes('Network error');
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: AppApiError): boolean => {
  return error.status === 401 || error.status === 403;
};

/**
 * Check if error is a client error (4xx)
 */
export const isClientError = (error: AppApiError): boolean => {
  return error.status >= 400 && error.status < 500;
};

/**
 * Check if error is a server error (5xx)
 */
export const isServerError = (error: AppApiError): boolean => {
  return error.status >= 500;
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: AppApiError): string => {
  // Network errors
  if (isNetworkError(error)) {
    return 'Please check your internet connection and try again.';
  }

  // Authentication errors
  if (isAuthError(error)) {
    return 'Please sign in to continue.';
  }

  // Client errors
  if (isClientError(error)) {
    return error.message;
  }

  // Server errors
  if (isServerError(error)) {
    return 'Something went wrong on our end. Please try again later.';
  }

  return error.message;
};

/**
 * Log error for debugging (in development) or monitoring (in production)
 */
export const logError = (error: AppApiError, context?: string): void => {
  const errorInfo = {
    message: error.message,
    status: error.status,
    details: error.details,
    context,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };

  if (import.meta.env.DEV) {
    console.error('API Error:', errorInfo);
  } else {
    // In production, you might want to send to a monitoring service
    // e.g., Sentry, LogRocket, etc.
    console.error('API Error:', {
      message: error.message,
      status: error.status,
      context,
      timestamp: errorInfo.timestamp
    });
  }
};

/**
 * Retry configuration interface
 */
export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  retryCondition?: (error: AppApiError) => boolean;
}

/**
 * Default retry condition - retry on server errors and network errors
 */
export const defaultRetryCondition = (error: AppApiError): boolean => {
  return isServerError(error) || isNetworkError(error);
};

/**
 * Create a retry wrapper for async functions
 */
export const withRetry = <T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    backoffMs = 1000,
    retryCondition = defaultRetryCondition
  } = config;

  const attempt = async (attemptNumber: number): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      const apiError = handleApiError(error);
      
      // Log the error
      logError(apiError, `Attempt ${attemptNumber}/${maxAttempts}`);

      // If we've exhausted retries or error shouldn't be retried, throw
      if (attemptNumber >= maxAttempts || !retryCondition(apiError)) {
        throw apiError;
      }

      // Wait before retrying with exponential backoff
      const delay = backoffMs * Math.pow(2, attemptNumber - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      return attempt(attemptNumber + 1);
    }
  };

  return attempt(1);
};
