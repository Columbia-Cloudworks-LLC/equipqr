
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if user has access to equipment using our optimized edge function
 * @param authUserId - The auth user ID
 * @param equipmentId - The equipment ID
 * @returns Object containing access check result
 */
export async function checkEquipmentAccess(authUserId: string, equipmentId: string) {
  try {
    // Verify access to this equipment using edge function
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
    
    if (!accessCheck?.has_permission) {
      console.error('User does not have access to this equipment');
      throw new Error('You do not have permission to view this equipment');
    }
    
    return accessCheck;
  } catch (error) {
    console.error('Error in checkEquipmentAccess:', error);
    throw error;
  }
}

/**
 * Check if user can edit equipment using our optimized edge function
 * @param authUserId - The auth user ID 
 * @param equipmentId - The equipment ID
 * @returns Boolean indicating whether user has edit permission
 */
export async function checkEquipmentEditPermission(authUserId: string, equipmentId: string) {
  try {
    // Check edit permission using optimized edge function
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
    
    return permissionCheck?.has_permission || false;
  } catch (error) {
    console.error('Error in checkEquipmentEditPermission:', error);
    return false;
  }
}

/**
 * Determine if a user can edit an equipment
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
    const editRoles = ['manager', 'creator', 'owner', 'admin'];
    canEdit = !!teamAccess.role && editRoles.includes(teamAccess.role);
  }
  
  return canEdit;
}
