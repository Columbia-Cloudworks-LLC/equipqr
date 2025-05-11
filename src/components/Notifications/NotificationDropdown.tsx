
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { InvitationNotification } from "./InvitationNotification";
import { getActiveNotifications, dismissNotification } from "@/services/team/notificationService";
import { toast } from "sonner";

export function NotificationDropdown() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const data = await getActiveNotifications();
      setInvitations(data);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch invitations when dropdown is opened
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchInvitations();
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInvitations();
    
    // Fetch notifications every 5 minutes if user is active
    const interval = setInterval(fetchInvitations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = () => {
    fetchInvitations();
  };

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    setInvitations(invitations.filter(inv => inv.id !== id));
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {invitations.length > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="py-2 px-4 font-medium border-b">
          Notifications
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : invitations.length > 0 ? (
            invitations.map((invitation) => (
              <InvitationNotification
                key={invitation.id}
                invitation={invitation}
                onAccept={handleAccept}
                onDecline={() => handleDismiss(invitation.id)}
              />
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No new notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
