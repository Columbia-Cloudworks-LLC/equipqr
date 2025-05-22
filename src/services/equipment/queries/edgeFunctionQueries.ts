
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
    
    // Prepare the payload with explicit typing
    const payload = { 
      user_id: userId,
      org_id: orgId || null
    };
    
    console.log("Calling list_user_equipment with payload:", payload);
    
    // Call the edge function with a longer timeout
    const response = await invokeEdgeFunction('list_user_equipment', payload, 10000);
    
    if (!response) {
      console.error('Empty response from equipment edge function');
      throw new Error('No response from equipment edge function');
    }
    
    if (!response.data) {
      console.error('Invalid response format from equipment edge function:', response);
      throw new Error('Invalid response format from equipment edge function');
    }
    
    console.log(`Received ${response.data.length} equipment records from edge function`);
    
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
