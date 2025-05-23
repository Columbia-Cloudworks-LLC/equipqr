
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Unified hook for authentication functionality
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  // Sign in with email and password - simplified
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        toast.error("Failed to sign in", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Successfully signed in");
      
      return data.session;
    } catch (error) {
      console.error('useAuth: Error during sign-in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign in with Google OAuth - simplified
  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      const callbackUrl = `${window.location.origin}/auth/callback`;
      
      console.log("useAuth: Google sign-in using callback URL:", callbackUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'select_account'
          }
        },
      });

      if (error) {
        console.error('useAuth: Google sign-in error:', error);
        toast.error("Failed to sign in with Google", {
          description: error.message
        });
        throw error;
      }
    } catch (error) {
      console.error('useAuth: Error during Google sign-in:', error);
      toast.error("An unexpected error occurred");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Sign up - simplified
  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        console.error('useAuth: Sign-up error:', error);
        toast.error("Failed to create account", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Account created successfully", {
        description: "Please check your email for verification instructions"
      });
    } catch (error) {
      console.error('useAuth: Error during sign-up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password - simplified
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('useAuth: Password reset error:', error);
        toast.error("Failed to send password reset email", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Password reset email sent");
    } catch (error) {
      console.error('useAuth: Error during password reset:', error);
      throw error;
    }
  }, []);

  // Sign out - simplified but thorough
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('useAuth: Starting sign-out process');
      
      // First try explicit sign out - both local and global
      await supabase.auth.signOut({ scope: 'global' });
      
      // Reset state
      setUser(null);
      setSession(null);
      
      console.log('useAuth: Sign-out completed');
      
      // Clear any auth-related storage
      localStorage.removeItem('authReturnTo');
      sessionStorage.removeItem('invitationPath');
      sessionStorage.removeItem('authRedirectCount');
      
    } catch (error) {
      console.error('useAuth: Error during sign-out:', error);
      toast.error("There was an issue during sign out");
      
      // Even if server-side logout fails, ensure client-side state is reset
      setUser(null);
      setSession(null);
      
      // Throw the error for upstream handling if needed
      throw error;
    } finally {
      setIsLoading(false);
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

  // Function to repair session - simple implementation
  const repairSession = useCallback(async () => {
    try {
      console.log('useAuth: Attempting to repair session');
      
      // First check if we have a session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        console.log('useAuth: No session to repair');
        return false;
      }
      
      // Try to refresh the token
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
      
      return false;
    } catch (error) {
      console.error('useAuth: Error during session repair:', error);
      return false;
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    signIn,
    signInWithGoogle,
    signOut,
    signUp,
    resetPassword,
    checkSession,
    repairSession,
    resetAuthSystem
  };
}
