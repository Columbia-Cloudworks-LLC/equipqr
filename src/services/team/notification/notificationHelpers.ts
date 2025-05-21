
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interface for invitation data
export interface Invitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
  invitationType: string;
  team?: any;
  organization?: any;
  role?: string;
  token?: string;
}

// List of dismissed notification IDs stored in local storage
const DISMISSED_NOTIFICATIONS_KEY = 'dismissed_notifications';

/**
 * Get dismissed notification IDs from local storage
 */
function getDismissedNotifications(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading dismissed notifications from localStorage:', error);
    return [];
  }
}

/**
 * Save a dismissed notification ID to local storage
 */
function saveDismissedNotification(id: string): void {
  try {
    const current = getDismissedNotifications();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error saving dismissed notification to localStorage:', error);
  }
}

/**
 * Mark a notification as dismissed
 */
export async function dismissNotification(id: string): Promise<void> {
  try {
    saveDismissedNotification(id);
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
}

/**
 * Clear all dismissed notifications from local storage
 */
export async function clearLocalDismissedNotifications(): Promise<void> {
  try {
    localStorage.removeItem(DISMISSED_NOTIFICATIONS_KEY);
    toast.success('Notifications reset successfully');
  } catch (error) {
    console.error('Error clearing dismissed notifications:', error);
    toast.error('Failed to reset notifications');
  }
}

/**
 * Get active invitations/notifications that haven't been dismissed
 */
export async function getActiveNotifications(): Promise<Invitation[]> {
  try {
    // Get team invitations
    const { data: teamInvitations, error: teamError } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(*)')
      .eq('status', 'pending');
    
    if (teamError) throw teamError;
    
    // Get organization invitations (placeholder, implement if needed)
    const orgInvitations: any[] = []; 
    
    // Add type information to each invitation
    const typedTeamInvitations = (teamInvitations || []).map(inv => ({
      ...inv,
      invitationType: 'team',
    }));
    
    const typedOrgInvitations = orgInvitations.map(inv => ({
      ...inv,
      invitationType: 'organization',
    }));
    
    // Combine all invitations
    const allInvitations = [...typedTeamInvitations, ...typedOrgInvitations];
    
    // Filter out dismissed invitations
    const dismissed = getDismissedNotifications();
    return allInvitations.filter(inv => !dismissed.includes(inv.id)) as Invitation[];
  } catch (error) {
    console.error('Error fetching active notifications:', error);
    return [];
  }
}
