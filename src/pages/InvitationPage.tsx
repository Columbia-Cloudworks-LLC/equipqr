
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useInvitationValidation } from '../hooks/useInvitationValidation';
import { useInvitationAcceptance } from '../hooks/useInvitationAcceptance';
import { InvalidInvitation } from '../components/Invitation/InvalidInvitation';
import { InvitationContent } from '../components/Invitation/InvitationContent';
import { InvitationLoading } from '../components/Invitation/InvitationLoading';
import { InvitationError } from '../components/Invitation/InvitationError';
import { InvitationValidating } from '../components/Invitation/InvitationStatus';

const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const invitationType = searchParams.get('type') || 'team';
  
  const { isValidating, isValid, error, invitation, user, isAuthLoading } = useInvitationValidation(token || '');
  const { acceptInvitation, isAccepting, acceptError } = useInvitationAcceptance();
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`Invitation page loaded for token: ${token?.substring(0, 8)}... (Type: ${invitationType})`);
    console.log('Invitation status:', {
      isValidating,
      isValid,
      hasError: Boolean(error),
      isAuthLoading,
      isAccepting,
      hasAcceptError: Boolean(acceptError)
    });
  }, [token, invitationType, isValidating, isValid, error, isAuthLoading, isAccepting, acceptError]);

  // Combine errors for display
  useEffect(() => {
    if (acceptError) {
      setProcessingError(acceptError);
    } else if (error) {
      setProcessingError(error);
    } else {
      setProcessingError(null);
    }
  }, [error, acceptError]);

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
      invitationType={invitationType || invitation.type || 'team'}
      invitationDetails={invitation} 
      onAccept={() => acceptInvitation(token || '', invitationType)}
      token={token || ''}
    />
  );
};

export default InvitationPage;
