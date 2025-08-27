import { useState, useEffect } from 'react';
import { UI_CONFIG } from '@/constants';

/**
 * Hook for debouncing values
 */
export const useDebounce = <T>(value: T, delay?: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay || UI_CONFIG.SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
