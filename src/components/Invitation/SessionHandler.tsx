
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sessionManager } from '@/services/auth/SessionManager';

interface SessionHandlerProps {
  token: string | undefined;
  searchParams: URLSearchParams;
  waitingForAuth: boolean;
  setWaitingForAuth: (waiting: boolean) => void;
  sessionCheckAttempt: number;
  setSessionCheckAttempt: React.Dispatch<React.SetStateAction<number>>;
  setAuthVerified: (verified: boolean) => void;
}

export function SessionHandler({
  token,
  searchParams,
  waitingForAuth,
  setWaitingForAuth,
  sessionCheckAttempt,
  setSessionCheckAttempt,
  setAuthVerified
}: SessionHandlerProps) {
  const { user, isLoading: authLoading } = useAuth();

  // Save invitation details to session storage when not authenticated
  useEffect(() => {
    if (!user && !authLoading && token) {
      // Save the invitation path for redirection after login
      const invitationPath = `/invitation/${token}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      sessionStorage.setItem('invitationPath', invitationPath);
      console.log('Saved invitation path for after login:', invitationPath);
    }
  }, [user, authLoading, token, searchParams]);

  // Check session validity periodically with exponential backoff when waiting for auth
  useEffect(() => {
    if (waitingForAuth && sessionCheckAttempt < 5) {
      const delay = Math.min(2000 * Math.pow(2, sessionCheckAttempt), 16000); // Exponential backoff with 16s max
      console.log(`Scheduling session check attempt ${sessionCheckAttempt + 1} in ${delay}ms`);
      
      const checkSessionTimeout = setTimeout(async () => {
        // Use our new sessionManager to check for a session
        const isValid = await sessionManager.checkSession();
        setSessionCheckAttempt(prev => prev + 1);
        
        if (isValid) {
          console.log('Session detected - can proceed with invitation');
          setWaitingForAuth(false);
          setAuthVerified(true);
        }
      }, delay);
      
      return () => clearTimeout(checkSessionTimeout);
    }
  }, [waitingForAuth, sessionCheckAttempt, setSessionCheckAttempt, setWaitingForAuth, setAuthVerified]);

  return null;
}
