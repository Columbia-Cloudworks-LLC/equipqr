import { supabase } from "@/integrations/supabase/client";
import { isValidUuid } from "@/utils/validationUtils";
import { invokeEdgeFunctionWithRetry } from "@/utils/edgeFunctionUtils";

interface PermissionResult {
  canCreate: boolean;
  orgId: string | null;
  reason?: string;
}

/**
 * Check if the user has permission to create equipment
 * @param authUserId The auth user ID
 * @param teamId Optional team ID
 * @returns Promise resolving to permission result
 */
export const checkCreatePermission = async (
  authUserId: string,
  teamId?: string | null
): Promise<PermissionResult> => {
  try {
    // Validate UUID format for user_id
    if (!isValidUuid(authUserId)) {
      console.error(`Invalid UUID format for authUserId: ${authUserId}`);
      throw new Error('Invalid user ID format');
    }

    // Validate team_id if provided
    if (teamId && teamId !== 'none' && !isValidUuid(teamId)) {
      console.error(`Invalid UUID format for teamId: ${teamId}`);
      throw new Error('Invalid team ID format');
    }

    // Normalize team_id to null if it's 'none' or empty string
    const normalizedTeamId = teamId === 'none' || teamId === '' ? null : teamId;

    // Log the full payload being sent to the edge function
    console.log('Sending payload to create_equipment_permission:', {
      user_id: authUserId,
      team_id: normalizedTeamId
    });

    // Call the edge function
    const { data, error } = await supabase.functions.invoke(
      'create_equipment_permission',
      {
        method: 'POST',
        body: {
          user_id: authUserId,
          team_id: normalizedTeamId
        },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Permission check failed: ${error.message}`);
    }

    if (!data) {
      console.error('No data returned from edge function');
      throw new Error('Permission check failed: No data returned');
    }

    console.log('Edge function response:', data);

    return {
      canCreate: data.can_create === true,
      orgId: data.org_id,
      reason: data.reason
    };
  } catch (error: any) {
    console.error('Error checking permission:', error);
    throw error;
  }
};

/**
 * Fallback permission check in case the edge function fails
 * Uses direct database access through RPC
 */
export const fallbackPermissionCheck = async (
  authUserId: string,
  teamId?: string | null
): Promise<PermissionResult> => {
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
      canCreate: data.has_permission,
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
};

/**
 * Final fallback using direct database access with RPC
 * This should work even when edge functions are failing
 */
export async function directDatabasePermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using direct database permission check as last resort');
    
    // Check session here as well
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      console.error('No valid session found in direct database permission check');
      throw new Error('Authentication required. Please sign in to continue.');
    }
    
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
      canCreate: typedData.permission_check?.has_permission,
      orgId: typedData.permission_check?.org_id || typedData.user_info?.user_org_id
    };
  } catch (error: any) {
    console.error('Direct database permission check failed:', error);
    
    // Check for auth errors here too
    if (error.message?.includes('Authentication required') || 
        error.message?.includes('sign in')) {
      throw error;
    }
    
    // If database check also fails, try one last approach - get user org only
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
          canCreate: true,
          orgId: userProfile.org_id
        };
      }
    } catch (profileError) {
      console.error('Profile fallback failed:', profileError);
    }
    
    throw error;
  }
}
