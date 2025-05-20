
import { supabase } from '@/integrations/supabase/client';
import { Invitation } from '@/types/notifications';

// Local storage key for tracking dismissed notifications
const DISMISSED_NOTIFICATIONS_KEY = 'equipqr_dismissed_notifications';
const MAX_CACHE_AGE_MS = 5 * 60 * 1000; // 5 minutes
let cachedNotifications: { data: Invitation[], timestamp: number } | null = null;

/**
 * Get dismissed notification IDs from local storage
 */
export function getDismissedNotificationIds(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading dismissed notifications from storage:', e);
  }
  return [];
}

/**
 * Clear dismissed notification IDs from local storage
 */
export function clearLocalDismissedNotifications(): void {
  try {
    localStorage.removeItem(DISMISSED_NOTIFICATIONS_KEY);
    console.log('Cleared dismissed notifications');
  } catch (e) {
    console.error('Error clearing dismissed notifications:', e);
  }
}

/**
 * Track a dismissed notification in local storage
 */
export function dismissNotification(id: string): void {
  try {
    const dismissed = getDismissedNotificationIds();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(dismissed));
    }
  } catch (e) {
    console.error('Error saving dismissed notification:', e);
  }
}

/**
 * Get active notifications for the current user
 */
export async function getActiveNotifications(): Promise<Invitation[]> {
  try {
    // Check for cached data first
    const now = Date.now();
    if (cachedNotifications && now - cachedNotifications.timestamp < MAX_CACHE_AGE_MS) {
      console.log('Using cached notifications data');
      return cachedNotifications.data;
    }

    // Get the current user's email first
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError || !authData?.session?.user?.email) {
      console.log('No authenticated user found or session error:', authError?.message);
      return [];
    }

    const userEmail = authData.session.user.email.toLowerCase();
    console.log('Fetching notifications for user email:', userEmail);

    // Get pending team invitations for this user's email
    const teamResponse = await supabase
      .from('team_invitations')
      .select('*, team:team_id(id, name, org_id)')
      .eq('email', userEmail)  // Filter by user email
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (teamResponse.error) {
      throw new Error(`Error fetching team invitations: ${teamResponse.error.message}`);
    }
    
    // Get pending organization invitations for this user's email
    const orgResponse = await supabase
      .from('organization_invitations')
      .select('*, organization:org_id(id, name)')
      .eq('email', userEmail)  // Filter by user email
      .eq('status', 'pending') 
      .order('created_at', { ascending: false });
      
    if (orgResponse.error) {
      throw new Error(`Error fetching organization invitations: ${orgResponse.error.message}`);
    }
    
    // Combine notifications and add type field with correct typing
    const teamInvitations = (teamResponse.data || []).map(invite => ({
      ...invite,
      invitationType: 'team' as const
    }));
    
    const orgInvitations = (orgResponse.data || []).map(invite => ({
      ...invite,
      invitationType: 'organization' as const
    }));
    
    const all = [...teamInvitations, ...orgInvitations] as Invitation[];
    
    // Filter out dismissed notifications
    const dismissed = getDismissedNotificationIds();
    const active = all.filter(invite => !dismissed.includes(invite.id));
    
    console.log(`Found ${active.length} active invitations for ${userEmail}`);
    
    // Cache the results
    cachedNotifications = {
      data: active,
      timestamp: now
    };
    
    return active;
  } catch (error) {
    console.error('Error getting active notifications:', error);
    // If we fail, return an empty array rather than throwing
    return [];
  }
}

/**
 * Get pending invitations directly from the database
 * Used as a fallback when the notifications system fails
 */
export async function getPendingInvitationsForUser(): Promise<Invitation[]> {
  try {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData?.session?.user) {
      return [];
    }
    
    const userEmail = authData.session.user.email;
    if (!userEmail) {
      return [];
    }
    
    // Fetch team invitations for this email
    const { data: teamInvites, error: teamError } = await supabase
      .from('team_invitations')
      .select('*, team:team_id(id, name, org_id)')
      .eq('email', userEmail)
      .eq('status', 'pending');
      
    if (teamError) {
      console.error('Error fetching team invitations:', teamError);
    }
    
    // Fetch organization invitations for this email
    const { data: orgInvites, error: orgError } = await supabase
      .from('organization_invitations')
      .select('*, organization:org_id(id, name)')
      .eq('email', userEmail)
      .eq('status', 'pending');
      
    if (orgError) {
      console.error('Error fetching organization invitations:', orgError);
    }
    
    // Combine and format the results with correct typing
    const pendingInvites = [
      ...(teamInvites || []).map(invite => ({
        ...invite,
        invitationType: 'team' as const
      })),
      ...(orgInvites || []).map(invite => ({
        ...invite,
        invitationType: 'organization' as const
      }))
    ] as Invitation[];
    
    return pendingInvites;
  } catch (error) {
    console.error('Error in getPendingInvitationsForUser:', error);
    return [];
  }
}
