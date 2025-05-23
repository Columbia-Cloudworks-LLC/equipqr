
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionVerification } from '@/hooks/invitation/useSessionVerification';
import { useInvitationStorage } from '@/hooks/invitation/useInvitationStorage';

interface SessionHandlerProps {
  token: string | undefined;
  searchParams: URLSearchParams | null;
  waitingForAuth: boolean;
  setWaitingForAuth: (waiting: boolean) => void;
  sessionCheckAttempt: number;
  setSessionCheckAttempt: React.Dispatch<React.SetStateAction<number>>;
  setAuthVerified: (verified: boolean) => void;
  invitationType?: string;
}

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
  
  // Debug component state - only include essential props to avoid cluttering logs
  React.useEffect(() => {
    console.log('SessionHandler state:', {
      token: token?.substring(0, 8) + '...',
      waitingForAuth,
      authLoading,
      user: user?.email || 'none',
      sessionCheckAttempt
    });
  }, [token, waitingForAuth, authLoading, user, sessionCheckAttempt]);

  // Store invitation details in session storage
  useInvitationStorage(token, invitationType, searchParams, user);
  
  // Handle session verification
  useSessionVerification({
    waitingForAuth,
    setWaitingForAuth,
    setAuthVerified,
    sessionCheckAttempt,
    setSessionCheckAttempt
  });

  return null;
}
