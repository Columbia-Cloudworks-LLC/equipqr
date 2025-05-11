
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

  // Initial load of notifications via context
  useEffect(() => {
    // Refresh notifications when page loads
    refreshNotifications();
  }, [refreshNotifications]);
  
  // Direct database query as a fallback
  useEffect(() => {
    const loadDirectInvitations = async () => {
      try {
        setIsDirectLoading(true);
        const invites = await getPendingInvitationsForUser();
        setDirectInvitations(invites);
      } catch (error) {
        console.error("Error loading direct invitations:", error);
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
  
  const handleResetAndRefresh = () => {
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
                  <AlertTitle>You have pending team invitations</AlertTitle>
                  <AlertDescription>
                    Review and accept invitations to join teams below.
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Team Invitations</CardTitle>
                    <CardDescription>
                      These teams have invited you to join them.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y">
                    {displayInvitations.map((invitation) => (
                      <InvitationNotification
                        key={invitation.id}
                        invitation={invitation}
                        onAccept={() => refreshNotifications()}
                        onDecline={() => refreshNotifications()}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg border border-dashed">
                <Check className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No pending invitations</h3>
                <p className="text-muted-foreground mt-2">
                  You don't have any pending team invitations at the moment.
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
