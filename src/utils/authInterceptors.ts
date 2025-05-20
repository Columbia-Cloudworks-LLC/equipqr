
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
 * Clear all Supabase-related storage data in browser
 */
function clearAllAuthStorageData(): void {
  // Get Supabase project ref from URL
  const projectRef = getSupabaseProjectRef();
  
  if (!projectRef) {
    console.warn('Could not determine Supabase project ref');
    return;
  }
  
  // Clear all known Supabase auth storage keys
  const keysToRemove = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token-code-verifier`,
    `supabase.auth.token`,
    `supabase.auth.refreshToken`,
    `sb-${projectRef}-provider-token`,
    `sb-${projectRef}-session`
  ];
  
  console.log(`Clearing ${keysToRemove.length} auth storage keys`);
  
  // ENHANCED: Try to clear from both localStorage and sessionStorage
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      
      // ADDED: Also try to clear from IndexedDB
      try {
        const dbName = 'supabase-auth';
        const storeName = 'auth-store';
        const request = indexedDB.open(dbName);
        
        request.onsuccess = function(event) {
          const db = request.result;
          try {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            store.delete(key);
          } catch (e) {
            console.error(`Failed to remove key from IndexedDB: ${key}`, e);
          } finally {
            db.close();
          }
        };
      } catch (idbError) {
        console.error(`Failed to access IndexedDB`, idbError);
      }
      
      console.log(`Removed ${key} from storage`);
    } catch (e) {
      console.error(`Failed to remove storage key: ${key}`, e);
    }
  });
  
  // NEW: Also clear any auth-related cookies by setting expiry to past
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name] = cookie.split('=').map(c => c.trim());
      if (name && (name.includes('supabase') || name.includes(projectRef))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        console.log(`Cleared cookie: ${name}`);
      }
    }
  } catch (e) {
    console.error('Failed to clear cookies:', e);
  }
}

/**
 * Get the Supabase project ref from SUPABASE_URL environment variable or URL
 */
function getSupabaseProjectRef(): string | null {
  // Extract from SUPABASE_URL
  const supabaseUrl = "https://oxeheowbfsshpyldlskb.supabase.co";
  
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  console.warn('Could not extract project ref from SUPABASE_URL');
  return null;
}

/**
 * NEW: Perform a comprehensive auth system reset and cleanup
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

