
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the current user has permission to update a specific equipment
 */
export async function checkUpdatePermission(equipmentId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('check_equipment_edit_permission', {
      body: { equipment_id: equipmentId }
    });

    if (error) {
      console.error('Error checking equipment edit permission:', error);
      return false;
    }

    return data?.has_permission === true;
  } catch (error) {
    console.error('Failed to check equipment edit permission:', error);
    return false;
  }
}

// Alias for checkUpdatePermission for better semantic naming
export const checkEditPermission = checkUpdatePermission;
