import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PermissionValidator } from '@/services/security/PermissionValidator';

/**
 * Enhanced account linking service with security improvements
 */
export class AccountLinkingService {
  /**
   * Handle OAuth account linking with enhanced security
   */
  public async handleOAuthLinking(
    provider: string,
    session: any,
    email: string
  ): Promise<{ success: boolean; requiresLinking: boolean; error?: string }> {
    try {
      console.log('AccountLinkingService: Checking for existing accounts with email:', 
        email.substring(0, 3) + '***');

      // Check for existing users with this email
      const { data: existingUsers, error: queryError } = await supabase.rpc(
        'get_user_by_email_safe',
        { email_param: email }
      );

      if (queryError) {
        console.error('AccountLinkingService: Error checking existing users:', queryError);
        
        await PermissionValidator.logSecurityEvent(
          'account_linking_check_failed',
          'auth',
          session.user?.id || 'unknown',
          {
            provider,
            email: email.substring(0, 3) + '***',
            error: queryError.message,
            timestamp: new Date().toISOString()
          },
          'error'
        );

        return { success: false, requiresLinking: false, error: 'Account verification failed' };
      }

      if (!existingUsers || existingUsers.length === 0) {
        // No existing account, proceed normally
        console.log('AccountLinkingService: No existing account found, proceeding');
        return { success: true, requiresLinking: false };
      }

      const existingUser = existingUsers[0];
      const currentUserId = session.user.id;

      // If the existing user ID matches current user ID, no linking needed
      if (existingUser.id === currentUserId) {
        console.log('AccountLinkingService: User IDs match, no linking needed');
        return { success: true, requiresLinking: false };
      }

      // Different user IDs - potential account linking scenario
      console.log('AccountLinkingService: Different user IDs detected, account linking required');
      
      await PermissionValidator.logSecurityEvent(
        'account_linking_required',
        'auth',
        currentUserId,
        {
          provider,
          email: email.substring(0, 3) + '***',
          existingUserId: existingUser.id.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        },
        'warning'
      );

      // Show user-friendly message about account linking
      toast.warning("Account already exists", {
        description: `An account with ${email} already exists. Please sign in with your original method or contact support for account linking.`
      });

      return { success: false, requiresLinking: true };
    } catch (error) {
      console.error('AccountLinkingService: Unexpected error:', error);
      
      await PermissionValidator.logSecurityEvent(
        'account_linking_error',
        'auth',
        session?.user?.id || 'unknown',
        {
          provider,
          email: email.substring(0, 3) + '***',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        },
        'error'
      );

      return { success: false, requiresLinking: false, error: 'Account linking check failed' };
    }
  }

  /**
   * Update last used timestamp for authentication method
   */
  public async updateLastUsed(userId: string, provider: string): Promise<void> {
    try {
      // Note: This assumes we have an auth_methods table or similar
      // For now, we'll just log this activity since the table structure isn't clear
      console.log('AccountLinkingService: Would update last used timestamp for provider:', provider);
      
      await PermissionValidator.logSecurityEvent(
        'auth_method_used',
        'auth',
        userId,
        {
          provider,
          timestamp: new Date().toISOString()
        },
        'info'
      );
    } catch (error) {
      console.error('AccountLinkingService: Unexpected error updating last used:', error);
    }
  }

  /**
   * Check for potential duplicate email during signup
   */
  public async checkDuplicateEmail(email: string, provider: string = 'email'): Promise<{
    hasDuplicate: boolean;
    existingUserId?: string;
    canLink?: boolean;
  }> {
    try {
      console.log('AccountLinkingService: Checking for duplicate email during signup');

      const { data: existingUsers } = await supabase.rpc('get_user_by_email_safe', {
        email_param: email
      });

      if (!existingUsers || existingUsers.length === 0) {
        return { hasDuplicate: false };
      }

      const existingUser = existingUsers[0];
      
      await PermissionValidator.logSecurityEvent(
        'signup_duplicate_email_detected',
        'auth',
        'system',
        {
          email: email.substring(0, 3) + '***',
          provider,
          existingUserId: existingUser.id.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        },
        'info'
      );

      return {
        hasDuplicate: true,
        existingUserId: existingUser.id,
        canLink: true // Can potentially be linked
      };
    } catch (error) {
      console.error('AccountLinkingService: Error checking duplicate email:', error);
      return { hasDuplicate: false };
    }
  }
}

// Create singleton instance
export const accountLinkingService = new AccountLinkingService();
