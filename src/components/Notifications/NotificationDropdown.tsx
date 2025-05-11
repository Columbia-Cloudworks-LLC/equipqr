
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, ExternalLink } from 'lucide-react';
import { InvitationNotification } from "./InvitationNotification";
import { useNotifications } from "@/contexts/NotificationsContext";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { invitations, isLoading, hasNewNotifications, refreshNotifications, dismissInvitation } = useNotifications();

  // Fetch invitations when dropdown is opened
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      refreshNotifications();
    }
  };

  const handleAccept = () => {
    refreshNotifications();
  };

  const handleDismiss = (id: string) => {
    dismissInvitation(id);
  };

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
          ) : (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
