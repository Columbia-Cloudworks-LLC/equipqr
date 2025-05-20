
import { useState, useCallback, useEffect, useRef } from 'react';
import { getActiveNotifications, dismissNotification, clearLocalDismissedNotifications } from '@/services/team/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Invitation } from '@/types/notifications';

// Throttling and debouncing configurations
const CONFIG = {
  MIN_REFRESH_INTERVAL_MS: 10000,       // 10 seconds between refresh attempts
  BACKGROUND_REFRESH_INTERVAL_MS: 900000, // 15 minutes for periodic checks (was 5 minutes)
  MAX_ATTEMPTS_WITHOUT_SUCCESS: 3,       // Max failed attempts before backing off
  FAILURE_BACKOFF_MS: 60000,            // 1 minute backoff after failures
  INITIAL_FETCH_DELAY_MS: 2000,         // Delay initial fetch on auth change
};

export function useNotificationsState() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isRefreshPending, setIsRefreshPending] = useState(false);
  const { user, session } = useAuth();
  
  // Refs for tracking state between renders
  const attemptCountRef = useRef(0);
  const lastSuccessRef = useRef<Date | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const refreshInProgressRef = useRef(false); // Prevent concurrent refreshes
  const pendingRefreshRef = useRef(false);    // Track if a refresh is requested while one is in progress
  
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
  
  // Debounced notification fetch - prevents multiple rapid calls
  const debouncedFetchNotifications = useCallback(async (force: boolean = false): Promise<boolean> => {
    // Skip if already in progress
    if (refreshInProgressRef.current) {
      pendingRefreshRef.current = true; // Mark that a refresh was requested while one is in progress
      return false;
    }
    
    // Don't refresh if no user is authenticated
    if (!user || !session) {
      setInvitations([]);
      setHasNewNotifications(false);
      return false;
    }
    
    // Prevent refreshing more than once every MIN_REFRESH_INTERVAL_MS unless forced
    const now = new Date();
    if (!force && lastRefreshAttempt && 
        (now.getTime() - lastRefreshAttempt.getTime() < CONFIG.MIN_REFRESH_INTERVAL_MS)) {
      console.log('Throttling notification refresh - too recent');
      return false;
    }
    
    // Prevent excessive attempts if we're failing repeatedly
    if (attemptCountRef.current >= CONFIG.MAX_ATTEMPTS_WITHOUT_SUCCESS && 
        (!lastSuccessRef.current || (now.getTime() - lastSuccessRef.current.getTime() > CONFIG.FAILURE_BACKOFF_MS))) {
      console.warn("Too many notification refresh attempts without success, backing off");
      setHasError(true);
      return false;
    }
    
    try {
      refreshInProgressRef.current = true; // Mark refresh as in progress
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
      refreshInProgressRef.current = false;
      
      // If another refresh was requested while this one was in progress, schedule it
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        const delay = CONFIG.MIN_REFRESH_INTERVAL_MS / 2; // Half the normal interval
        refreshTimeoutRef.current = window.setTimeout(() => {
          debouncedFetchNotifications(true).catch(console.error);
        }, delay);
      }
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
    
    // Force a refresh
    setIsRefreshPending(true);
    try {
      return await debouncedFetchNotifications(true);
    } finally {
      setIsRefreshPending(false);
    }
  }, [user, debouncedFetchNotifications]);

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
        debouncedFetchNotifications().catch(error => {
          console.error("Failed to refresh notifications on auth state change:", error);
        });
      }, CONFIG.INITIAL_FETCH_DELAY_MS);
      
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
  }, [user, session, debouncedFetchNotifications]);

  // Setup periodic check for new notifications (every 15 minutes, was 5 minutes)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      debouncedFetchNotifications().catch(error => {
        console.error("Failed to refresh notifications in periodic check:", error);
      });
    }, CONFIG.BACKGROUND_REFRESH_INTERVAL_MS);
    
    return () => {
      clearInterval(interval);
    };
  }, [user, debouncedFetchNotifications]);

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
    resetDismissedNotifications,
    isRefreshPending
  };
}
