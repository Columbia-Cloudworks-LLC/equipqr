
/**
 * Load dismissed notifications from local storage
 */
export async function loadDismissedNotifications(): Promise<string[]> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const dismissedKey = 'dismissed_notifications';
      const dismissedStr = window.localStorage.getItem(dismissedKey) || '[]';
      return JSON.parse(dismissedStr);
    }
    return [];
  } catch (e) {
    console.warn('Could not load dismissed notifications from localStorage:', e);
    return [];
  }
}

/**
 * Save dismissed notifications to local storage
 */
export async function saveDismissedNotifications(dismissed: string[]): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const dismissedKey = 'dismissed_notifications';
      window.localStorage.setItem(dismissedKey, JSON.stringify(dismissed));
    }
  } catch (e) {
    console.warn('Could not save dismissed notifications to localStorage:', e);
  }
}

// Function to dismiss/hide a notification (client-side only)
export function dismissNotification(id: string) {
  // Get existing dismissed notifications from localStorage
  const dismissedStr = localStorage.getItem('dismissed_notifications') || '[]';
  const dismissed = JSON.parse(dismissedStr);
  
  // Add the new notification ID if not already dismissed
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
  }
  
  return dismissed;
}

// Function to check if a notification has been dismissed
export function isNotificationDismissed(id: string) {
  const dismissedStr = localStorage.getItem('dismissed_notifications') || '[]';
  const dismissed = JSON.parse(dismissedStr);
  return dismissed.includes(id);
}

// Clear all dismissed notifications
export function clearAllDismissedNotifications() {
  localStorage.removeItem('dismissed_notifications');
}

/**
 * Function to force refresh local dismissed notifications status
 */
export function clearLocalDismissedNotifications() {
  localStorage.removeItem('dismissed_notifications');
  console.log("Cleared local dismissed notifications cache");
  return [];
}
