
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail } from 'lucide-react';
import { Invitation } from '@/types/notifications';

interface InvitationAlertProps {
  teamInvitations: Invitation[];
  orgInvitations: Invitation[];
}

export const InvitationAlert = ({ teamInvitations, orgInvitations }: InvitationAlertProps) => {
  if (teamInvitations.length === 0 && orgInvitations.length === 0) return null;
  
  return (
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
  );
};
