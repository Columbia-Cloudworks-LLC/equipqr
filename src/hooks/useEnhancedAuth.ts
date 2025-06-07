
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { enhancedAuthMethods } from '@/services/auth/EnhancedAuthMethods';

/**
 * Simplified enhanced authentication hook
 */
export function useEnhancedAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state and set up listener
  useEffect(() => {
    console.log('useEnhancedAuth: Initializing auth state');
    
    // Set up the auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useEnhancedAuth: Auth state change event:', event, session ? 'Has session' : 'No session');
      
      // Update state immediately
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Handle OAuth callback for new sessions only
      if (event === 'SIGNED_IN' && session && window.location.pathname === '/auth/callback') {
        console.log('useEnhancedAuth: Processing OAuth callback');
        // Use setTimeout to avoid auth state change deadlock
        setTimeout(() => {
          enhancedAuthMethods.handleOAuthCallback(session);
        }, 100);
      }
    });
    
    // Check for existing session
    const initializeSession = async () => {
      try {
        console.log('useEnhancedAuth: Checking for existing session');
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
      console.log('useEnhancedAuth: Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Auth methods
  const signIn = useCallback(async (email: string, password: string): Promise<Session | null> => {
    return await enhancedAuthMethods.signIn(email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return await enhancedAuthMethods.signInWithProvider('google');
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    return await enhancedAuthMethods.signInWithProvider('azure');
  }, []);

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    return await enhancedAuthMethods.signUp(email, password, userData);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return await enhancedAuthMethods.resetPassword(email);
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('useEnhancedAuth: Starting signOut process');
      await supabase.auth.signOut({ scope: 'global' });
      console.log('useEnhancedAuth: signOut completed successfully');
    } catch (error) {
      console.error('useEnhancedAuth: Error during signOut:', error);
      throw error;
    }
  }, []);

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('useEnhancedAuth: Checking session validity');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('useEnhancedAuth: Error checking session:', error);
        return false;
      }
      
      const isValid = !!session;
      console.log('useEnhancedAuth: Session check result:', isValid);
      return isValid;
    } catch (error) {
      console.error('useEnhancedAuth: Error during session check:', error);
      return false;
    }
  }, []);

  const repairSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('useEnhancedAuth: Attempting session repair');
      
      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('useEnhancedAuth: Error repairing session:', error);
        return false;
      }
      
      if (data?.session) {
        console.log('useEnhancedAuth: Session repaired successfully');
        setSession(data.session);
        setUser(data.session.user);
        return true;
      }
      
      console.log('useEnhancedAuth: Session repair failed - no session returned');
      return false;
    } catch (error) {
      console.error('useEnhancedAuth: Error during session repair:', error);
      return false;
    }
  }, []);

  const resetAuthSystem = useCallback(async () => {
    try {
      console.log('useEnhancedAuth: Performing complete auth system reset');
      
      // Clear state first
      setUser(null);
      setSession(null);
      
      // Sign out
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
      
      // Clear auth-related session data
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
