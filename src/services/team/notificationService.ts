
import { supabase } from "@/integrations/supabase/client";
import { 
  loadDismissedNotifications, 
  saveDismissedNotifications,
  clearLocalDismissedNotifications 
} from './notificationStorage';

/**
 * Get pending invitations for the current user's email
 * This works across organizations
 */
export async function getPendingInvitationsForUser() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Error retrieving session:", sessionError);
      return [];
    }
    
    if (!sessionData?.session?.user?.email) {
      console.error("No authenticated user email found");
      return [];
    }
    
    const userEmail = sessionData.session.user.email.toLowerCase();
    
    // Use the edge function to avoid recursion issues
    const { data, error } = await supabase.functions.invoke('get_user_invitations', {
      body: { email: userEmail }
    });
    
    if (error) {
      console.error('Error fetching pending invitations for user:', error);
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }
    
    console.log(`Found ${data?.invitations?.length || 0} pending invitations for ${userEmail}`);
    return data?.invitations || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitationsForUser:', error);
    return [];
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
