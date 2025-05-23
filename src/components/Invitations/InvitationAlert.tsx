
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, Check } from 'lucide-react';
import { Invitation } from '@/types/notifications';
import { Link } from 'react-router-dom';

interface InvitationAlertProps {
  teamInvitations: Invitation[];
  orgInvitations: Invitation[];
  onAccept?: (invitation: Invitation) => void;
  isAccepting?: boolean;
}

export const InvitationAlert = ({ 
  teamInvitations, 
  orgInvitations,
  onAccept,
  isAccepting = false
}: InvitationAlertProps) => {
  if (teamInvitations.length === 0 && orgInvitations.length === 0) return null;
  
  // Get the first invitation for the accept button
  const firstInvitation = teamInvitations[0] || orgInvitations[0];
  
  return (
    <Alert className="bg-primary/5 border-primary/10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full">
        <div className="flex items-center mb-2 lg:mb-0">
          <Mail className="h-5 w-5 mr-2" />
          <div>
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
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onAccept && (
            <Button 
              onClick={() => onAccept(firstInvitation)}
              disabled={isAccepting}
              size="sm"
            >
              <Check className="mr-1 h-4 w-4" />
              Accept
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/my-invitations">View All</Link>
          </Button>
        </div>
      </div>
    </Alert>
  );
};
