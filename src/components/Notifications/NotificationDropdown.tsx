
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { clearLocalDismissedNotifications } from "@/services/team/notification"
import { Button } from "../ui/button"
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe'
import { InvitationNotification } from "./InvitationNotification"
import { useOrganization } from "@/contexts/OrganizationContext"

// Much longer throttle to prevent excessive refreshing
const REFRESH_THROTTLE_MS = 60000; // 60 seconds

export function NotificationDropdown() {
  const { invitations, isLoading, hasNewNotifications, refreshNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const lastRefreshTime = useRef<number>(0);
  const refreshTimeoutRef = useRef<number | null>(null);
  const hasRefreshedRef = useRef<boolean>(false);
  
  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle invitation acceptance success
  const handleInvitationAccepted = async () => {
    try {
      await Promise.all([
        refreshNotifications(),
        refreshOrganizations()
      ]);
      toast.success("Invitation accepted successfully");
    } catch (error) {
      console.error("Error refreshing after invitation acceptance:", error);
    }
  };

  // Refresh notifications when dropdown opens, but only once per session
  // and with strong throttling
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open && user && !hasRefreshedRef.current) {
      const now = Date.now();
      
      // Only refresh if enough time has passed since the last refresh
      if (now - lastRefreshTime.current > REFRESH_THROTTLE_MS) {
        lastRefreshTime.current = now;
        hasRefreshedRef.current = true;
        
        // Use a small delay to prevent refreshing if user is just quickly hovering
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        console.log('NotificationDropdown: Scheduling refresh on open');
        refreshTimeoutRef.current = window.setTimeout(() => {
          refreshNotifications();
          refreshTimeoutRef.current = null;
        }, 500); // Half second delay
      }
    }
  };
  
  // Don't render the dropdown for unauthenticated users
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          {hasNewNotifications ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          <span className="sr-only">Notifications</span>
          {hasNewNotifications ? (
            <Badge
              variant="secondary"
              className="absolute -top-0 -right-0.5 rounded-full px-1 text-xs"
            >
              {invitations.length}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium leading-none">Notifications</p>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading notifications..."
              : invitations.length > 0
              ? `You have ${invitations.length} notifications.`
              : "No notifications yet."}
          </p>
        </div>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem className="justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </DropdownMenuItem>
        ) : invitations.length > 0 ? (
          <>
            <div className="max-h-[300px] overflow-y-auto">
              {invitations.map((invitation) => (
                <DropdownMenuItem key={invitation.id} className="p-0 focus:bg-transparent">
                  <div className="w-full">
                    <InvitationNotification 
                      invitation={invitation}
                      onAccept={handleInvitationAccepted}
                      onDecline={async () => {
                        await refreshNotifications();
                      }}
                    />
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                clearLocalDismissedNotifications();
                refreshNotifications();
                toast.success("Notifications reset.");
                hasRefreshedRef.current = false; // Allow refreshing again
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Reset Notifications
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem className="justify-center">
            <span>No new notifications</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/my-invitations" className="w-full">
            View All
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
