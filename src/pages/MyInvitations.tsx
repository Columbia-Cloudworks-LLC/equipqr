
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvitationNotification } from '@/components/Notifications/InvitationNotification';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPendingInvitationsForUser } from '@/services/team/notificationService';

export default function MyInvitations() {
  const { invitations, isLoading, refreshNotifications, resetDismissedNotifications } = useNotifications();
  const [directInvitations, setDirectInvitations] = useState<any[]>([]);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initial load of notifications via context
  useEffect(() => {
    // Refresh notifications when page loads
    try {
      refreshNotifications();
    } catch (error: any) {
      console.error("Error refreshing notifications:", error);
      setLoadError(`Failed to load notifications: ${error.message}`);
    }
  }, [refreshNotifications]);
  
  // Direct database query as a fallback
  useEffect(() => {
    const loadDirectInvitations = async () => {
      try {
        setIsDirectLoading(true);
        setLoadError(null);
        console.log("Loading direct invitations as fallback");
        const invites = await getPendingInvitationsForUser();
        console.log("Direct invitations loaded:", invites);
        setDirectInvitations(invites);
      } catch (error: any) {
        console.error("Error loading direct invitations:", error);
        setLoadError(`Failed to load invitations: ${error.message}`);
      } finally {
        setIsDirectLoading(false);
      }
    };
    
    // Load direct invitations if context invitations are empty
    if (!isLoading && invitations.length === 0) {
      loadDirectInvitations();
    }
  }, [isLoading, invitations]);
  
  // Use direct invitations if context invitations are empty
  const displayInvitations = invitations.length > 0 ? invitations : directInvitations;
  const loading = isLoading || isDirectLoading;
  
  // Count team and org invitations
  const teamInvitations = displayInvitations.filter(inv => inv.invitationType === 'team' || inv.team);
  const orgInvitations = displayInvitations.filter(inv => inv.invitationType === 'organization' || inv.organization);
  
  const handleResetAndRefresh = () => {
    setLoadError(null);
    resetDismissedNotifications();
    refreshNotifications();
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">My Invitations</h1>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleResetAndRefresh}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
        </div>
        
        {loadError && (
          <Alert variant="destructive">
            <AlertTitle>Error loading invitations</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
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
                          onAccept={() => refreshNotifications()}
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
                          onAccept={() => refreshNotifications()}
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
