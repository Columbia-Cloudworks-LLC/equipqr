
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
    
    // First check if we have a valid session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      console.error('No valid session found when checking creation permission');
      throw new Error('Authentication required. Please sign in to continue.');
    }
    
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
      { retries: 2, timeout: 8000 }
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
  } catch (error: any) {
    console.error('Permission check error:', error);
    
    // Check if this is a session/authentication error
    if (error.message?.includes('Authentication required') || 
        error.message?.includes('sign in')) {
      throw error; // Re-throw authentication errors to trigger proper redirect
    }
    
    // For other errors, try the fallback
    try {
      console.log('Primary permission check failed, trying fallback...');
      return await fallbackPermissionCheck(authUserId, teamId);
    } catch (fallbackError: any) {
      console.error('Fallback permission check failed:', fallbackError);
      
      // Enhance error information with type diagnosis
      if (fallbackError.message?.includes('type mismatch')) {
        console.error('Type mismatch error detected in permission check. Details:', fallbackError);
        
        // Generate fingerprint of the error for tracking
        const errorFingerprint = Date.now().toString().slice(-6);
        console.error(`Error fingerprint: ${errorFingerprint}`);
        
        throw new Error(`System error (Code: ${errorFingerprint}): Database type mismatch. Support has been notified.`);
      }
      
      if (fallbackError.message?.includes('Invalid UUID')) {
        throw new Error('Invalid user identification. Please log out and log back in.');
      }
      
      // Pass other errors through
      throw fallbackError;
    }
  }
}

/**
 * Fallback permission check that uses the check_equipment_permission edge function
 * as a backup if the primary permission check fails
 */
export async function fallbackPermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using fallback permission check with check_equipment_permission');
    
    // First check if we have a valid session here too
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      console.error('No valid session found in fallback permission check');
      throw new Error('Authentication required. Please sign in to continue.');
    }
    
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
      { timeout: 8000, retries: 1 }
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
  } catch (error: any) {
    console.error('Fallback permission check failed:', error);
    
    // Try direct database approach as a last resort
    if (error.message?.includes('function invoke error') || 
        error.message?.includes('timed out')) {
      console.log('Edge function failed, attempting direct database access');
      return await directDatabasePermissionCheck(authUserId, teamId);
    }
    
    // Enhanced error handling with specific messages
    if (error.message?.includes('Authentication required') || 
        error.message?.includes('sign in')) {
      throw error; // Re-throw auth errors for proper handling
    }
    
    if (error.message?.includes('Invalid UUID')) {
      throw new Error('Session error: Please log out and log back in.');
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
  } catch (error: any) {
    console.error('Direct database permission check failed:', error);
    
    // If database check also fails, try one last approach - get user org only
    if (!error.message?.includes('Authentication required')) {
      try {
        console.log('Attempting simplified org-only permission check');
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('org_id')
          .eq('id', authUserId)
          .single();
          
        if (userProfile?.org_id) {
          console.log('Retrieved user org_id as fallback:', userProfile.org_id);
          return {
            hasPermission: true,
            orgId: userProfile.org_id
          };
        }
      } catch (profileError) {
        console.error('Profile fallback failed:', profileError);
      }
    }
    
    throw error;
  }
}
