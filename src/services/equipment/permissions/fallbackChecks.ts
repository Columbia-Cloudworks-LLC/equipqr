
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
      
      // Extract data from test function response
      const typedData = data as DirectDBPermissionResult;
      const permResult = typedData.permission_check;
      
      if (!permResult || !permResult.has_permission) {
        throw new Error('Permission denied by fallback check');
      }
      
      return {
        canCreate: true,
        orgId: permResult.org_id || typedData.user_info?.user_org_id || null,
        reason: 'fallback_success'
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
  
  if (!data || !data.has_permission) {
    throw new Error('Permission denied by database check');
  }
  
  return {
    canCreate: data.has_permission === true,
    orgId: data.org_id || null,
    reason: data.reason || 'direct_db_check'
  };
};
