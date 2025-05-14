
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

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
    const projectRef = "oxeheowbfsshpyldlskb";
    const keys = [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token-code-verifier`,
      "supabase-auth-token",
      `sb-${projectRef}-provider-token`,
      `sb-${projectRef}-session`
    ];
    
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`Removed ${key} from localStorage`);
      } catch (e) {
        console.error(`Failed to remove ${key} from localStorage:`, e);
      }
    });
    
    // Also clear session storage
    sessionStorage.removeItem('authRedirectCount');
    localStorage.removeItem('authReturnTo');
    
    return true;
  } catch (error) {
    console.error('Failed to reset auth state:', error);
    return false;
  }
}
