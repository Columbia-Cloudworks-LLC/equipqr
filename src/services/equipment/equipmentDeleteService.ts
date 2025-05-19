
import { supabase } from "@/integrations/supabase/client";

interface PermissionResponse {
  has_permission: boolean;
  reason?: string;
}

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
    
    // Check access using edge function to avoid RLS recursion
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
      throw new Error('You do not have permission to delete this equipment');
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
    
    // Set cache busting flag for equipment list refresh
    try {
      window.localStorage.setItem('equipment_cache_bust', 'true');
    } catch (e) {
      console.warn('Could not set cache bust flag:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteEquipment:', error);
    throw error;
  }
}
