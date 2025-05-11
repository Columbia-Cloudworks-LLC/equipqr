
import { getActiveInvitations as getActiveInvitationsInternal } from './invitationQueries';
import { 
  dismissNotification as dismissNotificationLocal,
  isNotificationDismissed,
  clearAllDismissedNotifications,
  clearLocalDismissedNotifications
} from './notificationStorage';
import { supabase } from '@/integrations/supabase/client';

// Main function to get active notifications (non-dismissed invitations)
export async function getActiveNotifications() {
  try {
    // Get the current user session to check the email
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.email) {
      console.log("No authenticated user or email found when checking for notifications");
      return [];
    }

    const userEmail = sessionData.session.user.email.toLowerCase();
    
    // Get all pending invitations
    const invitations = await getActiveInvitationsInternal();
    
    // Filter for invitations that match the current user's email and haven't been dismissed
    const activeInvitations = invitations.filter(inv => 
      inv.email.toLowerCase() === userEmail && 
      !isNotificationDismissed(inv.id)
    );
    
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
