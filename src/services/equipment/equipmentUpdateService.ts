
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { checkUpdatePermission } from "./permissions/updatePermissionCheck";
import { prepareEquipmentForUpdate, updateEquipmentInDb } from "./db/equipmentUpdateDbService";
import { saveEquipmentAttributes } from "./attributesService";

/**
 * Update existing equipment
 */
export async function updateEquipment(id: string, equipment: Partial<Equipment>): Promise<Equipment> {
  try {
    // Get the current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to update equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    console.log('Updating equipment with ID:', id);
    console.log('Auth user ID:', authUserId);
    
    // Check access permission
    await checkUpdatePermission(authUserId, id);
    
    // Extract attributes before sending to database
    const attributes = equipment.attributes || [];
    const equipmentData = { ...equipment };
    delete equipmentData.attributes;
    
    // Process and prepare equipment data
    const processedEquipment = prepareEquipmentForUpdate(equipmentData);
    console.log('Processed equipment data:', processedEquipment);
    
    // Update the equipment in the database
    const updatedEquipment = await updateEquipmentInDb(id, processedEquipment);
    
    // Update attributes
    try {
      console.log('Saving equipment attributes:', attributes);
      const updatedAttributes = await saveEquipmentAttributes(id, attributes);
      console.log('Updated attributes:', updatedAttributes);
      return { ...updatedEquipment, attributes: updatedAttributes } as Equipment;
    } catch (attrError) {
      console.error('Error updating equipment attributes:', attrError);
      // Return equipment without updated attributes on error
      return updatedEquipment as Equipment;
    }
  } catch (error) {
    console.error('Error in updateEquipment:', error);
    throw error;
  }
}
