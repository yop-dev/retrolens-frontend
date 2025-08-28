import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ROUTE_PATHS } from '@/constants';
import { Header, AuthWrapper } from '@/components';
import { Landing, Search, AddCamera } from '@/pages';
import { queryClient } from '@/lib/react-query';

// Lazy load components for better performance
const LazyFeed = lazy(() => import('@/pages/FeedOptimizedV2'));
const LazyProfile = lazy(() => import('@/pages/ProfileOptimized'));
const LazyDiscover = lazy(() => import('@/pages/Discover'));
const LazyCollection = lazy(() => import('@/pages/Collection'));

/**
 * Protected route wrapper component
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <Navigate to={ROUTE_PATHS.HOME} replace />
    </SignedOut>
  </>
);

/**
 * Public route wrapper (redirects authenticated users)
 */
const PublicRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({ 
  children, 
  redirectTo = ROUTE_PATHS.FEED 
}) => (
  <>
    <SignedOut>{children}</SignedOut>
    <SignedIn>
      <Navigate to={redirectTo} replace />
    </SignedIn>
  </>
);

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner" />
    <p>Loading...</p>
  </div>
);

/**
 * App content component with routing logic
 */
function AppContent() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Check initially
    checkMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Hide header on home page, or on profile page when mobile
  const showHeader = location.pathname !== ROUTE_PATHS.HOME && 
                     !(location.pathname === ROUTE_PATHS.PROFILE && isMobile);
  
  return (
    <div className="page-container">
      {showHeader && <Header />}
      <main className="page-content-full">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path={ROUTE_PATHS.HOME} 
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              } 
            />
            
            
            {/* Protected Routes */}
            <Route 
              path={ROUTE_PATHS.DASHBOARD} 
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTE_PATHS.FEED} replace />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path={ROUTE_PATHS.PROFILE} 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <LazyProfile />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path={ROUTE_PATHS.SEARCH} 
              element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              } 
            />
            
            {/* Lazy-loaded Routes */}
            <Route 
              path={ROUTE_PATHS.FEED} 
              element={
                <ProtectedRoute>
                  <LazyFeed />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path={ROUTE_PATHS.DISCOVER} 
              element={
                <LazyDiscover />
              } 
            />
            
            <Route 
              path={ROUTE_PATHS.COLLECTION} 
              element={
                <ProtectedRoute>
                  <LazyCollection />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path={ROUTE_PATHS.ADD_CAMERA} 
              element={
                <ProtectedRoute>
                  <AddCamera />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route 
              path="*" 
              element={<Navigate to={ROUTE_PATHS.HOME} replace />} 
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

/**
 * Main App component
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthWrapper>
          <AppContent />
        </AuthWrapper>
      </BrowserRouter>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;
