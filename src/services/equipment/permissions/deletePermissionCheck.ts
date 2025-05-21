
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Check if the current user has permission to delete the specified equipment
 * @param equipmentId The ID of the equipment to check
 */
export async function checkDeletePermission(equipmentId: string): Promise<PermissionResult> {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to delete equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Fetch the equipment first to check if it exists
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, org_id, team_id')
      .eq('id', equipmentId)
      .single();
      
    if (equipmentError) {
      if (equipmentError.code === 'PGRST116') {
        return {
          authUserId,
          teamId: null,
          orgId: null,
          hasPermission: false,
          reason: 'Equipment not found'
        };
      }
      throw new Error(`Error fetching equipment: ${equipmentError.message}`);
    }
    
    // Use RPC function to check permission for delete action
    const { data, error } = await supabase.rpc('rpc_check_equipment_permission', {
      user_id: authUserId,
      action: 'edit', // Using 'edit' as the closest proxy for delete permission
      equipment_id: equipmentId
    });
    
    if (error) {
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    // Cast the result to get proper type access
    const result = data as { has_permission: boolean, reason: string };
    
    // Add additional check: Only the organization that owns equipment can delete it
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
    
    const isOrgOwner = userProfile && userProfile.org_id === equipment.org_id;
    
    return {
      authUserId,
      teamId: equipment.team_id,
      orgId: equipment.org_id,
      hasPermission: result.has_permission === true && isOrgOwner,
      reason: isOrgOwner ? result.reason : 'Only the equipment owner organization can delete equipment'
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
