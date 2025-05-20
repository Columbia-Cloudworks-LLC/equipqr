
import { supabase } from '@/integrations/supabase/client';
import { Invitation } from '@/types/notifications';
import { loadDismissedNotifications, saveDismissedNotifications, clearAllDismissedNotifications } from './notificationStorage';
import { invokeEdgeFunctionWithCache } from '@/utils/edgeFunctionUtils';

// Cache durations (in seconds) - Increased to reduce function calls
const CACHE_DURATIONS = {
  ACTIVE_NOTIFICATIONS: 1800, // 30 minutes (was 5 minutes)
  PENDING_INVITATIONS: 3600   // 1 hour (was 10 minutes)
};

// Flag to track if we've fetched notifications in this session
let hasInitiallyFetchedNotifications = false;

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
    
    // Use the edge function with enhanced caching
    try {
      // Check if we can use client-side cache instead of making an edge function call
      const cachedInvitations = getCachedInvitationsSync(userEmail);
      if (cachedInvitations && !hasInitiallyFetchedNotifications) {
        console.log(`Using client-side cached invitations for ${userEmail}`);
        
        // For first app load, use cached data, but request refresh in background
        if (!hasInitiallyFetchedNotifications) {
          hasInitiallyFetchedNotifications = true;
          
          // Background refresh after a delay
          setTimeout(() => {
            console.log('Background refreshing notifications after initial load');
            refreshNotificationsInBackground(userEmail).catch(console.error);
          }, 10000); // 10 second delay before background refresh
          
          // Filter out dismissed notifications from cache
          const dismissed = await loadDismissedNotifications();
          return cachedInvitations.filter(invite => !dismissed.includes(invite.id));
        }
        
        return cachedInvitations;
      }
      
      // If no cache or forced refresh, make the actual edge function call
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
      
      // Mark that we've fetched at least once
      hasInitiallyFetchedNotifications = true;
      
      // Ensure data is an array
      const invitations = data?.invitations || [];
      
      // Cache the invitations client-side as well
      cacheInvitations(userEmail, invitations);
      
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
 * Refresh notifications in background without blocking UI
 */
async function refreshNotificationsInBackground(userEmail: string): Promise<void> {
  try {
    console.log(`Background refresh of notifications for ${userEmail}`);
    
    const data = await invokeEdgeFunctionWithCache<any>(
      'get_user_invitations', 
      { email: userEmail },
      {
        useCache: false, // Skip cache for background refresh
        cacheDuration: CACHE_DURATIONS.ACTIVE_NOTIFICATIONS,
        cachePrefix: 'notifications_',
        maxRetries: 1 // Limit retries for background refresh
      }
    );
    
    const invitations = data?.invitations || [];
    cacheInvitations(userEmail, invitations);
    console.log(`Background refresh complete: Found ${invitations.length} invitations`);
  } catch (error) {
    console.error('Background notification refresh failed:', error);
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
    
    // Cache key based on user email for client-side caching
    const cacheKey = `direct_invitations_${userEmail}`;
    
    // Try to get cached invitations first
    const cachedInvitations = getCachedInvitations(cacheKey);
    if (cachedInvitations) {
      console.log(`Using cached direct DB invitations for ${userEmail}`);
      
      // Filter out dismissed invitations
      const dismissed = await loadDismissedNotifications();
      return cachedInvitations.filter(inv => !dismissed.includes(inv.id));
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
    
    // Cache the invitations for future use
    cacheInvitations(cacheKey, allInvitations);
    
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

// Client-side cache with stronger typing
interface CachedData<T> {
  data: T;
  timestamp: number;
}

// Increased cache durations to reduce API calls
const INVITATION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (was 5 minutes)

// Helper to cache invitations in memory and sessionStorage
function cacheInvitations(key: string, invitations: Invitation[]): void {
  try {
    // We'll use sessionStorage for persistence between page navigations
    const cachedData: CachedData<Invitation[]> = {
      data: invitations,
      timestamp: Date.now()
    };
    
    try {
      sessionStorage.setItem(key, JSON.stringify(cachedData));
    } catch (storageError) {
      console.warn('Failed to save to sessionStorage:', storageError);
    }
    
    // Also store in a module-level variable for faster access
    moduleCache[key] = cachedData;
  } catch (error) {
    console.error('Error caching invitations:', error);
  }
}

// Module-level cache for even faster access without storage API calls
const moduleCache: Record<string, CachedData<Invitation[]>> = {};

// Helper to get cached invitations with multi-level fallback
function getCachedInvitations(key: string): Invitation[] | null {
  try {
    // First check module level cache (RAM)
    if (moduleCache[key]) {
      const cachedData = moduleCache[key];
      
      // Check if cache is still valid
      if (Date.now() - cachedData.timestamp <= INVITATION_CACHE_DURATION) {
        return cachedData.data;
      } else {
        delete moduleCache[key]; // Clear expired cache
      }
    }
    
    // Then try sessionStorage
    const cached = sessionStorage.getItem(key);
    
    if (!cached) return null;
    
    const cachedData = JSON.parse(cached) as CachedData<Invitation[]>;
    
    // Check if cache is still valid
    if (Date.now() - cachedData.timestamp > INVITATION_CACHE_DURATION) {
      sessionStorage.removeItem(key);
      return null;
    }
    
    // Update module cache
    moduleCache[key] = cachedData;
    
    return cachedData.data;
  } catch (error) {
    console.error('Error retrieving cached invitations:', error);
    return null;
  }
}

// Sync version that doesn't use await
function getCachedInvitationsSync(userEmail: string): Invitation[] | null {
  const key = `user_invitations_${userEmail}`;
  
  try {
    // Check module cache first (fastest)
    if (moduleCache[key]) {
      const cachedData = moduleCache[key];
      if (Date.now() - cachedData.timestamp <= INVITATION_CACHE_DURATION) {
        return cachedData.data;
      }
    }
    
    // Try localStorage
    const cachedStr = sessionStorage.getItem(key);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr) as CachedData<Invitation[]>;
      if (Date.now() - cached.timestamp <= INVITATION_CACHE_DURATION) {
        // Update module cache
        moduleCache[key] = cached;
        return cached.data;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error in getCachedInvitationsSync:', error);
    return null;
  }
}
