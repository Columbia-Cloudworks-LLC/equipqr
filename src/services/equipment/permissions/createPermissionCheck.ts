
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
    
    const { data, error } = await supabase.functions.invoke('permissions', {
      body: {
        userId: authUserId,
        resource: 'equipment',
        action: 'create',
        targetId: teamId || null
      }
    });
    
    if (error) {
      return {
        authUserId,
        teamId: teamId || null,
        orgId: null,
        hasPermission: false,
        reason: `Permission check failed: ${error.message}`
      };
    }
    
    return {
      authUserId,
      teamId: teamId || null,
      orgId: data?.org_id || null,
      hasPermission: data?.has_permission || false,
      reason: data?.reason || 'Permission check completed'
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
