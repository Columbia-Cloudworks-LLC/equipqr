
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsePeriodicSessionVerificationProps {
  waitingForAuth: boolean;
  sessionCheckAttempt: number;
  setSessionCheckAttempt: React.Dispatch<React.SetStateAction<number>>;
  checkingSession: boolean;
  initialCheckDone: boolean;
  sessionVerified: boolean;
  lastRefreshTime: number;
  setLastRefreshTime: (time: number) => void;
  sessionRepairAttempted: boolean;
  setSessionRepairAttempted: (attempted: boolean) => void;
  setWaitingForAuth: (waiting: boolean) => void;
  setAuthVerified: (verified: boolean) => void;
  repairSession: () => Promise<boolean>;
}

export function usePeriodicSessionVerification({
  waitingForAuth,
  sessionCheckAttempt,
  setSessionCheckAttempt,
  checkingSession,
  initialCheckDone,
  sessionVerified,
  lastRefreshTime,
  setLastRefreshTime,
  sessionRepairAttempted,
  setSessionRepairAttempted,
  setWaitingForAuth,
  setAuthVerified,
  repairSession
}: UsePeriodicSessionVerificationProps) {
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
          }
        } catch (error) {
          console.error('Error checking session:', error);
        }
      }, delay);
      
      return () => clearTimeout(checkSessionTimeout);
    }
  }, [waitingForAuth, sessionCheckAttempt, setSessionCheckAttempt, setWaitingForAuth, setAuthVerified, 
      checkingSession, initialCheckDone, sessionVerified, lastRefreshTime, repairSession, sessionRepairAttempted]);
}
