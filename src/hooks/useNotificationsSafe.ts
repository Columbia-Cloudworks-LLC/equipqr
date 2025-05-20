
import { useContext } from 'react';
import { NotificationsContext } from '@/contexts/NotificationsContext';

/**
 * Safe hook to access notifications context with proper error handling
 */
export function useNotificationsSafe() {
  const context = useContext(NotificationsContext);
  
  if (context === undefined) {
    // Provide a fallback implementation that doesn't crash
    console.error('useNotifications must be used within a NotificationsProvider');
    return {
      invitations: [],
      isLoading: false,
      hasNewNotifications: false,
      hasError: true,
      refreshNotifications: async () => false,
      dismissInvitation: () => {},
      resetDismissedNotifications: () => {},
      isRefreshPending: false
    };
  }
  
  return context;
}
