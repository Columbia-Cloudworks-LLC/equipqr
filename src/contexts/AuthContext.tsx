
import { createContext, useContext } from 'react';
import {
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthMethods } from '@/hooks/useAuthMethods';

interface AuthContextType {
  supabaseClient: SupabaseClient<Database> | null;
  session: Session | null;
  user: Session['user'] | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  supabaseClient: null,
  session: null,
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  checkSession: async () => false,
  signIn: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Get authentication state
  const { user, session, isLoading, checkSession } = useAuthState();
  
  // Get authentication methods
  const { signInWithGoogle, signIn, signUp, resetPassword, signOut } = useAuthMethods();

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
