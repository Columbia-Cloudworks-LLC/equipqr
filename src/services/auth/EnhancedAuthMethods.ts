
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
   * Enhanced OAuth sign-in with improved Microsoft authentication
   */
  public async signInWithProvider(provider: 'google' | 'azure'): Promise<void> {
    try {
      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback`;
      
      console.log(`Enhanced ${provider} sign-in using callback URL:`, callbackUrl);
      
      // Enhanced OAuth options with explicit scopes and parameters
      const oauthOptions: any = {
        redirectTo: callbackUrl,
        queryParams: {
          prompt: 'select_account'
        }
      };

      // Microsoft-specific enhancements
      if (provider === 'azure') {
        console.log('Configuring Microsoft Azure OAuth with enhanced parameters');
        
        // Add Microsoft-specific query parameters to ensure email access
        oauthOptions.queryParams = {
          ...oauthOptions.queryParams,
          // Explicitly request email and profile scopes
          scope: 'openid email profile User.Read',
          // Force consent to ensure we get the email permission
          prompt: 'consent',
          // Request specific response types
          response_type: 'code',
          // Ensure we get both access and ID tokens
          response_mode: 'query'
        };

        // Add additional options for Microsoft
        oauthOptions.options = {
          // Skip if user already has session to avoid conflicts
          skipBrowserRedirect: false,
          // Ensure we can access user email
          scopes: 'openid email profile User.Read'
        };

        console.log('Microsoft OAuth options:', JSON.stringify(oauthOptions, null, 2));
      }

      // Google-specific enhancements
      if (provider === 'google') {
        oauthOptions.queryParams = {
          ...oauthOptions.queryParams,
          scope: 'openid email profile',
          access_type: 'offline'
        };
      }

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
        console.log('Processing Microsoft OAuth callback');
        
        // Check if we received email from Microsoft
        if (!email) {
          console.error('Microsoft OAuth: No email received in user object');
          console.log('Full user object (sanitized):', {
            id: session.user.id,
            email: session.user.email,
            email_verified: session.user.email_verified,
            app_metadata: session.user.app_metadata,
            user_metadata: session.user.user_metadata,
            identities: session.user.identities?.map(identity => ({
              provider: identity.provider,
              identity_data_keys: identity.identity_data ? Object.keys(identity.identity_data) : []
            }))
          });

          // Try to get email from identities
          const microsoftIdentity = session.user.identities?.find(
            (identity: any) => identity.provider === 'azure'
          );
          
          if (microsoftIdentity?.identity_data?.email) {
            console.log('Found email in Microsoft identity data');
            // Note: We can't modify the session, but we can log this for debugging
          } else {
            console.error('No email found in Microsoft identity data either');
          }

          toast.error("Microsoft sign-in incomplete", {
            description: "We couldn't retrieve your email address. Please ensure your Microsoft account has email permissions enabled.",
            duration: 8000
          });

          // Log the OAuth error with detailed information
          await authErrorDetection.logAuthEvent({
            event_type: 'oauth_email_missing',
            provider,
            email: 'missing',
            success: false,
            error_code: 'email_not_provided',
            error_message: 'Microsoft OAuth did not provide user email',
            metadata: {
              user_id: userId,
              has_identities: !!session.user.identities,
              identity_count: session.user.identities?.length || 0,
              microsoft_identity_found: !!microsoftIdentity,
              app_metadata_keys: session.user.app_metadata ? Object.keys(session.user.app_metadata) : []
            }
          });

          return;
        }

        console.log('Microsoft OAuth: Email successfully received');
      }

      // Log successful OAuth sign-in
      await authErrorDetection.logAuthEvent({
        event_type: 'oauth_sign_in_success',
        provider,
        email: email || 'not_provided',
        success: true,
        metadata: {
          user_id: userId,
          email_verified: session.user.email_verified,
          provider_specific_data: provider === 'azure' ? 'microsoft_oauth' : 'other_oauth'
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

      // Success message with provider-specific text
      const providerName = provider === 'azure' ? 'Microsoft' : provider;
      toast.success(`Successfully signed in with ${providerName}`, {
        description: email ? `Welcome back, ${email}` : 'Welcome back!'
      });

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
