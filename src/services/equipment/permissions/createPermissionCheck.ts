
import { supabase } from "@/integrations/supabase/client";
import { getUserOrganizationId } from "@/utils/authUtils";
import { Json } from "@/integrations/supabase/types";

// Define a proper interface for permission check responses
interface PermissionResponse {
  has_permission: boolean;
  reason?: string;
  org_id?: string;
}

/**
 * Check if the current user has permission to create equipment
 * using our improved permission check function
 * @param authUserId - The auth user ID
 * @param teamId - Optional team ID if equipment is being assigned to a team
 * @returns Object containing permission check result
 */
export async function checkCreatePermission(authUserId: string, teamId?: string | null) {
  try {
    console.log('Checking create permission via edge function');
    const checkPermissionPayload = {
      user_id: authUserId,
      action: 'create',
      team_id: teamId && teamId !== 'none' ? teamId : null
    };
    
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke(
      'check_equipment_permission', 
      { body: checkPermissionPayload }
    );
    
    if (permissionError) {
      console.error('Error from check_equipment_permission edge function:', permissionError);
      console.log('Falling back to direct RPC check...');
      return fallbackPermissionCheck(authUserId, teamId);
    }
    
    if (!permissionCheck) {
      console.error('Permission check returned no data, falling back to direct RPC');
      return fallbackPermissionCheck(authUserId, teamId);
    }
    
    // Log raw response for debugging
    console.log('Raw permission check response:', permissionCheck);
    
    // Safely handle the response as PermissionResponse
    if (typeof permissionCheck === 'object' && 
        permissionCheck !== null && 
        'has_permission' in permissionCheck) {
      const response = permissionCheck as PermissionResponse;
      console.log('Processed permission check response:', response);
      
      if (!response.has_permission) {
        const reason = response.reason || 'unknown';
        throw new Error(`You don't have permission to create equipment. Reason: ${reason}`);
      }
      
      // Return the org_id from the response
      return { 
        hasPermission: true, 
        orgId: response.org_id 
      };
    } else {
      console.error('Invalid permission check response format:', permissionCheck);
      console.log('Falling back to direct RPC check...');
      return fallbackPermissionCheck(authUserId, teamId);
    }
  } catch (error) {
    console.error('Permission check error, attempting fallback:', error);
    // Always attempt fallback on any error
    try {
      return fallbackPermissionCheck(authUserId, teamId);
    } catch (fallbackError) {
      console.error('All permission checks failed:', fallbackError);
      throw fallbackError; // If both methods fail, propagate the error
    }
  }
}

/**
 * Fallback permission check using our improved database function
 */
export async function fallbackPermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using fallback permission check with RPC');
    
    // Use our improved database function through RPC
    const { data: permissionData, error: permissionError } = await supabase.rpc(
      'check_equipment_create_permission',
      { 
        p_user_id: authUserId,
        p_team_id: teamId && teamId !== 'none' ? teamId : null
      }
    );
    
    if (permissionError) {
      console.error('Error checking permission:', permissionError);
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }
    
    if (!permissionData || permissionData.length === 0) {
      console.error('Permission check returned no data');
      throw new Error('Failed to determine permission');
    }
    
    if (!permissionData[0].has_permission) {
      const reason = permissionData[0].reason || 'unknown';
      throw new Error(`You don't have permission to create equipment. Reason: ${reason}`);
    }
    
    return { 
      hasPermission: true, 
      orgId: permissionData[0].org_id 
    };
  } catch (error) {
    console.error('Fallback permission check failed:', error);
    throw error;
  }
}
