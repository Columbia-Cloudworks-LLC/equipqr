
import { supabase } from "@/integrations/supabase/client";
import { getUserOrganizationId } from "@/utils/authUtils";

/**
 * Check if the current user has permission to create equipment
 * @param authUserId - The auth user ID
 * @param teamId - Optional team ID if equipment is being assigned to a team
 * @returns Object containing permission check result
 */
export async function checkCreatePermission(authUserId: string, teamId?: string | null) {
  try {
    console.log('Checking permission via edge function');
    const checkPermissionPayload: {
      user_id: string;
      action: string;
      team_id?: string;
    } = {
      user_id: authUserId,
      action: 'create'
    };
    
    // Add team_id to payload if provided
    if (teamId && teamId !== 'none') {
      Object.assign(checkPermissionPayload, { team_id: teamId });
    }
    
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke(
      'check_equipment_permission', 
      { body: checkPermissionPayload }
    );
    
    if (permissionError) {
      console.error('Error from check_equipment_permission edge function:', permissionError);
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }
    
    if (!permissionCheck?.has_permission) {
      const reason = permissionCheck?.reason || 'unknown';
      throw new Error(`You don't have permission to create equipment. Reason: ${reason}`);
    }
    
    // Return the org_id from the response
    return { 
      hasPermission: true, 
      orgId: permissionCheck.org_id 
    };
  } catch (error) {
    console.error('Permission check error:', error);
    throw error;
  }
}

/**
 * Fallback permission check if edge function fails
 * @param authUserId - The auth user ID
 * @param teamId - Optional team ID if equipment is being assigned to a team
 * @returns Object containing permission check result
 */
export async function fallbackPermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    let orgId: string;
    
    if (teamId && teamId !== 'none') {
      // For team equipment, get team's org ID
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', teamId)
        .is('deleted_at', null)
        .single();
        
      if (teamError) {
        throw new Error(`Failed to retrieve team information: ${teamError.message}`);
      }
      
      orgId = teamData.org_id;
      console.log(`Using team's org ID: ${orgId}`);
    } else {
      // Use user's organization for non-team equipment
      orgId = await getUserOrganizationId(authUserId);
      console.log(`Using user's org ID: ${orgId}`);
    }
    
    if (!orgId) {
      throw new Error('Failed to determine organization ID for equipment creation');
    }
    
    return { 
      hasPermission: true, 
      orgId 
    };
  } catch (error) {
    console.error('Fallback permission check failed:', error);
    throw error;
  }
}
