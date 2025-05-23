
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { debounce } from '@/utils/edgeFunctions/retry';
import { validateSessionForInvitation } from '@/services/invitation/tokenUtils';
import { toast } from 'sonner';
import { completeAuthVerification } from '@/utils/auth/sessionVerification';

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
  // Use our enhanced verification that tests with an actual API call
  return await completeAuthVerification(true);
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
  const [sessionVerified, setSessionVerified] = useState(false);

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
        console.log('Performing initial session check with API call verification');
        try {
          setCheckingSession(true);
          
          // First check if we have a valid session using our enhanced verification
          const isValid = await completeAuthVerification();
          
          console.log('Initial API-verified session check result:', { isValid, user: !!user });
          
          // If we have both a valid session and user, authentication is verified
          if (isValid && user) {
            console.log('Initial check: User authenticated and session valid');
            setWaitingForAuth(false);
            setAuthVerified(true);
            setSessionVerified(true);
          } else if (!user) {
            // No user but session might be valid - we're waiting for auth
            console.log('Initial check: No user, waiting for authentication');
            setWaitingForAuth(true);
          } else {
            console.log('Initial check: User exists but API verification failed, attempting repair');
            // Use our repair functionality
            const repairResult = await completeAuthVerification(true, true);
            
            if (repairResult) {
              console.log('Session repaired successfully');
              setWaitingForAuth(false);
              setAuthVerified(true);
              setSessionVerified(true);
            } else {
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
    if (waitingForAuth && sessionCheckAttempt < 5 && !checkingSession && initialCheckDone && !sessionVerified) {
      const delay = Math.min(1000 * Math.pow(2, sessionCheckAttempt), 16000); // Exponential backoff with 16s max
      console.log(`Scheduling API-verified session check attempt ${sessionCheckAttempt + 1} in ${delay}ms`);
      
      const checkSessionTimeout = setTimeout(async () => {
        try {
          setCheckingSession(true);
          
          // Use our API-verified session check
          const isValid = await debouncedSessionCheck();
          setSessionCheckAttempt(prev => prev + 1);
          
          if (isValid) {
            console.log('Session API verification successful - can proceed with invitation');
            setWaitingForAuth(false);
            setAuthVerified(true);
            setSessionVerified(true);
          }
        } catch (error) {
          console.error('Error checking session with API call:', error);
        } finally {
          setCheckingSession(false);
        }
      }, delay);
      
      return () => clearTimeout(checkSessionTimeout);
    }
  }, [waitingForAuth, sessionCheckAttempt, setSessionCheckAttempt, setWaitingForAuth, setAuthVerified, checkingSession, initialCheckDone, sessionVerified]);

  return null;
}
