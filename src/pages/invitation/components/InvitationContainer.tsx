
import React from 'react';
import { useInvitationFlow } from '../hooks/useInvitationFlow';
import { InvitationStateRenderer } from './InvitationStateRenderer';
import { SessionHandler } from '@/components/Invitation/SessionHandler';
import { InvitationType } from '@/types/invitations';

interface InvitationContainerProps {
  token: string;
  initialInvitationType: InvitationType;
}

export const InvitationContainer: React.FC<InvitationContainerProps> = ({ 
  token, 
  initialInvitationType 
}) => {
  const {
    // Auth state
    waitingForAuth,
    setWaitingForAuth,
    sessionCheckAttempt,
    setSessionCheckAttempt,
    setAuthVerified,
    
    // Validation and status
    isRateLimited,
    isValidating,
    isAuthLoading,
    processingError,
    isValid,
    invitation,
    detectedType,
    
    // Actions
    handleRetryAfterRateLimit,
    handleAcceptInvitation
  } = useInvitationFlow(token, initialInvitationType);

  return (
    <>
      <SessionHandler
        token={token}
        searchParams={null}
        waitingForAuth={waitingForAuth}
        setWaitingForAuth={setWaitingForAuth}
        sessionCheckAttempt={sessionCheckAttempt}
        setSessionCheckAttempt={setSessionCheckAttempt}
        setAuthVerified={setAuthVerified}
        invitationType={initialInvitationType}
      />
      
      <InvitationStateRenderer
        waitingForAuth={waitingForAuth}
        isRateLimited={isRateLimited}
        isValidating={isValidating}
        isAuthLoading={isAuthLoading}
        processingError={processingError}
        isValid={isValid}
        invitation={invitation}
        token={token}
        detectedType={detectedType}
        onRetry={handleRetryAfterRateLimit}
        onAccept={handleAcceptInvitation}
      />
    </>
  );
};
