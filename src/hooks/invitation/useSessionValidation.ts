import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for validating session before proceeding with invitation operations
 */
export function useSessionValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { session, checkSession } = useAuth();

  useEffect(() => {
    const validateSession = async () => {
      await checkSession();
    };
    
    validateSession();
  }, [checkSession]);

  const ensureValidSession = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    setValidationError(null);
    
    try {
      // Check if we already have a valid session
      if (session?.user) {
        return true;
      }
      
      // Otherwise, explicitly check session status
      console.log("Ensuring valid session before proceeding with invitation acceptance");
      const isValid = await checkSession();
      
      if (!isValid) {
        console.error("No valid session available for invitation acceptance");
        throw new Error('Authentication required. Please login and try again.');
      }
      
      // Double check we have a session now
      const { data: sessionData } = await supabase.auth.getSession();
      return !!sessionData?.session;
    } catch (error: any) {
      console.error("Session validation error:", error);
      setValidationError(error.message || 'Authentication error');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [session, checkSession]);

  return {
    ensureValidSession,
    isValidating,
    validationError,
    currentSession: session
  };
}
