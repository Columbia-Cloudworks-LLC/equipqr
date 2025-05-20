
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
 */
export async function getEquipment(): Promise<Equipment[]> {
  try {
    console.log('Fetching all equipment for current user');
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
    
    // Check cache first but skip if cache busting is requested
    if (!window.localStorage.getItem('equipment_cache_bust')) {
      const cachedEquipment = checkEquipmentCache(userId);
      if (cachedEquipment) {
        console.log(`Using ${cachedEquipment.length} cached equipment items for user ${userId.slice(0, 8)}...`);
        return cachedEquipment;
      }
    } else {
      // Clear cache busting flag after use
      window.localStorage.removeItem('equipment_cache_bust');
    }
    
    // Try the edge function first
    try {
      return await getEquipmentViaEdgeFunction(userId);
    } catch (edgeFunctionError) {
      console.warn('Edge function failed, falling back to direct query:', edgeFunctionError);
      
      // Fall back to direct query
      return await getEquipmentDirectQuery(userId);
    }
  } catch (error) {
    console.error('Error in getEquipment:', error);
    
    // Show more context about the error without disrupting UI
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Fallback to direct query if there's an exception
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (userId) {
        return await getEquipmentDirectQuery(userId);
      }
      
      console.warn('Returning empty equipment list due to errors');
      return []; 
    } catch (fallbackError) {
      console.error('Equipment fallback also failed:', fallbackError);
      
      console.warn('Returning empty equipment list due to errors in fallback');
      return []; 
    }
  }
}

/**
 * Force refresh equipment data by busting the cache
 */
export async function refreshEquipment(): Promise<Equipment[]> {
  try {
    // Get current user ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    // Bust cache for this user
    if (userId) {
      bustEquipmentCache(userId);
    } else {
      bustEquipmentCache();
    }
    
    // Fetch fresh data
    return getEquipment();
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
