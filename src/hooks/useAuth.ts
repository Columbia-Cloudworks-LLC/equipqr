
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logoutService } from '@/services/auth/LogoutService';
import { useAuthMethods } from './useAuthMethods';

/**
 * Simplified auth hook with robust logout functionality
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
    
    // Set up the auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useAuth: Auth state change event:', event, session ? 'Has session' : 'No session');
      
      // Update state immediately
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Handle specific events
      if (event === 'SIGNED_OUT') {
        console.log('useAuth: User signed out, ensuring clean state');
        setSession(null);
        setUser(null);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('useAuth: User signed in successfully');
        setSession(session);
        setUser(session.user);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('useAuth: Token refreshed successfully');
        setSession(session);
        setUser(session.user);
      }
    });
    
    // Check for existing session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('useAuth: Error getting initial session:', error);
        } else {
          console.log('useAuth: Initial session check:', session ? 'Has session' : 'No session');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('useAuth: Error during session initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSession();
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Simplified session check
  const checkSession = useCallback(async (): Promise<boolean> => {
    return await logoutService.validateSession();
  }, []);

  // Simplified session repair
  const repairSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('useAuth: Attempting to repair session');
      
      const { data: refreshData, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('useAuth: Failed to refresh session:', error);
        return false;
      }
      
      if (refreshData?.session) {
        console.log('useAuth: Session successfully refreshed');
        setSession(refreshData.session);
        setUser(refreshData.session.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('useAuth: Error during session repair:', error);
      return false;
    }
  }, []);

  // Use the new logout service
  const signOut = useCallback(async () => {
    await logoutService.logout();
  }, []);

  // Complete auth reset using logout service
  const resetAuthSystem = useCallback(async () => {
    await logoutService.emergencyLogout();
  }, []);

  return {
    user,
    session,
    isLoading,
    signIn: authMethods.signIn,
    signInWithGoogle: authMethods.signInWithGoogle,
    signInWithMicrosoft: authMethods.signInWithMicrosoft,
    signOut,
    signUp: authMethods.signUp,
    resetPassword: authMethods.resetPassword,
    checkSession,
    repairSession,
    resetAuthSystem
  };
}
