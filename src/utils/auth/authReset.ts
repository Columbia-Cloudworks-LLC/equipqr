
import { clearAllAuthStorageData, clearAuthCookies } from './storageCleanup';
import { supabase } from '@/integrations/supabase/client';

/**
 * Reset all authentication state
 * This cleans up all auth related storage and performs a clean logout
 */
export function resetAuthState(): void {
  console.log('Resetting auth state...');
  
  try {
    // Clear supabase storage
    localStorage.removeItem('supabase.auth.token');
    
    // Clear any session data
    clearAllAuthStorageData();
    
    console.log('Auth state reset completed');
  } catch (error) {
    console.error('Error resetting auth state:', error);
  }
}

/**
 * Perform a comprehensive auth system reset and cleanup
 * This does a more thorough job than resetAuthState and also reloads the page
 */
export function performFullAuthReset(): void {
  console.log('Performing full auth system reset');
  
  // First try to explicitly sign out using supabase client
  try {
    supabase.auth.signOut({ scope: 'global' })
      .catch(err => console.error('Error during explicit signOut:', err));
  } catch (e) {
    console.error('Failed to call supabase.auth.signOut:', e);
  }
  
  // Then clear all auth storage
  resetAuthState();
  
  // Clear auth cookies
  clearAuthCookies();
  
  // Also clear any auth-related local/session storage directly
  try {
    // Clear redirect counter and return URL
    sessionStorage.removeItem('authRedirectCount');
    localStorage.removeItem('authReturnTo');
    
    // Clear any cached data that might depend on user auth
    localStorage.removeItem('equipment_cache_bust');
    
    // Find and remove any items with supabase or auth in the key
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
        localStorage.removeItem(key);
      }
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.error('Error clearing additional storage items:', e);
  }
  
  console.log('Auth reset complete - reloading page');
}
