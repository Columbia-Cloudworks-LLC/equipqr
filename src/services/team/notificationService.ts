
import { supabase } from "@/integrations/supabase/client";
import { 
  loadDismissedNotifications, 
  saveDismissedNotifications,
  clearLocalDismissedNotifications
} from './notificationStorage';

// Function to get pending invitations for the current user
// Using edge function to avoid RLS recursion issues
export async function getPendingInvitationsForUser() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Error retrieving session when checking for invitations:", sessionError);
      return [];
    }
    
    if (!sessionData?.session?.user?.email) {
      console.log("No authenticated user email found when checking for invitations");
      return [];
    }

    const userEmail = sessionData.session.user.email.toLowerCase();
    
    // Use a direct query without joins to avoid recursion issues
    // We'll get team names in a separate query if needed
    const { data, error } = await supabase
      .from('team_invitations')
      .select('id, email, token, team_id, role, created_at, expires_at, status')
      .eq('email', userEmail)
      .eq('status', 'pending');
      
    if (error) {
      console.error('Error fetching pending invitations for user:', error);
      throw error;
    }
    
    // No invitations found
    if (!data || data.length === 0) {
      console.log(`No pending invitations found for ${userEmail}`);
      return [];
    }
    
    // For each invitation, fetch the team name separately
    const invitationsWithTeamNames = await Promise.all(
      data.map(async (invitation) => {
        try {
          // Get team name in a separate query
          const { data: teamData } = await supabase
            .from('team')
            .select('name')
            .eq('id', invitation.team_id)
            .single();
            
          return {
            ...invitation,
            team: teamData ? { name: teamData.name } : { name: 'Unknown Team' }
          };
        } catch (err) {
          console.error(`Error fetching team name for invitation ${invitation.id}:`, err);
          return {
            ...invitation,
            team: { name: 'Unknown Team' }
          };
        }
      })
    );
    
    console.log(`Found ${invitationsWithTeamNames.length} pending invitations for ${userEmail}`);
    
    return invitationsWithTeamNames || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitationsForUser:', error);
    throw new Error(`Failed to get pending invitations: ${error.message}`);
  }
}

// Function to get active notifications with minimal retry logic
export async function getActiveNotifications(retryCount = 0, maxRetries = 1) {
  try {
    // Check if we have an active session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.log("No active session, skipping invitation check");
      return [];
    }
    
    const invitations = await getPendingInvitationsForUser();
    
    // Only retry once if no invitations found initially
    if (invitations.length === 0 && retryCount < maxRetries) {
      console.log(`No invitations found on attempt ${retryCount + 1}, will retry in 1s`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getActiveNotifications(retryCount + 1, maxRetries);
    }
    
    return invitations;
  } catch (error) {
    console.error("Error in getActiveNotifications:", error);
    
    // Implement minimal retry logic
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getActiveNotifications(retryCount + 1, maxRetries);
    }
    
    return [];
  }
}

/**
 * Dismiss a notification by storing its ID in local storage
 */
export async function dismissNotification(notificationId: string) {
  try {
    const dismissed = await loadDismissedNotifications();
    dismissed.push(notificationId);
    await saveDismissedNotifications(dismissed);
    console.log(`Dismissed notification ${notificationId}`);
  } catch (error) {
    console.error("Error dismissing notification:", error);
  }
}

/**
 * Reset dismissed notifications by clearing local storage
 */
export async function resetDismissedNotifications() {
  try {
    await clearLocalDismissedNotifications();
    console.log("Dismissed notifications reset");
  } catch (e) {
    console.warn('Could not clear dismissed notifications from localStorage:', e);
  }
}

/**
 * Check if a notification has been dismissed
 */
export async function isNotificationDismissed(notificationId: string): Promise<boolean> {
  try {
    const dismissed = await loadDismissedNotifications();
    return dismissed.includes(notificationId);
  } catch (error) {
    console.error("Error checking if notification is dismissed:", error);
    return false;
  }
}

/**
 * Export the clearLocalDismissedNotifications function from notificationStorage
 */
export { clearLocalDismissedNotifications };
