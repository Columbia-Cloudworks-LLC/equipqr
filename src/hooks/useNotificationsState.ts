
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
  const [retryCount, setRetryCount] = useState(0);
  const { user, session, checkSession } = useAuth();
  
  // Use a debounced refresh function to prevent multiple rapid calls
  const debouncedRefresh = useCallback(async () => {
    // Prevent refreshing more than once every 2 seconds
    const now = new Date();
    if (lastRefreshAttempt && (now.getTime() - lastRefreshAttempt.getTime()) < 2000) {
      console.log("Skipping notification refresh - too soon after last refresh");
      return;
    }
    
    // Check if we have a valid session before proceeding
    let validSession = !!session;
    
    if (!validSession && user) {
      console.log("Session appears invalid but user exists - checking session validity");
      validSession = await checkSession();
    }
    
    // Only refresh if we have a valid user and session
    if (!user || !validSession) {
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
      
      // Reset retry count on successful fetch
      setRetryCount(0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      
      // Implement exponential backoff strategy for retries
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Will retry notification fetch in ${delay}ms (retry ${retryCount + 1}/3)`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          debouncedRefresh();
        }, delay);
      } else {
        console.log("Max retries reached for notification refresh");
        setRetryCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, session, lastRefreshAttempt, retryCount, checkSession]);
  
  // Called after authentication is complete
  const refreshNotifications = useCallback(async () => {
    if (!user) {
      console.log("Manual refresh attempted but no user is authenticated");
      return;
    }
    
    console.log("Manual notification refresh triggered");
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
      console.log("Auth state changed with valid user/session - refreshing notifications");
      
      // Small delay to make sure auth is fully established
      setTimeout(() => {
        debouncedRefresh();
      }, 1000);
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

  const dismissInvitation = useCallback((id: string) => {
    console.log(`Dismissing invitation ${id}`);
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
