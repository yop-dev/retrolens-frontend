# Frontend Best Practices - RetroLensAI

## Tech Stack Overview
- **Framework**: React 19.1.1 with TypeScript 5.8.3
- **Build Tool**: Vite 7.1.2
- **Routing**: React Router DOM 7.8.2
- **Authentication**: Clerk
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Linting**: ESLint with TypeScript support

## File Structure & Organization

### Recommended Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (Button, Input, etc.)
│   ├── forms/           # Form-specific components
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   └── index.ts         # Barrel exports
├── pages/               # Page-level components (route components)
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard-related pages
│   └── index.ts        # Barrel exports
├── hooks/               # Custom React hooks
├── services/            # API calls and external services
│   ├── api/            # API endpoints
│   ├── auth/           # Authentication services
│   └── types/          # API response types
├── utils/               # Utility functions
├── constants/           # Application constants
├── types/               # TypeScript type definitions
├── styles/              # Global styles and themes
├── assets/              # Images, fonts, static files
├── store/               # State management (if using Context/Zustand)
└── __tests__/           # Test files
```

### Current Structure Improvements
Your current structure is good but could benefit from:
1. Create `hooks/` directory for custom hooks
2. Split `services/` into `services/api/` and `services/auth/`
3. Add `utils/`, `constants/`, and `types/` directories
4. Create `components/ui/` for basic UI components

## Naming Conventions

### Files and Folders
```typescript
// Components - PascalCase
Button.tsx
UserProfile.tsx
SearchResults.tsx

// Hooks - camelCase with 'use' prefix
useAuth.ts
useLocalStorage.ts
useApiQuery.ts

// Utilities - camelCase
formatDate.ts
validateEmail.ts
apiHelpers.ts

// Constants - UPPER_SNAKE_CASE
API_ENDPOINTS.ts
ROUTE_PATHS.ts
APP_CONFIG.ts

// Types - PascalCase with descriptive suffix
User.types.ts
ApiResponse.types.ts
FormData.types.ts
```

### Code Naming
```typescript
// Components - PascalCase
const UserDashboard: React.FC = () => { /* ... */ };

// Variables and functions - camelCase
const userName = 'john_doe';
const handleUserLogin = () => { /* ... */ };

// Constants - UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.retrolensai.com';
const MAX_RETRY_ATTEMPTS = 3;

// Types and Interfaces - PascalCase
interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
}

type ApiStatus = 'idle' | 'loading' | 'success' | 'error';
```

## Component Best Practices

### Component Structure
```typescript
// 1. Imports (external libraries first, then internal)
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { User, Settings } from 'lucide-react';

import { useApiQuery } from '../hooks/useApiQuery';
import { Button } from '../components/ui/Button';
import type { UserProfile } from '../types/User.types';

// 2. Types and interfaces
interface UserDashboardProps {
  userId: string;
  onUserUpdate?: (user: UserProfile) => void;
}

// 3. Component definition
export const UserDashboard: React.FC<UserDashboardProps> = ({
  userId,
  onUserUpdate
}) => {
  // 4. Hooks (built-in first, then custom)
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { data: userProfile, error } = useApiQuery(`/users/${userId}`);

  // 5. Event handlers
  const handleUpdateProfile = async () => {
    // Implementation
  };

  // 6. Effects
  useEffect(() => {
    // Side effects
  }, [userId]);

  // 7. Early returns
  if (error) return <div>Error loading user profile</div>;
  if (!userProfile) return <div>Loading...</div>;

  // 8. Render
  return (
    <div className="user-dashboard">
      {/* JSX */}
    </div>
  );
};
```

### Component Composition Patterns
```typescript
// Compound Components
export const Card = ({ children, className }: CardProps) => (
  <div className={`card ${className}`}>{children}</div>
);

Card.Header = ({ children }: { children: React.ReactNode }) => (
  <div className="card-header">{children}</div>
);

Card.Body = ({ children }: { children: React.ReactNode }) => (
  <div className="card-body">{children}</div>
);

// Usage
<Card>
  <Card.Header>Profile Information</Card.Header>
  <Card.Body>User details here</Card.Body>
</Card>
```

## TypeScript Best Practices

### Type Definitions
```typescript
// Use interfaces for object shapes
interface UserProfile {
  readonly id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Use types for unions, primitives, and computed types
type Theme = 'light' | 'dark' | 'system';
type ApiStatus = 'idle' | 'loading' | 'success' | 'error';
type UserWithPreferences = UserProfile & { theme: Theme };

// Generic types for reusable patterns
interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
  timestamp: string;
}

// Use const assertions for immutable data
const API_ENDPOINTS = {
  USERS: '/api/users',
  PROFILE: '/api/profile',
  SEARCH: '/api/search'
} as const;
```

### Component Props
```typescript
// Use proper prop types with good defaults
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = ''
}) => {
  // Implementation
};
```

## State Management Best Practices

### React State
```typescript
// Use proper state typing
const [user, setUser] = useState<UserProfile | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(false);
const [errors, setErrors] = useState<Record<string, string>>({});

// Use functional updates for complex state
const [formData, setFormData] = useState<FormData>({
  email: '',
  name: '',
  preferences: {}
});

