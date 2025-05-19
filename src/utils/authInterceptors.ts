import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { createSupabaseStorage } from "@/utils/storageAdapter";

/**
 * Sets an interceptor for auth requests to fix specific errors
 */
export function setupAuthInterceptors() {
  // Create a subscription that we can return to clean up later
  const subscription = {
    unsubscribe: () => {}
  };

  // Log auth errors manually since onError might not be available
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    } else if (event === 'SIGNED_IN') {
      console.log('User signed in');
    } else if (event === 'USER_UPDATED') {
      console.log('User updated');
    } else if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed');
    } else if (event === 'PASSWORD_RECOVERY') {
      console.log('Password recovery requested');
    }
  });

  return subscription;
}

/**
 * Check if a session is valid by verifying the token
 * @param session The session to verify
 * @returns True if session is valid, false otherwise
 */
export async function validateSession(session: Session | null): Promise<boolean> {
  if (!session) return false;
  
  try {
    // Try to use the session with a lightweight request
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
      .single();
    
    if (error) {
      // Check if error is auth-related
      if (error.code === 'PGRST301' || 
          error.code === '401' || 
          error.message.includes('JWT')) {
        console.warn('Session validation failed:', error);
        return false;
      }
      
      // Other errors don't indicate invalid session
      console.error('Error while validating session:', error);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}

/**
 * Reset authentication state in the browser
 * This can help fix issues with corrupted auth tokens
 */
export function resetAuthState() {
  try {
    console.log('resetAuthState: Beginning token cleanup');
    
    // Get the storage adapter to ensure we clean both localStorage and IndexedDB
    const storageAdapter = createSupabaseStorage();
    
    // Define all possible auth token keys
    const projectRef = "oxeheowbfsshpyldlskb";
    const keys = [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token-code-verifier`,
      "supabase.auth.token",
      "supabase-auth-token",
      `sb-${projectRef}-provider-token`, 
      `sb-${projectRef}-session`,
      `sb-${projectRef}-auth-person-identity`,
      "supabase.auth.refreshToken"
    ];
    
    // For each key, clear from our storage adapter (IndexedDB + localStorage)
    const cleanupPromises = keys.map(async key => {
      try {
        await storageAdapter.removeItem(key);
        console.log(`resetAuthState: Removed ${key} from custom storage`);
      } catch (e) {
        console.error(`resetAuthState: Failed to remove ${key} from custom storage:`, e);
      }
    });
    
    // Also clear from localStorage directly as a fallback
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`resetAuthState: Removed ${key} from localStorage`);
      } catch (e) {
        console.error(`resetAuthState: Failed to remove ${key} from localStorage:`, e);
      }
    });
    
    // Clear session storage related data
    sessionStorage.removeItem('authRedirectCount');
    localStorage.removeItem('authReturnTo');
    
    console.log('resetAuthState: Token cleanup complete');
    return true;
  } catch (error) {
    console.error('resetAuthState: Failed to reset auth state:', error);
    return false;
  }
}
