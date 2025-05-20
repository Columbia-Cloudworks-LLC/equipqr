
import { useState, useCallback, useEffect } from 'react';
import { useNotificationsSafe } from './useNotificationsSafe';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingInvitationsForUser } from '@/services/team/notificationService';
import { useInvitationError } from './useInvitationError';

// Constants for throttling and caching
const REFRESH_THROTTLE_MS = 5000; // 5 seconds minimum between refreshes
const INITIAL_DELAY_MS = 1000; // Delay initial loading by 1 second

export function useInvitationsPage() {
  const { invitations, isLoading: isNotificationsLoading, refreshNotifications, resetDismissedNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  const { user, isLoading: authLoading } = useAuth();
  const [directInvitations, setDirectInvitations] = useState<any[]>([]);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false); // Prevent concurrent refreshes
  const [hasInitialized, setHasInitialized] = useState(false);

  // Use our error handling hook
  const { 
    errorMessage, 
    isRetrying, 
    retryingIn, 
    handleError, 
    clearError 
  } = useInvitationError({
    onReset: handleResetAndRefresh,
    maxAttempts: 3
  });
  
  // Combined loading state
  const isLoading = isNotificationsLoading || isDirectLoading || authLoading || isRetrying || isRefreshing;

  // Debounced refresh function to prevent duplicate calls
  const debouncedRefresh = useCallback(async () => {
    const now = Date.now();
    
    // Don't refresh if we recently refreshed (debounce)
    if (now - lastRefreshTime < REFRESH_THROTTLE_MS || isRefreshing) {
      console.log("MyInvitations: Throttling refresh, too soon since last refresh or already refreshing");
      return;
    }
    
    if (!user) {
      console.log("MyInvitations: No authenticated user, skipping refresh");
      return;
    }
    
    try {
      setIsRefreshing(true);
      setLastRefreshTime(now);
      console.log("MyInvitations: Refreshing notifications for authenticated user");
      await refreshNotifications();
      console.log("MyInvitations: Notifications refreshed");
      clearError();
    } catch (error: any) {
      console.error("MyInvitations: Error refreshing notifications:", error);
      handleError(error, true);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshNotifications, user, lastRefreshTime, clearError, handleError, isRefreshing]);

  // Initial load - only run once after auth is settled
  useEffect(() => {
    // Don't try to load anything until auth is settled
    if (authLoading || hasInitialized) {
      return;
    }
    
    if (user) {
      setHasInitialized(true);
      
      // Delay initial load to avoid stampede during page load
      const timer = setTimeout(() => {
        debouncedRefresh();
      }, INITIAL_DELAY_MS);
      
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, debouncedRefresh, hasInitialized]);
  
  // Direct database query as a fallback - only run if context invitations failed
  useEffect(() => {
    // Skip if there's no authenticated user or we're still checking auth
    // or if context invitations are already loaded or we're currently retrying
    if (!user || authLoading || isNotificationsLoading || invitations.length > 0 || isRetrying || isDirectLoading) {
      return;
    }
    
    // Only attempt direct loading once if context failed
    const loadDirectInvitations = async () => {
      // Skip loading if we loaded recently
      const now = Date.now();
      if (now - lastRefreshTime < REFRESH_THROTTLE_MS) {
        return;
      }
      
      try {
        setIsDirectLoading(true);
        setLastRefreshTime(now);
        console.log("MyInvitations: Loading direct invitations as fallback");
        const invites = await getPendingInvitationsForUser();
        console.log("MyInvitations: Direct invitations loaded:", invites);
        setDirectInvitations(invites);
      } catch (error: any) {
        console.error("MyInvitations: Error loading direct invitations:", error);
        handleError(`Failed to load invitations: ${error.message}`, false);
      } finally {
        setIsDirectLoading(false);
      }
    };
    
    // Only run once per page load if not already loading and no invitations found
    if (!isNotificationsLoading && invitations.length === 0 && directInvitations.length === 0) {
      loadDirectInvitations();
    }
  }, [isNotificationsLoading, invitations, user, authLoading, handleError, isRetrying, lastRefreshTime, isDirectLoading, directInvitations]);
  
  // Combined reset and refresh function with debounce
  async function handleResetAndRefresh() {
    const now = Date.now();
    
    // Prevent rapid fires of reset & refresh
    if (now - lastRefreshTime < REFRESH_THROTTLE_MS || isRefreshing) {
      console.log("MyInvitations: Throttling reset and refresh, too soon or already refreshing");
      return;
    }
    
    try {
      if (!user) {
        return;
      }
      
      setIsRefreshing(true);
      setLastRefreshTime(now);
      console.log("MyInvitations: Performing full data refresh");
      
      // Reset dismissed notifications first
      resetDismissedNotifications();
      
      // Then refresh data
      await Promise.all([
        refreshNotifications(),
        refreshOrganizations()
      ]);
      
      console.log("MyInvitations: Full data refresh completed");
      clearError();
    } catch (error: any) {
      console.error("MyInvitations: Error in handleResetAndRefresh:", error);
      handleError(error.message || 'Failed to refresh data', true);
    } finally {
      setIsRefreshing(false);
    }
  }
  
  const handleAcceptInvitation = useCallback(async () => {
    const now = Date.now();
    
    // Don't refresh if we recently refreshed
    if (now - lastRefreshTime < REFRESH_THROTTLE_MS || isRefreshing) {
      return;
    }
    
    try {
      setIsRefreshing(true);
      setLastRefreshTime(now);
      console.log("MyInvitations: Refreshing data after invitation acceptance");
      // Refresh both notifications and organizations
      await Promise.all([
        refreshNotifications(),
        refreshOrganizations()
      ]);
    } catch (error: any) {
      console.error("MyInvitations: Error handling invitation acceptance:", error);
      handleError(`Failed to refresh after acceptance: ${error.message}`, false);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshNotifications, refreshOrganizations, handleError, lastRefreshTime, isRefreshing]);
  
  // Use direct invitations if context invitations are empty
  const displayInvitations = invitations.length > 0 ? invitations : directInvitations;
  
  return {
    user,
    displayInvitations,
    isLoading,
    errorMessage,
    isRetrying,
    retryingIn,
    handleResetAndRefresh,
    handleAcceptInvitation,
    authLoading
  };
}
