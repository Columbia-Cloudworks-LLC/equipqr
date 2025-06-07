
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseFunctions } from './DatabaseFunctions';

/**
 * Service for handling account linking between different authentication methods
 */
export class AccountLinkingService {
  /**
   * Create an account linking request
   */
  public async createLinkRequest(
    existingEmail: string,
    newProvider: string,
    newProviderEmail: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Use enhanced database functions
      const userLookupResult = await DatabaseFunctions.lookupUserByEmail(existingEmail);
      
      if (!userLookupResult) {
        return { success: false, error: 'Existing user not found' };
      }

      const existingUserId = userLookupResult.user_id;

      // Generate verification token
      const token = await DatabaseFunctions.generateVerificationToken();
      
      if (!token) {
        return { success: false, error: 'Failed to generate verification token' };
      }

      // Create the link request
      const { data, error } = await supabase
        .from('account_link_requests')
        .insert({
          existing_user_id: existingUserId,
          new_provider: newProvider,
          new_provider_email: newProviderEmail,
          verification_token: token,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating link request:', error);
        return { success: false, error: 'Failed to create link request' };
      }

      return { success: true, token };
    } catch (error) {
      console.error('Error in createLinkRequest:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Verify and complete account linking
   */
  public async completeLinking(
    token: string,
    newUserSession: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the link request
      const { data: linkRequest, error: requestError } = await supabase
        .from('account_link_requests')
        .select('*')
        .eq('verification_token', token)
        .eq('status', 'pending')
        .single();

      if (requestError || !linkRequest) {
        return { success: false, error: 'Invalid or expired link request' };
      }

      // Check if request has expired
      if (new Date(linkRequest.expires_at) < new Date()) {
        // Mark as expired
        await supabase
          .from('account_link_requests')
          .update({ status: 'expired' })
          .eq('id', linkRequest.id);
        
        return { success: false, error: 'Link request has expired' };
      }

      // Create auth method record for the existing user
      const { error: authMethodError } = await supabase
        .from('user_auth_methods')
        .insert({
          user_id: linkRequest.existing_user_id,
          provider: linkRequest.new_provider,
          provider_id: newUserSession.user.id,
          email: linkRequest.new_provider_email,
          is_primary: false,
          verified_at: new Date().toISOString()
        });

      if (authMethodError) {
        console.error('Error creating auth method:', authMethodError);
        return { success: false, error: 'Failed to link account' };
      }

      // Mark the link request as completed
      await supabase
        .from('account_link_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', linkRequest.id);

      // Delete the temporary user account (the new one that was just created)
      try {
        await supabase.auth.admin.deleteUser(newUserSession.user.id);
      } catch (deleteError) {
        console.warn('Failed to delete temporary user account:', deleteError);
        // Don't fail the entire operation if we can't delete the temp account
      }

      return { success: true };
    } catch (error) {
      console.error('Error completing account linking:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get authentication methods for a user
   */
  public async getUserAuthMethods(userId: string): Promise<Array<{
    id: string;
    provider: string;
    email: string;
    is_primary: boolean;
    verified_at: string | null;
    last_used_at: string | null;
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_auth_methods')
        .select('id, provider, email, is_primary, verified_at, last_used_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching user auth methods:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserAuthMethods:', error);
      return [];
    }
  }

  /**
   * Update last used timestamp for an auth method
   */
  public async updateLastUsed(userId: string, provider: string): Promise<void> {
    try {
      await supabase
        .from('user_auth_methods')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('provider', provider);
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  }

  /**
   * Handle account linking flow from OAuth providers
   */
  public async handleOAuthLinking(
    provider: string,
    session: any,
    existingEmail?: string
  ): Promise<{ requiresLinking: boolean; linkToken?: string }> {
    if (!existingEmail) {
      return { requiresLinking: false };
    }

    try {
      // Use enhanced duplicate checking
      let duplicateResult;
      
      try {
        // Try RPC function first
        const { data: duplicateCheckData, error: duplicateError } = await supabase.rpc('check_duplicate_email_signup', {
          p_email: session.user.email,
          p_provider: provider
        });

        if (duplicateError) {
          throw duplicateError;
        }
        
        duplicateResult = duplicateCheckData as any;
      } catch (rpcError) {
        console.log('RPC function not available, using fallback');
        // Use fallback method
        duplicateResult = await DatabaseFunctions.checkDuplicateEmailFallback(
          session.user.email,
          provider
        );
      }
      
      if (duplicateResult?.has_duplicate && duplicateResult?.can_link) {
        // Create a link request
        const linkResult = await this.createLinkRequest(
          existingEmail,
          provider,
          session.user.email
        );

        if (linkResult.success) {
          toast.info('Account Linking Required', {
            description: 'We found an existing account with this email. Check your email for linking instructions.'
          });

          return { 
            requiresLinking: true, 
            linkToken: linkResult.token 
          };
        }
      }

      return { requiresLinking: false };
    } catch (error) {
      console.error('Error in OAuth linking flow:', error);
      return { requiresLinking: false };
    }
  }

  /**
   * Remove an authentication method (except primary)
   */
  public async removeAuthMethod(authMethodId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if this is the primary method
      const { data: authMethod, error: fetchError } = await supabase
        .from('user_auth_methods')
        .select('is_primary')
        .eq('id', authMethodId)
        .single();

      if (fetchError) {
        return { success: false, error: 'Auth method not found' };
      }

      if (authMethod.is_primary) {
        return { success: false, error: 'Cannot remove primary authentication method' };
      }

      // Remove the auth method
      const { error } = await supabase
        .from('user_auth_methods')
        .delete()
        .eq('id', authMethodId);

      if (error) {
        return { success: false, error: 'Failed to remove authentication method' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing auth method:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

// Create singleton instance
export const accountLinkingService = new AccountLinkingService();
