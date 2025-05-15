
import { supabase } from "@/integrations/supabase/client";
import { getUserOrganizationId } from "@/utils/authUtils";
import { Json } from "@/integrations/supabase/types";

// Define a proper interface for permission check responses
interface PermissionResponse {
  has_permission: boolean;
  reason?: string;
  org_id?: string;
}

/**
 * Check if the current user has permission to create equipment
 * @param authUserId - The auth user ID
 * @param teamId - Optional team ID if equipment is being assigned to a team
 * @returns Object containing permission check result
 */
export async function checkCreatePermission(authUserId: string, teamId?: string | null) {
  try {
    console.log('Checking create permission via edge function');
    const checkPermissionPayload: {
      user_id: string;
      action: string;
      team_id?: string;
    } = {
      user_id: authUserId,
      action: 'create'
    };
    
    // Add team_id to payload if provided
    if (teamId && teamId !== 'none') {
      Object.assign(checkPermissionPayload, { team_id: teamId });
    }
    
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke(
      'check_equipment_permission', 
      { body: checkPermissionPayload }
    );
    
    if (permissionError) {
      console.error('Error from check_equipment_permission edge function:', permissionError);
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }
    
    if (!permissionCheck) {
      console.error('Permission check returned no data');
      throw new Error('Permission check failed: No response data received');
    }
    
    // Log raw response for debugging
    console.log('Raw permission check response:', permissionCheck);
    
    // Safely handle the response as PermissionResponse
    if (typeof permissionCheck === 'object' && 
        permissionCheck !== null && 
        'has_permission' in permissionCheck) {
      const response = permissionCheck as PermissionResponse;
      console.log('Processed permission check response:', response);
      
      if (!response.has_permission) {
        const reason = response.reason || 'unknown';
        throw new Error(`You don't have permission to create equipment. Reason: ${reason}`);
      }
      
      // Return the org_id from the response
      return { 
        hasPermission: true, 
        orgId: response.org_id 
      };
    } else {
      console.error('Invalid permission check response format:', permissionCheck);
      throw new Error('Permission check failed: Invalid response format');
    }
  } catch (error) {
    console.error('Permission check error:', error);
    throw error;
  }
}

/**
 * Fallback permission check if edge function fails
 * Uses direct RPC calls to our optimized DB functions
 * @param authUserId - The auth user ID
 * @param teamId - Optional team ID if equipment is being assigned to a team
 * @returns Object containing permission check result
 */
export async function fallbackPermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using fallback permission check with direct RPC');
    
    // Use optimized DB function via RPC
    const { data: permissionData, error: permissionError } = await supabase.rpc(
      'rpc_check_equipment_permission',
      { 
        user_id: authUserId,
        action: 'create',
        team_id: teamId || null,
        equipment_id: null
      }
    );
    
    if (permissionError) {
      console.error('Error in fallback permission check:', permissionError);
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }
    
    if (!permissionData) {
      console.error('Fallback permission check returned no data');
      throw new Error('Permission check failed: No response data received');
    }
    
    // Log the raw permission data for debugging
    console.log('Raw permission check RPC result:', permissionData);
    
    // Safely handle the response
    if (typeof permissionData === 'object' && 
        permissionData !== null && 
        'has_permission' in permissionData) {
        
      if (!permissionData.has_permission) {
        const reason = permissionData.reason || 'unknown';
        throw new Error(`You don't have permission to create equipment. Reason: ${reason}`);
      }
      
      const orgId = permissionData.org_id;
      
      if (!orgId) {
        throw new Error('Failed to determine organization ID for equipment creation');
      }
      
      console.log(`Fallback permission check successful. Using org ID: ${orgId}`);
      
      return { 
        hasPermission: true, 
        orgId 
      };
    } else {
      console.error('Invalid permission check response format:', permissionData);
      throw new Error('Permission check failed: Invalid response format');
    }
  } catch (error) {
    console.error('Fallback permission check failed:', error);
    throw error;
  }
}
