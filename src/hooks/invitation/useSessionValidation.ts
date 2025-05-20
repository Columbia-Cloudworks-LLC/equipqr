
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function useSessionValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  const ensureValidSession = useCallback(async () => {
    try {
      setIsValidating(true);
      
      // Check if we have a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session validation error:', sessionError);
        return false;
      }
      
      if (!sessionData?.session) {
        console.log('No active session found, redirecting to login');
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Unexpected error during session validation:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [navigate]);
  
  return {
    ensureValidSession,
    isValidating
  };
}
