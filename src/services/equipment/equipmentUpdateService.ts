
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { processDateFields } from "@/utils/authUtils";
import { saveEquipmentAttributes } from "./attributesService";

interface PermissionResponse {
  has_permission: boolean;
  reason?: string;
}

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
    
    // Check access using our non-recursive edge function
    const { data: accessCheck, error: accessError } = await supabase.functions.invoke('check_equipment_permission', {
      body: { 
        user_id: authUserId,
        equipment_id: id,
        action: 'edit'
      }
    });
    
    if (accessError) {
      console.error('Error checking equipment access:', accessError);
      throw new Error(`Access check failed: ${accessError.message}`);
    }
    
    const response = accessCheck as PermissionResponse;
    
    if (!response || !response.has_permission) {
      const reason = response?.reason || 'unknown';
      console.error('Access denied:', reason);
      throw new Error('You do not have permission to edit this equipment');
    }
    
    // Extract attributes before sending to database
    const attributes = equipment.attributes || [];
    const equipmentData = { ...equipment };
    delete equipmentData.attributes;
    
    // Handle 'none' value for team_id
    if (equipmentData.team_id === 'none') {
      equipmentData.team_id = null;
    }
    
    // Process dates and prepare data
    const processedEquipment = processDateFields({
      ...equipmentData,
      updated_at: new Date().toISOString(),
    }, ['install_date', 'warranty_expiration']);
    
    // Update the equipment
    const { data, error } = await supabase
      .from('equipment')
      .update(processedEquipment)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
    
    // Update attributes
    try {
      console.log('Saving updated attributes:', attributes);
      const updatedAttributes = await saveEquipmentAttributes(id, attributes);
      return { ...data, attributes: updatedAttributes } as Equipment;
    } catch (attrError) {
      console.error('Error updating equipment attributes:', attrError);
      // Return equipment without updated attributes on error
      return data as Equipment;
    }
  } catch (error) {
    console.error('Error in updateEquipment:', error);
    throw error;
  }
}
