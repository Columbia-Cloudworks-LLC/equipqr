
import { useState, useCallback, useEffect, useRef } from 'react';
import { getActiveNotifications, dismissNotification, clearLocalDismissedNotifications } from '@/services/team/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Invitation } from '@/types/notifications';

// Throttling and debouncing configurations - Increased intervals to reduce edge function calls
const CONFIG = {
  MIN_REFRESH_INTERVAL_MS: 60000,        // 1 minute between refresh attempts (was 10 seconds)
  BACKGROUND_REFRESH_INTERVAL_MS: 1800000, // 30 minutes for periodic checks (was 15 minutes)
  MAX_ATTEMPTS_WITHOUT_SUCCESS: 2,        // Reduced max failed attempts before backing off (was 3)
  FAILURE_BACKOFF_MS: 300000,            // 5 minutes backoff after failures (was 1 minute)
  INITIAL_FETCH_DELAY_MS: 5000,          // Initial fetch delay increased to 5 seconds (was 2 seconds)
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
  const refreshInProgressRef = useRef(false);      // Prevent concurrent refreshes
  const pendingRefreshRef = useRef(false);         // Track if a refresh is requested while one is in progress
  const initialFetchCompletedRef = useRef(false);  // Track if initial fetch has completed
  
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
    initialFetchCompletedRef.current = false; // Reset initial fetch flag when user changes
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
    
    // Don't refresh for normal checks if initial fetch hasn't happened yet
    if (!force && !initialFetchCompletedRef.current) {
      console.log('Initial fetch not completed yet, skipping routine refresh');
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
      
      // Mark that we've completed an initial fetch
      initialFetchCompletedRef.current = true;
      
      return true;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setHasError(true);
      // Don't update state on error to avoid wiping out previous valid data
      return false;
    } finally {
      setIsLoading(false);
      refreshInProgressRef.current = false;
      
      // If another refresh was requested while this one was in progress, schedule it with a reasonable delay
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        const delay = CONFIG.MIN_REFRESH_INTERVAL_MS / 4; // Quarter the normal interval
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
      return false;
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

  // Fetch notifications when authentication state changes - BUT ONLY ONCE
  useEffect(() => {
    if (user && session && !initialFetchCompletedRef.current) {
      // Cancel any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Small delay to make sure auth is fully established
      console.log(`Scheduling initial notifications fetch with ${CONFIG.INITIAL_FETCH_DELAY_MS}ms delay`);
      refreshTimeoutRef.current = window.setTimeout(() => {
        debouncedFetchNotifications(true).catch(error => {
          console.error("Failed to refresh notifications on auth state change:", error);
        });
      }, CONFIG.INITIAL_FETCH_DELAY_MS);
      
      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    } else if (!user) {
      // Reset state when user logs out
      setInvitations([]);
      setHasNewNotifications(false);
      initialFetchCompletedRef.current = false;
    }
  }, [user?.id, session?.access_token, debouncedFetchNotifications]); // Only trigger on user ID or token changes

  // Setup less frequent periodic check for new notifications (every 30 minutes, was 15 minutes)
  useEffect(() => {
    if (!user || !initialFetchCompletedRef.current) return;
    
    console.log(`Setting up background refresh interval: ${CONFIG.BACKGROUND_REFRESH_INTERVAL_MS / 60000} minutes`);
    
    const interval = setInterval(() => {
      console.log('Running scheduled background notifications check');
      debouncedFetchNotifications().catch(error => {
        console.error("Failed to refresh notifications in periodic check:", error);
      });
    }, CONFIG.BACKGROUND_REFRESH_INTERVAL_MS);
    
    return () => {
      clearInterval(interval);
    };
  }, [user?.id, initialFetchCompletedRef.current, debouncedFetchNotifications]);

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
