
import { supabase } from "@/integrations/supabase/client";
import { DirectDBPermissionResult, PermissionResult } from "./types";

/**
 * Fallback permission check when edge function fails
 * Uses direct database RPC call
 */
export const fallbackPermissionCheck = async (
  authUserId: string,
  teamId?: string | null
): Promise<PermissionResult> => {
  try {
    console.log('Using fallback permission check with params:', { authUserId, teamId });
    
    // Try to use a direct database function first
    try {
      const result = await directDatabasePermissionCheck(authUserId, teamId);
      return result;
    } catch (dbError) {
      console.error('Direct database permission check failed:', dbError);
      
      // Final fallback - use test function that returns more diagnostic info
      const { data, error } = await supabase.rpc(
        'test_equipment_permission_flow',
        { 
          auth_user_id: authUserId,
          team_id: teamId
        }
      );
      
      if (error) {
        console.error('Test permission flow failed:', error);
        throw error;
      }
      
      console.log('Test permission flow result:', data);
      
      // More defensive type checking for the fallback flow
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from permission check');
      }
      
      // Safe type assertion
      const typedData = data as DirectDBPermissionResult;
      
      // Verify the expected structure exists
      const permissionCheck = typedData.permission_check;
      if (!permissionCheck || typeof permissionCheck !== 'object') {
        throw new Error('Missing permission_check in response');
      }
      
      // Safely determine permission result
      const hasPermission = 'has_permission' in permissionCheck && Boolean(permissionCheck.has_permission);
      
      if (!hasPermission) {
        throw new Error('Permission denied by fallback check');
      }
      
      // Safely extract org_id and reason with fallbacks
      let orgId: string | null = null;
      if (permissionCheck && typeof permissionCheck === 'object' && 'org_id' in permissionCheck) {
        orgId = permissionCheck.org_id as string || null;
      } else if (typedData.user_info && typeof typedData.user_info === 'object' && 'user_org_id' in typedData.user_info) {
        orgId = typedData.user_info.user_org_id as string || null;
      }
      
      const reason = permissionCheck && typeof permissionCheck === 'object' && 'reason' in permissionCheck ? 
                    permissionCheck.reason as string : 'fallback_success';
      
      return {
        canCreate: true,
        orgId,
        reason
      };
    }
  } catch (error: any) {
    console.error('All fallback methods failed:', error);
    throw new Error(`Permission check failed after all fallbacks: ${error.message}`);
  }
};

/**
 * Direct database permission check via RPC
 */
export const directDatabasePermissionCheck = async (
  authUserId: string,
  teamId?: string | null
): Promise<PermissionResult> => {
  const { data, error } = await supabase.rpc(
    'rpc_check_equipment_permission',
    { 
      user_id: authUserId, 
      action: 'create',
      team_id: teamId
    }
  );
  
  if (error) {
    console.error('Direct DB permission check failed:', error);
    throw error;
  }
  
  // Validate the response exists
  if (!data) {
    throw new Error('Empty response from permission check');
  }
  
  // Safely work with the response object
  if (typeof data !== 'object') {
    throw new Error('Invalid response type from permission check');
  }
  
  // Type assertion with runtime validation
  const typedData = data as { has_permission?: boolean; org_id?: string; reason?: string };
  
  // Check if key properties exist
  const hasPermission = 'has_permission' in typedData && Boolean(typedData.has_permission);
  
  if (!hasPermission) {
    throw new Error('Permission denied by database check');
  }
  
  // Safe extraction of properties with fallbacks
  return {
    canCreate: hasPermission,
    orgId: 'org_id' in typedData ? (typedData.org_id as string) || null : null,
    reason: 'reason' in typedData ? (typedData.reason as string) || 'direct_db_check' : 'direct_db_check'
  };
};
