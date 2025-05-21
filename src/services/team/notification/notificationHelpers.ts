
import { supabase } from '@/integrations/supabase/client';
import { Invitation } from '@/types';

// Local storage key for dismissed notifications
const DISMISSED_NOTIFICATIONS_KEY = 'dismissed_notifications';

/**
 * Get active invitations for the current user
 */
export async function getActiveInvitations(): Promise<Invitation[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.email) {
      console.log('No authenticated user with email found');
      return [];
    }
    
    const userEmail = sessionData.session.user.email;
    
    // Get team invitations
    const { data: teamInvitations, error: teamError } = await supabase
      .from('team_invitations')
      .select(`
        id,
        email,
        status,
        created_at,
        team:team_id (
          id,
          name,
          org_id,
          created_by,
          created_at,
          deleted_at
        ),
        role
      `)
      .eq('email', userEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (teamError) {
      console.error('Error fetching team invitations:', teamError);
    }
    
    // Get organization invitations
    const { data: orgInvitations, error: orgError } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        email,
        status,
        created_at,
        role,
        org_id,
        organization:org_id (
          id,
          name,
          created_at
        )
      `)
      .eq('email', userEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (orgError) {
      console.error('Error fetching organization invitations:', orgError);
    }
    
    // Process team invitations
    const processedTeamInvitations = (teamInvitations || []).map(inv => ({
      ...inv,
      token: '',  // Token is server-side only
      invitationType: 'team'
    }));
    
    // Process organization invitations
    const processedOrgInvitations = (orgInvitations || []).map(inv => ({
      ...inv,
      token: '',  // Token is server-side only
      invitationType: 'organization',
      team_id: null
    }));
    
    // Combine and filter out locally dismissed notifications
    const allInvitations = [...processedTeamInvitations, ...processedOrgInvitations];
    const dismissedIds = getDismissedNotificationIds();
    
    return allInvitations.filter(inv => !dismissedIds.includes(inv.id)) as Invitation[];
  } catch (error) {
    console.error('Error in getActiveInvitations:', error);
    return [];
  }
}

/**
 * Get dismissed notification IDs from local storage
 */
function getDismissedNotificationIds(): string[] {
  try {
    const dismissed = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    return dismissed ? JSON.parse(dismissed) : [];
  } catch (error) {
    console.error('Error reading dismissed notifications:', error);
    return [];
  }
}

/**
 * Dismiss a notification locally
 */
export function dismissNotification(id: string): void {
  try {
    const dismissed = getDismissedNotificationIds();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(dismissed));
    }
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
}

/**
 * Clear all locally dismissed notifications
 */
export function clearLocalDismissedNotifications(): void {
  try {
    localStorage.removeItem(DISMISSED_NOTIFICATIONS_KEY);
  } catch (error) {
    console.error('Error clearing dismissed notifications:', error);
  }
}

/**
 * Check if there are any active notifications
 */
export async function hasActiveNotifications(): Promise<boolean> {
  const invitations = await getActiveInvitations();
  return invitations.length > 0;
}
