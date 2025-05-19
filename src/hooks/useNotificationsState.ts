
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
  const [hasError, setHasError] = useState(false);
  const { user, session } = useAuth();
  
  // Debounced refresh function to prevent multiple rapid calls
  const debouncedRefresh = useCallback(async () => {
    // Don't refresh if no user is authenticated
    if (!user || !session) {
      setInvitations([]);
      setHasNewNotifications(false);
      return;
    }
    
    // Prevent refreshing more than once every 2 seconds
    const now = new Date();
    if (lastRefreshAttempt && (now.getTime() - lastRefreshAttempt.getTime()) < 2000) {
      return;
    }
    
    try {
      setLastRefreshAttempt(now);
      setIsLoading(true);
      setHasError(false);
      
      const data = await getActiveNotifications().catch(error => {
        console.error("Error in getActiveNotifications:", error);
        setHasError(true);
        return []; // Return empty array on error
      });
      
      // Ensure we always have a valid array
      const notificationArray = Array.isArray(data) ? data : [];
      
      console.log('Received notifications:', notificationArray);
      
      setInvitations(notificationArray);
      setHasNewNotifications(notificationArray.length > 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setHasError(true);
      // Don't update state on error to avoid wiping out previous valid data
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
    try {
      clearLocalDismissedNotifications();
      refreshNotifications();
      toast.success("Notification status reset");
    } catch (error) {
      console.error("Error resetting dismissed notifications:", error);
      toast.error("Failed to reset notification status");
    }
  }, [refreshNotifications]);

  // Fetch notifications when authentication state changes
  useEffect(() => {
    if (user && session) {
      // Small delay to make sure auth is fully established
      const timer = setTimeout(() => {
        debouncedRefresh().catch(error => {
          console.error("Failed to refresh notifications on auth state change:", error);
        });
      }, 1000);
      
      return () => clearTimeout(timer);
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
      debouncedRefresh().catch(error => {
        console.error("Failed to refresh notifications in periodic check:", error);
      });
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user, debouncedRefresh]);

  const dismissInvitation = useCallback((id: string) => {
    try {
      dismissNotification(id);
      setInvitations(prevInvitations => {
        const filtered = prevInvitations.filter(inv => inv.id !== id);
        setHasNewNotifications(filtered.length > 0);
        return filtered;
      });
    } catch (error) {
      console.error("Error dismissing invitation:", error);
    }
  }, []);

  return {
    invitations,
    isLoading,
    hasNewNotifications,
    hasError,
    refreshNotifications,
    dismissInvitation,
    resetDismissedNotifications
  };
}
