
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, X, Check, Loader2 } from 'lucide-react';
import { useInvitationProcessing } from '@/hooks/invitation/useInvitationProcessing';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';

interface InvitationAlertProps {
  invitations: any[];
}

export function InvitationAlert({ invitations }: InvitationAlertProps) {
  const [showInvitationAlert, setShowInvitationAlert] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { processInvitation } = useInvitationProcessing();
  const { refreshOrganizations } = useOrganization();
  const { refreshNotifications } = useNotificationsSafe();

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

  // Handle accepting the first invitation in the list
  const handleAcceptInvitation = async () => {
    if (invitations.length === 0) return;
    
    const invitation = invitations[0];
    const invitationType = invitation.invitationType === 'organization' || invitation.organization ? 'organization' : 'team';
    
    if (!invitation.token) {
      toast.error("Unable to process invitation", {
        description: "Invitation token is missing. Please view all invitations to accept."
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      setProcessingId(invitation.id);
      
      const result = await processInvitation(invitation.token, invitationType);
      
      if (result && result.success) {
        toast.success(`Successfully accepted the ${invitationType} invitation`);
        
        // Refresh data
        await Promise.all([
          refreshNotifications(),
          refreshOrganizations()
        ]);
        
        // If this was the last invitation, hide the alert
        if (invitations.length <= 1) {
          setShowInvitationAlert(false);
        }
      } else {
        toast.error("Failed to accept invitation", {
          description: result?.error || "Please try again or view all invitations for details."
        });
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error("Failed to process invitation", {
        description: error.message || "An unexpected error occurred."
      });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  return (
    <Alert className="bg-primary/5 border-primary/10 flex items-center justify-between">
      <div className="flex items-center">
        <Mail className="h-5 w-5 mr-2" />
        <AlertDescription className="flex-1">
          {invitationMessage}
          <Button variant="link" asChild className="h-auto p-0 ml-1">
            <Link to="/my-invitations">View all</Link>
          </Button>
        </AlertDescription>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm"
          variant="default"
          onClick={handleAcceptInvitation}
          disabled={isProcessing}
          className="h-8"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Accept
            </>
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={() => setShowInvitationAlert(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </Alert>
  );
}
