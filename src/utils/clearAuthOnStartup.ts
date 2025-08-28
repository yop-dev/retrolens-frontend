/**
 * Clear authentication data on app startup in development mode
 */
export function clearAuthOnStartup() {
  // Only run in development
  if (import.meta.env.DEV) {
    // Check if we should clear auth (only on initial load, not hot reload)
    const shouldClearAuth = !sessionStorage.getItem('dev-session-active');
    
    if (shouldClearAuth) {
      console.log('🔄 Clearing authentication for fresh dev session...');
      
      // Clear Clerk cookies and localStorage
      // Clerk stores data with keys starting with "__clerk"
      const keysToRemove: string[] = [];
      
      // Clear localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('__clerk') || key.startsWith('clerk'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear sessionStorage
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('__clerk') || key.startsWith('clerk'))) {
          sessionKeysToRemove.push(key);
        }
      }
      
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      // Clear all cookies that might contain Clerk session data
      document.cookie.split(";").forEach((c) => {
        const cookie = c.trim();
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if (name.includes('clerk') || name.includes('__session') || name.includes('__client')) {
          // Clear cookie by setting expiry in the past
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
        }
      });
      
      // Mark that we've started a dev session (this will be cleared on page refresh)
      sessionStorage.setItem('dev-session-active', 'true');
      
      console.log('✅ Authentication cleared. Please log in.');
    }
  }
}
