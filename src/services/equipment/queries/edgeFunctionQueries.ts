
/**
 * Edge function queries for equipment data
 */
import { Equipment } from "@/types";
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";
import { processEquipmentList } from "../utils/equipmentFormatting";
import { cacheEquipmentResults } from "../caching/equipmentCache";

/**
 * Get equipment data from the edge function
 */
export async function getEquipmentViaEdgeFunction(userId: string): Promise<Equipment[]> {
  try {
    console.log('Fetching equipment via edge function for user:', userId);
    
    const data = await invokeEdgeFunction('list_user_equipment', { user_id: userId }, 8000);
    
    // FIX: Add better validation to prevent app errors
    if (!data) {
      console.error('Invalid response from list_user_equipment function: null or undefined');
      throw new Error('Empty response from equipment service');
    }
    
    // Validate that we received an array
    if (!Array.isArray(data)) {
      console.error('Invalid response from list_user_equipment function:', data);
      throw new Error('Invalid response format from equipment service');
    }
    
    console.log(`Successfully fetched ${data.length} equipment items via edge function`);
    
    // Process the data to ensure all properties are set correctly
    const processedData = processEquipmentList(data);
    
    // Cache the results (with the user ID as a parameter)
    cacheEquipmentResults(processedData, userId);
    
    return processedData;
  } catch (error) {
    console.error('Error fetching equipment via edge function:', error);
    throw error;
  }
}
