
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseSessionCheckProps {
  setWaitingForAuth: (waiting: boolean) => void;
  setAuthVerified: (verified: boolean) => void;
  repairSession: () => Promise<boolean>;
}

export function useSessionCheck({
  setWaitingForAuth,
  setAuthVerified,
  repairSession
}: UseSessionCheckProps) {
  const [checkingSession, setCheckingSession] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [sessionRepairAttempted, setSessionRepairAttempted] = useState(false);
  
  // Perform initial session check when component mounts
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
          
          if (isValid) {
            console.log('Initial check: Session valid');
            setWaitingForAuth(false);
            setAuthVerified(true);
            setSessionVerified(true);
          } else {
            console.log('Initial check: No valid session');
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
  }, [initialCheckDone, setWaitingForAuth, setAuthVerified, lastRefreshTime, 
      repairSession, sessionRepairAttempted]);

  return {
    checkingSession,
    initialCheckDone,
    sessionVerified,
    lastRefreshTime,
    setLastRefreshTime,
    sessionRepairAttempted,
    setSessionRepairAttempted
  };
}
