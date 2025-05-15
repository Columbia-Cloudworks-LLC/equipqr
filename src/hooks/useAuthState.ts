
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to manage authentication state
 */
export function useAuthState() {
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event) {
          console.log("Auth state change event:", event);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const isValid = data?.session ? true : false;
      
      return isValid;
    } catch (error) {
      console.error("Error checking session:", error);
      return false;
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    checkSession
  };
}
