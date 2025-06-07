
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { accountLinkingService } from './AccountLinkingService';

/**
 * Specialized handler for Microsoft OAuth authentication flows
 */
export class MicrosoftOAuthHandler {
  /**
   * Check if email already exists and handle account linking
   */
  public async handlePreAuthConflict(email: string): Promise<{
    shouldProceed: boolean;
    requiresLinking: boolean;
    existingProviders?: string[];
  }> {
    try {
      console.log('MicrosoftOAuthHandler: Checking for email conflicts:', email);
      
      // Check if email exists with different providers
      const { data: duplicateCheck, error } = await supabase.rpc('check_duplicate_email_signup', {
        p_email: email,
        p_provider: 'azure'
      });

      if (error) {
        console.error('Error checking duplicate email:', error);
        return { shouldProceed: true, requiresLinking: false };
      }

      const result = duplicateCheck as any;
      
      if (result?.has_duplicate) {
        console.log('Microsoft OAuth: Email conflict detected');
        const providers = result.existing_providers || [];
        
        toast.info('Account Found', {
          description: `An account with this email already exists using ${providers.join(', ')}. Attempting to link accounts...`,
          duration: 5000
        });
        
        return {
          shouldProceed: false,
          requiresLinking: true,
          existingProviders: providers
        };
      }

      return { shouldProceed: true, requiresLinking: false };
    } catch (error) {
      console.error('Error in pre-auth conflict check:', error);
      return { shouldProceed: true, requiresLinking: false };
    }
  }

  /**
   * Handle Microsoft OAuth callback with enhanced email validation
   */
  public async handleOAuthCallback(session: Session): Promise<{
    success: boolean;
    requiresLinking?: boolean;
    linkToken?: string;
  }> {
    if (!session?.user) {
      console.error('Microsoft OAuth: No user in session');
      return { success: false };
    }

    const user = session.user;
    const email = user.email;
    
    console.log('Microsoft OAuth callback:', {
      userId: user.id,
      email: email ? `${email.substring(0, 3)}***` : 'NO EMAIL',
      provider: user.app_metadata?.provider,
      hasIdentities: !!user.identities,
      identityCount: user.identities?.length || 0
    });

    // Check if we got email from Microsoft
    if (!email) {
      console.error('Microsoft OAuth: No email provided');
      
      // Try to extract email from identities
      const microsoftIdentity = user.identities?.find(
        identity => identity.provider === 'azure'
      );
      
      if (microsoftIdentity?.identity_data?.email) {
        console.log('Found email in Microsoft identity data');
      } else {
        toast.error('Microsoft Sign-in Issue', {
          description: 'Your Microsoft account did not provide an email address. Please ensure your account has email permissions enabled.',
          duration: 8000
        });
        return { success: false };
      }
    }

    // Check for account linking needs
    try {
      const linkingResult = await accountLinkingService.handleOAuthLinking(
        'azure',
        session,
        email
      );

      if (linkingResult.requiresLinking) {
        return {
          success: false,
          requiresLinking: true,
          linkToken: linkingResult.linkToken
        };
      }

      // Success case
      toast.success('Microsoft Sign-in Successful', {
        description: `Welcome back, ${email}!`
      });

      return { success: true };
    } catch (error) {
      console.error('Error handling Microsoft OAuth callback:', error);
      
      toast.error('Sign-in Error', {
        description: 'There was an issue processing your Microsoft sign-in. Please try again.'
      });
      
      return { success: false };
    }
  }

  /**
   * Enhanced Microsoft OAuth initiation with proper scopes
   */
  public async initiateOAuth(): Promise<void> {
    try {
      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback`;
      
      console.log('Microsoft OAuth: Initiating with enhanced configuration');
      console.log('Callback URL:', callbackUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            // Force consent to ensure we get email permission
            prompt: 'consent',
            // Explicitly request necessary scopes
            scope: 'openid email profile User.Read',
            // Ensure proper response handling
            response_type: 'code',
            response_mode: 'query'
          }
        }
      });

      if (error) {
        console.error('Microsoft OAuth initiation error:', error);
        toast.error('Microsoft Sign-in Failed', {
          description: error.message
        });
        throw error;
      }

      console.log('Microsoft OAuth: Redirect initiated successfully');
    } catch (error) {
      console.error('Unexpected error during Microsoft OAuth initiation:', error);
      toast.error('Sign-in Error', {
        description: 'An unexpected error occurred. Please try again.'
      });
      throw error;
    }
  }
}

// Create singleton instance
export const microsoftOAuthHandler = new MicrosoftOAuthHandler();
