
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Enhanced error detection for authentication issues
 */
export class AuthErrorDetection {
  /**
   * Log authentication events to the database
   */
  public async logAuthEvent(eventData: {
    event_type: string;
    provider: string;
    email: string;
    success: boolean;
    error_code?: string;
    error_message?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('auth_events')
        .insert({
          ...eventData,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
        });

      if (error) {
        console.error('Failed to log auth event:', error);
      }
    } catch (error) {
      console.error('Error logging auth event:', error);
    }
  }

  /**
   * Check for duplicate email during signup
   */
  public async checkDuplicateEmail(email: string, provider: string = 'email'): Promise<{
    has_duplicate: boolean;
    existing_user_id?: string;
    existing_providers?: string[];
    can_link?: boolean;
  }> {
    try {
      const { data, error } = await supabase.rpc('check_duplicate_email_signup', {
        p_email: email,
        p_provider: provider
      });

      if (error) {
        console.error('Error checking duplicate email:', error);
        return { has_duplicate: false };
      }

      return data;
    } catch (error) {
      console.error('Error in duplicate email check:', error);
      return { has_duplicate: false };
    }
  }

  /**
   * Handle authentication errors with enhanced messaging
   */
  public handleAuthError(error: any, context: {
    email?: string;
    provider?: string;
    action?: string;
  }): void {
    const { email, provider = 'email', action = 'authentication' } = context;

    // Log the error event
    if (email) {
      this.logAuthEvent({
        event_type: `${action}_error`,
        provider,
        email,
        success: false,
        error_code: error.message,
        error_message: error.message,
        metadata: { context }
      });
    }

    // Provide user-friendly error messages
    let userMessage = 'An authentication error occurred.';
    let description = error.message;

    if (error.message?.includes('Email not confirmed')) {
      userMessage = 'Email verification required';
      description = 'Please check your email and click the verification link before signing in.';
    } else if (error.message?.includes('Invalid login credentials')) {
      userMessage = 'Invalid credentials';
      description = 'The email or password you entered is incorrect. Please try again.';
    } else if (error.message?.includes('User already registered')) {
      userMessage = 'Account already exists';
      description = `An account with this email already exists. Try signing in instead, or use a different authentication method.`;
    } else if (error.message?.includes('Email rate limit exceeded')) {
      userMessage = 'Too many requests';
      description = 'Please wait a few minutes before trying again.';
    } else if (error.message?.includes('Password should be at least')) {
      userMessage = 'Password too weak';
      description = 'Password must be at least 6 characters long.';
    }

    toast.error(userMessage, { description });
  }

  /**
   * Get client IP address (approximate)
   */
  private async getClientIP(): Promise<string | null> {
    try {
      // This is a basic implementation - in production you might want to use a service
      return null; // Will be null for now
    } catch {
      return null;
    }
  }

  /**
   * Analyze authentication patterns for suspicious activity
   */
  public async analyzeAuthPatterns(email: string): Promise<{
    suspicious: boolean;
    reason?: string;
    recent_failures: number;
  }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentEvents, error } = await supabase
        .from('auth_events')
        .select('*')
        .eq('email', email)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error analyzing auth patterns:', error);
        return { suspicious: false, recent_failures: 0 };
      }

      const failures = recentEvents?.filter(event => !event.success) || [];
      const recent_failures = failures.length;

      // Flag as suspicious if more than 5 failed attempts in the last hour
      const suspicious = recent_failures > 5;
      const reason = suspicious ? 'Multiple failed authentication attempts' : undefined;

      return {
        suspicious,
        reason,
        recent_failures
      };
    } catch (error) {
      console.error('Error in auth pattern analysis:', error);
      return { suspicious: false, recent_failures: 0 };
    }
  }
}

// Create singleton instance
export const authErrorDetection = new AuthErrorDetection();
