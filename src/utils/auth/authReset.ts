
import { STORAGE_KEYS } from '@/config/environment';

/**
 * Reset auth state
 */
export function resetAuthState() {
  // Clear auth-related storage
  localStorage.removeItem(STORAGE_KEYS.authReturnTo);
  sessionStorage.removeItem(STORAGE_KEYS.invitationPath);
  sessionStorage.removeItem(STORAGE_KEYS.authRedirectCount);
}

/**
 * Perform a full reset of the auth system including storage cleanup
 */
export function performFullAuthReset() {
  resetAuthState();
  
  // Clear all Supabase-related storage using centralized keys
  const keys = [
    STORAGE_KEYS.authToken,
    STORAGE_KEYS.authTokenCodeVerifier,
    STORAGE_KEYS.supabaseAuthToken
  ];
  
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error(`Error clearing ${key}:`, e);
    }
  });
}
