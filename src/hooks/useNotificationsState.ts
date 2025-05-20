
import { useState, useCallback, useEffect, useRef } from 'react';
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
  
  // Track total attempts to prevent infinite loops
  const attemptCountRef = useRef(0);
  const lastSuccessRef = useRef<Date | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
  
  // Reset attempt counter when user changes
  useEffect(() => {
    attemptCountRef.current = 0;
  }, [user?.id]);
  
  // Fetch notifications function (doesn't directly call itself)
  const fetchNotifications = useCallback(async (force: boolean = false): Promise<boolean> => {
    // Don't refresh if no user is authenticated
    if (!user || !session) {
      setInvitations([]);
      setHasNewNotifications(false);
      return false;
    }
    
    // Prevent refreshing more than once every 2 seconds unless forced
    const now = new Date();
    if (!force && lastRefreshAttempt && (now.getTime() - lastRefreshAttempt.getTime()) < 2000) {
      return false;
    }
    
    // Prevent excessive attempts if we're failing repeatedly
    const maxAttemptsWithoutSuccess = 5;
    if (attemptCountRef.current >= maxAttemptsWithoutSuccess && 
        (!lastSuccessRef.current || (now.getTime() - lastSuccessRef.current.getTime() > 30000))) {
      console.warn("Too many notification refresh attempts without success, backing off");
      setHasError(true);
      return false;
    }
    
    try {
      setLastRefreshAttempt(now);
      setIsLoading(true);
      setHasError(false);
      attemptCountRef.current++;
      
      const data = await getActiveNotifications();
      
      // Ensure we always have a valid array
      const notificationArray = Array.isArray(data) ? data : [];
      
      console.log('Received notifications:', notificationArray);
      
      setInvitations(notificationArray);
      setHasNewNotifications(notificationArray.length > 0);
      
      // Reset attempt counter on success
      attemptCountRef.current = 0;
      lastSuccessRef.current = new Date();
      return true;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setHasError(true);
      // Don't update state on error to avoid wiping out previous valid data
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, session, lastRefreshAttempt]); // Dependencies explicitly defined
  
  // Manual refresh function (exported)
  const refreshNotifications = useCallback(async () => {
    if (!user) {
      console.log("Manual refresh attempted but no user is authenticated");
      return;
    }
    
    // Cancel any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    return await fetchNotifications(true);
  }, [user, fetchNotifications]);

  // Reset dismissed notifications
  const resetDismissedNotifications = useCallback(() => {
    try {
      clearLocalDismissedNotifications();
      attemptCountRef.current = 0; // Reset counter
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
      // Cancel any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Small delay to make sure auth is fully established
      refreshTimeoutRef.current = window.setTimeout(() => {
        fetchNotifications().catch(error => {
          console.error("Failed to refresh notifications on auth state change:", error);
        });
      }, 1500);
      
      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    } else {
      // Reset state when user logs out
      setInvitations([]);
      setHasNewNotifications(false);
    }
  }, [user, session, fetchNotifications]);

  // Setup periodic check for new notifications (every 5 minutes)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchNotifications().catch(error => {
        console.error("Failed to refresh notifications in periodic check:", error);
      });
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user, fetchNotifications]);

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
