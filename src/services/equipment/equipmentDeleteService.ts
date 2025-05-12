
import { supabase } from "@/integrations/supabase/client";

/**
 * Soft delete equipment
 */
export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    // Soft delete by setting deleted_at
    const { error } = await supabase
      .from('equipment')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteEquipment:', error);
    throw error;
  }
}
