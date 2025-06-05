
import React from 'react';
import Layout from '@/components/Layout/Layout';
import { useInvitationsPage } from '@/hooks/useInvitationsPage';

// Import the components
import { ErrorAlert } from '@/components/Invitations/ErrorAlert';
import { AuthRequired } from '@/components/Invitations/AuthRequired';
import { PageHeader } from '@/components/Invitations/PageHeader';
import { LoadingState } from '@/components/Invitations/LoadingState';
import { EmptyState } from '@/components/Invitations/EmptyState';
import { InvitationAlert } from '@/components/Invitations/InvitationAlert';
import { 
  TeamInvitationsCard, 
  OrganizationInvitationsCard 
} from '@/components/Invitations/InvitationCards';

export default function MyInvitations() {
  const {
    user,
    displayInvitations,
    isLoading,
    errorMessage,
    isRetrying,
    retryingIn,
    handleResetAndRefresh,
    handleAcceptInvitation,
    authLoading
  } = useInvitationsPage();

  // Split invitations by type
  const teamInvitations = displayInvitations.filter(inv => inv.invitationType === 'team' || inv.team);
  const orgInvitations = displayInvitations.filter(inv => inv.invitationType === 'organization' || inv.organization);

  // Wrap callbacks in Promise-returning functions
  const handleAccept = async () => {
    await handleAcceptInvitation();
    return Promise.resolve();
  };

  const handleDecline = async () => {
    await handleResetAndRefresh();
    return Promise.resolve();
  };

  // Show authentication required message if not logged in
  if (!user && !authLoading) {
    return (
      <Layout>
        <AuthRequired />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader onRefresh={handleResetAndRefresh} isLoading={isLoading} />
        
        <ErrorAlert 
          errorMessage={errorMessage} 
          isRetrying={isRetrying} 
          retryingIn={retryingIn}
          onRetry={handleResetAndRefresh}
        />
        
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {displayInvitations.length > 0 ? (
              <div className="space-y-4">
                <InvitationAlert 
                  teamInvitations={teamInvitations} 
                  orgInvitations={orgInvitations} 
                />
                
                <OrganizationInvitationsCard
                  invitations={orgInvitations}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
                
                <TeamInvitationsCard
                  invitations={teamInvitations}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              </div>
            ) : (
              <EmptyState onCheckAgain={handleResetAndRefresh} />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
