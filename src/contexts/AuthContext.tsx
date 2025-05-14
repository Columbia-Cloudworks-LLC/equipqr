import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Session,
  SupabaseClient,
  useSessionContext,
  useSupabaseClient,
} from '@supabase/auth-helpers-react';
import { Database } from '@/integrations/supabase/types';

interface AuthContextType {
  supabaseClient: SupabaseClient<Database> | null;
  session: Session | null;
  user: Session['user'] | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  supabaseClient: null,
  session: null,
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  checkSession: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading: authIsLoading, session, supabaseClient } = useSessionContext();
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setUser(session?.user || null);
    setAuthLoading(authIsLoading);
  }, [session, authIsLoading]);

  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true);
      const { error } = await supabaseClient?.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        // Handle error appropriately, e.g., show a toast notification
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      // Handle unexpected errors
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthLoading(true);
      await supabaseClient?.auth.signOut();
      setUser(null); // Clear user state on sign out
    } catch (error) {
      console.error('Sign-out error:', error);
      // Handle sign-out errors
    } finally {
      setAuthLoading(false);
    }
  };

  // Update the checkSession function to use our new validator
  const checkSession = useCallback(async () => {
    try {
      const { data } = await supabaseClient?.auth.getSession();
      const isValid = data?.session ? true : false;
      
      return isValid;
    } catch (error) {
      console.error("Error checking session:", error);
      return false;
    }
  }, [supabaseClient]);

  const value = {
    supabaseClient,
    session,
    user,
    isLoading: authLoading,
    signInWithGoogle,
    signOut,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
