
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getAppUserId } from "@/utils/authUtils";
import { saveEquipmentAttributes } from "./attributesService";
import { insertEquipment } from "./db/equipmentDbService";
import { checkCreatePermission, fallbackPermissionCheck } from "./permissions/createPermissionCheck";
import { prepareEquipmentData, extractAttributes } from "./utils/dataProcessing";

/**
 * Create new equipment - only for equipment owned by the current user's organization
 * or for teams the user has manager access to
 */
export async function createEquipment(equipment: Partial<Equipment>): Promise<Equipment> {
  try {
    // Ensure name is provided as it's required in the database
    if (!equipment.name) {
      throw new Error('Equipment name is required');
    }
    
    // Get the current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to create equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    console.log('Current auth user ID:', authUserId);
    
    // Convert auth user ID to app_user ID
    const appUserId = await getAppUserId(authUserId);
    console.log('Mapped to app_user ID:', appUserId);
    
    if (!appUserId) {
      throw new Error('Failed to retrieve user profile information');
    }
    
    let orgId;
    
    // First check permission using edge function
    try {
      const permissionResult = await checkCreatePermission(authUserId, equipment.team_id);
      orgId = permissionResult.orgId;
      console.log(`Permission check successful. Using org ID: ${orgId}`);
    } catch (edgeFnError) {
      // Fallback logic if edge function fails
      console.error('Edge function error, falling back to direct permission checks:', edgeFnError);
      
      try {
        const fallbackResult = await fallbackPermissionCheck(authUserId, equipment.team_id);
        orgId = fallbackResult.orgId;
      } catch (fallbackError) {
        console.error('Fallback permission check failed:', fallbackError);
        throw new Error('Could not verify permissions to create equipment. Please try again.');
      }
    }
    
    // Extract attributes before sending to database
    const attributes = extractAttributes(equipment);
    
    // Process and prepare equipment data
    const processedEquipment = prepareEquipmentData(equipment, appUserId, orgId);
    
    // Create the equipment record
    const data = await insertEquipment(processedEquipment);
    
    // If we have attributes, insert them
    if (attributes.length > 0) {
      try {
        console.log('Saving attributes:', attributes);
        const savedAttributes = await saveEquipmentAttributes(data.id, attributes);
        return { ...data, attributes: savedAttributes } as Equipment;
      } catch (attrError) {
        console.error('Error adding equipment attributes:', attrError);
        // Return equipment without attributes on attribute error
        return data as Equipment;
      }
    }
    
    return data as Equipment;
  } catch (error) {
    console.error('Error in createEquipment:', error);
    throw error;
  }
}
