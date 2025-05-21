
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
    const { data: permissionData, error } = await supabase.rpc(
      'can_access_equipment',
      {
        p_uid: authUserId,
        p_equipment_id: equipmentId
      }
    );

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

    // Process the response from the RPC function
    if (typeof permissionData === 'boolean') {
      return {
        authUserId,
        teamId: null, 
        orgId: null,
        hasPermission: permissionData,
        reason: permissionData ? 'Access granted' : 'Access denied'
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
    const { data: permissionData, error } = await supabase.rpc(
      'can_edit_equipment',
      {
        p_uid: authUserId,
        p_equipment_id: equipmentId
      }
    );

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

    // Process the response from the RPC function
    if (typeof permissionData === 'boolean') {
      return {
        authUserId,
        teamId: null,
        orgId: null,
        hasPermission: permissionData,
        reason: permissionData ? 'Edit permission granted' : 'Edit permission denied'
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
