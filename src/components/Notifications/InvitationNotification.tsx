
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { acceptInvitation } from "@/services/team/invitationService";
import { Check, X, Loader2 } from 'lucide-react';

interface InvitationNotificationProps {
  invitation: {
    id: string;
    email: string;
    team: {
      name: string;
    };
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
  
  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      await acceptInvitation(invitation.token);
      toast.success(`You've joined ${invitation.team.name}!`);
      onAccept();
      navigate('/team');
    } catch (error: any) {
      toast.error(`Failed to accept invitation: ${error.message}`);
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
          You've been invited to join <span className="font-medium">{invitation.team.name}</span> as a <span className="font-medium">{invitation.role}</span>
        </p>
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
