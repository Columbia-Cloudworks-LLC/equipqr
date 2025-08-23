
import React, { createContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthProvider - Setting up auth listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (import.meta.env.DEV) {
          console.log('🔐 Auth state change:', { 
            event, 
            user: session?.user?.email || 'none',
            timestamp: new Date().toISOString()
          });
        }
        
        // Distinguish between different types of auth events
        const isTokenRefresh = event === 'TOKEN_REFRESHED';
        const isSignIn = event === 'SIGNED_IN';
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle post-login redirect for QR code scans (only for actual sign-ins)
        if (isSignIn && session?.user) {
          const pendingRedirect = sessionStorage.getItem('pendingRedirect');
          if (pendingRedirect) {
            sessionStorage.removeItem('pendingRedirect');
            // Redirecting to pending URL after sign-in
            // Use setTimeout to ensure the redirect happens after state updates
            setTimeout(() => {
              window.location.href = pendingRedirect;
            }, 100);
          }
        }

        // Don't trigger session refresh for token refreshes - this is normal
        if (isTokenRefresh) {
          // Token refreshed - maintaining current session state
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (import.meta.env.DEV) {
        console.log('🔐 Initial session check:', { 
          user: session?.user?.email || 'none',
          hasSession: !!session 
        });
      }
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
      // Let Supabase handle all auth storage cleanup
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Server-side logout failed:', error);
        // Continue with cleanup even if server logout fails
      }
    } catch (error) {
      console.error('Exception during logout:', error);
    } finally {
      // Clear application-specific session storage
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
