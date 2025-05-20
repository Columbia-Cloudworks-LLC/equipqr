
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useInvitationValidation } from '../hooks/useInvitationValidation';
import { useInvitationAcceptance } from '../hooks/useInvitationAcceptance';
import { InvalidInvitation } from '../components/Invitation/InvalidInvitation';
import { InvitationContent } from '../components/Invitation/InvitationContent';
import { InvitationLoading } from '../components/Invitation/InvitationLoading';
import { InvitationError } from '../components/Invitation/InvitationError';
import { InvitationValidating } from '../components/Invitation/InvitationStatus';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';
import { useOrganization } from '@/contexts/OrganizationContext';

const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const invitationType = searchParams.get('type') || 'team';
  const { refreshNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  
  const { isValidating, isValid, error, invitation, user, isAuthLoading } = useInvitationValidation(token || '');
  const { acceptInvitation, isAccepting, acceptError } = useInvitationAcceptance();
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [acceptedSuccessfully, setAcceptedSuccessfully] = useState(false);

  useEffect(() => {
    console.log(`Invitation page loaded for token: ${token?.substring(0, 8)}... (Type: ${invitationType})`);
    console.log('Invitation status:', {
      isValidating,
      isValid,
      hasError: Boolean(error),
      isAuthLoading,
      isAccepting,
      hasAcceptError: Boolean(acceptError),
      invitation
    });
  }, [token, invitationType, isValidating, isValid, error, isAuthLoading, isAccepting, acceptError, invitation]);

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

  // Refresh notifications after successful invitation validation
  useEffect(() => {
    if (isValid && invitation && !isValidating && !isAuthLoading) {
      refreshNotifications();
    }
  }, [isValid, invitation, isValidating, isAuthLoading, refreshNotifications]);
  
  // Refresh data when invitation is successfully accepted
  useEffect(() => {
    if (acceptedSuccessfully) {
      const refreshData = async () => {
        console.log("Invitation accepted, refreshing data...");
        try {
          await refreshNotifications();
          await refreshOrganizations();
        } catch (err) {
          console.error("Error refreshing data after invitation acceptance:", err);
        }
      };
      
      refreshData();
    }
  }, [acceptedSuccessfully, refreshNotifications, refreshOrganizations]);

  if (isValidating || isAuthLoading) {
    return <InvitationValidating />;
  }

  if (processingError) {
    return <InvitationError error={processingError} />;
  }

  if (!isValid || !invitation) {
    return <InvalidInvitation />;
  }

  const handleAcceptInvitation = async () => {
    try {
      console.log(`Accepting invitation: ${token?.substring(0, 8)}... (Type: ${invitationType})`);
      const result = await acceptInvitation(token || '', invitationType);
      
      if (result && result.success) {
        console.log("Invitation accepted successfully:", result);
        setAcceptedSuccessfully(true);
        // Explicitly refresh data
        await Promise.all([
          refreshNotifications(),
          refreshOrganizations()
        ]);
      } else {
        console.error("Invitation acceptance failed:", result);
      }
    } catch (error) {
      console.error('Error in handleAcceptInvitation:', error);
    }
  };

  return (
    <InvitationContent 
      invitationType={invitationType || invitation.type || 'team'}
      invitationDetails={invitation} 
      onAccept={handleAcceptInvitation}
      token={token || ''}
    />
  );
};

export default InvitationPage;
