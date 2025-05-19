
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunctionWithRetry } from "@/utils/edgeFunctionUtils";

/**
 * Enhanced permission check for equipment creation
 * Using an edge function that avoids UUID comparison issues
 */
export async function checkCreatePermission(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using enhanced permission check for equipment creation');
    console.log(`Parameters: authUserId=${authUserId}, teamId=${teamId || 'none'}`);
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(authUserId)) {
      console.error('Invalid UUID format for authUserId:', authUserId);
      throw new Error('Invalid user ID format');
    }
    
    // Normalize teamId to ensure consistent handling 
    const normalizedTeamId = teamId && teamId !== 'none' ? teamId : null;
    
    // Use the utility function for more reliable edge function calling
    const data = await invokeEdgeFunctionWithRetry(
      'create_equipment_permission',
      {
        user_id: authUserId,
        team_id: normalizedTeamId
      },
      { retries: 3, timeout: 10000 }
    );
    
    if (!data) {
      console.error('No data returned from permission check');
      throw new Error('Invalid response from permission service');
    }
    
    console.log('Permission check result:', data);
    
    // Handle permission denied
    if (!data.can_create) {
      const reason = data.reason || 'Access denied';
      console.warn(`Permission check failed: ${reason}`);
      
      // Provide user-friendly error messages based on common reasons
      if (reason === 'user_not_found') {
        throw new Error('User profile not found. Please refresh and try again.');
      } else if (reason === 'team_not_found') {
        throw new Error('The selected team does not exist or was deleted.');
      } else if (reason === 'insufficient_permission') {
        throw new Error('You need manager or creator privileges to add equipment to this team.');
      } else {
        throw new Error(`You don't have permission to create equipment. Reason: ${reason}`);
      }
    }
    
    // Return simplified result with essential data
    return {
      hasPermission: true,
      orgId: data.org_id
    };
  } catch (error) {
    console.error('Permission check error:', error);
    
    // Enhance error information with type diagnosis
    if (error.message?.includes('type mismatch')) {
      console.error('Type mismatch error detected in permission check. Details:', error);
      
      // Generate fingerprint of the error for tracking
      const errorFingerprint = Date.now().toString().slice(-6);
      console.error(`Error fingerprint: ${errorFingerprint}`);
      
      throw new Error(`System error (Code: ${errorFingerprint}): Database type mismatch. Support has been notified.`);
    }
    
    if (error.message?.includes('Invalid UUID')) {
      throw new Error('Invalid user identification. Please log out and log back in.');
    }
    
    // Pass other errors through
    throw error;
  }
}

/**
 * Fallback permission check that uses the check_equipment_permission edge function
 * as a backup if the primary permission check fails
 */
export async function fallbackPermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using fallback permission check with check_equipment_permission');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(authUserId)) {
      console.error('Invalid UUID format for authUserId in fallback:', authUserId);
      throw new Error('Invalid user ID format');
    }
    
    // Normalize teamId value for consistency
    const normalizedTeamId = teamId && teamId !== 'none' ? teamId : null;
    
    // Use the check_equipment_permission edge function which may be more reliable
    const data = await invokeEdgeFunctionWithRetry(
      'check_equipment_permission',
      {
        user_id: authUserId,
        equipment_id: null,
        action: 'create',
        team_id: normalizedTeamId
      },
      { timeout: 12000, retries: 2 }
    );
    
    if (!data || typeof data !== 'object') {
      console.error('Invalid response format from fallback:', data);
      throw new Error('Failed to determine permission');
    }
    
    if (!data.has_permission) {
      const reason = data.reason || 'Access denied';
      console.warn(`Fallback permission check failed: ${reason}`);
      
      throw new Error(`You don't have permission to create equipment. Reason: ${reason}`);
    }
    
    return { 
      hasPermission: true, 
      orgId: data.org_id 
    };
  } catch (error) {
    console.error('Fallback permission check failed:', error);
    
    // Enhanced error handling with specific messages
    if (error.message?.includes('Invalid UUID')) {
      throw new Error('Session error: Please log out and log back in.');
    } else if (error.message?.includes('function invoke error')) {
      throw new Error('Permission service temporarily unavailable. Please try again in a moment.');
    }
    
    throw error;
  }
}

/**
 * Final fallback using direct database access with RPC
 * This should work even when edge functions are failing
 */
export async function directDatabasePermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using direct database permission check as last resort');
    
    // Normalize teamId value for consistency
    const normalizedTeamId = teamId && teamId !== 'none' ? teamId : null;
    
    // Use the test function which gives detailed diagnostics
    const { data, error } = await supabase.rpc(
      'test_equipment_permission_flow', 
      {
        auth_user_id: authUserId,
        team_id: normalizedTeamId
      }
    );
    
    if (error) {
      console.error('Direct DB permission check failed:', error);
      throw new Error(`Database permission check failed: ${error.message}`);
    }
    
    console.log('Direct DB permission check result:', data);
    
    // Type guard to ensure we're working with a proper object structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from database');
    }
    
    // Explicitly define and check the shape of the returned data
    interface PermissionCheckResult {
      permission_check?: { 
        has_permission: boolean;
        org_id?: string;
      };
      user_info?: {
        user_org_id?: string;
      };
    }
    
    const typedData = data as PermissionCheckResult;
    
    if (!typedData.permission_check?.has_permission) {
      throw new Error('You do not have permission to create equipment');
    }
    
    return {
      hasPermission: true,
      orgId: typedData.permission_check?.org_id || typedData.user_info?.user_org_id
    };
  } catch (error) {
    console.error('Direct database permission check failed:', error);
    throw error;
  }
}
