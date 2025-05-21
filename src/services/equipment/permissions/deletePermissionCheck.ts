
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Check if the current user has permission to delete the equipment
 * @param equipmentId The ID of the equipment to check
 */
export async function checkDeletePermission(equipmentId: string): Promise<PermissionResult> {
  try {
    // Get current user session first
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to delete equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Get equipment details to check ownership
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('org_id')
      .eq('id', equipmentId)
      .single();
      
    if (equipmentError) {
      throw new Error(`Could not retrieve equipment: ${equipmentError.message}`);
    }
    
    if (!equipment) {
      throw new Error('Equipment not found');
    }
    
    // Check if user has owner or manager role in the organization
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUserId)
      .eq('org_id', equipment.org_id)
      .single();
      
    if (roleError && roleError.code !== 'PGRST116') {
      throw new Error(`Error checking permissions: ${roleError.message}`);
    }
    
    // Only organization owners and managers can delete equipment
    if (userRole && (userRole.role === 'owner' || userRole.role === 'manager')) {
      return {
        authUserId,
        teamId: null,
        orgId: equipment.org_id,
        hasPermission: true,
        reason: 'Organization ownership'
      };
    }
    
    return {
      authUserId,
      teamId: null,
      orgId: equipment.org_id,
      hasPermission: false,
      reason: 'Insufficient permissions to delete equipment'
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
