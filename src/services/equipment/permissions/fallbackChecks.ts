
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Direct database check using RPC for equipment create permission
 * This is used as a fallback when the edge function fails
 */
export async function directDatabasePermissionCheck(
  authUserId: string,
  teamId?: string | null,
  orgId?: string | null
): Promise<PermissionResult> {
  console.log('Using direct database permission check', { authUserId, teamId, orgId });
  
  try {
    const params: { p_user_id: string; p_team_id?: string | null; p_org_id?: string | null } = {
      p_user_id: authUserId,
      p_team_id: teamId || null
    };

    // Only add orgId if provided
    if (orgId) {
      params.p_org_id = orgId;
    }
    
    const { data, error } = await supabase.rpc(
      'simplified_equipment_create_permission',
      params
    );
    
    if (error) throw error;
    
    if (!data) {
      throw new Error('Permission check returned no data');
    }
    
    // Handle the response with proper type checking
    const hasPermission = typeof data === 'object' && 'can_create' in data ? !!data.can_create : false;
    const resultOrgId = typeof data === 'object' && 'org_id' in data ? data.org_id : orgId;
    const reason = typeof data === 'object' && 'reason' in data ? String(data.reason) : 'unknown';
    
    return {
      authUserId,
      teamId: teamId || null,
      orgId: resultOrgId || null,
      hasPermission,
      reason
    };
  } catch (error: any) {
    console.error('Direct permission check failed:', error);
    return {
      authUserId,
      teamId: teamId || null,
      orgId: orgId || null,
      hasPermission: false,
      reason: `Error: ${error.message || 'Unknown database error'}`
    };
  }
}

/**
 * Fallback permission checking function that tries multiple approaches
 */
export async function fallbackPermissionCheck(
  authUserId: string,
  teamId?: string | null,
  orgId?: string | null
): Promise<PermissionResult> {
  try {
    // First try the direct database approach
    return await directDatabasePermissionCheck(authUserId, teamId, orgId);
  } catch (error) {
    console.error('All permission check approaches failed:', error);
    
    // If all approaches fail, return a failure result
    return {
      authUserId,
      teamId: teamId || null,
      orgId: orgId || null,
      hasPermission: false,
      reason: `Error: Unable to verify permission: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
