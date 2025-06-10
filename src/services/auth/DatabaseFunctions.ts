
import { supabase } from '@/integrations/supabase/client';

/**
 * Database functions service to ensure required functions exist
 */
export class DatabaseFunctions {
  /**
   * Ensure the duplicate email check function exists
   */
  public static async ensureDuplicateEmailFunction(): Promise<void> {
    try {
      // Test if the function exists by calling it with a safe email
      const { error } = await supabase.rpc('get_user_by_email_safe', {
        email_param: 'test@example.com'
      });

      // If function doesn't exist, we'll get a specific error
      if (error && error.message.includes('function')) {
        console.warn('DatabaseFunctions: get_user_by_email_safe function may not exist');
      } else {
        console.log('DatabaseFunctions: get_user_by_email_safe function is available');
      }
    } catch (error) {
      console.error('DatabaseFunctions: Error checking duplicate email function:', error);
    }
  }

  /**
   * Test enhanced rate limiting function
   */
  public static async testRateLimitFunction(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_enhanced_rate_limit', {
        p_identifier: 'test_user',
        p_attempt_type: 'test',
        p_max_attempts: 5,
        p_window_minutes: 15
      });

      if (error) {
        console.error('DatabaseFunctions: Rate limit function test failed:', error);
        return false;
      }

      console.log('DatabaseFunctions: Rate limit function is working:', data);
      return true;
    } catch (error) {
      console.error('DatabaseFunctions: Rate limit function test error:', error);
      return false;
    }
  }

  /**
   * Test security event logging function
   */
  public static async testSecurityEventLogging(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('log_security_event_enhanced', {
        p_event_type: 'test_event',
        p_entity_type: 'test',
        p_entity_id: '00000000-0000-0000-0000-000000000000',
        p_details: JSON.stringify({ test: true }),
        p_severity: 'info'
      });

      if (error) {
        console.error('DatabaseFunctions: Security event logging test failed:', error);
        return false;
      }

      console.log('DatabaseFunctions: Security event logging function is working');
      return true;
    } catch (error) {
      console.error('DatabaseFunctions: Security event logging test error:', error);
      return false;
    }
  }
}
