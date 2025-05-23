
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sessionManager } from '@/services/auth/SessionManager';
import { debounce } from '@/utils/edgeFunctions/retry';

interface SessionHandlerProps {
  token: string | undefined;
  searchParams: URLSearchParams;
  waitingForAuth: boolean;
  setWaitingForAuth: (waiting: boolean) => void;
  sessionCheckAttempt: number;
  setSessionCheckAttempt: React.Dispatch<React.SetStateAction<number>>;
  setAuthVerified: (verified: boolean) => void;
}

// Create a debounced session check function
const debouncedSessionCheck = debounce(async () => {
  return await sessionManager.checkSession();
}, 1000);

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
  const [checkingSession, setCheckingSession] = useState(false);

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
    if (waitingForAuth && sessionCheckAttempt < 5 && !checkingSession) {
      const delay = Math.min(1000 * Math.pow(2, sessionCheckAttempt), 16000); // Exponential backoff with 16s max
      console.log(`Scheduling session check attempt ${sessionCheckAttempt + 1} in ${delay}ms`);
      
      const checkSessionTimeout = setTimeout(async () => {
        try {
          setCheckingSession(true);
          
          // Use our debounced session check to prevent rate limits
          const isValid = await debouncedSessionCheck();
          setSessionCheckAttempt(prev => prev + 1);
          
          if (isValid) {
            console.log('Session detected - can proceed with invitation');
            setWaitingForAuth(false);
            setAuthVerified(true);
          }
        } catch (error) {
          console.error('Error checking session:', error);
        } finally {
          setCheckingSession(false);
        }
      }, delay);
      
      return () => clearTimeout(checkSessionTimeout);
    }
  }, [waitingForAuth, sessionCheckAttempt, setSessionCheckAttempt, setWaitingForAuth, setAuthVerified, checkingSession]);

  return null;
}
