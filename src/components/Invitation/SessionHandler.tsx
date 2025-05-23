
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sessionManager } from '@/services/auth/SessionManager';
import { debounce } from '@/utils/edgeFunctions/retry';
import { validateSessionForInvitation } from '@/services/invitation/tokenUtils';
import { toast } from 'sonner';

interface SessionHandlerProps {
  token: string | undefined;
  searchParams: URLSearchParams;
  waitingForAuth: boolean;
  setWaitingForAuth: (waiting: boolean) => void;
  sessionCheckAttempt: number;
  setSessionCheckAttempt: React.Dispatch<React.SetStateAction<number>>;
  setAuthVerified: (verified: boolean) => void;
  invitationType?: string;
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
  setAuthVerified,
  invitationType = 'team'
}: SessionHandlerProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [checkingSession, setCheckingSession] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Save invitation details to session storage when not authenticated
  useEffect(() => {
    if (!user && !authLoading && token) {
      // Save the invitation path for redirection after login
      const typeParam = invitationType === 'organization' ? '?type=organization' : '';
      const invitationPath = `/invitation/${token}${typeParam}${typeParam ? '&' : '?'}${searchParams.toString()}`;
      sessionStorage.setItem('invitationPath', invitationPath);
      sessionStorage.setItem('invitationType', invitationType);
      console.log('Saved invitation path for after login:', invitationPath);
    }
  }, [user, authLoading, token, searchParams, invitationType]);

  // Initial session check when component mounts
  useEffect(() => {
    const performInitialCheck = async () => {
      if (!initialCheckDone && !authLoading) {
        console.log('Performing initial session check');
        try {
          setCheckingSession(true);
          
          // First check if we have a valid session using the more reliable validator
          const isValid = await validateSessionForInvitation();
          
          console.log('Initial session check result:', { isValid, user: !!user });
          
          // If we have both a valid session and user, authentication is verified
          if (isValid && user) {
            console.log('Initial check: User authenticated and session valid');
            setWaitingForAuth(false);
            setAuthVerified(true);
          } else if (!user) {
            // No user but session might be valid - we're waiting for auth
            console.log('Initial check: No user, waiting for authentication');
            setWaitingForAuth(true);
          } else {
            // User exists but session might be invalid
            console.log('Initial check: User exists but session may be invalid');
            // Try to refresh the session
            try {
              const { data } = await supabase.auth.refreshSession();
              if (data.session) {
                console.log('Session refreshed successfully');
                setWaitingForAuth(false);
                setAuthVerified(true);
              } else {
                setWaitingForAuth(true);
              }
            } catch (refreshError) {
              console.error('Error refreshing session:', refreshError);
              setWaitingForAuth(true);
            }
          }
        } catch (error) {
          console.error('Error during initial session check:', error);
          toast.error('Authentication Error', {
            description: 'There was a problem verifying your session. Please try logging in again.'
          });
        } finally {
          setInitialCheckDone(true);
          setCheckingSession(false);
        }
      }
    };
    
    performInitialCheck();
  }, [user, authLoading, initialCheckDone, setWaitingForAuth, setAuthVerified]);

  // Check session validity periodically with exponential backoff when waiting for auth
  useEffect(() => {
    if (waitingForAuth && sessionCheckAttempt < 5 && !checkingSession && initialCheckDone) {
      const delay = Math.min(1000 * Math.pow(2, sessionCheckAttempt), 16000); // Exponential backoff with 16s max
      console.log(`Scheduling session check attempt ${sessionCheckAttempt + 1} in ${delay}ms`);
      
      const checkSessionTimeout = setTimeout(async () => {
        try {
          setCheckingSession(true);
          
          // Use our improved session validator
          const isValid = await validateSessionForInvitation();
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
  }, [waitingForAuth, sessionCheckAttempt, setSessionCheckAttempt, setWaitingForAuth, setAuthVerified, checkingSession, initialCheckDone]);

  return null;
}
