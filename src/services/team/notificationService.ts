
import { supabase } from '@/integrations/supabase/client';
import { Invitation } from '@/types/notifications';
import { loadDismissedNotifications, saveDismissedNotifications, clearAllDismissedNotifications } from './notificationStorage';
import { invokeEdgeFunctionWithCache } from '@/utils/edgeFunctionUtils';

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  ACTIVE_NOTIFICATIONS: 300, // 5 minutes 
  PENDING_INVITATIONS: 600   // 10 minutes
};

/**
 * Fetch all active notifications for the current user
 * This includes team and organization invitations that have not been dismissed
 * Uses caching to reduce edge function calls
 */
export async function getActiveNotifications(): Promise<Invitation[]> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('Error fetching session:', sessionError);
      return [];
    }
    
    const userEmail = sessionData.session.user.email;
    if (!userEmail) {
      console.error('No user email found in session');
      return [];
    }
    
    console.log(`Fetching notifications for ${userEmail}`);
    
    // Use the edge function with caching
    try {
      const data = await invokeEdgeFunctionWithCache<any>(
        'get_user_invitations', 
        { email: userEmail },
        {
          useCache: true,
          cacheDuration: CACHE_DURATIONS.ACTIVE_NOTIFICATIONS,
          cachePrefix: 'notifications_',
          useStaleWhileRevalidate: true,
          cacheKeyFn: payload => `user_invitations_${payload.email}`
        }
      );
      
      // Ensure data is an array
      const invitations = data?.invitations || [];
      
      // Filter out dismissed notifications
      const dismissed = await loadDismissedNotifications();
      const filtered = invitations.filter(invite => !dismissed.includes(invite.id));
      
      console.log(`Found ${filtered.length} active notifications (${dismissed.length} dismissed)`);
      return filtered;
    } catch (edgeFunctionError) {
      console.error('Error using edge function for notifications:', edgeFunctionError);
      
      // Fall back to direct DB calls if edge function fails
      return await getPendingInvitationsForUser();
    }
  } catch (error) {
    console.error('Error in getActiveNotifications:', error);
    return [];
  }
}

/**
 * Get pending invitations for current user directly from DB
 */
export async function getPendingInvitationsForUser(): Promise<Invitation[]> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('Error fetching session:', sessionError);
      return [];
    }
    
    const userEmail = sessionData.session.user.email?.toLowerCase();
    if (!userEmail) {
      console.error('No user email found in session');
      return [];
    }
    
    // Get dismissed notification IDs
    const dismissedIds = await loadDismissedNotifications();
    
    // Fetch team invitations
    const { data: teamInvitations, error: teamError } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(name, org_id)')
      .eq('email', userEmail)
      .eq('status', 'pending')
      .is('accepted_at', null);
      
    if (teamError) {
      console.error('Error fetching team invitations:', teamError);
    }
    
    // Fetch organization invitations
    const { data: orgInvitations, error: orgError } = await supabase
      .from('organization_invitations')
      .select('*, organization:org_id(name)')
      .eq('email', userEmail)
      .eq('status', 'pending')
      .is('accepted_at', null);
      
    if (orgError) {
      console.error('Error fetching organization invitations:', orgError);
    }
    
    // Normalize invitations
    const allInvitations: Invitation[] = [];
    
    // Add team invitations
    if (teamInvitations && Array.isArray(teamInvitations)) {
      teamInvitations.forEach(inv => {
        if (!dismissedIds.includes(inv.id)) {
          allInvitations.push({
            id: inv.id,
            email: inv.email,
            team: inv.team,
            role: inv.role,
            token: inv.token,
            created_at: inv.created_at,
            org_name: inv.team?.org_id ? 'Organization' : undefined,
            invitationType: 'team'
          });
        }
      });
    }
    
    // Add organization invitations
    if (orgInvitations && Array.isArray(orgInvitations)) {
      orgInvitations.forEach(inv => {
        if (!dismissedIds.includes(inv.id)) {
          allInvitations.push({
            id: inv.id,
            email: inv.email,
            organization: inv.organization,
            role: inv.role,
            token: inv.token,
            created_at: inv.created_at,
            invitationType: 'organization',
            status: inv.status
          });
        }
      });
    }
    
    console.log(`Found ${allInvitations.length} active invitations (direct DB call)`);
    return allInvitations;
  } catch (error) {
    console.error('Error in getPendingInvitationsForUser:', error);
    return [];
  }
}

/**
 * Mark a notification as dismissed (locally)
 */
export function dismissNotification(id: string): void {
  // Get existing dismissed notifications
  loadDismissedNotifications().then(dismissed => {
    // Add the new notification ID if not already dismissed
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      saveDismissedNotifications(dismissed);
    }
  });
}

/**
 * Clear all dismissed notifications
 */
export function clearLocalDismissedNotifications(): void {
  clearAllDismissedNotifications();
}
