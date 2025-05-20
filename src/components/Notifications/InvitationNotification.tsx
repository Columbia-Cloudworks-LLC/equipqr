
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Loader2 } from 'lucide-react';
import { Invitation } from '@/types/notifications';
import { useInvitationAcceptance } from '@/hooks/useInvitationAcceptance';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

interface InvitationNotificationProps {
  invitation: Invitation;
  onAccept: () => void;
  onDecline?: () => void;
}

export function InvitationNotification({ invitation, onAccept, onDecline }: InvitationNotificationProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshNotifications } = useNotifications();
  const { refreshOrganizations } = useOrganization();
  const { acceptInvitation } = useInvitationAcceptance();
  const { user } = useAuth();
  
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
  
  const handleAccept = useCallback(async () => {
    if (!user) {
      toast.error("You must be logged in to accept invitations");
      return;
    }
    
    try {
      setIsAccepting(true);
      setError(null);
      
      // Log what we're doing
      console.log(`InvitationNotification: Accepting invitation: ${invitation.token.substring(0, 8)}... (Type: ${isOrgInvitation ? 'organization' : 'team'})`);
      console.log('Current auth state:', { email: user?.email });
      
      // Explicitly use correct invitation type
      const invitationType = isOrgInvitation ? 'organization' : 'team';
      
      // Use the updated acceptInvitation hook that handles both invitation types
      const result = await acceptInvitation(invitation.token, invitationType);
      
      if (result && result.success) {
        console.log("InvitationNotification: Invitation accepted successfully:", result);
        
        // Call the onAccept callback to update the parent component
        onAccept();
        
        // Update the local state to remove the notification
        setIsDeclined(true);
        
        // Refresh with retry mechanism
        const refreshWithRetry = async (retryCount = 0) => {
          try {
            console.log(`Refreshing data after invitation acceptance (attempt ${retryCount + 1})`);
            await Promise.all([
              refreshNotifications(),
              refreshOrganizations()
            ]);
            console.log("Data refreshed successfully");
          } catch (err) {
            console.error("Error refreshing data:", err);
            if (retryCount < 2) {
              console.log(`Will retry refresh in ${(retryCount + 1) * 1000}ms`);
              setTimeout(() => refreshWithRetry(retryCount + 1), (retryCount + 1) * 1000);
            }
          }
        };
        
        refreshWithRetry();
        
        toast.success(`Successfully joined the ${isOrgInvitation ? 'organization' : 'team'}`);
        
        // Navigate to the relevant page
        if (isOrgInvitation) {
          navigate('/organization');
        } else {
          navigate('/teams');
        }
      } else {
        console.error("InvitationNotification: Invitation acceptance failed:", result);
        setError("Failed to accept invitation. Please try again.");
        toast.error("Failed to accept invitation. Please try again.");
      }
    } catch (error: any) {
      console.error("InvitationNotification: Invitation acceptance error:", error);
      setError(error.message || "An error occurred");
      toast.error(`Failed to accept invitation: ${error.message}`);
    } finally {
      setIsAccepting(false);
    }
  }, [invitation.token, isOrgInvitation, user, acceptInvitation, onAccept, refreshNotifications, refreshOrganizations, navigate]);
  
  const handleViewDetails = useCallback(() => {
    const queryParam = isOrgInvitation ? '?type=organization' : '';
    navigate(`/invitation/${invitation.token}${queryParam}`);
  }, [invitation.token, isOrgInvitation, navigate]);
  
  const handleDismiss = useCallback(() => {
    setIsDeclined(true);
    if (onDecline) {
      onDecline();
    }
  }, [onDecline]);
  
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
              onClick={handleDismiss}
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
        
        {error && (
          <div className="mt-1 text-sm text-destructive">
            {error}
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
