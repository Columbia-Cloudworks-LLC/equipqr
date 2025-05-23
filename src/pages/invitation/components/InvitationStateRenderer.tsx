
import React from 'react';
import { InvalidInvitation } from '@/components/Invitation/InvalidInvitation';
import { InvitationError } from '@/components/Invitation/InvitationError';
import { InvitationValidating, RateLimitedState } from '@/components/Invitation/InvitationStatus';
import { InvitationContent } from '@/components/Invitation/InvitationContent';
import { InvitationType } from '@/types/invitations';

interface InvitationStateRendererProps {
  waitingForAuth: boolean;
  isRateLimited: boolean;
  isValidating: boolean;
  isAuthLoading: boolean;
  processingError: string | null;
  isValid: boolean;
  invitation: any;
  token: string;
  detectedType: InvitationType;
  onRetry: () => void;
  onAccept: () => void;  // Changed the type to match the actual function signature
}

export const InvitationStateRenderer: React.FC<InvitationStateRendererProps> = ({
  waitingForAuth,
  isRateLimited,
  isValidating,
  isAuthLoading,
  processingError,
  isValid,
  invitation,
  token,
  detectedType,
  onRetry,
  onAccept
}) => {
  if (waitingForAuth) {
    return (
      <InvitationError 
        error="Please login to accept this invitation" 
        suggestion="You'll need to sign in or create an account before accepting this invitation."
        isAuthError={true}
        token={token}
        invitationType={detectedType}
      />
    );
  }
  
  if (isRateLimited) {
    return <RateLimitedState onRetry={onRetry} />;
  }
  
  if (isValidating || isAuthLoading) {
    return <InvitationValidating />;
  }
  
  if (processingError) {
    return <InvitationError error={processingError} />;
  }
  
  if (!isValid || !invitation) {
    return <InvalidInvitation />;
  }
  
  return (
    <InvitationContent 
      invitationType={detectedType}
      invitationDetails={invitation} 
      onAccept={onAccept}
      token={token}
    />
  );
};
