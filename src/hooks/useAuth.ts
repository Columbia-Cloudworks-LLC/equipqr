
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthMethods } from './useAuthMethods';
import { APP_CONFIG, STORAGE_KEYS } from '@/config/environment';

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
    if (APP_CONFIG.debug) {
      console.log('useAuth: Initializing auth state');
    }
    setIsLoading(true);
    
    // Set up the auth state listener first
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (APP_CONFIG.debug) {
        console.log('useAuth: Auth state change event:', event, session ? 'Has session' : 'No session');
      }
      
      // Update state synchronously
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Handle specific events
      if (event === 'SIGNED_OUT') {
        if (APP_CONFIG.debug) {
          console.log('useAuth: User signed out, clearing state');
        }
        setSession(null);
        setUser(null);
      } else if (event === 'SIGNED_IN' && session) {
        if (APP_CONFIG.debug) {
          console.log('useAuth: User signed in successfully');
        }
        setSession(session);
        setUser(session.user);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        if (APP_CONFIG.debug) {
          console.log('useAuth: Token refreshed successfully');
        }
        setSession(session);
        setUser(session.user);
      }
    });
    
    // Then check for an existing session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('useAuth: Error getting initial session:', error);
        } else {
          if (APP_CONFIG.debug) {
            console.log('useAuth: Initial session check:', session ? 'Has session' : 'No session');
          }
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

  // Check session validity with better error handling
  const checkSession = useCallback(async () => {
    try {
      if (APP_CONFIG.debug) {
        console.log('useAuth: Checking session validity');
      }
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('useAuth: Session check error:', error);
        return false;
      }
      
      const isValid = !!data?.session;
      if (APP_CONFIG.debug) {
        console.log('useAuth: Session valid:', isValid);
      }
      
      // Update state if needed
      if (isValid && !session) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } else if (!isValid && session) {
        if (APP_CONFIG.debug) {
          console.log('useAuth: Session invalid, clearing state');
        }
        setSession(null);
        setUser(null);
      }
      
      return isValid;
    } catch (error) {
      console.error('useAuth: Error checking session:', error);
      return false;
    }
  }, [session]);

  // Function to repair session with improved logic
  const repairSession = useCallback(async () => {
    try {
      if (APP_CONFIG.debug) {
        console.log('useAuth: Attempting to repair session');
      }
      
      // First check if we have a session
      const { data: sessionData, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('useAuth: Error getting session for repair:', error);
        return false;
      }
      
      if (!sessionData?.session) {
        if (APP_CONFIG.debug) {
          console.log('useAuth: No session data found to repair');
        }
        
        // Try to refresh session if we have a refresh token
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('useAuth: Failed to refresh session:', refreshError);
            return false;
          }
          
          if (refreshData?.session) {
            if (APP_CONFIG.debug) {
              console.log('useAuth: Session successfully refreshed');
            }
            setSession(refreshData.session);
            setUser(refreshData.session.user);
            return true;
          }
        } catch (refreshError) {
          console.error('useAuth: Error during session refresh:', refreshError);
        }
        
        return false;
      }
      
      // Session exists, validate it
      if (APP_CONFIG.debug) {
        console.log('useAuth: Session found, validating');
      }
      setSession(sessionData.session);
      setUser(sessionData.session.user);
      return true;
    } catch (error) {
      console.error('useAuth: Error during session repair:', error);
      return false;
    }
  }, []);

  // Complete auth reset
  const resetAuthSystem = useCallback(async () => {
    try {
      if (APP_CONFIG.debug) {
        console.log('useAuth: Performing complete auth system reset');
      }
      
      // Clear auth state
      setUser(null);
      setSession(null);
      
      // Sign out from Supabase
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.error('useAuth: Error during explicit sign-out in reset:', e);
      }
      
      // Clear storage using centralized keys
      const keys = [
        STORAGE_KEYS.authToken,
        STORAGE_KEYS.authTokenCodeVerifier,
        STORAGE_KEYS.supabaseAuthToken,
        STORAGE_KEYS.authReturnTo,
        STORAGE_KEYS.authRedirectCount,
        STORAGE_KEYS.invitationPath
      ];
      
      keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      if (APP_CONFIG.debug) {
        console.log('useAuth: Auth system reset complete');
      }
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
