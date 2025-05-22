
/**
 * Equipment list service - main entry point
 */
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getEquipmentDirectQuery } from "./queries/directQueries";
import { getEquipmentViaEdgeFunction } from "./queries/edgeFunctionQueries";
import { bustEquipmentCache, checkEquipmentCache, clearEquipmentCache } from "./caching/equipmentCache";

/**
 * Get all equipment items including those from teams the user belongs to
 * @param orgId Optional organization ID to filter equipment by specific organization
 */
export async function getEquipment(orgId?: string): Promise<Equipment[]> {
  try {
    console.log('Fetching equipment for current user', orgId ? `filtered by orgId: ${orgId}` : '');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting auth session:', sessionError);
      throw new Error('Failed to authenticate user');
    }
    
    if (!sessionData?.session?.user) {
      console.error('User is not authenticated, cannot fetch equipment');
      throw new Error('User must be logged in to view equipment');
    }

    const userId = sessionData.session.user.id;
    console.log('Authenticated user ID:', userId);
    
    // Cache key should include org ID if filtering
    const cacheKey = orgId ? `${userId}_${orgId}` : userId;
    
    // Always bust the cache for now to ensure we get fresh data
    bustEquipmentCache(cacheKey);
    
    try {
      // Try using the edge function
      return await getEquipmentViaEdgeFunction(userId, orgId);
    } catch (edgeFunctionError) {
      console.error('Edge function failed:', edgeFunctionError);
      
      // Fall back to direct query
      return await getEquipmentDirectQuery(userId, orgId);
    }
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
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    // Bust cache for this user/org combination
    if (userId) {
      const cacheKey = orgId ? `${userId}_${orgId}` : userId;
      bustEquipmentCache(cacheKey);
    } else {
      bustEquipmentCache();
    }
    
    // Fetch fresh data
    return getEquipment(orgId);
  } catch (error) {
    // Handle refresh errors gracefully
    console.error('Error refreshing equipment:', error);
    return [];
  }
}

// Re-export cache clearing function for use during login/logout
export { clearEquipmentCache };

// Export the direct query function for testing purposes
export { getEquipmentDirectQuery };
