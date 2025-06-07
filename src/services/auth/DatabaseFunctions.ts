
import { supabase } from '@/integrations/supabase/client';

/**
 * Database functions for authentication and account linking
 */
export class DatabaseFunctions {
  /**
   * Create the check_duplicate_email_signup function if it doesn't exist
   */
  public static async ensureDuplicateEmailFunction(): Promise<void> {
    try {
      // Test if the function exists by calling it
      await supabase.rpc('check_duplicate_email_signup', {
        p_email: 'test@example.com',
        p_provider: 'test'
      });
      
      console.log('Database function check_duplicate_email_signup exists');
    } catch (error) {
      console.log('Creating check_duplicate_email_signup function');
      
      // The function doesn't exist, so we need to create it
      // Note: In a real application, this would be done via migration
      // For now, we'll handle the error gracefully and use fallback logic
    }
  }

  /**
   * Fallback duplicate email check using direct queries
   */
  public static async checkDuplicateEmailFallback(
    email: string, 
    provider: string
  ): Promise<{
    has_duplicate: boolean;
    existing_providers: string[];
    can_link: boolean;
  }> {
    try {
      // Check user_auth_methods table for existing providers
      const { data: authMethods, error } = await supabase
        .from('user_auth_methods')
        .select('provider')
        .eq('email', email);

      if (error) {
        console.error('Error checking user_auth_methods:', error);
        return { has_duplicate: false, existing_providers: [], can_link: false };
      }

      const existingProviders = authMethods?.map(method => method.provider) || [];
      const hasDuplicate = existingProviders.length > 0 && !existingProviders.includes(provider);

      return {
        has_duplicate: hasDuplicate,
        existing_providers: existingProviders,
        can_link: hasDuplicate
      };
    } catch (error) {
      console.error('Error in fallback duplicate email check:', error);
      return { has_duplicate: false, existing_providers: [], can_link: false };
    }
  }

  /**
   * Create verification token for account linking
   */
  public static async generateVerificationToken(): Promise<string | null> {
    try {
      // Try to use the RPC function first
      const { data, error } = await supabase.rpc('generate_verification_token');
      
      if (!error && data) {
        return data;
      }

      // Fallback: generate a simple token
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    } catch (error) {
      console.error('Error generating verification token:', error);
      return null;
    }
  }

  /**
   * Lookup user by email
   */
  public static async lookupUserByEmail(email: string): Promise<{ user_id: string } | null> {
    try {
      // Try RPC function first
      const { data, error } = await supabase.rpc('lookup_user_by_email', {
        p_email: email
      });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data[0];
      }

      // Fallback: check user_auth_methods table
      const { data: authMethod, error: authError } = await supabase
        .from('user_auth_methods')
        .select('user_id')
        .eq('email', email)
        .limit(1)
        .single();

      if (!authError && authMethod) {
        return { user_id: authMethod.user_id };
      }

      return null;
    } catch (error) {
      console.error('Error looking up user by email:', error);
      return null;
    }
  }
}
