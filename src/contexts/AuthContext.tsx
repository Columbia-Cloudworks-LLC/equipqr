
import { createContext, useContext, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AuthContextType {
  supabaseClient: typeof supabase;
  session: Session | null;
  user: Session['user'] | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<Session | null>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resetAuthSystem: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  supabaseClient: null as any,
  session: null,
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  checkSession: async () => false,
  signIn: async () => null,
  signUp: async () => {},
  resetPassword: async () => {},
  resetAuthSystem: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Get authentication state and methods using our new unified hook
  const { 
    user, 
    session, 
    isLoading, 
    signInWithGoogle, 
    signIn, 
    signUp, 
    resetPassword, 
    signOut, 
    checkSession,
    resetAuthSystem
  } = useAuth();

  const value: AuthContextType = {
    supabaseClient: supabase,
    session,
    user,
    isLoading,
    signInWithGoogle,
    signIn,
    signUp,
    resetPassword,
    signOut,
    checkSession,
    resetAuthSystem,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
