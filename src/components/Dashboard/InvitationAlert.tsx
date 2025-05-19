
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, X } from 'lucide-react';

interface InvitationAlertProps {
  invitations: any[];
}

export function InvitationAlert({ invitations }: InvitationAlertProps) {
  const [showInvitationAlert, setShowInvitationAlert] = useState(true);

  if (!Array.isArray(invitations) || invitations.length === 0 || !showInvitationAlert) {
    return null;
  }
  
  // Count team and org invitations
  const teamInvitations = invitations.filter(inv => inv.invitationType === 'team' || inv.team);
  const orgInvitations = invitations.filter(inv => inv.invitationType === 'organization' || inv.organization);
  
  // Create a descriptive message based on the invitation types
  let invitationMessage = '';
  
  if (teamInvitations.length > 0 && orgInvitations.length > 0) {
    invitationMessage = `You have ${teamInvitations.length} team and ${orgInvitations.length} organization invitation${orgInvitations.length > 1 ? 's' : ''}`;
  } else if (teamInvitations.length > 0) {
    invitationMessage = `You have ${teamInvitations.length} team invitation${teamInvitations.length > 1 ? 's' : ''}`;
  } else if (orgInvitations.length > 0) {
    invitationMessage = `You have ${orgInvitations.length} organization invitation${orgInvitations.length > 1 ? 's' : ''}`;
  }

  return (
    <Alert className="bg-primary/5 border-primary/10 flex items-center justify-between">
      <div className="flex items-center">
        <Mail className="h-5 w-5 mr-2" />
        <AlertDescription className="flex-1">
          {invitationMessage}.
          <Button variant="link" asChild className="h-auto p-0 ml-1">
            <Link to="/my-invitations">View invitations</Link>
          </Button>
        </AlertDescription>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6" 
        onClick={() => setShowInvitationAlert(false)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  );
}
