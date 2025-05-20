
import { useContext, useEffect } from 'react';
import { NotificationsContext } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * A safer version of the useNotifications hook that handles edge cases
 * like the context not being available or the user not being authenticated.
 */
export function useNotificationsSafe() {
  const notificationsContext = useContext(NotificationsContext);
  const { user } = useAuth();
  
  // Handle missing context more gracefully
  if (!notificationsContext) {
    // Return a safe fallback implementation
    return {
      invitations: [],
      isLoading: false,
      hasNewNotifications: false,
      hasError: false,
      isRefreshPending: false,
      refreshNotifications: async () => {
        console.warn('NotificationsContext not available, cannot refresh notifications');
        return false;
      },
      dismissInvitation: (id: string) => {
        console.warn('NotificationsContext not available, cannot dismiss invitation');
      },
      resetDismissedNotifications: () => {
        console.warn('NotificationsContext not available, cannot reset dismissed notifications');
      }
    };
  }
  
  // Effect to refresh notifications when user changes
  useEffect(() => {
    if (user) {
      // Only refresh if authenticated
      notificationsContext.refreshNotifications().catch(err => {
        console.error('Error refreshing notifications on auth change:', err);
      });
    }
  }, [user?.id]);
  
  return notificationsContext;
}
