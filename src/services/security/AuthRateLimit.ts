
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Client-side authentication rate limiting utility
 */
export class AuthRateLimit {
  /**
   * Check if authentication attempt is allowed
   */
  static async checkRateLimit(
    identifier: string,
    attemptType: 'login' | 'signup' | 'reset',
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_attempt_type: attemptType,
        p_max_attempts: maxAttempts,
        p_window_minutes: windowMinutes
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the attempt but log it
        return true;
      }

      if (!data) {
        toast.error('Too many attempts', {
          description: `Please wait ${windowMinutes} minutes before trying again.`
        });
        return false;
      }

      return data;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // On error, allow the attempt
      return true;
    }
  }

  /**
   * Get client IP for rate limiting (approximate)
   */
  static async getClientIP(): Promise<string> {
    try {
      // In a real implementation, you might use a service like ipapi.co
      // For now, return a placeholder
      return 'client_ip';
    } catch {
      return 'unknown_ip';
    }
  }
}
