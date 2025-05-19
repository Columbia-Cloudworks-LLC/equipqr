
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useInvitationValidation } from '@/hooks/useInvitationValidation';
import { useInvitationAcceptance } from '@/hooks/useInvitationAcceptance';
import { InvitationLoading } from '@/components/Invitation/InvitationLoading';
import { InvitationError } from '@/components/Invitation/InvitationError';
import { InvalidInvitation } from '@/components/Invitation/InvalidInvitation';
import { InvitationContent } from '@/components/Invitation/InvitationContent';

function InvitationPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const invitationType = searchParams.get('type') || 'team';
  
  // Custom hooks for validation and acceptance
  const { loading, error, invitationDetails } = useInvitationValidation(token, invitationType);
  const { acceptInvitationHandler } = useInvitationAcceptance();

  // Render appropriate UI based on state
  if (loading) {
    return <InvitationLoading />;
  }

  if (error) {
    return <InvitationError error={error} />;
  }

  if (!invitationDetails) {
    return <InvalidInvitation />;
  }

  return (
    <InvitationContent
      invitationType={invitationType as 'team' | 'organization'}
      invitationDetails={invitationDetails}
      onAccept={acceptInvitationHandler}
      token={token!}
    />
  );
}

export default InvitationPage;
