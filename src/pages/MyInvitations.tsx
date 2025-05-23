
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { useInvitationsPage } from '@/hooks/useInvitationsPage';

// Import the new component files
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
                  onAccept={() => Promise.resolve(handleAcceptInvitation())}
                  onDecline={() => Promise.resolve(handleResetAndRefresh())}
                />
                
                <TeamInvitationsCard
                  invitations={teamInvitations}
                  onAccept={() => Promise.resolve(handleAcceptInvitation())}
                  onDecline={() => Promise.resolve(handleResetAndRefresh())}
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
