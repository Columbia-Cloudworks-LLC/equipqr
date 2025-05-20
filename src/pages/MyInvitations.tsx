
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvitationNotification } from '@/components/Notifications/InvitationNotification';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPendingInvitationsForUser } from '@/services/team/notificationService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useInvitationError } from '@/hooks/useInvitationError';

export default function MyInvitations() {
  const { invitations, isLoading: isNotificationsLoading, refreshNotifications, resetDismissedNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  const { user, isLoading: authLoading } = useAuth();
  const [directInvitations, setDirectInvitations] = useState<any[]>([]);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  // Use our new error handling hook
  const { 
    errorMessage, 
    isRetrying, 
    retryingIn, 
    handleError, 
    clearError 
  } = useInvitationError({
    onReset: handleResetAndRefresh,
    maxAttempts: 3
  });
  
  // Combined loading state
  const isLoading = isNotificationsLoading || isDirectLoading || authLoading || isRetrying;

  // Initial load of notifications via context
  useEffect(() => {
    // Don't try to load anything until auth is settled
    if (authLoading) {
      console.log("MyInvitations: Waiting for authentication to complete");
      return;
    }
    
    // Don't fetch if we recently refreshed (debounce)
    const now = Date.now();
    if (now - lastRefreshTime < 3000) {
      console.log("MyInvitations: Throttling refresh, too soon since last refresh");
      return;
    }
    
    // Refresh notifications when page loads
    const loadData = async () => {
      if (!user) {
        console.log("MyInvitations: No authenticated user, skipping refresh");
        return;
      }
      
      try {
        setLastRefreshTime(now);
        console.log("MyInvitations: Refreshing notifications for authenticated user");
        await refreshNotifications();
        console.log("MyInvitations: Notifications refreshed");
        clearError();
      } catch (error: any) {
        console.error("MyInvitations: Error refreshing notifications:", error);
        handleError(error, true);
      }
    };
    
    loadData();
  }, [refreshNotifications, user, authLoading, lastRefreshTime, clearError, handleError]);
  
  // Direct database query as a fallback
  useEffect(() => {
    // Skip if there's no authenticated user or we're still checking auth
    // or if context invitations are already loaded
    if (!user || authLoading || isNotificationsLoading || invitations.length > 0 || isRetrying) {
      return;
    }
    
    const loadDirectInvitations = async () => {
      try {
        setIsDirectLoading(true);
        console.log("MyInvitations: Loading direct invitations as fallback");
        const invites = await getPendingInvitationsForUser();
        console.log("MyInvitations: Direct invitations loaded:", invites);
        setDirectInvitations(invites);
      } catch (error: any) {
        console.error("MyInvitations: Error loading direct invitations:", error);
        handleError(`Failed to load invitations: ${error.message}`, false);
      } finally {
        setIsDirectLoading(false);
      }
    };
    
    // Only attempt direct loading if context invitations are empty (and not loading)
    if (!isNotificationsLoading && invitations.length === 0) {
      loadDirectInvitations();
    }
  }, [isNotificationsLoading, invitations, user, authLoading, handleError, isRetrying]);
  
  // Use direct invitations if context invitations are empty
  const displayInvitations = invitations.length > 0 ? invitations : directInvitations;
  
  // Count team and org invitations
  const teamInvitations = displayInvitations.filter(inv => inv.invitationType === 'team' || inv.team);
  const orgInvitations = displayInvitations.filter(inv => inv.invitationType === 'organization' || inv.organization);
  
  // Combined reset and refresh function
  async function handleResetAndRefresh() {
    try {
      if (!user) {
        return;
      }
      
      setLastRefreshTime(Date.now());
      console.log("MyInvitations: Performing full data refresh");
      await Promise.all([
        refreshNotifications(),
        refreshOrganizations()
      ]);
      console.log("MyInvitations: Full data refresh completed");
      clearError();
    } catch (error: any) {
      console.error("MyInvitations: Error in handleResetAndRefresh:", error);
      handleError(error.message || 'Failed to refresh data', true);
    }
  }
  
  const handleAcceptInvitation = async () => {
    try {
      setLastRefreshTime(Date.now());
      console.log("MyInvitations: Refreshing data after invitation acceptance");
      // Refresh both notifications and organizations
      await Promise.all([
        refreshNotifications(),
        refreshOrganizations()
      ]);
    } catch (error: any) {
      console.error("MyInvitations: Error handling invitation acceptance:", error);
      handleError(`Failed to refresh after acceptance: ${error.message}`, false);
    }
  };
  
  // Show authentication required message if not logged in
  if (!user && !authLoading) {
    return (
      <Layout>
        <div className="flex-1 space-y-6 p-6">
          <Alert variant="destructive">
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to be logged in to view your invitations. Please sign in and try again.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">My Invitations</h1>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => resetDismissedNotifications()}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> 
            Reset & Refresh
          </Button>
        </div>
        
        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Error loading invitations</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              {errorMessage}
              {isRetrying && (
                <div className="text-sm">
                  Retrying in {retryingIn} seconds...
                </div>
              )}
              {!isRetrying && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetAndRefresh} 
                  className="self-start mt-2"
                >
                  Try Again
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {displayInvitations.length > 0 ? (
              <div className="space-y-4">
                <Alert className="bg-primary/5 border-primary/10">
                  <Mail className="h-5 w-5" />
                  <AlertTitle>You have pending invitations</AlertTitle>
                  <AlertDescription>
                    {teamInvitations.length > 0 && orgInvitations.length > 0 ? (
                      `You have ${teamInvitations.length} team and ${orgInvitations.length} organization invitations pending.`
                    ) : teamInvitations.length > 0 ? (
                      `You have ${teamInvitations.length} team invitation${teamInvitations.length > 1 ? 's' : ''} pending.`
                    ) : (
                      `You have ${orgInvitations.length} organization invitation${orgInvitations.length > 1 ? 's' : ''} pending.`
                    )}
                  </AlertDescription>
                </Alert>
                
                {orgInvitations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Invitations</CardTitle>
                      <CardDescription>
                        These organizations have invited you to join them.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                      {orgInvitations.map((invitation) => (
                        <InvitationNotification
                          key={invitation.id}
                          invitation={invitation}
                          onAccept={handleAcceptInvitation}
                          onDecline={() => refreshNotifications()}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {teamInvitations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Invitations</CardTitle>
                      <CardDescription>
                        These teams have invited you to join them.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                      {teamInvitations.map((invitation) => (
                        <InvitationNotification
                          key={invitation.id}
                          invitation={invitation}
                          onAccept={handleAcceptInvitation}
                          onDecline={() => refreshNotifications()}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg border border-dashed">
                <Check className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No pending invitations</h3>
                <p className="text-muted-foreground mt-2">
                  You don't have any pending team or organization invitations at the moment.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleResetAndRefresh}
                >
                  Check again
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
