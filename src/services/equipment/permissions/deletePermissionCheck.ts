
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
    
    // Additional check: Only the organization that owns equipment can delete it
    const { data: equipment } = await supabase
      .from('equipment')
      .select('org_id, team_id')
      .eq('id', equipmentId)
      .single();
    
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
    
    const isOrgOwner = userProfile && equipment && userProfile.org_id === equipment.org_id;
    
    return {
      authUserId,
      teamId: equipment?.team_id || null,
      orgId: equipment?.org_id || null,
      hasPermission: (data?.has_permission || false) && isOrgOwner,
      reason: isOrgOwner ? (data?.reason || 'Permission granted') : 'Only the equipment owner organization can delete equipment'
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
