
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';
import { checkEquipmentEditPermission } from './accessCheck';

/**
 * Check if the current user has permission to update the equipment
 * @param equipmentId The ID of the equipment to check
 */
export async function checkUpdatePermission(equipmentId: string): Promise<PermissionResult> {
  try {
    // Get current user session first
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to update equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Check if user has permission to edit this equipment
    const permissionResult = await checkEquipmentEditPermission(equipmentId);
    
    if (!permissionResult.hasPermission) {
      throw new Error(`Permission denied: ${permissionResult.reason}`);
    }
    
    return permissionResult;
  } catch (error: any) {
    console.error('Error checking update permission:', error);
    throw error;
  }
}
