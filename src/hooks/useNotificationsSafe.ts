
import { useContext } from 'react';
import { NotificationsContextType } from '@/types/notifications';
import { NotificationsContext } from '@/contexts/NotificationsContext';

/**
 * A safe version of useNotifications that returns default values when used outside 
 * of NotificationsProvider context, rather than throwing an error.
 */
export function useNotificationsSafe(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  
  if (context === undefined) {
    // Return default values that won't cause errors
    return {
      invitations: [],
      isLoading: false,
      hasNewNotifications: false,
      hasError: false,
      refreshNotifications: async () => { /* no-op */ },
      dismissInvitation: () => { /* no-op */ },
      resetDismissedNotifications: () => { /* no-op */ }
    };
  }
  
  return context;
}
