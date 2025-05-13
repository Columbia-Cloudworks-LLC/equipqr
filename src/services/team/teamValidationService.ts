
import { supabase } from "@/integrations/supabase/client";

/**
 * Validate team membership for the current user
 * @param userId The user ID to check
 * @param teamId The team ID to check
 * @returns A boolean indicating whether the user is a member of the team
 */
export async function validateTeamMembership(userId: string, teamId: string): Promise<boolean> {
  try {
    if (!userId || !teamId) {
      console.error('Missing required parameters for validateTeamMembership');
      return false;
    }
    
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: { team_id: teamId, user_id: userId }
    });
    
    if (error) {
      console.error('Error validating team membership:', error);
      return false;
    }
    
    return data?.is_member || false;
  } catch (error) {
    console.error('Error in validateTeamMembership:', error);
    return false;
  }
}

/**
 * Repair team membership for the current user
 * @param teamId The ID of the team
 * @returns Response data from the repair operation
 */
export async function repairTeamMembership(teamId: string) {
  try {
    // Get current authenticated user
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to repair team membership');
    }
    
    const userId = sessionData.session.user.id;
    
    // Call the repair_team_membership edge function
    const { data, error } = await supabase.functions.invoke('repair_team_membership', {
      body: { 
        team_id: teamId, 
        user_id: userId 
      }
    });
    
    if (error) {
      console.error('Error repairing team membership:', error);
      throw new Error(`Failed to repair team membership: ${error.message}`);
    }
    
    if (!data?.success) {
      throw new Error(data?.error || 'Failed to repair team membership');
    }
    
    return data;
  } catch (error: any) {
    console.error('Error in repairTeamMembership:', error);
    throw error;
  }
}

/**
 * Get detailed team access information for current user
 * @param userId The user ID to check
 * @param teamId The team ID to check
 * @returns Detailed access information
 */
export async function getTeamAccessDetails(userId: string, teamId: string) {
  try {
    if (!userId || !teamId) {
      console.error('Missing required parameters for getTeamAccessDetails');
      return {
        isMember: false,
        accessReason: 'missing_params',
        role: null,
        hasCrossOrgAccess: false
      };
    }
    
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: { team_id: teamId, user_id: userId }
    });
    
    if (error) {
      console.error('Error getting team access details:', error);
      return {
        isMember: false,
        accessReason: 'error',
        role: null,
        hasCrossOrgAccess: false
      };
    }
    
    return {
      isMember: data?.is_member || false,
      accessReason: data?.access_reason || 'unknown',
      role: data?.role || null,
      hasCrossOrgAccess: data?.has_cross_org_access || false,
      orgName: data?.org_name || null
    };
  } catch (error) {
    console.error('Error in getTeamAccessDetails:', error);
    return {
      isMember: false,
      accessReason: 'exception',
      role: null,
      hasCrossOrgAccess: false
    };
  }
}
