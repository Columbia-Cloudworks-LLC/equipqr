
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Check if the current user has permission to create equipment
 * @param teamId Optional team ID if creating equipment for a specific team
 */
export async function checkCreatePermission(teamId?: string | null): Promise<PermissionResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to create equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Use the fixed database function with better error handling
    const { data, error } = await supabase.rpc('check_equipment_create_permission', {
      p_user_id: authUserId,
      p_team_id: teamId || null,
      p_org_id: null // Let the function determine the org
    });
    
    if (error) {
      console.error('Permission check error:', error);
      return {
        authUserId,
        teamId: teamId || null,
        orgId: null,
        hasPermission: false,
        reason: `Permission check failed: ${error.message}`
      };
    }
    
    console.log('Permission check result:', data);
    
    // The function returns a table, so we need the first row
    const result = Array.isArray(data) ? data[0] : data;
    
    if (!result) {
      console.error('Permission check returned no data');
      return {
        authUserId,
        teamId: teamId || null,
        orgId: null,
        hasPermission: false,
        reason: 'Permission check returned no data'
      };
    }
    
    return {
      authUserId,
      teamId: teamId || null,
      orgId: result.org_id || null,
      hasPermission: result.has_permission || false,
      reason: result.reason || 'Permission check completed'
    };
  } catch (error: any) {
    console.error('Error checking create permission:', error);
    return {
      authUserId: '',
      teamId: null,
      orgId: null,
      hasPermission: false,
      reason: `Error: ${error.message}`
    };
  }
}
