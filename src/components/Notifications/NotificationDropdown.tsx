import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
  Mail,
  XCircle,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { Invitation } from "@/types/notifications"
import { toast } from "sonner"
import { useNotifications } from "@/contexts/NotificationsContext"
import { formatDistanceToNow } from 'date-fns';
import { clearLocalDismissedNotifications, dismissNotification } from "@/services/team/notificationService"
import { Button } from "../ui/button"
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Define a throttling interval to prevent too frequent refreshes
const REFRESH_THROTTLE_MS = 10000; // 10 seconds

// Modified function component to include optimizations
export function NotificationDropdown() {
  const { invitations, isLoading, hasNewNotifications, refreshNotifications } = useNotificationsSafe();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const lastRefreshTime = useRef<number>(0);
  const refreshTimeoutRef = useRef<number | null>(null);
  
  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
  
  // Refresh notifications when dropdown opens, but throttle the refreshes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open && user) {
      const now = Date.now();
      
      // Only refresh if enough time has passed since the last refresh
      if (now - lastRefreshTime.current > REFRESH_THROTTLE_MS) {
        lastRefreshTime.current = now;
        
        // Use a small delay to prevent refreshing if user is just quickly hovering
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = window.setTimeout(() => {
          refreshNotifications();
          refreshTimeoutRef.current = null;
        }, 150);
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
            {invitations.map((invitation) => (
              <DropdownMenuItem key={invitation.id}>
                <InvitationItem invitation={invitation} />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                clearLocalDismissedNotifications()
                refreshNotifications()
                toast.success("Notifications reset.")
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

interface InvitationItemProps {
  invitation: Invitation
}

function InvitationItem({ invitation }: InvitationItemProps) {
  const { refreshNotifications } = useNotifications()
  const [isDismissing, setIsDismissing] = useState(false)

  const handleDismiss = async (id: string) => {
    setIsDismissing(true)
    try {
      dismissNotification(id)
      await refreshNotifications()
      toast.success("Notification dismissed.")
    } catch (error) {
      console.error("Error dismissing notification:", error)
      toast.error("Failed to dismiss notification.")
    } finally {
      setIsDismissing(false)
    }
  }

  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex items-center space-x-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/avatars/0.png" alt="Avatar" />
          <AvatarFallback>
            {invitation.email.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-0.5">
          <p className="text-sm font-medium leading-none">
            {invitation.invitationType === "team"
              ? `Team Invitation: ${invitation.team?.name}`
              : `Organization Invitation: ${invitation.organization?.name}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {invitation.email} -{" "}
            {formatDistanceToNow(new Date(invitation.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDismiss(invitation.id)}
        disabled={isDismissing}
      >
        {isDismissing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <span className="sr-only">Dismiss</span>
      </Button>
    </div>
  )
}
