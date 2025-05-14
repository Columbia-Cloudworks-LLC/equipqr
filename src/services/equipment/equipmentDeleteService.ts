
import { supabase } from "@/integrations/supabase/client";

/**
 * Soft delete equipment
 */
export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    // Get the current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to delete equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Use the edge function to check if user has permission to edit this equipment
    // We use the same permission check for delete operations
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke('check_equipment_edit_permission', {
      body: {
        user_id: authUserId,
        equipment_id: id
      }
    });
    
    if (permissionError) {
      console.error('Error checking equipment delete permission:', permissionError);
      throw new Error('Failed to verify permissions: ' + permissionError.message);
    }
    
    if (!permissionCheck?.can_edit) {
      const reason = permissionCheck?.reason || 'unknown';
      console.error('Delete permission denied:', reason);
      throw new Error(`You don't have permission to delete this equipment (${reason})`);
    }
    
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
