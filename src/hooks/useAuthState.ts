
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { resetAuthState } from '@/utils/authInterceptors';

/**
 * Custom hook to manage authentication state
 */
export function useAuthState() {
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthState: Initializing auth state management');
    
    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AuthState: Auth state change event:", event, session ? `Session ID: ${session.access_token.substring(0, 8)}...` : 'No session');
        
        if (event === 'SIGNED_OUT') {
          // Force clear all tokens on explicit signout event
          resetAuthState();
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthState: Initial session check:", session ? `Session ID: ${session.access_token.substring(0, 8)}...` : 'No session');
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      console.log('AuthState: Unsubscribing from auth state changes');
      data.subscription.unsubscribe();
    };
  }, []);

  const checkSession = useCallback(async () => {
    try {
      console.log('AuthState: Performing session validity check');
      const { data } = await supabase.auth.getSession();
      const isValid = data?.session ? true : false;
      
      console.log('AuthState: Session check result:', isValid ? 'Valid session' : 'No valid session');
      
      // If no valid session but we think we have a user, reset auth state
      if (!isValid && user) {
        console.warn('AuthState: Session invalid but user state exists, resetting auth state');
        resetAuthState();
      }
      
      return isValid;
    } catch (error) {
      console.error("AuthState: Error checking session:", error);
      return false;
    }
  }, [user]);

  return {
    user,
    session,
    isLoading,
    checkSession
  };
}
