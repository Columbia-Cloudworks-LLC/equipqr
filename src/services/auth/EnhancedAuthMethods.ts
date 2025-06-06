
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { authErrorDetection } from './AuthErrorDetection';
import { accountLinkingService } from './AccountLinkingService';

/**
 * Enhanced authentication methods with error detection and account linking
 */
export class EnhancedAuthMethods {
  /**
   * Enhanced sign in with better error handling and tracking
   */
  public async signIn(email: string, password: string): Promise<Session | null> {
    try {
      // Log sign-in attempt
      await authErrorDetection.logAuthEvent({
        event_type: 'sign_in_attempt',
        provider: 'email',
        email,
        success: false // Will update if successful
      });

      // Check for suspicious patterns
      const patterns = await authErrorDetection.analyzeAuthPatterns(email);
      if (patterns.suspicious) {
        toast.warning('Security Notice', {
          description: 'Multiple failed attempts detected. Please verify your credentials carefully.'
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        authErrorDetection.handleAuthError(error, {
          email,
          provider: 'email',
          action: 'sign_in'
        });
        throw error;
      }

      // Log successful sign-in
      await authErrorDetection.logAuthEvent({
        event_type: 'sign_in_success',
        provider: 'email',
        email,
        success: true
      });

      // Update last used timestamp
      if (data.session?.user) {
        await accountLinkingService.updateLastUsed(data.session.user.id, 'email');
      }

      toast.success("Successfully signed in");
      return data.session;
    } catch (error) {
      console.error('Enhanced sign-in error:', error);
      throw error;
    }
  }

  /**
   * Enhanced OAuth sign-in with account linking detection
   */
  public async signInWithProvider(provider: 'google' | 'azure'): Promise<void> {
    try {
      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback`;
      
      console.log(`Enhanced ${provider} sign-in using callback URL:`, callbackUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'select_account'
          }
        },
      });

      if (error) {
        console.error(`Enhanced ${provider} sign-in error:`, error);
        authErrorDetection.handleAuthError(error, {
          provider,
          action: 'oauth_sign_in'
        });
        throw error;
      }
    } catch (error) {
      console.error(`Unexpected error during enhanced ${provider} sign-in:`, error);
      toast.error("An unexpected error occurred");
      throw error;
    }
  }

  /**
   * Enhanced sign up with duplicate detection and linking
   */
  public async signUp(email: string, password: string, userData?: any): Promise<void> {
    try {
      // Check for duplicate email first
      const duplicateCheck = await authErrorDetection.checkDuplicateEmail(email, 'email');
      
      if (duplicateCheck.has_duplicate) {
        // Show account linking option
        const providers = duplicateCheck.existing_providers || [];
        const providerText = providers.length > 1 
          ? `multiple providers (${providers.join(', ')})` 
          : providers[0];
          
        toast.error("Account already exists", {
          description: `An account with this email already exists using ${providerText}. Please sign in instead.`,
          duration: 6000
        });
        
        // Log the duplicate attempt
        await authErrorDetection.logAuthEvent({
          event_type: 'duplicate_signup_attempt',
          provider: 'email',
          email,
          success: false,
          error_code: 'duplicate_email',
          error_message: 'Account already exists',
          metadata: { existing_providers: providers }
        });
        
        return;
      }

      // Log sign-up attempt
      await authErrorDetection.logAuthEvent({
        event_type: 'sign_up_attempt',
        provider: 'email',
        email,
        success: false // Will update if successful
      });

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        authErrorDetection.handleAuthError(error, {
          email,
          provider: 'email',
          action: 'sign_up'
        });
        throw error;
      }
      
      // Log successful sign-up
      await authErrorDetection.logAuthEvent({
        event_type: 'sign_up_success',
        provider: 'email',
        email,
        success: true
      });
      
      toast.success("Account created successfully", {
        description: "Please check your email for verification instructions"
      });
    } catch (error) {
      console.error('Enhanced sign-up error:', error);
      throw error;
    }
  }

  /**
   * Enhanced password reset with better tracking
   */
  public async resetPassword(email: string): Promise<void> {
    try {
      // Log password reset attempt
      await authErrorDetection.logAuthEvent({
        event_type: 'password_reset_attempt',
        provider: 'email',
        email,
        success: false // Will update if successful
      });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        authErrorDetection.handleAuthError(error, {
          email,
          provider: 'email',
          action: 'password_reset'
        });
        throw error;
      }
      
      // Log successful password reset request
      await authErrorDetection.logAuthEvent({
        event_type: 'password_reset_success',
        provider: 'email',
        email,
        success: true
      });
      
      toast.success("Password reset email sent");
    } catch (error) {
      console.error('Enhanced password reset error:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback with account linking
   */
  public async handleOAuthCallback(session: any): Promise<void> {
    if (!session?.user) return;

    try {
      const provider = session.user.app_metadata?.provider || 'unknown';
      const email = session.user.email;

      // Log successful OAuth sign-in
      await authErrorDetection.logAuthEvent({
        event_type: 'oauth_sign_in_success',
        provider,
        email,
        success: true
      });

      // Update last used timestamp
      await accountLinkingService.updateLastUsed(session.user.id, provider);

      // Check if account linking is needed
      const linkingResult = await accountLinkingService.handleOAuthLinking(
        provider,
        session,
        email
      );

      if (linkingResult.requiresLinking) {
        // The linking service will handle the UI notifications
        return;
      }

      toast.success(`Successfully signed in with ${provider}`);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
    }
  }
}

// Create singleton instance
export const enhancedAuthMethods = new EnhancedAuthMethods();
