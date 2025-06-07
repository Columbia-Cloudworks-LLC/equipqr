
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { authErrorDetection } from './AuthErrorDetection';
import { accountLinkingService } from './AccountLinkingService';
import { microsoftOAuthHandler } from './MicrosoftOAuthHandler';

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
   * Enhanced OAuth sign-in with improved Microsoft authentication
   */
  public async signInWithProvider(provider: 'google' | 'azure'): Promise<void> {
    try {
      // Special handling for Microsoft OAuth
      if (provider === 'azure') {
        return await microsoftOAuthHandler.initiateOAuth();
      }

      // Google OAuth handling
      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback`;
      
      console.log(`Enhanced ${provider} sign-in using callback URL:`, callbackUrl);
      
      const oauthOptions: any = {
        redirectTo: callbackUrl,
        queryParams: {
          prompt: 'select_account',
          scope: 'openid email profile',
          access_type: 'offline'
        }
      };

      // Log the OAuth attempt
      await authErrorDetection.logAuthEvent({
        event_type: 'oauth_sign_in_attempt',
        provider,
        email: 'unknown', // Will be updated after successful auth
        success: false,
        metadata: { 
          callback_url: callbackUrl,
          query_params: oauthOptions.queryParams 
        }
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
      });

      if (error) {
        console.error(`Enhanced ${provider} sign-in error:`, error);
        
        // Log the OAuth error
        await authErrorDetection.logAuthEvent({
          event_type: 'oauth_sign_in_error',
          provider,
          email: 'unknown',
          success: false,
          error_code: error.message,
          error_message: error.message,
          metadata: { 
            callback_url: callbackUrl,
            query_params: oauthOptions.queryParams 
          }
        });

        authErrorDetection.handleAuthError(error, {
          provider,
          action: 'oauth_sign_in'
        });
        throw error;
      }

      console.log(`${provider} OAuth redirect initiated successfully`);
    } catch (error) {
      console.error(`Unexpected error during enhanced ${provider} sign-in:`, error);
      toast.error("An unexpected error occurred during sign-in");
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
   * Enhanced OAuth callback handler with comprehensive debugging
   */
  public async handleOAuthCallback(session: any): Promise<void> {
    if (!session?.user) {
      console.warn('OAuth callback received without user session');
      return;
    }

    try {
      const provider = session.user.app_metadata?.provider || 'unknown';
      const email = session.user.email;
      const userId = session.user.id;

      console.log('OAuth callback details:', {
        provider,
        email: email ? `${email.substring(0, 3)}***` : 'NO EMAIL',
        userId: userId ? `${userId.substring(0, 8)}...` : 'NO USER ID',
        hasAppMetadata: !!session.user.app_metadata,
        hasUserMetadata: !!session.user.user_metadata,
        appMetadataKeys: session.user.app_metadata ? Object.keys(session.user.app_metadata) : [],
        userMetadataKeys: session.user.user_metadata ? Object.keys(session.user.user_metadata) : []
      });

      // Enhanced Microsoft OAuth callback handling
      if (provider === 'azure') {
        const result = await microsoftOAuthHandler.handleOAuthCallback(session);
        
        if (!result.success) {
          if (result.requiresLinking) {
            console.log('Microsoft OAuth: Account linking required');
            return;
          }
          
          // Error was already handled and toasted by the handler
          return;
        }
        
        // Success case handled by the handler
        return;
      }

      // Google OAuth handling
      if (provider === 'google') {
        // Log successful OAuth sign-in
        await authErrorDetection.logAuthEvent({
          event_type: 'oauth_sign_in_success',
          provider,
          email: email || 'not_provided',
          success: true,
          metadata: {
            user_id: userId,
            email_verified: session.user.email_verified
          }
        });

        // Update last used timestamp
        if (email) {
          await accountLinkingService.updateLastUsed(userId, provider);
        }

        // Check if account linking is needed
        if (email) {
          const linkingResult = await accountLinkingService.handleOAuthLinking(
            provider,
            session,
            email
          );

          if (linkingResult.requiresLinking) {
            console.log('Account linking required for', provider);
            return;
          }
        }

        toast.success(`Successfully signed in with Google`, {
          description: email ? `Welcome back, ${email}` : 'Welcome back!'
        });
      }

    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      
      // Log the callback error
      await authErrorDetection.logAuthEvent({
        event_type: 'oauth_callback_error',
        provider: session.user.app_metadata?.provider || 'unknown',
        email: session.user.email || 'unknown',
        success: false,
        error_code: error instanceof Error ? error.message : 'unknown_error',
        error_message: error instanceof Error ? error.message : 'Unknown callback error'
      });

      toast.error("Authentication processing failed", {
        description: "There was an issue completing your sign-in. Please try again."
      });
    }
  }
}

// Create singleton instance
export const enhancedAuthMethods = new EnhancedAuthMethods();
