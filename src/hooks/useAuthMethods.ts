
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getSiteUrl, getAuthCallbackUrl } from '@/utils/authCallbackUtils';

/**
 * Custom hook providing authentication methods
 */
export function useAuthMethods() {
  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
    try {
      // Get the correct site URL for redirects
      const siteUrl = getSiteUrl();
      const callbackUrl = getAuthCallbackUrl();
      
      console.log("Google sign-in using site URL:", siteUrl);
      console.log("Google sign-in using callback URL:", callbackUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            // Add prompt parameter for consistent login experience
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
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
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

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign-out error:', error);
      toast.error("Failed to sign out");
      throw error;
    }
  };

  return {
    signInWithGoogle,
    signIn,
    signUp,
    resetPassword,
    signOut
  };
}
