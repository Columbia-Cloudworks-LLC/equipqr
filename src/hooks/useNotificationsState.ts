
import { useState, useEffect } from 'react';
import { getActiveInvitations, dismissNotification, clearLocalDismissedNotifications } from '@/services/team/notification/notificationHelpers';
import { Invitation } from '@/types';

export function useNotificationsState() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshPending, setIsRefreshPending] = useState(false);
  
  // Load invitations on mount
  useEffect(() => {
    fetchInvitations();
  }, []);
  
  // Function to fetch active invitations
  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getActiveInvitations();
      
      // Ensure data is of the correct type before setting
      setInvitations(data as Invitation[]);
      setLastRefreshed(new Date());
      return true;
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      setError(err.message || 'Failed to fetch invitations');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to dismiss a single notification
  const handleDismiss = async (id: string) => {
    try {
      await dismissNotification(id);
      setInvitations(prevInvitations => 
        prevInvitations.filter(inv => inv.id !== id)
      );
    } catch (err: any) {
      console.error('Error dismissing notification:', err);
      setError(err.message || 'Failed to dismiss notification');
    }
  };
  
  // Function to dismiss all notifications
  const handleDismissAll = async () => {
    try {
      await clearLocalDismissedNotifications();
      setInvitations([]);
    } catch (err: any) {
      console.error('Error dismissing all notifications:', err);
      setError(err.message || 'Failed to dismiss all notifications');
    }
  };
  
  // Get the count of unread notifications
  const unreadCount = invitations.length;
  
  // Add the missing properties
  const hasNewNotifications = invitations.length > 0;
  const hasError = !!error;
  
  // Rename functions to match expected interface
  const refreshNotifications = fetchInvitations;
  const dismissInvitation = handleDismiss;
  const resetDismissedNotifications = handleDismissAll;
  
  return {
    invitations,
    isLoading,
    error,
    unreadCount,
    lastRefreshed,
    hasNewNotifications,
    hasError,
    refreshNotifications,
    dismissInvitation,
    resetDismissedNotifications,
    isRefreshPending,
    fetchInvitations,
    handleDismiss,
    handleDismissAll
  };
}
