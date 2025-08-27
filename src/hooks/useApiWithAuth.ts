import { useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { handleApiError, logError } from '@/utils';

/**
 * Hook for making authenticated API requests
 */
export const useApiWithAuth = () => {
  const { getToken } = useClerkAuth();

  /**
   * Make an authenticated request
   */
  const makeAuthenticatedRequest = useCallback(async <T>(
    apiCall: (token?: string) => Promise<T>
  ): Promise<T> => {
    try {
      const token = await getToken();
      return await apiCall(token || undefined);
    } catch (error) {
      const apiError = handleApiError(error);
      logError(apiError, 'useApiWithAuth.makeAuthenticatedRequest');
      throw apiError;
    }
  }, [getToken]);

  /**
   * Make an authenticated request with error handling
   */
  const makeAuthenticatedRequestSafe = useCallback(async <T>(
    apiCall: (token?: string) => Promise<T>,
    fallbackValue?: T
  ): Promise<{ data: T | null; error: Error | null }> => {
    try {
      const data = await makeAuthenticatedRequest(apiCall);
      return { data, error: null };
    } catch (error) {
      return { 
        data: fallbackValue ?? null, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }, [makeAuthenticatedRequest]);

  return {
    makeAuthenticatedRequest,
    makeAuthenticatedRequestSafe,
  };
};
