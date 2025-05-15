
import { supabase } from "@/integrations/supabase/client";

interface PermissionResponse {
  has_permission: boolean;
  reason?: string;
  role?: string;
}

/**
 * Check if user has permission to update equipment
 * @param authUserId - The auth user ID 
 * @param equipmentId - The equipment ID
 * @returns Permission check result
 */
export async function checkUpdatePermission(authUserId: string, equipmentId: string): Promise<PermissionResponse> {
  try {
    // Verify permission to update this equipment using edge function
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke('check_equipment_permission', {
      body: { 
        user_id: authUserId,
        equipment_id: equipmentId,
        action: 'edit'
      }
    });
    
    if (permissionError) {
      console.error('Error checking equipment edit permission:', permissionError);
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }
    
    const response = permissionCheck as PermissionResponse;
    
    if (!response || !response.has_permission) {
      const reason = response?.reason || 'unknown';
      console.error('Update permission denied:', reason);
      throw new Error(`You do not have permission to edit this equipment. Reason: ${reason}`);
    }
    
    return response;
  } catch (error) {
    console.error('Error in checkUpdatePermission:', error);
    throw error;
  }
}
