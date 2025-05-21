
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Check if the current user has permission to create equipment
 * @param teamId Optional team ID if creating equipment for a specific team
 */
export async function checkCreatePermission(teamId?: string | null): Promise<PermissionResult> {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to create equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Call the edge function to check permission
    const { data, error } = await supabase.functions.invoke('check_equipment_create_permission', {
      body: { 
        user_id: authUserId, 
        team_id: teamId || null 
      }
    });
    
    if (error) {
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    if (!data || !data.can_create) {
      return {
        authUserId,
        teamId: teamId || null,
        orgId: null,
        hasPermission: false,
        reason: data?.reason || 'Permission denied'
      };
    }
    
    return {
      authUserId,
      teamId: teamId || null,
      orgId: data.org_id,
      hasPermission: true,
      reason: data.reason || 'Permission granted'
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
