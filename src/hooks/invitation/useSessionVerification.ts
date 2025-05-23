
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseSessionVerificationProps {
  waitingForAuth: boolean;
  setWaitingForAuth: (waiting: boolean) => void;
  setAuthVerified: (verified: boolean) => void;
  sessionCheckAttempt: number;
  setSessionCheckAttempt: React.Dispatch<React.SetStateAction<number>>;
}

export function useSessionVerification({
  waitingForAuth,
  setWaitingForAuth,
  setAuthVerified,
  sessionCheckAttempt,
  setSessionCheckAttempt
}: UseSessionVerificationProps) {
  const { user, repairSession } = useAuth();
  const [checkingSession, setCheckingSession] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [sessionRepairAttempted, setSessionRepairAttempted] = useState(false);

  // Debug information
  useEffect(() => {
    console.log('SessionVerification state:', {
      waitingForAuth,
      user: user?.email || 'none',
      sessionCheckAttempt,
      initialCheckDone,
      sessionVerified,
      sessionRepairAttempted
    });
  }, [waitingForAuth, user, sessionCheckAttempt, initialCheckDone, sessionVerified, sessionRepairAttempted]);

  // Initial session check when component mounts
  useEffect(() => {
    const performInitialCheck = async () => {
      if (!initialCheckDone) {
        console.log('Performing initial session check');
        try {
          setCheckingSession(true);
          
          // Check if we need to throttle based on recent refreshes
          const now = Date.now();
          if (now - lastRefreshTime < 2000) {
            console.log('Session check throttled - too soon since last check');
            setCheckingSession(false);
            return;
          }
          
          setLastRefreshTime(now);
          
          // First check if we have a valid session from Supabase
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            // Notify user of the session error if it's not just a missing session
            if (error.message !== 'Not authenticated' && error.message !== 'JWT expired') {
              toast.error('Session error', { 
                description: 'Please try signing out and in again'
              });
            }
            
            // Try to repair the session if this is our first attempt
            if (!sessionRepairAttempted) {
              console.log('Attempting to repair session');
              const repaired = await repairSession();
              setSessionRepairAttempted(true);
              
              if (repaired) {
                console.log('Session repair successful');
                // Force reload to ensure we have the latest session
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
                return;
              }
            }
            
            setWaitingForAuth(true);
            setCheckingSession(false);
            setInitialCheckDone(true);
            return;
          }
          
          const isValid = !!data?.session;
          
          console.log('Initial session check result:', { isValid, user: !!user });
          
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
            console.log('Initial check: User exists but session verification failed');
            setWaitingForAuth(true);
          }
        } catch (error) {
          console.error('Error during initial session check:', error);
        } finally {
          setInitialCheckDone(true);
          setCheckingSession(false);
        }
      }
    };
    
    performInitialCheck();
  }, [user, initialCheckDone, setWaitingForAuth, setAuthVerified, lastRefreshTime, 
      repairSession, sessionRepairAttempted]);

  // Check session validity periodically with exponential backoff when waiting for auth
  useEffect(() => {
    if (waitingForAuth && sessionCheckAttempt < 5 && !checkingSession && initialCheckDone && !sessionVerified) {
      const delay = Math.min(1000 * Math.pow(2, sessionCheckAttempt), 16000); // Exponential backoff with 16s max
      console.log(`Scheduling session check attempt ${sessionCheckAttempt + 1} in ${delay}ms`);
      
      const checkSessionTimeout = setTimeout(async () => {
        try {
          const now = Date.now();
          // Prevent rapid-fire calls with a minimum time between refreshes
          if (now - lastRefreshTime < 2000) {
            console.log('Session check throttled - too soon since last check');
            return;
          }
          
          setCheckingSession(true);
          setLastRefreshTime(now);
          
          // Use direct Supabase session check
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error refreshing session:', error);
            
            // If we haven't tried repairing yet, try now
            if (sessionCheckAttempt >= 2 && !sessionRepairAttempted) {
              console.log('Multiple session check failures, attempting repair');
              await repairSession();
              setSessionRepairAttempted(true);
            }
            
            setCheckingSession(false);
            setSessionCheckAttempt(prev => prev + 1);
            return;
          }
          
          setSessionCheckAttempt(prev => prev + 1);
          
          if (data?.session) {
            console.log('Session verification successful - can proceed with invitation');
            
            // Try to trigger a token refresh if close to expiring
            try {
              const payload = JSON.parse(atob(data.session.access_token.split('.')[1]));
              const expiry = payload.exp * 1000; // Convert to milliseconds
              const now = Date.now();
              const timeRemaining = expiry - now;
              
              // If token expires in less than 5 minutes, refresh it
              if (timeRemaining < 300000) {
                console.log('Token expires soon, refreshing...');
                await supabase.auth.refreshSession();
              }
            } catch (tokenError) {
              console.error('Error checking token expiry:', tokenError);
            }
            
            setWaitingForAuth(false);
            setAuthVerified(true);
            setSessionVerified(true);
          }
        } catch (error) {
          console.error('Error checking session:', error);
        } finally {
          setCheckingSession(false);
        }
      }, delay);
      
      return () => clearTimeout(checkSessionTimeout);
    }
  }, [waitingForAuth, sessionCheckAttempt, setSessionCheckAttempt, setWaitingForAuth, setAuthVerified, 
      checkingSession, initialCheckDone, sessionVerified, lastRefreshTime, repairSession, sessionRepairAttempted]);

  return {
    sessionVerified,
    checkingSession,
    initialCheckDone
  };
}
