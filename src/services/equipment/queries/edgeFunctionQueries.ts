
import { Equipment } from "@/types";
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";
import { checkEquipmentCache, saveEquipmentCache } from "../caching/equipmentCache";
import { processEquipmentList } from "../utils/equipmentFormatting";

/**
 * Fetch equipment data using the edge function
 */
export async function getEquipmentViaEdgeFunction(userId: string, orgId?: string): Promise<Equipment[]> {
  try {
    console.log("Fetching equipment via edge function");
    
    // Check cache first
    const cacheKey = orgId ? `${userId}_${orgId}` : userId;
    const cachedData = checkEquipmentCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Call the edge function
    const response = await invokeEdgeFunction('list_user_equipment', { 
      user_id: userId,
      org_id: orgId || null
    });
    
    if (!response || !response.data) {
      console.error('Invalid response from equipment edge function:', response);
      throw new Error('Invalid response from equipment edge function');
    }
    
    // Process the data to ensure proper formatting
    const equipmentData = processEquipmentList(response.data);
    
    // Save the results to cache
    saveEquipmentCache(cacheKey, equipmentData);
    
    return equipmentData;
  } catch (error) {
    console.error('Error in getEquipmentViaEdgeFunction:', error);
    throw error;
  }
}
