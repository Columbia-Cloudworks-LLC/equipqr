
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

// Function to force refresh local dismissed notifications status
export function clearLocalDismissedNotifications() {
  localStorage.removeItem('dismissed_notifications');
  console.log("Cleared local dismissed notifications cache");
  return [];
}
