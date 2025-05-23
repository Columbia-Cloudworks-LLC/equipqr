
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionCheck } from './useSessionCheck';
import { usePeriodicSessionVerification } from './usePeriodicSessionVerification';

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
  
  // Debug information
  useEffect(() => {
    console.log('SessionVerification state:', {
      waitingForAuth,
      user: user?.email || 'none',
      sessionCheckAttempt,
    });
  }, [waitingForAuth, user, sessionCheckAttempt]);

  // Use the initial session check hook
  const {
    checkingSession,
    initialCheckDone,
    sessionVerified,
    lastRefreshTime,
    setLastRefreshTime,
    sessionRepairAttempted,
    setSessionRepairAttempted
  } = useSessionCheck({ 
    setWaitingForAuth, 
    setAuthVerified,
    repairSession 
  });

  // Use the periodic session verification hook
  usePeriodicSessionVerification({
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
  });

  return {
    sessionVerified,
    checkingSession,
    initialCheckDone
  };
}
