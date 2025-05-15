
import { supabase } from "@/integrations/supabase/client";

interface PermissionResponse {
  has_permission: boolean;
  reason?: string;
  org_id?: string;
}

/**
 * Check if user has access to equipment using our improved permission function
 * @param authUserId - The auth user ID
 * @param equipmentId - The equipment ID
 * @returns Object containing access check result
 */
export async function checkEquipmentAccess(authUserId: string, equipmentId: string) {
  try {
    // Verify access to this equipment using improved function
    const { data: accessCheck, error: accessError } = await supabase.functions.invoke('check_equipment_permission', {
      body: {
        user_id: authUserId,
        equipment_id: equipmentId,
        action: 'view'
      }
    });
    
    if (accessError) {
      console.error('Error checking equipment access:', accessError);
      throw new Error(`Access check failed: ${accessError.message}`);
    }
    
    const response = accessCheck as PermissionResponse;
    
    if (!response || !response.has_permission) {
      console.error('User does not have access to this equipment');
      throw new Error('You do not have permission to view this equipment');
    }
    
    return response;
  } catch (error) {
    console.error('Error in checkEquipmentAccess:', error);
    throw error;
  }
}

/**
 * Check if user can edit equipment using our improved permission function
 * @param authUserId - The auth user ID 
 * @param equipmentId - The equipment ID
 * @returns Boolean indicating whether user has edit permission
 */
export async function checkEquipmentEditPermission(authUserId: string, equipmentId: string) {
  try {
    // Check edit permission using improved function
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
    return response?.has_permission || false;
  } catch (error) {
    console.error('Error in checkEquipmentEditPermission:', error);
    return false;
  }
}

/**
 * Determine if a user can edit an equipment based on team and org info
 * @param equipmentData - The equipment data with team and org info
 * @param userOrgId - The user's organization ID
 * @param teamAccess - The team access information
 * @returns Boolean indicating whether user has edit permission
 */
export function determineEditPermission(
  equipmentData: { team?: { org_id?: string } },
  userOrgId: string | undefined, 
  teamAccess?: { role?: string }
) {
  // Default: can edit if it's in user's org
  const isExternalOrg = equipmentData.team?.org_id && userOrgId && equipmentData.team.org_id !== userOrgId;
  let canEdit = !isExternalOrg; 
  
  if (isExternalOrg && teamAccess) {
    // Can edit if manager or higher role
    const editRoles = ['manager', 'owner', 'creator', 'admin'];
    canEdit = !!teamAccess.role && editRoles.includes(teamAccess.role);
  }
  
  return canEdit;
}
