import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthMethods } from './useAuthMethods';

/**
 * Unified hook for authentication functionality
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const authMethods = useAuthMethods();

  // Initialize auth state and set up listener
  useEffect(() => {
    console.log('useAuth: Initializing auth state');
    setIsLoading(true);
    
    // IMPORTANT: First set up the auth state listener before checking session
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useAuth: Auth state change event:', event);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    
    // Then check for an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth: Initial session check:', session ? 'Has session' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Check session validity - simplified
  const checkSession = useCallback(async () => {
    try {
      console.log('useAuth: Checking session validity');
      const { data } = await supabase.auth.getSession();
      const isValid = !!data?.session;
      
      console.log('useAuth: Session valid:', isValid);
      
      // Update state if needed
      if (isValid && !session) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } else if (!isValid && session) {
        // Session is not valid but we have one locally - reset state
        setSession(null);
        setUser(null);
      }
      
      return isValid;
    } catch (error) {
      console.error('useAuth: Error checking session:', error);
      return false;
    }
  }, [session]);

  // Function to repair session - implementation improved
  const repairSession = useCallback(async () => {
    try {
      console.log('useAuth: Attempting to repair session');
      
      // First check if we have a session
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Get project ID from project URL
      const projectRef = "oxeheowbfsshpyldlskb";
      
      // Refresh session storage keys
      const sessionKey = `sb-${projectRef}-auth-token`;
      const codeVerifierKey = `sb-${projectRef}-auth-token-code-verifier`;
      const legacySessionKey = "supabase.auth.token";
      
      console.log(`Checking storage for session keys: ${sessionKey}, ${legacySessionKey}`);
      
      // Look for any traces of session
      const localStorageSession = localStorage.getItem(sessionKey);
      const localLegacySession = localStorage.getItem(legacySessionKey);
      
      if (!sessionData?.session && !localStorageSession && !localLegacySession) {
        console.log('useAuth: No session data found to repair');
        return false;
      }
      
      // If session exists but is not in proper state, try to refresh
      try {
        console.log('useAuth: Attempting to refresh session token');
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('useAuth: Failed to refresh token:', error);
          return false;
        }
        
        if (data?.session) {
          console.log('useAuth: Session successfully refreshed');
          setSession(data.session);
          setUser(data.session.user);
          return true;
        }
      } catch (refreshError) {
        console.error('useAuth: Error during token refresh:', refreshError);
      }
      
      // Last resort - explicit signout and let user sign in again
      try {
        await supabase.auth.signOut({ scope: 'local' });
        console.log('useAuth: Signed out locally to reset auth state');
        setSession(null);
        setUser(null);
      } catch (signOutError) {
        console.error('useAuth: Error during cleanup signout:', signOutError);
      }
      
      return false;
    } catch (error) {
      console.error('useAuth: Error during session repair:', error);
      return false;
    }
  }, []);

  // Complete auth reset - useful for troubleshooting  
  const resetAuthSystem = useCallback(async () => {
    try {
      console.log('useAuth: Performing complete auth system reset');
      
      // Clear auth state
      setUser(null);
      setSession(null);
      
      // First try explicit sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.error('useAuth: Error during explicit sign-out in reset:', e);
      }
      
      // Clear all Supabase-related storage
      const projectRef = "oxeheowbfsshpyldlskb";
      const keys = [
        `sb-${projectRef}-auth-token`,
        `sb-${projectRef}-auth-token-code-verifier`,
        "supabase.auth.token"
      ];
      
      keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear all other auth-related storage
      localStorage.removeItem('authReturnTo');
      sessionStorage.removeItem('authRedirectCount');
      sessionStorage.removeItem('invitationPath');
      
      console.log('useAuth: Auth system reset complete');
    } catch (error) {
      console.error('useAuth: Error during auth system reset:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Modified signIn to pass through the Session
  const signIn = useCallback(async (email: string, password: string): Promise<Session | null> => {
    return await authMethods.signIn(email, password);
  }, [authMethods]);

  return {
    user,
    session,
    isLoading,
    signIn,
    signInWithGoogle: authMethods.signInWithGoogle,
    signOut: authMethods.signOut,
    signUp: authMethods.signUp,
    resetPassword: authMethods.resetPassword,
    checkSession,
    repairSession,
    resetAuthSystem
  };
}
