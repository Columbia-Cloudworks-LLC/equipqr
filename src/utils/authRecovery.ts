
/**
 * Utility functions to help recover from auth errors
 */

/**
 * Reset all authentication related storage and settings
 * This can be used as a last resort to fix persistent auth issues
 */
export function resetAuthSystem(): void {
  console.log('Performing complete auth system reset');
  
  // Reset redirect counter
  sessionStorage.removeItem('authRedirectCount');
  
  // Clear return URL
  localStorage.removeItem('authReturnTo');
  
  // Clear Supabase auth tokens
  const projectRef = "oxeheowbfsshpyldlskb";
  const keys = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token-code-verifier`,
    "supabase.auth.token",
    "supabase-auth-token"
  ];
  
  // Clear all known auth tokens
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`Removed ${key} from localStorage`);
    } catch (e) {
      console.error(`Failed to remove ${key} from localStorage`, e);
    }
  });
  
  // Force reload the application
  window.location.href = '/auth';
}

/**
 * Check if we're in a redirect loop
 * @returns boolean indicating if we're in a redirect loop
 */
export function isInRedirectLoop(): boolean {
  const redirectCount = sessionStorage.getItem('authRedirectCount');
  if (!redirectCount) return false;
  
  return parseInt(redirectCount, 10) >= 3;
}

/**
 * Get the current redirect count
 */
export function getRedirectCount(): number {
  const redirectCount = sessionStorage.getItem('authRedirectCount');
  if (!redirectCount) return 0;
  
  return parseInt(redirectCount, 10);
}

/**
 * Increment the redirect count
 */
export function incrementRedirectCount(): number {
  const currentCount = getRedirectCount();
  const newCount = currentCount + 1;
  sessionStorage.setItem('authRedirectCount', newCount.toString());
  return newCount;
}

/**
 * Reset the redirect count
 */
export function resetRedirectCount(): void {
  sessionStorage.removeItem('authRedirectCount');
}
