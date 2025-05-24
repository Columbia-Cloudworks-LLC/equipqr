
import { supabase } from "@/integrations/supabase/client";
import { isValidUuid } from "@/utils/validationUtils";

/**
 * Check if a user has permission to assign a role in a team
 * @param teamId Team ID to check
 * @param role Role to be assigned
 * @returns Boolean indicating if the user can assign this role
 */
export async function canAssignTeamRole(teamId: string, role: string) {
  try {
    if (!teamId || !isValidUuid(teamId)) {
      return false;
    }
    
    // Get current authenticated user
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return false;
    }
    
    const userId = sessionData.session.user.id;
    
    // Use the unified permissions function to check team management
    const { data, error } = await supabase.functions.invoke('permissions', {
      body: {
        userId,
        resource: 'team',
        action: 'manage_members',
        resourceId: teamId
      }
    });
    
    if (error) {
      console.error('Error checking role assignment permission:', error);
      // Fallback to original RPC call
      const { data: fallbackData, error: fallbackError } = await supabase.rpc('can_assign_team_role', {
        p_auth_user_id: userId,
        p_team_id: teamId,
        p_role: role
      });
      
      if (fallbackError) {
        console.error('Fallback role assignment check failed:', fallbackError);
        return false;
      }
      
      return fallbackData || false;
    }
    
    return data?.has_permission || false;
  } catch (error) {
    console.error('Error in canAssignTeamRole:', error);
    return false;
  }
}
