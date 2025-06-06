
import { createContext, useContext, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth as useAuthHook } from '@/hooks/useAuth';

interface AuthContextType {
  supabaseClient: typeof supabase;
  session: Session | null;
  user: Session['user'] | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<Session | null>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resetAuthSystem: () => Promise<void>;
  repairSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  supabaseClient: null as any,
  session: null,
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signInWithMicrosoft: async () => {},
  signOut: async () => {},
  checkSession: async () => false,
  signIn: async () => null,
  signUp: async () => {},
  resetPassword: async () => {},
  resetAuthSystem: async () => {},
  repairSession: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Get authentication state and methods using our simplified hook
  const { 
    user, 
    session, 
    isLoading, 
    signInWithGoogle,
    signInWithMicrosoft,
    signIn, 
    signUp, 
    resetPassword, 
    signOut, 
    checkSession,
    resetAuthSystem,
    repairSession
  } = useAuthHook();

  const value: AuthContextType = {
    supabaseClient: supabase,
    session,
    user,
    isLoading,
    signInWithGoogle,
    signInWithMicrosoft,
    signIn,
    signUp,
    resetPassword,
    signOut,
    checkSession,
    resetAuthSystem,
    repairSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
