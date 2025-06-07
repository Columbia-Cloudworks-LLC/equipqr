
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthValidationResult {
  isValid: boolean;
  user: User | null;
  session: Session | null;
  error?: string;
}

/**
 * Centralized authentication service for consistent auth operations
 */
export class AuthenticationService {
  /**
   * Validate current authentication state
   */
  async validateAuthentication(): Promise<AuthValidationResult> {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return {
          isValid: false,
          user: null,
          session: null,
          error: 'Authentication error: Please sign in again'
        };
      }
      
      if (!sessionData?.session?.user) {
        return {
          isValid: false,
          user: null,
          session: null,
          error: 'User must be logged in'
        };
      }
      
      return {
        isValid: true,
        user: sessionData.session.user,
        session: sessionData.session
      };
    } catch (error) {
      console.error('Auth validation error:', error);
      return {
        isValid: false,
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Get authenticated user ID
   */
  async getAuthenticatedUserId(): Promise<{ userId: string | null; error?: string }> {
    const validation = await this.validateAuthentication();
    
    if (!validation.isValid) {
      return { userId: null, error: validation.error };
    }
    
    return { userId: validation.user!.id };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const validation = await this.validateAuthentication();
    return validation.isValid;
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    const validation = await this.validateAuthentication();
    return validation.session;
  }
}

// Singleton instance
export const authenticationService = new AuthenticationService();
