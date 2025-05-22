
/**
 * Equipment list service - main entry point
 */
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "./services/authService";
import { fetchEquipment } from "./services/fetchService";
import { invalidateEquipmentCache, clearEquipmentCache, getEquipmentFromCache } from "./services/cacheService";

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
        const { getEquipmentDirectQuery } = await import("./queries/directQueries");
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
    // Handle refresh errors gracefully
    console.error('Error refreshing equipment:', error);
    return [];
  }
}

// Export the direct query function for testing purposes
export { getEquipmentDirectQuery } from "./queries/directQueries";

// Re-export cache clearing function for use during login/logout
export { clearEquipmentCache };
