
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
    console.log('Checking permission via optimized edge function');
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
 * Uses direct RPC calls to our optimized DB functions
 * @param authUserId - The auth user ID
 * @param teamId - Optional team ID if equipment is being assigned to a team
 * @returns Object containing permission check result
 */
export async function fallbackPermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using fallback permission check with direct RPC');
    
    // Use the non-recursive DB function via RPC
    const { data: permissionData, error: permissionError } = await supabase.rpc(
      'check_equipment_create_permission',
      { 
        p_user_id: authUserId,
        p_team_id: teamId || null
      }
    );
    
    if (permissionError) {
      console.error('Error in fallback permission check:', permissionError);
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }
    
    if (!permissionData || permissionData.length === 0 || !permissionData[0].has_permission) {
      const reason = permissionData?.[0]?.reason || 'unknown';
      throw new Error(`You don't have permission to create equipment. Reason: ${reason}`);
    }
    
    const orgId = permissionData[0].org_id;
    
    if (!orgId) {
      throw new Error('Failed to determine organization ID for equipment creation');
    }
    
    console.log(`Fallback permission check successful. Using org ID: ${orgId}`);
    
    return { 
      hasPermission: true, 
      orgId 
    };
  } catch (error) {
    console.error('Fallback permission check failed:', error);
    throw error;
  }
}
