
import { useEffect, useState, useCallback } from 'react';
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

// Constants for throttling and caching
const REFRESH_THROTTLE_MS = 5000; // 5 seconds minimum between refreshes
const INITIAL_DELAY_MS = 1000; // Delay initial loading by 1 second

export default function MyInvitations() {
  const { invitations, isLoading: isNotificationsLoading, refreshNotifications, resetDismissedNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  const { user, isLoading: authLoading } = useAuth();
  const [directInvitations, setDirectInvitations] = useState<any[]>([]);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false); // Prevent concurrent refreshes
  const [hasInitialized, setHasInitialized] = useState(false);

  // Use our error handling hook
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
  const isLoading = isNotificationsLoading || isDirectLoading || authLoading || isRetrying || isRefreshing;

  // Debounced refresh function to prevent duplicate calls
  const debouncedRefresh = useCallback(async () => {
    const now = Date.now();
    
    // Don't refresh if we recently refreshed (debounce)
    if (now - lastRefreshTime < REFRESH_THROTTLE_MS || isRefreshing) {
      console.log("MyInvitations: Throttling refresh, too soon since last refresh or already refreshing");
      return;
    }
    
    if (!user) {
      console.log("MyInvitations: No authenticated user, skipping refresh");
      return;
    }
    
    try {
      setIsRefreshing(true);
      setLastRefreshTime(now);
      console.log("MyInvitations: Refreshing notifications for authenticated user");
      await refreshNotifications();
      console.log("MyInvitations: Notifications refreshed");
      clearError();
    } catch (error: any) {
      console.error("MyInvitations: Error refreshing notifications:", error);
      handleError(error, true);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshNotifications, user, lastRefreshTime, clearError, handleError, isRefreshing]);

  // Initial load - only run once after auth is settled
  useEffect(() => {
    // Don't try to load anything until auth is settled
    if (authLoading || hasInitialized) {
      return;
    }
    
    if (user) {
      setHasInitialized(true);
      
      // Delay initial load to avoid stampede during page load
      const timer = setTimeout(() => {
        debouncedRefresh();
      }, INITIAL_DELAY_MS);
      
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, debouncedRefresh, hasInitialized]);
  
  // Direct database query as a fallback - only run if context invitations failed
  useEffect(() => {
    // Skip if there's no authenticated user or we're still checking auth
    // or if context invitations are already loaded or we're currently retrying
    if (!user || authLoading || isNotificationsLoading || invitations.length > 0 || isRetrying || isDirectLoading) {
      return;
    }
    
    // Only attempt direct loading once if context failed
    const loadDirectInvitations = async () => {
      // Skip loading if we loaded recently
      const now = Date.now();
      if (now - lastRefreshTime < REFRESH_THROTTLE_MS) {
        return;
      }
      
      try {
        setIsDirectLoading(true);
        setLastRefreshTime(now);
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
    
    // Only run once per page load if not already loading and no invitations found
    if (!isNotificationsLoading && invitations.length === 0 && directInvitations.length === 0) {
      loadDirectInvitations();
    }
  }, [isNotificationsLoading, invitations, user, authLoading, handleError, isRetrying, lastRefreshTime, isDirectLoading, directInvitations]);
  
  // Use direct invitations if context invitations are empty
  const displayInvitations = invitations.length > 0 ? invitations : directInvitations;
  
  // Count team and org invitations
  const teamInvitations = displayInvitations.filter(inv => inv.invitationType === 'team' || inv.team);
  const orgInvitations = displayInvitations.filter(inv => inv.invitationType === 'organization' || inv.organization);
  
  // Combined reset and refresh function with debounce
  async function handleResetAndRefresh() {
    const now = Date.now();
    
    // Prevent rapid fires of reset & refresh
    if (now - lastRefreshTime < REFRESH_THROTTLE_MS || isRefreshing) {
      console.log("MyInvitations: Throttling reset and refresh, too soon or already refreshing");
      return;
    }
    
    try {
      if (!user) {
        return;
      }
      
      setIsRefreshing(true);
      setLastRefreshTime(now);
      console.log("MyInvitations: Performing full data refresh");
      
      // Reset dismissed notifications first
      resetDismissedNotifications();
      
      // Then refresh data
      await Promise.all([
        refreshNotifications(),
        refreshOrganizations()
      ]);
      
      console.log("MyInvitations: Full data refresh completed");
      clearError();
    } catch (error: any) {
      console.error("MyInvitations: Error in handleResetAndRefresh:", error);
      handleError(error.message || 'Failed to refresh data', true);
    } finally {
      setIsRefreshing(false);
    }
  }
  
  const handleAcceptInvitation = useCallback(async () => {
    const now = Date.now();
    
    // Don't refresh if we recently refreshed
    if (now - lastRefreshTime < REFRESH_THROTTLE_MS || isRefreshing) {
      return;
    }
    
    try {
      setIsRefreshing(true);
      setLastRefreshTime(now);
      console.log("MyInvitations: Refreshing data after invitation acceptance");
      // Refresh both notifications and organizations
      await Promise.all([
        refreshNotifications(),
        refreshOrganizations()
      ]);
    } catch (error: any) {
      console.error("MyInvitations: Error handling invitation acceptance:", error);
      handleError(`Failed to refresh after acceptance: ${error.message}`, false);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshNotifications, refreshOrganizations, handleError, lastRefreshTime, isRefreshing]);
  
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
            onClick={handleResetAndRefresh}
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
