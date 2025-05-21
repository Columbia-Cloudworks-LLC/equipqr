
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the current user has permission to access a specific equipment
 */
export async function checkAccessPermission(equipmentId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('check_equipment_access', {
      body: { equipment_id: equipmentId }
    });

    if (error) {
      console.error('Error checking equipment access permission:', error);
      return false;
    }

    return data?.has_permission === true;
  } catch (error) {
    console.error('Failed to check equipment access permission:', error);
    return false;
  }
}

// Alias for checkAccessPermission for better semantic naming
export const checkViewPermission = checkAccessPermission;
