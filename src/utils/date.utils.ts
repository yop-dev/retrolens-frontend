/**
 * Date formatting utilities
 */

/**
 * Format date to human-readable string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
};

/**
 * Format date to short string (MM/DD/YYYY)
 */
export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
};

/**
 * Format datetime to human-readable string with time
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(d);
};

/**
 * Format date to relative time (e.g., "2 hours ago", "3 days ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  // Less than a minute ago
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour ago
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day ago
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week ago
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Less than a month ago
  if (diffInSeconds < 2629746) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Less than a year ago
  if (diffInSeconds < 31556952) {
    const months = Math.floor(diffInSeconds / 2629746);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  
  // More than a year ago
  const years = Math.floor(diffInSeconds / 31556952);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

/**
 * Get the year from a date string or Date object
 */
export const getYear = (date: Date | string): number => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getFullYear();
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return d.toDateString() === today.toDateString();
};

/**
 * Check if a date is yesterday
 */
export const isYesterday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return d.toDateString() === yesterday.toDateString();
};

/**
 * Check if a date is in the current week
 */
export const isThisWeek = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  
  return d >= weekStart && d <= weekEnd;
};

/**
 * Get age from birthdate
 */
export const getAge = (birthDate: Date | string): number => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Add days to a date
 */
export const addDays = (date: Date | string, days: number): Date => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Subtract days from a date
 */
export const subtractDays = (date: Date | string, days: number): Date => {
  return addDays(date, -days);
};

/**
 * Format date for API (ISO string)
 */
export const formatForApi = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};

/**
 * Parse date from various formats
 */
export const parseDate = (dateString: string): Date | null => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};
