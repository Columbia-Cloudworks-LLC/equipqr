import { Session } from '@supabase/supabase-js';

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface AuthResponse {
  error: AuthError | null;
  data?: any;
}

export interface AuthContextType {
  user: any;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  name?: string;
}

export interface GoogleAuthOptions {
  redirectTo?: string;
}