
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvitationNotification } from '@/components/Notifications/InvitationNotification';
import { Invitation } from '@/types/notifications';

interface TeamInvitationsCardProps {
  invitations: Invitation[];
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}

export const TeamInvitationsCard = ({ invitations, onAccept, onDecline }: TeamInvitationsCardProps) => {
  if (invitations.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Invitations</CardTitle>
        <CardDescription>
          These teams have invited you to join them.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {invitations.map((invitation) => (
          <InvitationNotification
            key={invitation.id}
            invitation={invitation}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export const OrganizationInvitationsCard = ({ invitations, onAccept, onDecline }: TeamInvitationsCardProps) => {
  if (invitations.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Invitations</CardTitle>
        <CardDescription>
          These organizations have invited you to join them.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {invitations.map((invitation) => (
          <InvitationNotification
            key={invitation.id}
            invitation={invitation}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </CardContent>
    </Card>
  );
};
