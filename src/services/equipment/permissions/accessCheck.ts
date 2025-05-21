
/**
 * Check functions for equipment access permissions
 */
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Check if the current user has access to view the equipment
 */
export async function checkViewPermission(equipmentId: string): Promise<PermissionResult> {
  try {
    if (!equipmentId) {
      return {
        authUserId: '',
        teamId: null,
        orgId: null,
        hasPermission: false,
        reason: 'Invalid equipment ID'
      };
    }

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData?.session?.user?.id;

    if (!authUserId) {
      return {
        authUserId: '',
        teamId: null,
        orgId: null,
        hasPermission: false,
        reason: 'Not authenticated'
      };
    }

    // Check if the user has permission to view this equipment
    const { data, error } = await supabase.rpc('check_equipment_permission', {
      p_equipment_id: equipmentId,
      p_user_id: authUserId,
      p_action: 'view'
    });

    if (error) {
      console.error('Error checking equipment view permission:', error);
      return {
        authUserId,
        teamId: null,
        orgId: null,
        hasPermission: false,
        reason: `Error checking permission: ${error.message}`
      };
    }

    // Parse the returned data to match our expected permission result
    if (data && typeof data === 'object') {
      return {
        authUserId,
        teamId: data.team_id || null,
        orgId: data.org_id || null,
        hasPermission: !!data.can_access,
        reason: data.reason || 'Unknown'
      };
    }

    return {
      authUserId,
      teamId: null,
      orgId: null,
      hasPermission: false,
      reason: 'Invalid response format from permission check'
    };
  } catch (error: any) {
    console.error('Error in checkViewPermission:', error);
    return {
      authUserId: '',
      teamId: null,
      orgId: null,
      hasPermission: false,
      reason: `Exception: ${error.message}`
    };
  }
}

/**
 * Check if the current user has general access to the equipment
 */
export async function checkAccessPermission(equipmentId: string): Promise<PermissionResult> {
  // For now, access permission is the same as view permission
  return checkViewPermission(equipmentId);
}

/**
 * Check if the current user has permission to edit the equipment
 */
export async function checkEquipmentEditPermission(equipmentId: string): Promise<PermissionResult> {
  try {
    if (!equipmentId) {
      return {
        authUserId: '',
        teamId: null,
        orgId: null,
        hasPermission: false,
        reason: 'Invalid equipment ID'
      };
    }

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData?.session?.user?.id;

    if (!authUserId) {
      return {
        authUserId: '',
        teamId: null,
        orgId: null,
        hasPermission: false,
        reason: 'Not authenticated'
      };
    }

    // Check if the user has permission to edit this equipment
    const { data, error } = await supabase.rpc('check_equipment_permission', {
      p_equipment_id: equipmentId,
      p_user_id: authUserId,
      p_action: 'edit'
    });

    if (error) {
      console.error('Error checking equipment edit permission:', error);
      return {
        authUserId,
        teamId: null,
        orgId: null,
        hasPermission: false,
        reason: `Error checking permission: ${error.message}`
      };
    }

    // Parse the returned data properly
    if (data && typeof data === 'object') {
      return {
        authUserId,
        teamId: data.team_id || null,
        orgId: data.org_id || null,
        hasPermission: !!data.can_edit,
        reason: data.reason || 'Unknown'
      };
    }

    return {
      authUserId,
      teamId: null,
      orgId: null,
      hasPermission: false,
      reason: 'Invalid response format from permission check'
    };
  } catch (error: any) {
    console.error('Error in checkEquipmentEditPermission:', error);
    return {
      authUserId: '',
      teamId: null,
      orgId: null,
      hasPermission: false,
      reason: `Exception: ${error.message}`
    };
  }
}
