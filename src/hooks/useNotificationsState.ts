
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
  
  // Throttled refresh function to prevent multiple rapid calls
  const debouncedRefresh = useCallback(async (force: boolean = false) => {
    // Don't refresh if no user is authenticated
    if (!user || !session) {
      setInvitations([]);
      setHasNewNotifications(false);
      return;
    }
    
    // Prevent refreshing more than once every 2 seconds unless forced
    const now = new Date();
    if (!force && lastRefreshAttempt && (now.getTime() - lastRefreshAttempt.getTime()) < 2000) {
      return;
    }
    
    // Prevent excessive attempts if we're failing repeatedly
    const maxAttemptsWithoutSuccess = 5;
    if (attemptCountRef.current >= maxAttemptsWithoutSuccess && 
        (!lastSuccessRef.current || (now.getTime() - lastSuccessRef.current.getTime() > 30000))) {
      console.warn("Too many notification refresh attempts without success, backing off");
      setHasError(true);
      return;
    }
    
    try {
      setLastRefreshAttempt(now);
      setIsLoading(true);
      setHasError(false);
      attemptCountRef.current++;
      
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
      
      // Reset attempt counter on success
      attemptCountRef.current = 0;
      lastSuccessRef.current = new Date();
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setHasError(true);
      // Don't update state on error to avoid wiping out previous valid data
    } finally {
      setIsLoading(false);
    }
  }, [user, session, lastRefreshAttempt]);
  
  // Called after authentication is complete or when manually triggered
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
    
    await debouncedRefresh(true);
  }, [user, debouncedRefresh]);

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
        debouncedRefresh().catch(error => {
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
