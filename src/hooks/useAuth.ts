
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService, AuthEventType } from '@/services/auth/AuthService';

/**
 * Unified hook for authentication functionality
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [session, setSession] = useState<Session | null>(authService.getSession());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Set up auth event listener
  useEffect(() => {
    setIsLoading(true);
    
    // Handle authentication events
    const handleAuthEvent = (event: AuthEventType, newSession: Session | null) => {
      console.log('useAuth: Auth event:', event);
      
      // Update state based on the event
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    };
    
    // Subscribe to auth events
    const unsubscribe = authService.addEventListener(handleAuthEvent);
    
    // Initial session check
    authService.checkSession().then(hasSession => {
      if (!hasSession && !!user) {
        // Reset state if no valid session but we thought we had a user
        setUser(null);
        setSession(null);
      }
      setIsLoading(false);
    });
    
    // Cleanup listener on unmount
    return unsubscribe;
  }, [user]);

  // Check session validity
  const checkSession = useCallback(async () => {
    return authService.checkSession();
  }, []);

  return {
    user,
    session,
    isLoading,
    signIn: authService.signIn.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signOut: authService.signOut.bind(authService),
    signUp: authService.signUp.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    checkSession,
    getSessionInfo: authService.getSessionInfo.bind(authService),
    repairSession: authService.repairSession.bind(authService),
    resetAuthSystem: authService.resetAuthSystem.bind(authService)
  };
}
