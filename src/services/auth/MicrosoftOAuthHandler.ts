
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PermissionValidator } from '@/services/security/PermissionValidator';

/**
 * Enhanced Microsoft OAuth handler with security improvements
 */
export class MicrosoftOAuthHandler {
  /**
   * Initiate Microsoft OAuth with enhanced security parameters
   */
  public async initiateOAuth(): Promise<void> {
    try {
      console.log('MicrosoftOAuthHandler: Starting Microsoft OAuth flow');
      
      // Log OAuth initiation
      await PermissionValidator.logSecurityEvent(
        'oauth_initiation',
        'auth',
        'system',
        {
          provider: 'microsoft',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 100)
        },
        'info'
      );

      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback`;
      
      console.log('MicrosoftOAuthHandler: Using callback URL:', callbackUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'consent',
            scope: 'openid email profile User.Read',
            response_type: 'code',
            response_mode: 'query'
          }
        },
      });

      if (error) {
        console.error('MicrosoftOAuthHandler: OAuth initiation error:', error);
        
        // Log OAuth failure
        await PermissionValidator.logSecurityEvent(
          'oauth_initiation_failure',
          'auth',
          'system',
          {
            provider: 'microsoft',
            error: error.message,
            timestamp: new Date().toISOString()
          },
          'error'
        );
        
        toast.error("Failed to initiate Microsoft sign-in", {
          description: error.message
        });
        throw error;
      }

      console.log('MicrosoftOAuthHandler: OAuth redirect initiated successfully');
    } catch (error) {
      console.error('MicrosoftOAuthHandler: Unexpected error:', error);
      toast.error("An unexpected error occurred during Microsoft sign-in");
      throw error;
    }
  }

  /**
   * Handle Microsoft OAuth callback with enhanced security validation
   */
  public async handleOAuthCallback(session: any): Promise<{
    success: boolean;
    requiresLinking?: boolean;
    error?: string;
  }> {
    try {
      if (!session?.user) {
        await PermissionValidator.logSecurityEvent(
          'oauth_callback_invalid',
          'auth',
          'system',
          {
            provider: 'microsoft',
            reason: 'No user in session',
            timestamp: new Date().toISOString()
          },
          'warning'
        );
        return { success: false, error: 'Invalid session data' };
      }

      const user = session.user;
      const email = user.email;
      const userId = user.id;

      console.log('MicrosoftOAuthHandler: Processing OAuth callback for user:', 
        userId ? `${userId.substring(0, 8)}...` : 'NO_ID');

      if (!email) {
        console.error('MicrosoftOAuthHandler: No email in Microsoft OAuth response');
        
        await PermissionValidator.logSecurityEvent(
          'oauth_callback_no_email',
          'auth',
          userId || 'unknown',
          {
            provider: 'microsoft',
            timestamp: new Date().toISOString(),
            userMetadata: user.user_metadata
          },
          'error'
        );

        toast.error("Microsoft sign-in failed", {
          description: "No email address was provided by Microsoft. Please ensure your Microsoft account has a verified email address."
        });
        return { success: false, error: 'No email provided' };
      }

      // Check for potential account linking scenarios
      const { data: existingUsers } = await supabase.rpc('get_user_by_email_safe', {
        email_param: email
      });

      if (existingUsers && existingUsers.length > 0) {
        const existingUserId = existingUsers[0].id;
        
        if (existingUserId !== userId) {
          console.log('MicrosoftOAuthHandler: Account linking may be required');
          
          await PermissionValidator.logSecurityEvent(
            'oauth_account_linking_detected',
            'auth',
            userId,
            {
              provider: 'microsoft',
              email: email.substring(0, 3) + '***',
              existingUserId: existingUserId.substring(0, 8) + '...',
              timestamp: new Date().toISOString()
            },
            'info'
          );

          toast.info("Account linking detected", {
            description: "We found an existing account with this email. Please use your original sign-in method or contact support."
          });
          return { success: false, requiresLinking: true };
        }
      }

      // Log successful OAuth callback
      await PermissionValidator.logSecurityEvent(
        'oauth_callback_success',
        'auth',
        userId,
        {
          provider: 'microsoft',
          email: email.substring(0, 3) + '***',
          timestamp: new Date().toISOString()
        },
        'info'
      );

      toast.success('Successfully signed in with Microsoft', {
        description: `Welcome back, ${email}`
      });

      return { success: true };
    } catch (error) {
      console.error('MicrosoftOAuthHandler: Callback processing error:', error);
      
      await PermissionValidator.logSecurityEvent(
        'oauth_callback_error',
        'auth',
        session?.user?.id || 'unknown',
        {
          provider: 'microsoft',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        },
        'error'
      );

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Create singleton instance
export const microsoftOAuthHandler = new MicrosoftOAuthHandler();
