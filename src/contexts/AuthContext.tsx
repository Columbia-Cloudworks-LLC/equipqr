import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSiteUrl } from '@/utils/authCallbackUtils';

interface AuthContextType {
  supabaseClient: SupabaseClient<Database> | null;
  session: Session | null;
  user: Session['user'] | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  supabaseClient: null,
  session: null,
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  checkSession: async () => false,
  signIn: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true);
      
      // Get the correct site URL for redirects
      const siteUrl = getSiteUrl();
      console.log("Google sign-in using redirect URL:", `${siteUrl}/auth`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth`,
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        toast.error("Failed to sign in with Google", {
          description: error.message
        });
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign-in error:', error);
        toast.error("Failed to sign in", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Successfully signed in");
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        console.error('Sign-up error:', error);
        toast.error("Failed to create account", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Account created successfully", {
        description: "Please check your email for verification instructions"
      });
    } catch (error) {
      console.error('Unexpected error during sign-up:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error("Failed to send password reset email", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Password reset email sent");
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign-out error:', error);
      toast.error("Failed to sign out");
    } finally {
      setAuthLoading(false);
    }
  };

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

  const value = {
    supabaseClient: supabase,
    session,
    user,
    isLoading: authLoading,
    signInWithGoogle,
    signIn,
    signUp,
    resetPassword,
    signOut,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
