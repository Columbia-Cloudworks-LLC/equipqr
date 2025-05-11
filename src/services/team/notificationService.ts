
import { getActiveInvitations as getActiveInvitationsInternal } from './invitationQueries';
import { 
  dismissNotification as dismissNotificationLocal,
  isNotificationDismissed,
  clearAllDismissedNotifications,
  clearLocalDismissedNotifications
} from './notificationStorage';

// Main function to get active notifications (non-dismissed invitations)
export async function getActiveNotifications(retryCount = 0, maxRetries = 2) {
  try {
    console.log(`Fetching active notifications`);
    
    const invitations = await getActiveInvitationsInternal(retryCount, maxRetries);
    
    // Filter out dismissed invitations
    const activeInvitations = invitations.filter(inv => !isNotificationDismissed(inv.id));
    
    console.log(`Found ${activeInvitations.length} active (non-dismissed) invitations`);
    if (activeInvitations.length === 0 && invitations.length > 0) {
      console.log("Note: Found invitations but they were all dismissed");
    }
    
    return activeInvitations;
  } catch (error) {
    console.error("Error in getActiveNotifications:", error);
    return [];
  }
}

// Re-export functions from notificationStorage
export {
  dismissNotification,
  isNotificationDismissed,
  clearAllDismissedNotifications,
  clearLocalDismissedNotifications
} from './notificationStorage';

// Re-export functions from invitationQueries
export {
  getPendingInvitationsForUser
} from './invitationQueries';
