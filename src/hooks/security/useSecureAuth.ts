
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthRateLimit } from '@/services/security/AuthRateLimit';
import { SecurityAudit } from '@/services/security/SecurityAudit';
import { InputValidation } from '@/services/security/InputValidation';
import { toast } from 'sonner';

/**
 * Enhanced authentication hook with security features
 */
export function useSecureAuth() {
  const auth = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);

  const secureSignIn = useCallback(async (email: string, password: string) => {
    // Validate email format
    if (!InputValidation.validateEmail(email)) {
      toast.error('Invalid email format');
      return;
    }

    // Check rate limiting
    const isAllowed = await AuthRateLimit.checkRateLimit(email, 'login');
    if (!isAllowed) {
      setIsBlocked(true);
      await SecurityAudit.logAuthEvent('login_failure', email, { reason: 'rate_limited' });
      return;
    }

    try {
      await SecurityAudit.logAuthEvent('login_attempt', email);
      const result = await auth.signIn(email, password);
      
      if (result) {
        await SecurityAudit.logAuthEvent('login_success', email);
        setIsBlocked(false);
      }
      
      return result;
    } catch (error) {
      await SecurityAudit.logAuthEvent('login_failure', email, { 
        reason: error instanceof Error ? error.message : 'unknown_error'
      });
      throw error;
    }
  }, [auth]);

  const secureSignUp = useCallback(async (email: string, password: string, userData?: any) => {
    // Validate email format
    if (!InputValidation.validateEmail(email)) {
      toast.error('Invalid email format');
      return;
    }

    // Check rate limiting
    const isAllowed = await AuthRateLimit.checkRateLimit(email, 'signup');
    if (!isAllowed) {
      setIsBlocked(true);
      return;
    }

    try {
      await auth.signUp(email, password, userData);
      await SecurityAudit.logAuthEvent('signup_success', email);
      setIsBlocked(false);
    } catch (error) {
      await SecurityAudit.logAuthEvent('signup_failure', email, { 
        reason: error instanceof Error ? error.message : 'unknown_error'
      });
      throw error;
    }
  }, [auth]);

  const secureSignOut = useCallback(async () => {
    try {
      await SecurityAudit.logAuthEvent('logout');
      await auth.signOut();
    } catch (error) {
      console.error('Secure sign out error:', error);
      throw error;
    }
  }, [auth]);

  return {
    ...auth,
    signIn: secureSignIn,
    signUp: secureSignUp,
    signOut: secureSignOut,
    isBlocked
  };
}
