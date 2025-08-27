import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';

import { AUTH_CONFIG, THEME_CONFIG } from '@/constants';
import App from './App';
import './css/index.css'

// Validate required environment variables
if (!AUTH_CONFIG.CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={AUTH_CONFIG.CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl={AUTH_CONFIG.AFTER_SIGN_OUT_URL}
      appearance={{
        elements: {
          rootBox: 'clerk-root',
          card: 'clerk-card',
        },
        variables: {
          colorPrimary: THEME_CONFIG.COLORS.PRIMARY,
          colorBackground: THEME_CONFIG.COLORS.BACKGROUND,
          colorText: THEME_CONFIG.COLORS.TEXT,
        },
      }}
      signInFallbackRedirectUrl={AUTH_CONFIG.SIGN_IN_FALLBACK_URL}
      signUpFallbackRedirectUrl={AUTH_CONFIG.SIGN_UP_FALLBACK_URL}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);
