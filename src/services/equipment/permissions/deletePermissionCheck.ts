
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Check if the current user has permission to delete the specified equipment
 * @param equipmentId The ID of the equipment to check
 */
export async function checkDeletePermission(equipmentId: string): Promise<PermissionResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to delete equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Use the unified permissions function
    const { data, error } = await supabase.functions.invoke('permissions', {
      body: {
        userId: authUserId,
        resource: 'equipment',
        action: 'delete',
        resourceId: equipmentId
      }
    });
    
    if (error) {
      return {
        authUserId,
        teamId: null,
        orgId: null,
        hasPermission: false,
        reason: `Permission check failed: ${error.message}`
      };
    }
    
    // Get equipment details for context
    const { data: equipment } = await supabase
      .from('equipment')
      .select('org_id, team_id')
      .eq('id', equipmentId)
      .single();
    
    return {
      authUserId,
      teamId: equipment?.team_id || null,
      orgId: equipment?.org_id || null,
      hasPermission: data?.has_permission || false,
      reason: data?.reason || 'Permission check completed'
    };
  } catch (error: any) {
    console.error('Error checking delete permission:', error);
    return {
      authUserId: '',
      teamId: null,
      orgId: null,
      hasPermission: false,
      reason: `Error: ${error.message}`
    };
  }
}
