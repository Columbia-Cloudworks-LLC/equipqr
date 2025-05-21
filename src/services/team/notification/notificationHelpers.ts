
import { supabase } from "@/integrations/supabase/client";
import { Invitation } from "@/types/notifications";

// Local storage key for dismissed notifications
const DISMISSED_NOTIFICATIONS_KEY = 'equipqr_dismissed_notifications';

/**
 * Dismisses a notification locally by storing its ID
 */
export function dismissNotification(id: string): void {
  try {
    // Get current dismissed notifications
    const currentDismissed = getDismissedNotifications();
    
    // Add the new ID if not already present
    if (!currentDismissed.includes(id)) {
      currentDismissed.push(id);
      
      // Store updated list
      localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(currentDismissed));
    }
  } catch (error) {
    console.error("Error dismissing notification:", error);
  }
}

/**
 * Clears all locally dismissed notifications
 */
export function clearLocalDismissedNotifications(): void {
  try {
    localStorage.removeItem(DISMISSED_NOTIFICATIONS_KEY);
  } catch (error) {
    console.error("Error clearing dismissed notifications:", error);
  }
}

/**
 * Gets the list of dismissed notification IDs
 */
export function getDismissedNotifications(): string[] {
  try {
    const dismissed = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    return dismissed ? JSON.parse(dismissed) : [];
  } catch (error) {
    console.error("Error getting dismissed notifications:", error);
    return [];
  }
}

/**
 * Gets active notifications - combines pending invitations and filters out dismissed ones
 */
export async function getActiveNotifications(): Promise<Invitation[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.email) {
      return [];
    }
    
    const userEmail = sessionData.session.user.email.toLowerCase();
    const dismissedIds = getDismissedNotifications();
    
    // Get team invitations
    const { data: teamInvites } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(*)')
      .eq('email', userEmail)
      .eq('status', 'pending');
    
    // Get organization invitations
    const { data: orgInvites } = await supabase
      .from('organization_invitations')
      .select('*, organization:org_id(*)')
      .eq('email', userEmail)
      .eq('status', 'pending');
    
    // Combine and transform invitations
    const allInvitations: Invitation[] = [
      ...(teamInvites || []).map(invite => ({
        id: invite.id,
        email: invite.email,
        status: invite.status,
        created_at: invite.created_at,
        invitationType: 'team',
        team: invite.team,
        organization: null
      })),
      ...(orgInvites || []).map(invite => ({
        id: invite.id,
        email: invite.email,
        status: invite.status,
        created_at: invite.created_at,
        invitationType: 'organization',
        team: null,
        organization: invite.organization
      }))
    ];
    
    // Filter out dismissed notifications
    return allInvitations.filter(invite => !dismissedIds.includes(invite.id));
  } catch (error) {
    console.error("Error fetching active notifications:", error);
    return [];
  }
}
