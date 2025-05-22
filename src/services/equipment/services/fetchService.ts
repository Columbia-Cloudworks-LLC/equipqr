
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getEquipmentDirectQuery } from "../queries/directQueries";
import { getEquipmentViaEdgeFunction } from "../queries/edgeFunctionQueries";
import { generateCacheKey } from "./cacheService";
import { cacheEquipmentData } from "../queries/helpers/equipmentCache";

/**
 * Fetch equipment using the edge function with fallback to direct query
 * @param userId User ID
 * @param orgId Optional organization ID filter
 * @returns Promise resolving to array of equipment
 */
export async function fetchEquipment(userId: string, orgId?: string): Promise<Equipment[]> {
  console.log('Fetching equipment for user', userId, orgId ? `filtered by orgId: ${orgId}` : '');
  
  try {
    // Try using the edge function
    const edgeData = await getEquipmentViaEdgeFunction(userId, orgId);
    
    // Cache the edge function results
    cacheEquipmentData(userId, edgeData, orgId);
    
    return edgeData;
  } catch (edgeFunctionError) {
    console.error('Edge function failed:', edgeFunctionError);
    
    // Fall back to direct query
    const directData = await getEquipmentDirectQuery(userId, orgId);
    
    // No need to explicitly cache as getEquipmentDirectQuery handles caching
    
    return directData;
  }
}
