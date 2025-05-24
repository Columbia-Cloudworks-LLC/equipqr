
import { Equipment } from "@/types";
import { invokeEdgeFunction } from "@/utils/edgeFunctions";

/**
 * Get equipment via edge function with better error handling and format validation
 */
export async function getEquipmentViaEdgeFunction(userId: string, orgId?: string): Promise<Equipment[]> {
  try {
    console.log(`Calling edge function for user ${userId}, org: ${orgId}`);
    
    const response = await invokeEdgeFunction('list_user_equipment', {
      user_id: userId,
      org_id: orgId
    });
    
    console.log('Raw edge function response:', response);
    
    // The edge function should return an array directly, not wrapped in an object
    if (Array.isArray(response)) {
      console.log(`Edge function returned ${response.length} equipment items directly`);
      return response;
    }
    
    // If it's wrapped in an object, try to extract the array
    if (response && typeof response === 'object') {
      // Try common response wrapper formats
      if (Array.isArray(response.equipment)) {
        console.log(`Edge function returned ${response.equipment.length} equipment items in 'equipment' property`);
        return response.equipment;
      }
      
      if (Array.isArray(response.data)) {
        console.log(`Edge function returned ${response.data.length} equipment items in 'data' property`);
        return response.data;
      }
      
      if (Array.isArray(response.items)) {
        console.log(`Edge function returned ${response.items.length} equipment items in 'items' property`);
        return response.items;
      }
    }
    
    console.warn('Edge function response format not recognized:', response);
    throw new Error(`Unexpected response format from equipment edge function: ${typeof response}`);
    
  } catch (error) {
    console.error('Error in getEquipmentViaEdgeFunction:', error);
    throw error;
  }
}
