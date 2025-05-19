
import React from 'react';
import { useParams } from 'react-router-dom';
import { useInvitationValidation } from '../hooks/useInvitationValidation';
import { useInvitationAcceptance } from '../hooks/useInvitationAcceptance';
import InvalidInvitation from '../components/Invitation/InvalidInvitation';
import InvitationContent from '../components/Invitation/InvitationContent';
import InvitationLoading from '../components/Invitation/InvitationLoading';
import InvitationError from '../components/Invitation/InvitationError';

const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { isValidating, isValid, error, invitation, user, isAuthLoading } = useInvitationValidation(token || '');
  const { acceptInvitation, isAccepting, acceptError } = useInvitationAcceptance();

  if (isValidating || isAuthLoading) {
    return <InvitationLoading />;
  }

  if (error) {
    return <InvitationError error={error} />;
  }

  if (!isValid || !invitation) {
    return <InvalidInvitation />;
  }

  return (
    <InvitationContent 
      invitation={invitation} 
      user={user} 
      onAccept={(data) => acceptInvitation(data, invitation)}
      isAccepting={isAccepting}
      acceptError={acceptError}
    />
  );
};

export default InvitationPage;
