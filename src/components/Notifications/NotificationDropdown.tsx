
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, ExternalLink, AlertCircle } from 'lucide-react';
import { InvitationNotification } from "./InvitationNotification";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const { invitations, isLoading, hasNewNotifications, refreshNotifications, dismissInvitation } = useNotifications();
  const { user } = useAuth();

  // Fetch invitations when dropdown is opened, but only if we have a user
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open && user) {
      console.log("Notification dropdown opened - refreshing notifications");
      setRefreshAttempted(true);
      refreshNotifications().catch(error => {
        console.error("Error refreshing notifications from dropdown:", error);
      });
    }
  };

  // Reset the refresh attempted flag when closed
  useEffect(() => {
    if (!isOpen) {
      setRefreshAttempted(false);
    }
  }, [isOpen]);

  const handleAccept = () => {
    refreshNotifications();
  };

  const handleDismiss = (id: string) => {
    dismissInvitation(id);
  };

  // Don't render the notification bell if there's no authenticated user
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNewNotifications && (
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
          ) : refreshAttempted && (
            <div className="p-4 text-center text-muted-foreground">
              No new notifications
            </div>
          )}
        </div>
        {invitations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/my-invitations" className="flex w-full items-center justify-center py-2 font-medium">
                <ExternalLink className="mr-2 h-4 w-4" />
                View all invitations
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link to="/my-invitations" className="flex w-full items-center justify-center py-2 text-sm text-muted-foreground">
            <AlertCircle className="mr-2 h-3 w-3" />
            Check all invitations
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
