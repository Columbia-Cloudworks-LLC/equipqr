import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

/**
 * Sets an interceptor for auth requests to fix specific errors
 */
export function setupAuthInterceptors() {
  // Log auth errors for debugging
  const { data: { subscription } } = supabase.auth.onError((error) => {
    console.error('Auth error intercepted:', error);
    
    // TODO: Add custom error handling here
    // For example, tracking specific errors or displaying custom messages
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
