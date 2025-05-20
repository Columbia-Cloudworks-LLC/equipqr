
import { useNotificationsState } from './useNotificationsState';

// This is a simple wrapper to ensure we never get undefined from the notifications hook
export function useNotificationsSafe() {
  const notificationsState = useNotificationsState();
  
  return {
    invitations: notificationsState.invitations || [],
    isLoading: notificationsState.isLoading || false,
    hasNewNotifications: notificationsState.hasNewNotifications || false,
    hasError: notificationsState.hasError || false,
    refreshNotifications: notificationsState.refreshNotifications || (async () => false),
    dismissInvitation: notificationsState.dismissInvitation || (async () => {}),
    resetDismissedNotifications: notificationsState.resetDismissedNotifications || (() => {}),
    isRefreshPending: notificationsState.isRefreshPending || false
  };
}
