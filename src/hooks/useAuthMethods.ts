
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getSiteUrl, getAuthCallbackUrl } from '@/utils/authCallbackUtils';
import { Session } from '@supabase/supabase-js';

/**
 * Simplified authentication methods hook
 */
export function useAuthMethods() {
  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
    try {
      const siteUrl = getSiteUrl();
      const callbackUrl = getAuthCallbackUrl();
      
      console.log("Google sign-in using site URL:", siteUrl);
      console.log("Google sign-in using callback URL:", callbackUrl);
      
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
        console.error('Google sign-in error:', error);
        toast.error("Failed to sign in with Google", {
          description: error.message
        });
        throw error;
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      toast.error("An unexpected error occurred");
      throw error;
    }
  };

  /**
   * Sign in with Microsoft OAuth
   */
  const signInWithMicrosoft = async () => {
    try {
      const siteUrl = getSiteUrl();
      const callbackUrl = getAuthCallbackUrl();
      
      console.log("Microsoft sign-in using site URL:", siteUrl);
      console.log("Microsoft sign-in using callback URL:", callbackUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'select_account'
          }
        },
      });

      if (error) {
        console.error('Microsoft sign-in error:', error);
        toast.error("Failed to sign in with Microsoft", {
          description: error.message
        });
        throw error;
      }
    } catch (error) {
      console.error('Unexpected error during Microsoft sign-in:', error);
      toast.error("An unexpected error occurred");
      throw error;
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<Session | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign-in error:', error);
        toast.error("Failed to sign in", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Successfully signed in");
      return data.session;
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      throw error;
    }
  };

  /**
   * Create a new user account
   */
  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        console.error('Sign-up error:', error);
        toast.error("Failed to create account", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Account created successfully", {
        description: "Please check your email for verification instructions"
      });
    } catch (error) {
      console.error('Unexpected error during sign-up:', error);
      throw error;
    }
  };

  /**
   * Send password reset email to user
   */
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteUrl()}/auth/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error("Failed to send password reset email", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Password reset email sent");
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    signInWithMicrosoft,
    signIn,
    signUp,
    resetPassword
  };
}
