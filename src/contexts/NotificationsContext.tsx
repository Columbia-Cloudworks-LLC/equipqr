
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getActiveNotifications, dismissNotification } from '@/services/team/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationsContextType {
  invitations: any[];
  isLoading: boolean;
  hasNewNotifications: boolean;
  refreshNotifications: () => Promise<void>;
  dismissInvitation: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<Date | null>(null);
  const { user, session } = useAuth();
  
  // Use a debounced refresh function to prevent multiple rapid calls
  const debouncedRefresh = useCallback(async () => {
    // Prevent refreshing more than once every 3 seconds
    const now = new Date();
    if (lastRefreshAttempt && (now.getTime() - lastRefreshAttempt.getTime()) < 3000) {
      console.log("Skipping notification refresh - too soon after last refresh");
      return;
    }
    
    // Only refresh if we have a valid user and session
    if (!user || !session) {
      console.log("Skipping notification refresh - no valid user/session");
      setInvitations([]);
      setHasNewNotifications(false);
      return;
    }
    
    try {
      console.log("Starting notifications refresh with user:", user.email);
      setLastRefreshAttempt(now);
      setIsLoading(true);
      
      const data = await getActiveNotifications();
      console.log(`Retrieved ${data.length} active notifications`);
      
      setInvitations(data);
      setHasNewNotifications(data.length > 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Don't show error toast to users - this is an ambient feature
      // but log it for debugging
    } finally {
      setIsLoading(false);
    }
  }, [user, session, lastRefreshAttempt]);
  
  // Called after authentication is complete
  const refreshNotifications = useCallback(async () => {
    if (!user) {
      console.log("Manual refresh attempted but no user is authenticated");
      return;
    }
    
    console.log("Manual notification refresh triggered");
    await debouncedRefresh();
  }, [user, debouncedRefresh]);

  // Fetch notifications when authentication state changes
  useEffect(() => {
    if (user && session) {
      console.log("Auth state changed with valid user/session - refreshing notifications");
      debouncedRefresh();
    } else {
      // Reset state when user logs out
      console.log("Auth state changed with no user/session - resetting notifications");
      setInvitations([]);
      setHasNewNotifications(false);
    }
  }, [user, session, debouncedRefresh]);

  // Setup periodic check for new notifications (every 5 minutes)
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up periodic notification check");
    const interval = setInterval(() => {
      console.log("Running periodic notification check");
      debouncedRefresh();
    }, 5 * 60 * 1000);
    
    return () => {
      console.log("Clearing periodic notification check");
      clearInterval(interval);
    };
  }, [user, debouncedRefresh]);

  const dismissInvitation = (id: string) => {
    console.log(`Dismissing invitation ${id}`);
    dismissNotification(id);
    setInvitations(invitations.filter(inv => inv.id !== id));
    setHasNewNotifications(invitations.length > 1);
  };

  return (
    <NotificationsContext.Provider
      value={{
        invitations,
        isLoading,
        hasNewNotifications,
        refreshNotifications,
        dismissInvitation
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
