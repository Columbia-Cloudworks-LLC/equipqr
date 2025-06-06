
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Soft delete equipment
 */
export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    if (!id) {
      throw new Error('Equipment ID is required');
    }
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: Please sign in again');
    }
    
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to delete equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    console.log('Deleting equipment:', id, 'User:', authUserId);
    
    // Check access using unified permissions function with delete action
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke('permissions', {
      body: {
        userId: authUserId,
        resource: 'equipment',
        action: 'delete',
        resourceId: id
      }
    });
    
    if (permissionError) {
      console.error('Error checking equipment delete permission:', permissionError);
      throw new Error(`Access check failed: ${permissionError.message}`);
    }
    
    console.log('Delete permission check response:', permissionCheck);
    
    if (!permissionCheck || !permissionCheck.has_permission) {
      const reason = permissionCheck?.reason || 'unknown';
      console.error('Delete access denied:', reason);
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
    
    toast.success('Equipment deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteEquipment:', error);
    toast.error('Failed to delete equipment', {
      description: error instanceof Error ? error.message : 'An unknown error occurred'
    });
    throw error;
  }
}
