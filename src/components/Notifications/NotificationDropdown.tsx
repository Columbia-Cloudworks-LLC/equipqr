
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
import { Bell, ExternalLink, AlertCircle, RotateCcw } from 'lucide-react';
import { InvitationNotification } from "./InvitationNotification";
import { useNotificationsSafe } from "@/hooks/useNotificationsSafe";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const { 
    invitations, 
    isLoading, 
    hasNewNotifications, 
    refreshNotifications, 
    dismissInvitation,
    resetDismissedNotifications,
    isRefreshPending
  } = useNotificationsSafe();
  const { user } = useAuth();
  
  // Track last open time to implement a cooldown between refreshes
  const [lastOpenTime, setLastOpenTime] = useState<number>(0);
  const OPEN_REFRESH_COOLDOWN = 30000; // 30 seconds
  
  // Fetch invitations when dropdown is opened, with cooldown
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    
    if (open && user) {
      setRefreshAttempted(true);
      const now = Date.now();
      
      // Only refresh if it's been more than the cooldown period since last open
      if (now - lastOpenTime > OPEN_REFRESH_COOLDOWN) {
        setLastOpenTime(now); 
        try {
          await refreshNotifications();
        } catch (error) {
          console.error("Error refreshing notifications on open:", error);
        }
      } else {
        console.log("Skipping refresh on open - cooldown active");
      }
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
  
  const handleManualRefresh = async () => {
    setLastOpenTime(Date.now());
    try {
      await refreshNotifications();
      setRefreshAttempted(true);
    } catch (error) {
      console.error("Error manually refreshing notifications:", error);
    }
  };

  // Filter out any accepted invitations 
  const pendingInvitations = invitations.filter(inv => 
    inv.status === undefined || inv.status === 'pending'
  );

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
        <div className="py-2 px-4 font-medium border-b flex justify-between items-center">
          <span>Notifications</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleManualRefresh} 
            disabled={isLoading || isRefreshPending}
            className="h-6 w-6"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${(isLoading || isRefreshPending) ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {(isLoading || isRefreshPending) ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : pendingInvitations.length > 0 ? (
            pendingInvitations.map((invitation) => (
              <InvitationNotification
                key={invitation.id}
                invitation={invitation}
                onAccept={handleAccept}
                onDecline={() => handleDismiss(invitation.id)}
              />
            ))
          ) : refreshAttempted ? (
            <div className="p-4 text-center text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Click refresh to check for new notifications
            </div>
          )}
        </div>
        {pendingInvitations.length > 0 && (
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
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/my-invitations" className="flex w-full items-center justify-center py-2 text-sm text-muted-foreground">
            <AlertCircle className="mr-2 h-3 w-3" />
            Check all invitations
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={resetDismissedNotifications} className="flex w-full items-center justify-center py-2 text-xs text-muted-foreground">
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset notification status
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
