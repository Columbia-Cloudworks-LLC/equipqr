
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { checkUpdatePermission } from "./permissions/updatePermissionCheck";
import { prepareEquipmentForUpdate, updateEquipmentInDb } from "./db/equipmentUpdateDbService";
import { saveEquipmentAttributes } from "./attributesService";
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";
import { toast } from "sonner";
import { invalidateEquipmentCache } from "./services/cacheService";

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
    
    // Check access permission using edge function for reliability
    try {
      const permissionCheck = await invokeEdgeFunction('check_equipment_edit_permission', {
        user_id: authUserId,
        equipment_id: id
      });
      
      if (!permissionCheck?.can_edit) {
        throw new Error(`Permission denied: ${permissionCheck?.reason || 'You do not have permission to edit this equipment'}`);
      }
      
      console.log('Permission check passed:', permissionCheck);
    } catch (permError) {
      console.error('Error checking edit permission (using fallback):', permError);
      // Fall back to regular permission check
      await checkUpdatePermission(id);
    }
    
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
      
      // Immediately invalidate all equipment cache after successful update
      invalidateEquipmentCache(authUserId, equipment.org_id, id);
      
      return { ...updatedEquipment, attributes: updatedAttributes } as Equipment;
    } catch (attrError) {
      console.error('Error updating equipment attributes:', attrError);
      
      // Still invalidate cache even if attributes failed to update
      invalidateEquipmentCache(authUserId, equipment.org_id, id);
      
      // Return equipment without updated attributes on error
      return updatedEquipment as Equipment;
    }
  } catch (error) {
    console.error('Error in updateEquipment:', error);
    throw error;
  }
}
