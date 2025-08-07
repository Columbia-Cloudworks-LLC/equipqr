
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: import('@/types/authTypes').AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: import('@/types/authTypes').AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: import('@/types/authTypes').AuthError | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let authStateChangedCount = 0;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authStateChangedCount++;
        console.log(`🔐 Auth state changed (#${authStateChangedCount}):`, event, session?.user?.id);
        
        // Distinguish between different types of auth events
        const isTokenRefresh = event === 'TOKEN_REFRESHED';
        const isSignIn = event === 'SIGNED_IN';
        const isSignOut = event === 'SIGNED_OUT';
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle post-login redirect for QR code scans (only for actual sign-ins)
        if (isSignIn && session?.user) {
          const pendingRedirect = sessionStorage.getItem('pendingRedirect');
          if (pendingRedirect) {
            sessionStorage.removeItem('pendingRedirect');
            console.log('🎯 Redirecting to pending URL after sign-in:', pendingRedirect);
            // Use setTimeout to ensure the redirect happens after state updates
            setTimeout(() => {
              window.location.href = pendingRedirect;
            }, 100);
          }
        }

        // Don't trigger session refresh for token refreshes - this is normal
        if (isTokenRefresh) {
          console.log('🔄 Token refreshed - maintaining current session state');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name || email
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    try {
      // First, validate that we have a session to sign out
      if (!session) {
        console.log('No active session found, performing client-side cleanup only');
        // Clear any potential stale local storage
        localStorage.removeItem('sb-ymxkzronkhwxzcdcbnwq-auth-token');
        return;
      }

      console.log('🚪 Attempting to sign out with session:', session.access_token?.substring(0, 20) + '...');
      
      // Attempt server-side logout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Server-side logout failed:', error);
        
        // Handle specific error cases
        if (error.message?.includes('Session not found') || error.message?.includes('session_not_found')) {
          console.log('Session already expired on server, performing client-side cleanup');
          // Session is already invalid on server, just clean up locally
        } else {
          // For other errors, we still want to clean up locally but log the error
          console.error('Unexpected logout error:', error);
        }
      } else {
        console.log('✅ Server-side logout successful');
      }
    } catch (error) {
      console.error('Exception during logout:', error);
    } finally {
      // Always perform client-side cleanup regardless of server response
      console.log('🧹 Performing client-side cleanup');
      
      // Clear local storage manually as fallback
      try {
        localStorage.removeItem('sb-ymxkzronkhwxzcdcbnwq-auth-token');
        // Also clear any other potential auth-related items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-ymxkzronkhwxzcdcbnwq-auth')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (storageError) {
        console.warn('Error clearing localStorage:', storageError);
      }
      
      // Clear session storage items
      try {
        sessionStorage.removeItem('pendingRedirect');
      } catch (sessionError) {
        console.warn('Error clearing sessionStorage:', sessionError);
      }
      
      // Reset local state
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      signUp, 
      signIn, 
      signInWithGoogle,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