const updateFormField = (field: keyof FormData, value: any) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};
```

### Custom Hooks for State Logic
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const syncUserData = async () => {
    if (user) {
      const profile = await userSyncService.syncUser(user);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    if (isSignedIn && user) {
      syncUserData();
    }
  }, [isSignedIn, user]);

  return {
    user,
    userProfile,
    isLoaded,
    isSignedIn,
    syncUserData
  };
};
```

## API Integration Best Practices

### Service Layer Organization
```typescript
// services/api/base.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth
apiClient.interceptors.request.use(async (config) => {
  const token = await window.Clerk?.session?.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// services/api/users.ts
export const userService = {
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>(`/users/${userId}`);
    return response.data.data;
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.patch<ApiResponse<UserProfile>>(`/users/${userId}`, data);
    return response.data.data;
  },

  async deleteAccount(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  }
};
```

### Error Handling
```typescript
// utils/errorHandler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return new ApiError(
      error.response.status,
      error.response.data?.message || 'An error occurred',
      error.response.data
    );
  }
  
  return new ApiError(500, 'Network error occurred');
};

// In components
const [error, setError] = useState<ApiError | null>(null);

const fetchData = async () => {
  try {
    setIsLoading(true);
    const data = await userService.getProfile(userId);
    setUserProfile(data);
  } catch (err) {
    const apiError = handleApiError(err);
    setError(apiError);
  } finally {
    setIsLoading(false);
  }
};
```

## Performance Best Practices

### Memoization
```typescript
import React, { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
export const UserList = memo<UserListProps>(({ users, onUserClick }) => {
  const sortedUsers = useMemo(() => 
    users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  const handleUserClick = useCallback((userId: string) => {
    onUserClick(userId);
  }, [onUserClick]);

  return (
    <div>
      {sortedUsers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onClick={handleUserClick}
        />
      ))}
    </div>
  );
});
```

### Code Splitting
```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Profile = lazy(() => import('../pages/Profile'));

// In your router
<Route
  path="/dashboard"
  element={
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <Dashboard />
    </Suspense>
  }
/>
```

## Security Best Practices

### Input Validation
```typescript
// utils/validation.ts
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain a number');
    }

    return { isValid: errors.length === 0, errors };
  }
};
```

### XSS Prevention
```typescript
// Use DOMPurify for sanitizing HTML content
import DOMPurify from 'dompurify';

const SafeHtmlRenderer: React.FC<{ htmlContent: string }> = ({ htmlContent }) => {
  const sanitizedHtml = DOMPurify.sanitize(htmlContent);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  );
};
```

## Testing Best Practices

### Unit Tests Structure
```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });
});
```

## Environment Configuration

### Environment Variables
```typescript
// Create env.d.ts for type safety
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Usage in code
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
```

## Build and Deployment

### Vite Configuration Optimization
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          clerk: ['@clerk/clerk-react'],
          router: ['react-router-dom'],
        },
      },
    },
    sourcemap: false, // Disable in production
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
});
```

## ESLint Rules Recommendations

### Additional ESLint Rules
```javascript
// eslint.config.js additions
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // React specific
      'react-hooks/exhaustive-deps': 'error',
      'react/prop-types': 'off', // Using TypeScript
      
      // General code quality
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
]);
```

## Accessibility Best Practices

### ARIA and Semantic HTML
```typescript
// Good accessibility practices
const SearchInput: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchId = 'main-search';

  return (
    <div className="search-container">
      <label htmlFor={searchId} className="search-label">
        Search RetroLens
      </label>
      <input
        id={searchId}
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-describedby="search-help"
        placeholder="Enter your search query..."
      />
      <div id="search-help" className="search-help">
        Search through your photo collection
      </div>
    </div>
  );
};
```

## Documentation Standards

### Component Documentation
```typescript
/**
 * UserProfile component displays user information and allows editing
 * 
 * @example
 * <UserProfile 
 *   userId="123" 
 *   onUpdate={(user) => console.log('Updated:', user)}
 * />
 */
interface UserProfileProps {
  /** The unique identifier for the user */
  userId: string;
  /** Callback fired when user profile is updated */
  onUpdate?: (user: UserProfile) => void;
  /** Whether the profile is in edit mode */
  editable?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
  editable = false
}) => {
  // Implementation
};
```

---

## Quick Reference Checklist

### Before Committing Code
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Components properly typed
- [ ] Error boundaries in place for major features
- [ ] API calls include proper error handling
- [ ] No hardcoded values (use constants/env vars)
- [ ] Responsive design considered
- [ ] Accessibility attributes added where needed
- [ ] Performance optimizations applied (memo, useMemo, useCallback)
- [ ] Tests written for new components/functions

### Code Review Focus Areas
- [ ] Component composition and reusability
- [ ] State management patterns
- [ ] Error handling completeness
- [ ] TypeScript type safety
- [ ] Performance implications
- [ ] Security considerations (input validation, XSS prevention)
- [ ] Accessibility compliance
- [ ] Code documentation

This document should be updated as new patterns emerge and the project evolves. Keep it as a living document that reflects the current best practices for the RetroLensAI frontend codebase.
