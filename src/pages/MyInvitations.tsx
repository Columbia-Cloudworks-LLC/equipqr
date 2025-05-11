
import { useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvitationNotification } from '@/components/Notifications/InvitationNotification';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Check } from 'lucide-react';

export default function MyInvitations() {
  const { invitations, isLoading, refreshNotifications } = useNotifications();

  useEffect(() => {
    // Refresh notifications when page loads
    refreshNotifications();
  }, [refreshNotifications]);

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">My Invitations</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {invitations.length > 0 ? (
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
                    {invitations.map((invitation) => (
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
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
