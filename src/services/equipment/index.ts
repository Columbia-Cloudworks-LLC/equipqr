
import { supabase } from "@/integrations/supabase/client";

/**
 * Get all equipment items that the current user has access to
 * This includes equipment owned by the user's organization
 * and equipment from teams the user belongs to
 */
export async function getEquipment() {
  try {
    console.log('Fetching all equipment for current user');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to view equipment');
    }
    
    const authUserId = sessionData.session.user.id;

    // Use the edge function to fetch equipment, which bypasses RLS recursion issues
    const { data, error } = await supabase.functions.invoke('list_user_equipment', {
      body: { user_id: authUserId }
    });
    
    if (error) {
      console.error('Error fetching equipment via edge function:', error);
      return []; // Return empty array instead of throwing
    }
    
    // Ensure we always have a valid array to work with
    const equipmentArray = Array.isArray(data) ? data : [];
    console.log(`Successfully fetched ${equipmentArray.length} equipment items via edge function`);
    
    return equipmentArray;
  } catch (error) {
    console.error('Error in getEquipment:', error);
    return []; // Return empty array on error
  }
}

// Re-export equipment service functions
export {
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentAttributes,
  saveEquipmentAttributes,
  recordScan
} from './equipmentDetailsService';
export { getEquipmentAttributes, saveEquipmentAttributes } from './attributesService';
export { recordScan } from './scanService';
export { getEquipmentById } from './equipmentDetailsService';
export { createEquipment } from './equipmentCreateService';
export { updateEquipment } from './equipmentUpdateService';
export { deleteEquipment } from './equipmentDeleteService';
