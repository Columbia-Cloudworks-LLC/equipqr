
import { useState, useCallback, useEffect } from 'react';
import { getActiveNotifications, dismissNotification, clearLocalDismissedNotifications } from '@/services/team/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Invitation } from '@/types/notifications';

export function useNotificationsState() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<Date | null>(null);
  const { user, session } = useAuth();
  
  // Debounced refresh function to prevent multiple rapid calls
  const debouncedRefresh = useCallback(async () => {
    // Prevent refreshing more than once every 2 seconds
    const now = new Date();
    if (lastRefreshAttempt && (now.getTime() - lastRefreshAttempt.getTime()) < 2000) {
      return;
    }
    
    // Only refresh if we have a valid user and session
    if (!user || !session) {
      setInvitations([]);
      setHasNewNotifications(false);
      return;
    }
    
    try {
      setLastRefreshAttempt(now);
      setIsLoading(true);
      
      const data = await getActiveNotifications();
      
      setInvitations(data);
      setHasNewNotifications(data.length > 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
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
    
    await debouncedRefresh();
  }, [user, debouncedRefresh]);

  // Reset dismissed notifications
  const resetDismissedNotifications = useCallback(() => {
    clearLocalDismissedNotifications();
    refreshNotifications();
    toast.success("Notification status reset");
  }, [refreshNotifications]);

  // Fetch notifications when authentication state changes
  useEffect(() => {
    if (user && session) {
      // Small delay to make sure auth is fully established
      setTimeout(() => {
        debouncedRefresh();
      }, 1000);
    } else {
      // Reset state when user logs out
      setInvitations([]);
      setHasNewNotifications(false);
    }
  }, [user, session, debouncedRefresh]);

  // Setup periodic check for new notifications (every 5 minutes)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      debouncedRefresh();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user, debouncedRefresh]);

  const dismissInvitation = useCallback((id: string) => {
    dismissNotification(id);
    setInvitations(prevInvitations => {
      const filtered = prevInvitations.filter(inv => inv.id !== id);
      setHasNewNotifications(filtered.length > 0);
      return filtered;
    });
  }, []);

  return {
    invitations,
    isLoading,
    hasNewNotifications,
    refreshNotifications,
    dismissInvitation,
    resetDismissedNotifications
  };
}
