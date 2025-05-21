import { supabase } from "@/integrations/supabase/client";
import { retry } from "@/utils/edgeFunctions/retry";

export interface PermissionCheckResult {
  has_permission: boolean;
  reason?: string;
}

/**
 * Check if a user has access to create equipment in an organization
 */
export async function checkCreatePermission(orgId: string) {
  try {
    console.log(`Checking equipment create permission for org: ${orgId}`);
    
    const { data, error } = await retry(() => 
      supabase.functions.invoke('check_equipment_create_permission', {
        body: { org_id: orgId }
      }), 3);
    
    if (error) {
      console.log('Create permission check error:', error);
      return false;
    }
    
    return data?.has_permission === true;
  } catch (error) {
    console.error('Create permission check failed:', error);
    return false;
  }
}

/**
 * Check if a user has permission to manage equipment for a specific organization
 */
export async function checkManageEquipmentPermission(orgId: string): Promise<boolean> {
  try {
    console.log(`Checking manage equipment permission for org: ${orgId}`);
    
    const { data, error } = await retry(() =>
      supabase.functions.invoke('check_manage_equipment_permission', {
        body: { org_id: orgId }
      }), 3);
    
    if (error) {
      console.error('Manage equipment permission check error:', error);
      return false;
    }
    
    return data?.has_permission === true;
  } catch (error) {
    console.error('Manage equipment permission check failed:', error);
    return false;
  }
}

/**
 * Check if a user has permission to view equipment for a specific organization
 */
export async function checkViewEquipmentPermission(orgId: string): Promise<boolean> {
  try {
    console.log(`Checking view equipment permission for org: ${orgId}`);
    
    const { data, error } = await retry(() =>
      supabase.functions.invoke('check_view_equipment_permission', {
        body: { org_id: orgId }
      }), 3);
    
    if (error) {
      console.error('View equipment permission check error:', error);
      return false;
    }
    
    return data?.has_permission === true;
  } catch (error) {
    console.error('View equipment permission check failed:', error);
    return false;
  }
}
