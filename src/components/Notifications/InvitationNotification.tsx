
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { acceptInvitation } from "@/services/team/invitationService";
import { Check, X, Loader2 } from 'lucide-react';

interface InvitationNotificationProps {
  invitation: {
    id: string;
    email: string;
    team?: {
      name?: string;
      org_id?: string;
    };
    org_name?: string;
    role: string;
    token: string;
    created_at: string;
  };
  onAccept: () => void;
  onDecline?: () => void;
}

export function InvitationNotification({ invitation, onAccept, onDecline }: InvitationNotificationProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  const navigate = useNavigate();
  
  // Safely get team name with fallback to prevent errors
  const teamName = invitation?.team?.name || 'Team';
  const orgName = invitation?.org_name;
  
  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      
      // Call the acceptInvitation function which will handle the proper role assignment
      const result = await acceptInvitation(invitation.token);
      
      toast.success(`You've joined ${result.teamName || teamName}!`, {
        description: `You have successfully joined as a ${result.role || invitation.role}`
      });
      
      onAccept();
      navigate('/team');
    } catch (error: any) {
      toast.error(`Failed to accept invitation: ${error.message}`);
      console.error("Invitation acceptance error:", error);
    } finally {
      setIsAccepting(false);
    }
  };
  
  const handleViewDetails = () => {
    navigate(`/invitation/${invitation.token}`);
  };
  
  if (isDeclined) {
    return null;
  }

  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Team Invitation</span>
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
          You've been invited to join <span className="font-medium">{teamName}</span> as a <span className="font-medium">{invitation.role}</span>
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
