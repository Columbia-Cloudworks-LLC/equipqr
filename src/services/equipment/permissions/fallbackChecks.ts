
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
      
      // Ensure data is of the expected type
      const typedData = data as DirectDBPermissionResult;
      
      // Check if data and permission_check exist and have expected structure
      if (!typedData || !typedData.permission_check) {
        throw new Error('Invalid response format from permission check');
      }
      
      const permResult = typedData.permission_check;
      
      // Safely check the has_permission property
      const hasPermission = typeof permResult === 'object' && 
                            permResult !== null && 
                            'has_permission' in permResult && 
                            !!permResult.has_permission;
      
      if (!hasPermission) {
        throw new Error('Permission denied by fallback check');
      }
      
      // Safely extract org_id and reason
      const orgId = typeof permResult === 'object' && 
                    permResult !== null && 
                    'org_id' in permResult ? 
                    permResult.org_id as string : 
                    (typedData.user_info?.user_org_id || null);
      
      const reason = typeof permResult === 'object' && 
                     permResult !== null && 
                     'reason' in permResult ? 
                     permResult.reason as string : 
                     'fallback_success';
      
      return {
        canCreate: true,
        orgId: orgId,
        reason: reason
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
  
  // Validate the response structure
  if (!data) {
    throw new Error('Empty response from permission check');
  }
  
  // Type assertion with runtime validation
  const typedData = data as { has_permission?: boolean; org_id?: string; reason?: string };
  
  // Validate required properties exist
  if (typeof typedData !== 'object' || !('has_permission' in typedData)) {
    throw new Error('Invalid response format: missing has_permission property');
  }
  
  // Check if permission is granted
  if (!typedData.has_permission) {
    throw new Error('Permission denied by database check');
  }
  
  return {
    canCreate: !!typedData.has_permission,
    orgId: (typedData.org_id as string) || null,
    reason: (typedData.reason as string) || 'direct_db_check'
  };
};
