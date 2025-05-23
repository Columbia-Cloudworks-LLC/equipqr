import { supabase } from '@/integrations/supabase/client';
import { retry } from '@/utils/edgeFunctions/retry';

// In-memory cache to prevent excessive edge function calls
let dashboardCache: {
  data: any;
  timestamp: number;
  orgId?: string;
} | null = null;

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache TTL
const INACTIVE_TAB_TTL = 10 * 60 * 1000; // 10 minutes cache TTL when tab is inactive

// Keep track of the last fetch time to implement request debouncing
let lastFetchTime = 0;
const DEBOUNCE_TIME = 5000; // 5 seconds minimum between fetches

// Track document visibility state
let isDocumentVisible = true;
document.addEventListener('visibilitychange', () => {
  isDocumentVisible = document.visibilityState === 'visible';
});

/**
 * Fetch dashboard data from the edge function with caching, debouncing, and retry logic
 */
export async function getDashboardData(orgId?: string, forceRefresh = false) {
  try {
    const now = Date.now();
    const isDebounced = now - lastFetchTime < DEBOUNCE_TIME;
    
    // Determine the appropriate TTL based on tab visibility
    const effectiveTTL = isDocumentVisible ? CACHE_TTL : INACTIVE_TAB_TTL;
    
    // Use cache if it's valid and not forcing refresh
    if (!forceRefresh && dashboardCache && dashboardCache.orgId === orgId) {
      const isCacheValid = now - dashboardCache.timestamp < effectiveTTL;
      
      if (isCacheValid) {
        console.log('Using cached dashboard data');
        return dashboardCache.data;
      }
      
      // If we're debounced but cache is expired, still use cache but mark for refresh
      if (isDebounced) {
        console.log('Debounced: using slightly stale cache');
        return dashboardCache.data;
      }
    }
    
    // Skip fetching if tab is not visible and we have any cache
    if (!isDocumentVisible && dashboardCache && dashboardCache.orgId === orgId) {
      console.log('Tab inactive: using existing cache regardless of age');
      return dashboardCache.data;
    }
    
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      throw new Error('User not authenticated');
    }
    
    const userId = sessionData.session.user.id;
    lastFetchTime = now;
    
    // Call the edge function with retry logic
    console.log(`Fetching dashboard data from edge function for org: ${orgId || 'none'}`);
    const { data, error } = await retry(
      async () => {
        return supabase.functions.invoke('get_dashboard_data', {
          body: {
            user_id: userId,
            org_id: orgId
          }
        });
      },
      2, // max retries
      1000 // retry delay in ms
    );
    
    if (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from dashboard edge function');
    }
    
    // Update cache
    dashboardCache = {
      data,
      timestamp: now,
      orgId
    };
    
    return data;
  } catch (error) {
    console.error('Dashboard service error:', error);
    
    // If we have cache, return it even if stale during errors
    if (dashboardCache && dashboardCache.orgId === orgId) {
      console.log('Error occurred, falling back to stale cache');
      return dashboardCache.data;
    }
    
    throw error;
  }
}

/**
 * Clear dashboard cache
 */
export function clearDashboardCache() {
  dashboardCache = null;
}

/**
 * Force refresh dashboard data
 */
export async function refreshDashboardData(orgId?: string) {
  return getDashboardData(orgId, true);
}
