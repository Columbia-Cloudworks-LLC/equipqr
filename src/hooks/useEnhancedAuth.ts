
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { enhancedAuthMethods } from '@/services/auth/EnhancedAuthMethods';

/**
 * Enhanced authentication hook with error detection and account linking
 */
export function useEnhancedAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state and set up listener
  useEffect(() => {
    console.log('useEnhancedAuth: Initializing auth state');
    setIsLoading(true);
    
    // Set up the auth state listener first
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useEnhancedAuth: Auth state change event:', event, session ? 'Has session' : 'No session');
      
      // Update state synchronously
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Handle OAuth callback if this is a new session
      if (event === 'SIGNED_IN' && session) {
        await enhancedAuthMethods.handleOAuthCallback(session);
      }
    });
    
    // Then check for an existing session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('useEnhancedAuth: Error getting initial session:', error);
        } else {
          console.log('useEnhancedAuth: Initial session check:', session ? 'Has session' : 'No session');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('useEnhancedAuth: Error during session initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSession();
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Enhanced sign in
  const signIn = useCallback(async (email: string, password: string): Promise<Session | null> => {
    return await enhancedAuthMethods.signIn(email, password);
  }, []);

  // Enhanced OAuth sign in
  const signInWithGoogle = useCallback(async () => {
    return await enhancedAuthMethods.signInWithProvider('google');
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    return await enhancedAuthMethods.signInWithProvider('azure');
  }, []);

  // Enhanced sign up
  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    return await enhancedAuthMethods.signUp(email, password, userData);
  }, []);

  // Enhanced password reset
  const resetPassword = useCallback(async (email: string) => {
    return await enhancedAuthMethods.resetPassword(email);
  }, []);

  // Standard sign out
  const signOut = useCallback(async () => {
    try {
      console.log('useEnhancedAuth: Starting signOut process');
      
      // Use a comprehensive logout approach
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('useEnhancedAuth: signOut completed successfully');
    } catch (error) {
      console.error('useEnhancedAuth: Error during signOut:', error);
      throw error;
    }
  }, []);

  // Session validation
  const checkSession = useCallback(async () => {
    try {
      console.log('useEnhancedAuth: Checking session validity');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('useEnhancedAuth: Session check error:', error);
        return false;
      }
      
      const isValid = !!data?.session;
      console.log('useEnhancedAuth: Session valid:', isValid);
      
      // Update state if needed
      if (isValid && !session) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } else if (!isValid && session) {
        console.log('useEnhancedAuth: Session invalid, clearing state');
        setSession(null);
        setUser(null);
      }
      
      return isValid;
    } catch (error) {
      console.error('useEnhancedAuth: Error checking session:', error);
      return false;
    }
  }, [session]);

  // Session repair
  const repairSession = useCallback(async () => {
    try {
      console.log('useEnhancedAuth: Attempting to repair session');
      
      const { data: sessionData, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('useEnhancedAuth: Error getting session for repair:', error);
        return false;
      }
      
      if (!sessionData?.session) {
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('useEnhancedAuth: Failed to refresh session:', refreshError);
            return false;
          }
          
          if (refreshData?.session) {
            console.log('useEnhancedAuth: Session successfully refreshed');
            setSession(refreshData.session);
            setUser(refreshData.session.user);
            return true;
          }
        } catch (refreshError) {
          console.error('useEnhancedAuth: Error during session refresh:', refreshError);
        }
        
        return false;
      }
      
      console.log('useEnhancedAuth: Session found, validating');
      setSession(sessionData.session);
      setUser(sessionData.session.user);
      return true;
    } catch (error) {
      console.error('useEnhancedAuth: Error during session repair:', error);
      return false;
    }
  }, []);

  // Complete auth reset
  const resetAuthSystem = useCallback(async () => {
    try {
      console.log('useEnhancedAuth: Performing complete auth system reset');
      
      setUser(null);
      setSession(null);
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.error('useEnhancedAuth: Error during explicit sign-out in reset:', e);
      }
      
      // Clear storage
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
      
      localStorage.removeItem('authReturnTo');
      sessionStorage.removeItem('authRedirectCount');
      sessionStorage.removeItem('invitationPath');
      
      console.log('useEnhancedAuth: Auth system reset complete');
    } catch (error) {
      console.error('useEnhancedAuth: Error during auth system reset:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    signIn,
    signInWithGoogle,
    signInWithMicrosoft,
    signUp,
    resetPassword,
    signOut,
    checkSession,
    repairSession,
    resetAuthSystem
  };
}
