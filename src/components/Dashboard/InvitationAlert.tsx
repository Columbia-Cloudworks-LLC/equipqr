
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

  return (
    <Alert className="bg-primary/5 border-primary/10 flex items-center justify-between">
      <div className="flex items-center">
        <Mail className="h-5 w-5 mr-2" />
        <AlertDescription className="flex-1">
          You have {invitations.length} pending team invitation{invitations.length > 1 ? 's' : ''}. 
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
