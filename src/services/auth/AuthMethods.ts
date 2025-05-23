
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Provides core authentication methods
 */
export class AuthMethods {
  /**
   * Sign in with email and password
   */
  public async signIn(email: string, password: string): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error("Failed to sign in", {
          description: error.message
        });
        throw error;
      }
      
      return data.session;
    } catch (error) {
      console.error('AuthMethods: Error during sign-in:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google OAuth
   */
  public async signInWithGoogle(): Promise<void> {
    try {
      // Use window location for redirects for consistency
      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback`;
      
      console.log("AuthMethods: Google sign-in using callback URL:", callbackUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'select_account'
          }
        },
      });

      if (error) {
        console.error('AuthMethods: Google sign-in error:', error);
        toast.error("Failed to sign in with Google", {
          description: error.message
        });
        throw error;
      }
    } catch (error) {
      console.error('AuthMethods: Unexpected error during Google sign-in:', error);
      toast.error("An unexpected error occurred");
      throw error;
    }
  }

  /**
   * Create a new user account
   */
  public async signUp(email: string, password: string, userData?: any): Promise<void> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        console.error('AuthMethods: Sign-up error:', error);
        toast.error("Failed to create account", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Account created successfully", {
        description: "Please check your email for verification instructions"
      });
    } catch (error) {
      console.error('AuthMethods: Unexpected error during sign-up:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  public async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('AuthMethods: Password reset error:', error);
        toast.error("Failed to send password reset email", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Password reset email sent");
    } catch (error) {
      console.error('AuthMethods: Unexpected error during password reset:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const authMethods = new AuthMethods();
