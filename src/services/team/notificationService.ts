
import { getActiveInvitations as getActiveInvitationsInternal } from './invitationQueries';
import { 
  dismissNotification as dismissNotificationLocal,
  isNotificationDismissed,
  clearAllDismissedNotifications,
  clearLocalDismissedNotifications
} from './notificationStorage';

// Main function to get active notifications (non-dismissed invitations)
export async function getActiveNotifications() {
  try {
    const invitations = await getActiveInvitationsInternal();
    
    // Filter out dismissed invitations
    const activeInvitations = invitations.filter(inv => !isNotificationDismissed(inv.id));
    
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
