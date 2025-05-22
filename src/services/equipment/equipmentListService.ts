
/**
 * Equipment list service - main entry point
 */
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "./services/authService";
import { fetchEquipment } from "./services/fetchService";
import { invalidateEquipmentCache, clearEquipmentCache } from "./services/cacheService";
import { getEquipmentDirectQuery } from "./queries/directQueries";

/**
 * Get all equipment items including those from teams the user belongs to
 * @param orgId Optional organization ID to filter equipment by specific organization
 */
export async function getEquipment(orgId?: string): Promise<Equipment[]> {
  try {
    const userId = await getCurrentUserId();
    console.log('Authenticated user ID:', userId);
    
    // Always invalidate cache for now to ensure we get fresh data
    invalidateEquipmentCache(userId, orgId);
    
    // Fetch equipment data
    return await fetchEquipment(userId, orgId);
  } catch (error) {
    console.error('Error in getEquipment:', error);
    
    // Fallback to direct query if there's an exception
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (userId) {
        console.log('Trying direct query as fallback');
        return await getEquipmentDirectQuery(userId, orgId);
      }
    } catch (fallbackError) {
      console.error('Equipment fallback also failed:', fallbackError);
    }
    
    console.warn('Returning empty equipment list due to errors');
    return []; 
  }
}

/**
 * Force refresh equipment data by busting the cache
 */
export async function refreshEquipment(orgId?: string): Promise<Equipment[]> {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    
    // Invalidate cache for this user/org combination
    invalidateEquipmentCache(userId, orgId);
    
    // Fetch fresh data
    return getEquipment(orgId);
  } catch (error) {
    // Enhanced error handling with better diagnostics
    console.error('Error refreshing equipment:', error);
    
    // Check for specific error types to provide better user feedback
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('permission') || errorMessage.includes('access denied')) {
      console.error('Permission issue refreshing equipment data');
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      console.error('Network issue refreshing equipment data');
    } else if (errorMessage.includes('authenticated') || errorMessage.includes('login')) { 
      console.error('Authentication issue refreshing equipment data');
    }
    
    // Rethrow to allow the component to handle the error
    throw error;
  }
}

// Re-export the direct query function for testing purposes
export { getEquipmentDirectQuery } from "./queries/directQueries";

// Re-export cache clearing function for use during login/logout
export { clearEquipmentCache };

/**
 * Diagnostic function to test equipment API connectivity
 * @returns Object with diagnostic information
 */
export async function diagnoseEquipmentService(): Promise<{ status: string, auth: boolean, cacheClear: boolean, directQueryWorks: boolean }> {
  try {
    // Test auth
    let authWorks = false;
    try {
      await getCurrentUserId();
      authWorks = true;
    } catch (e) {
      console.error('Auth test failed:', e);
    }
    
    // Test cache
    let cacheWorks = false;
    try {
      clearEquipmentCache();
      cacheWorks = true;
    } catch (e) {
      console.error('Cache test failed:', e);
    }
    
    // Test direct query
    let directQueryWorks = false;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        await getEquipmentDirectQuery(sessionData.session.user.id);
        directQueryWorks = true;
      }
    } catch (e) {
      console.error('Direct query test failed:', e);
    }
    
    return {
      status: 'completed',
      auth: authWorks,
      cacheClear: cacheWorks,
      directQueryWorks
    };
  } catch (error) {
    console.error('Diagnostics failed:', error);
    return {
      status: 'failed',
      auth: false,
      cacheClear: false,
      directQueryWorks: false
    };
  }
}
