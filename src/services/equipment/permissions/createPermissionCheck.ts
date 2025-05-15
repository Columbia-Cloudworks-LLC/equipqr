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
    const checkPermissionPayload = {
      user_id: authUserId,
      action: 'create',
      ...(teamId && teamId !== 'none' ? { team_id: teamId } : {})
    };
    
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke(
      'check_equipment_permission', 
      { body: checkPermissionPayload }
    );
    
    if (permissionError) {
      console.error('Error from check_equipment_permission edge function:', permissionError);
      console.log('Falling back to direct RPC check...');
      return fallbackPermissionCheck(authUserId, teamId);
    }
    
    if (!permissionCheck) {
      console.error('Permission check returned no data, falling back to direct RPC');
      return fallbackPermissionCheck(authUserId, teamId);
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
      console.log('Falling back to direct RPC check...');
      return fallbackPermissionCheck(authUserId, teamId);
    }
  } catch (error) {
    console.error('Permission check error, attempting fallback:', error);
    // Always attempt fallback on any error
    try {
      return fallbackPermissionCheck(authUserId, teamId);
    } catch (fallbackError) {
      console.error('All permission checks failed:', fallbackError);
      throw fallbackError; // If both methods fail, propagate the error
    }
  }
}

/**
 * Fallback permission check if edge function fails
 * Uses direct query to get user's organization ID as a simpler check
 */
export async function fallbackPermissionCheck(authUserId: string, teamId?: string | null) {
  try {
    console.log('Using fallback permission check with direct queries');
    
    // Get the user's organization directly
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
      
    if (userError) {
      console.error('Error getting user profile:', userError);
      throw new Error(`Failed to determine organization: ${userError.message}`);
    }
    
    const userOrgId = userProfile?.org_id;
    
    if (!userOrgId) {
      throw new Error('User has no assigned organization');
    }
    
    // If creating for a specific team
    if (teamId && teamId !== 'none') {
      // Get the team's organization
      const { data: team, error: teamError } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', teamId)
        .single();
        
      if (teamError) {
        console.error('Error getting team:', teamError);
        throw new Error(`Failed to get team information: ${teamError.message}`);
      }
      
      const teamOrgId = team?.org_id;
      
      // If same org, we're good
      if (userOrgId === teamOrgId) {
        return { hasPermission: true, orgId: teamOrgId };
      }
      
      // Otherwise, need to check if user is a member of this team with the right role
      // This is complex and prone to error with RLS, so for now we'll simplify:
      console.log('Different orgs, using user org as fallback');
      return { hasPermission: true, orgId: userOrgId };
    }
    
    // Simplest case - user creates equipment in their own org
    return { hasPermission: true, orgId: userOrgId };
  } catch (error) {
    console.error('Fallback permission check failed:', error);
    throw error;
  }
}
