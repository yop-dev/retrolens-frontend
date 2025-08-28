/**
 * Application configuration constants
 */
export const APP_CONFIG = {
  NAME: 'RetroLens',
  TAGLINE: 'Vintage Camera Community',
  VERSION: '1.0.0',
  DESCRIPTION: 'The Premier Community for Vintage Camera Enthusiasts',
} as const;

/**
 * API configuration constants
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000',
  TIMEOUT: 10000,
  MAX_RETRY_ATTEMPTS: 3,
  HEALTH_CHECK_TIMEOUT: 5000,
} as const;

/**
 * Authentication constants
 */
export const AUTH_CONFIG = {
  CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  SIGN_IN_FALLBACK_URL: '/discover',
  SIGN_UP_FALLBACK_URL: '/discover',
  AFTER_SIGN_OUT_URL: '/',
  SSO_CALLBACK_URL: '/sso-callback',
} as const;

/**
 * Route paths
 */
export const ROUTE_PATHS = {
  HOME: '/',
  LANDING: '/',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SEARCH: '/search',
  FEED: '/feed',
  DISCOVER: '/discover',
  COLLECTION: '/collection',
  ADD_CAMERA: '/add-camera',
  SETTINGS: '/settings',
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Health check
  HEALTH: '/health',
  
  // Users
  USERS: '/api/v1/users',
  USER_SYNC: '/api/v1/users/sync',
  USER_BY_ID: (id: string) => `/api/v1/users/${id}`,
  USER_BY_USERNAME: (username: string) => `/api/v1/users/username/${username}`,
  USER_FOLLOW: (id: string) => `/api/v1/users/${id}/follow`,
  USER_UNFOLLOW: (id: string) => `/api/v1/users/${id}/unfollow`,
  USER_UPDATE: (id: string) => `/api/v1/users/${id}`,
  
  // Cameras
  CAMERAS: '/api/v1/cameras',
  CAMERA_BY_ID: (id: string) => `/api/v1/cameras/${id}`,
  USER_CAMERAS: (userId: string) => `/api/v1/users/${userId}/cameras`, // Note: Not implemented in backend
  
  // Discussions
  DISCUSSIONS: '/api/v1/discussions',
  DISCUSSION_BY_ID: (id: string) => `/api/v1/discussions/${id}`,
  DISCUSSION_COMMENTS: (id: string) => `/api/v1/discussions/${id}/comments`, // Note: Not implemented in backend
  
  // Categories
  CATEGORIES: '/api/v1/categories',
  
  // Comments
  COMMENTS: '/api/v1/comments',
  
  // Upload endpoints
  UPLOAD_CAMERA_IMAGE: '/api/v1/upload/camera-image',
  UPLOAD_AVATAR: '/api/v1/upload/avatar',
} as const;

/**
 * UI constants
 */
export const UI_CONFIG = {
  // Pagination
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
  
  // Debounce delays
  SEARCH_DEBOUNCE_MS: 300,
  TYPING_DEBOUNCE_MS: 500,
  
  // Animation durations
  ANIMATION_DURATION_SHORT: 150,
  ANIMATION_DURATION_MEDIUM: 300,
  ANIMATION_DURATION_LONG: 500,
  
  // File upload
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  // Responsive breakpoints
  BREAKPOINTS: {
    MOBILE_MAX: 768,
    TABLET_MAX: 1024,
    DESKTOP_MIN: 1025,
  },
} as const;

/**
 * Theme constants
 */
export const THEME_CONFIG = {
  DEFAULT_THEME: 'light' as const,
  STORAGE_KEY: 'retrolens-theme',
  
  COLORS: {
    PRIMARY: '#E67E22',
    BACKGROUND: '#FAFAFA',
    TEXT: '#333333',
    TEXT_SECONDARY: '#666666',
    DANGER: '#cc0000',
  },
} as const;

/**
 * Camera-related constants
 */
export const CAMERA_CONFIG = {
  BRANDS: [
    'Leica', 'Canon', 'Nikon', 'Hasselblad', 'Mamiya', 'Pentax',
    'Olympus', 'Minolta', 'Yashica', 'Rollei', 'Contax', 'Zeiss',
    'Fujifilm', 'Kodak', 'Polaroid', 'Bronica', 'Other'
  ],
  
  POPULAR_MODELS: {
    'Leica': ['M3', 'M6', 'IIIf', 'CL'],
    'Canon': ['AE-1', 'F-1', 'A-1', '7'],
    'Nikon': ['F', 'FM', 'FE', 'F3'],
    'Hasselblad': ['500C', '500CM', '503CW', 'X1D'],
  },
  
  CONDITIONS: [
    { value: 'mint', label: 'Mint' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'very_good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
    { value: 'parts_only', label: 'Parts Only' },
  ],
} as const;

/**
 * Validation constants
 */
export const VALIDATION_CONFIG = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: false,
  },
  
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  
  BIO: {
    MAX_LENGTH: 500,
  },
  
  DISCUSSION: {
    TITLE_MIN_LENGTH: 5,
    TITLE_MAX_LENGTH: 200,
    BODY_MIN_LENGTH: 10,
    BODY_MAX_LENGTH: 10000,
  },
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  THEME: 'retrolens-theme',
  USER_PREFERENCES: 'retrolens-user-prefs',
  SEARCH_HISTORY: 'retrolens-search-history',
  ONBOARDING_COMPLETED: 'retrolens-onboarding',
} as const;
