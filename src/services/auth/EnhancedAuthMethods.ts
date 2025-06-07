
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
      console.log('EnhancedAuthMethods: Email sign-in attempt for:', email.substring(0, 3) + '***');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('EnhancedAuthMethods: Email sign-in error:', error);
        authErrorDetection.handleAuthError(error, {
          email,
          provider: 'email',
          action: 'sign_in'
        });
        throw error;
      }

      console.log('EnhancedAuthMethods: Email sign-in successful');
      toast.success("Successfully signed in");
      return data.session;
    } catch (error) {
      console.error('EnhancedAuthMethods: Enhanced sign-in error:', error);
      throw error;
    }
  }

  /**
   * Enhanced OAuth sign-in with improved provider handling
   */
  public async signInWithProvider(provider: 'google' | 'azure'): Promise<void> {
    try {
      console.log(`EnhancedAuthMethods: Starting ${provider} OAuth sign-in`);
      
      // Special handling for Microsoft OAuth
      if (provider === 'azure') {
        return await microsoftOAuthHandler.initiateOAuth();
      }

      // Google OAuth handling
      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback`;
      
      console.log(`EnhancedAuthMethods: Google OAuth using callback URL:`, callbackUrl);
      
      const oauthOptions = {
        redirectTo: callbackUrl,
        queryParams: {
          prompt: 'select_account',
          scope: 'openid email profile',
          access_type: 'offline'
        }
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
      });

      if (error) {
        console.error(`EnhancedAuthMethods: ${provider} sign-in error:`, error);
        authErrorDetection.handleAuthError(error, {
          provider,
          action: 'oauth_sign_in'
        });
        throw error;
      }

      console.log(`EnhancedAuthMethods: ${provider} OAuth redirect initiated successfully`);
    } catch (error) {
      console.error(`EnhancedAuthMethods: Unexpected error during ${provider} sign-in:`, error);
      toast.error("An unexpected error occurred during sign-in");
      throw error;
    }
  }

  /**
   * Enhanced sign up with duplicate detection
   */
  public async signUp(email: string, password: string, userData?: any): Promise<void> {
    try {
      console.log('EnhancedAuthMethods: Sign-up attempt for:', email.substring(0, 3) + '***');

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        console.error('EnhancedAuthMethods: Sign-up error:', error);
        authErrorDetection.handleAuthError(error, {
          email,
          provider: 'email',
          action: 'sign_up'
        });
        throw error;
      }
      
      console.log('EnhancedAuthMethods: Sign-up successful');
      toast.success("Account created successfully", {
        description: "Please check your email for verification instructions"
      });
    } catch (error) {
      console.error('EnhancedAuthMethods: Enhanced sign-up error:', error);
      throw error;
    }
  }

  /**
   * Enhanced password reset with better tracking
   */
  public async resetPassword(email: string): Promise<void> {
    try {
      console.log('EnhancedAuthMethods: Password reset for:', email.substring(0, 3) + '***');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('EnhancedAuthMethods: Password reset error:', error);
        authErrorDetection.handleAuthError(error, {
          email,
          provider: 'email',
          action: 'password_reset'
        });
        throw error;
      }
      
      console.log('EnhancedAuthMethods: Password reset email sent successfully');
      toast.success("Password reset email sent");
    } catch (error) {
      console.error('EnhancedAuthMethods: Enhanced password reset error:', error);
      throw error;
    }
  }

  /**
   * Improved OAuth callback handler with proper provider detection
   */
  public async handleOAuthCallback(session: any): Promise<void> {
    if (!session?.user) {
      console.warn('EnhancedAuthMethods: OAuth callback received without user session');
      return;
    }

    try {
      // Proper provider detection from multiple sources
      const provider = this.detectProvider(session);
      const email = session.user.email;
      const userId = session.user.id;

      console.log('EnhancedAuthMethods: OAuth callback details:', {
        provider,
        email: email ? `${email.substring(0, 3)}***` : 'NO EMAIL',
        userId: userId ? `${userId.substring(0, 8)}...` : 'NO USER ID',
        hasAppMetadata: !!session.user.app_metadata,
        appMetadataProvider: session.user.app_metadata?.provider,
        identitiesCount: session.user.identities?.length || 0,
        firstIdentityProvider: session.user.identities?.[0]?.provider
      });

      // Handle Microsoft OAuth
      if (provider === 'azure') {
        console.log('EnhancedAuthMethods: Handling Microsoft OAuth callback');
        const result = await microsoftOAuthHandler.handleOAuthCallback(session);
        
        if (!result.success) {
          if (result.requiresLinking) {
            console.log('EnhancedAuthMethods: Microsoft OAuth requires account linking');
            return;
          }
          console.error('EnhancedAuthMethods: Microsoft OAuth callback failed');
          return;
        }
        
        console.log('EnhancedAuthMethods: Microsoft OAuth callback successful');
        return;
      }

      // Handle Google OAuth
      if (provider === 'google') {
        console.log('EnhancedAuthMethods: Handling Google OAuth callback');
        
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
            console.log('EnhancedAuthMethods: Google OAuth requires account linking');
            return;
          }
        }

        toast.success('Successfully signed in with Google', {
          description: email ? `Welcome back, ${email}` : 'Welcome back!'
        });
        
        console.log('EnhancedAuthMethods: Google OAuth callback successful');
        return;
      }

      // Handle unknown provider
      console.warn('EnhancedAuthMethods: Unknown OAuth provider:', provider);
      toast.success('Successfully signed in', {
        description: email ? `Welcome back, ${email}` : 'Welcome back!'
      });

    } catch (error) {
      console.error('EnhancedAuthMethods: Error handling OAuth callback:', error);
      
      toast.error("Authentication processing failed", {
        description: "There was an issue completing your sign-in. Please try again."
      });
    }
  }

  /**
   * Detect the OAuth provider from session data
   */
  private detectProvider(session: any): string {
    // Check app_metadata first (most reliable)
    if (session.user.app_metadata?.provider) {
      const provider = session.user.app_metadata.provider;
      console.log('EnhancedAuthMethods: Provider from app_metadata:', provider);
      return provider;
    }

    // Check identities array
    if (session.user.identities && session.user.identities.length > 0) {
      const provider = session.user.identities[0].provider;
      console.log('EnhancedAuthMethods: Provider from identities:', provider);
      return provider;
    }

    // Check the email domain as a fallback for Microsoft
    if (session.user.email) {
      const email = session.user.email.toLowerCase();
      if (email.includes('@outlook.') || email.includes('@hotmail.') || email.includes('@live.')) {
        console.log('EnhancedAuthMethods: Provider detected from email domain: azure');
        return 'azure';
      }
      if (email.includes('@gmail.')) {
        console.log('EnhancedAuthMethods: Provider detected from email domain: google');
        return 'google';
      }
    }

    console.warn('EnhancedAuthMethods: Could not detect provider, defaulting to unknown');
    return 'unknown';
  }
}

// Create singleton instance
export const enhancedAuthMethods = new EnhancedAuthMethods();
