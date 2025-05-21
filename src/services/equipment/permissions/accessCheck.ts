
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';
import { Equipment } from '@/types/equipment';

/**
 * Check if the current user has permission to access the specified equipment
 */
export async function checkAccessPermission(equipmentId: string): Promise<PermissionResult> {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to access equipment');
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
    
    // Use RPC function to check permission - using rpc_check_equipment_permission
    const { data, error } = await supabase.rpc('rpc_check_equipment_permission', {
      user_id: authUserId,
      action: 'view',
      equipment_id: equipmentId
    });
    
    if (error) {
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    // Process the result
    return {
      authUserId,
      teamId: equipment.team_id,
      orgId: equipment.org_id,
      hasPermission: data.has_permission === true,
      reason: data.reason || 'Permission check completed'
    };
  } catch (error: any) {
    console.error('Error checking equipment access:', error);
    return {
      authUserId: '',
      teamId: null,
      orgId: null,
      hasPermission: false,
      reason: `Error: ${error.message}`
    };
  }
}

/**
 * Check if the current user has view access to all equipment in an organization or team
 */
export async function checkOrgOrTeamAccess(
  orgId?: string,
  teamId?: string
): Promise<PermissionResult> {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to access equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    if (!orgId && !teamId) {
      throw new Error('Either organization ID or team ID must be provided');
    }
    
    let hasAccess = false;
    let reason = '';
    
    if (teamId) {
      // Check team access
      const { data, error } = await supabase.rpc('rpc_check_equipment_permission', {
        user_id: authUserId,
        action: 'view',
        team_id: teamId
      });
      
      if (error) {
        throw new Error(`Team permission check failed: ${error.message}`);
      }
      
      hasAccess = data.has_permission === true;
      reason = data.reason || 'Team permission check completed';
    } else if (orgId) {
      // Check organization access (user belongs to organization)
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', authUserId)
        .single();
        
      if (profileError) {
        throw new Error(`User profile check failed: ${profileError.message}`);
      }
      
      hasAccess = userProfile.org_id === orgId;
      reason = hasAccess ? 'User belongs to organization' : 'User does not belong to organization';
    }
    
    return {
      authUserId,
      teamId: teamId || null,
      orgId: orgId || null,
      hasPermission: hasAccess,
      reason
    };
  } catch (error: any) {
    console.error('Error checking organization or team access:', error);
    return {
      authUserId: '',
      teamId: null,
      orgId: null,
      hasPermission: false,
      reason: `Error: ${error.message}`
    };
  }
}
