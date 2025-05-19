
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
    
    // Use the utility function for more reliable edge function calling
    const data = await invokeEdgeFunctionWithRetry(
      'create_equipment_permission',
      {
        user_id: authUserId,
        team_id: teamId && teamId !== 'none' ? teamId : null
      },
      { retries: 2, timeout: 8000 }
    );
    
    if (!data) {
      console.error('No data returned from permission check');
      throw new Error('Invalid response from permission service');
    }
    
    console.log('Permission check result:', data);
    
    // Handle permission denied
    if (!data.can_create) {
      throw new Error(`You don't have permission to create equipment. Reason: ${data.reason}`);
    }
    
    // Return simplified result with essential data
    return {
      hasPermission: true,
      orgId: data.org_id
    };
  } catch (error) {
    console.error('Permission check error:', error);
    
    // Provide more specific error messages based on the error type
    if (error.message?.includes('type mismatch')) {
      console.error('Type mismatch error detected in permission check');
      throw new Error('System error: Data type mismatch in permission check');
    }
    
    if (error.message?.includes('Invalid UUID')) {
      throw new Error('Invalid user identification. Please log out and log back in.');
    }
    
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
    
    // Use the check_equipment_permission edge function which may be more reliable
    const data = await invokeEdgeFunctionWithRetry(
      'check_equipment_permission',
      {
        user_id: authUserId,
        equipment_id: null,
        action: 'create',
        team_id: teamId && teamId !== 'none' ? teamId : null
      },
      { timeout: 10000, retries: 1 }
    );
    
    if (!data || typeof data !== 'object') {
      console.error('Invalid response format from fallback:', data);
      throw new Error('Failed to determine permission');
    }
    
    if (!data.has_permission) {
      throw new Error(`You don't have permission to create equipment. Reason: ${data.reason || 'Access denied'}`);
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
    }
    
    throw error;
  }
}
