
import { supabase } from '@/integrations/supabase/client';
import { PermissionResult } from './types';

/**
 * Check if the current user has permission to access the specified equipment
 */
export async function checkAccessPermission(equipmentId: string): Promise<PermissionResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to access equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    const { data, error } = await supabase.functions.invoke('permissions', {
      body: {
        userId: authUserId,
        resource: 'equipment',
        action: 'read',
        resourceId: equipmentId
      }
    });
    
    if (error) {
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    return {
      authUserId,
      teamId: null,
      orgId: null,
      hasPermission: data?.has_permission || false,
      reason: data?.reason || 'Permission check completed'
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
 * Check if the current user has permission to edit the equipment
 */
export async function checkEquipmentEditPermission(equipmentId: string): Promise<PermissionResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to edit equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    const { data, error } = await supabase.functions.invoke('permissions', {
      body: {
        userId: authUserId,
        resource: 'equipment',
        action: 'edit',
        resourceId: equipmentId
      }
    });
    
    if (error) {
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    return {
      authUserId,
      teamId: null,
      orgId: null,
      hasPermission: data?.has_permission || false,
      reason: data?.reason || 'Permission check completed'
    };
  } catch (error: any) {
    console.error('Error checking equipment edit permission:', error);
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
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to access equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    
    if (!orgId && !teamId) {
      throw new Error('Either organization ID or team ID must be provided');
    }
    
    const resource = teamId ? 'team' : 'organization';
    const resourceId = teamId || orgId;
    
    const { data, error } = await supabase.functions.invoke('permissions', {
      body: {
        userId: authUserId,
        resource,
        action: 'read',
        resourceId
      }
    });
    
    if (error) {
      throw new Error(`Permission check failed: ${error.message}`);
    }
    
    return {
      authUserId,
      teamId: teamId || null,
      orgId: orgId || null,
      hasPermission: data?.has_permission || false,
      reason: data?.reason || 'Permission check completed'
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
