
import { useContext, useMemo } from 'react';
import { NotificationsContextType } from '@/types/notifications';
import { NotificationsContext } from '@/contexts/NotificationsContext';

/**
 * A safe version of useNotifications that returns default values when used outside 
 * of NotificationsProvider context, rather than throwing an error.
 */
export function useNotificationsSafe(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  
  // Only create default values when context is undefined
  const defaultValues = useMemo<NotificationsContextType>(() => ({
    invitations: [],
    isLoading: false,
    hasNewNotifications: false,
    hasError: false,
    refreshNotifications: async () => false,
    dismissInvitation: () => { /* no-op */ },
    resetDismissedNotifications: () => { /* no-op */ }
  }), []);
  
  return context === undefined ? defaultValues : context;
}
