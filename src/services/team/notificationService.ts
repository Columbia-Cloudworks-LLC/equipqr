
import { supabase } from "@/integrations/supabase/client";

// Function to get pending invitations for the current user
export async function getPendingInvitationsForUser() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.warn("No authenticated user found when checking for invitations");
      return [];
    }

    const userEmail = sessionData.session.user.email?.toLowerCase();
    
    if (!userEmail) {
      console.warn("User email not found in session");
      return [];
    }
    
    console.log(`Checking for invitations for email: ${userEmail}`);
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(name)')
      .eq('email', userEmail)
      .eq('status', 'pending');
      
    if (error) {
      console.error('Error fetching pending invitations for user:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} pending invitations`);
    return data || [];
  } catch (error: any) {
    console.error('Error in getPendingInvitationsForUser:', error);
    throw new Error(`Failed to get pending invitations: ${error.message}`);
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

// Function to get non-dismissed invitations
export async function getActiveNotifications() {
  try {
    const invitations = await getPendingInvitationsForUser();
    return invitations.filter(inv => !isNotificationDismissed(inv.id));
  } catch (error) {
    console.error("Error in getActiveNotifications:", error);
    return [];
  }
}

// Clear all dismissed notifications
export function clearAllDismissedNotifications() {
  localStorage.removeItem('dismissed_notifications');
}
