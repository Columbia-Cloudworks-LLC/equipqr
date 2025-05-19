
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { acceptInvitation } from "@/services/team/invitationService";
import { acceptOrganizationInvitation } from "@/services/organization/invitationService";
import { Check, X, Loader2 } from 'lucide-react';
import { Invitation } from '@/types/notifications';

interface InvitationNotificationProps {
  invitation: Invitation;
  onAccept: () => void;
  onDecline?: () => void;
}

export function InvitationNotification({ invitation, onAccept, onDecline }: InvitationNotificationProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  const navigate = useNavigate();
  
  // Determine if this is a team or organization invitation
  const isTeamInvitation = invitation.invitationType === 'team' || invitation.team !== null;
  const isOrgInvitation = invitation.invitationType === 'organization' || invitation.organization !== null;
  
  // Safely get the name of the entity the user is being invited to join
  let entityName = 'Unknown';
  let orgName = invitation?.org_name;
  
  if (isTeamInvitation) {
    entityName = invitation?.team?.name || invitation?.team_name || invitation?.org_name || 'Team';
  } else if (isOrgInvitation) {
    entityName = invitation?.organization?.name || invitation?.org_name || 'Organization';
    orgName = null; // Don't show org name separately for org invitations
  }
  
  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      
      let result;
      
      if (isOrgInvitation) {
        // Handle organization invitation
        result = await acceptOrganizationInvitation(invitation.token);
        
        toast.success(`You've joined ${entityName}!`, {
          description: `You have successfully joined as a ${invitation.role}`
        });
        
        // For organization invitations, redirect to the organization settings
        // Use the correct route path from App.tsx
        onAccept();
        navigate('/settings/organization');
      } else {
        // Handle team invitation
        result = await acceptInvitation(invitation.token);
        
        toast.success(`You've joined ${entityName}!`, {
          description: `You have successfully joined as a ${result.role || invitation.role}`
        });
        
        // For team invitations, redirect to the team page
        onAccept();
        navigate('/team');
      }
    } catch (error: any) {
      toast.error(`Failed to accept invitation: ${error.message}`);
      console.error("Invitation acceptance error:", error);
    } finally {
      setIsAccepting(false);
    }
  };
  
  const handleViewDetails = () => {
    const queryParam = isOrgInvitation ? '?type=organization' : '';
    navigate(`/invitation/${invitation.token}${queryParam}`);
  };
  
  if (isDeclined) {
    return null;
  }

  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">
            {isOrgInvitation ? 'Organization Invitation' : 'Team Invitation'}
          </span>
          {onDecline && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => {
                setIsDeclined(true);
                onDecline?.();
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          You've been invited to join <span className="font-medium">{entityName}</span> as a <span className="font-medium">{invitation.role}</span>
        </p>
        
        {orgName && (
          <div className="mt-1">
            <Badge variant="outline" className="text-xs">
              {orgName} Organization
            </Badge>
          </div>
        )}
        
        <div className="flex gap-2 mt-2">
          <Button 
            size="sm" 
            className="w-full"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Accept
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
