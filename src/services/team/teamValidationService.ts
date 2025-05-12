
import { supabase } from "@/integrations/supabase/client";

/**
 * Validates whether a user is a member of a specified team
 */
export async function validateTeamMembership(userId: string, teamId: string): Promise<boolean> {
  try {
    console.log(`Validating team membership for user ${userId} in team ${teamId}`);
    
    // Call the validate_team_access edge function
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: {
        user_id: userId,
        team_id: teamId
      }
    });
    
    if (error) {
      console.error('Error validating team membership:', error);
      return false;
    }
    
    console.log('Team membership validation result:', data);
    return data?.is_member || false;
  } catch (error) {
    console.error('Error in validateTeamMembership:', error);
    return false;
  }
}

/**
 * Get detailed team access information
 */
export async function getTeamAccessDetails(userId: string, teamId: string) {
  try {
    console.log(`Getting detailed access info for user ${userId} in team ${teamId}`);
    
    // Call the validate_team_access edge function
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: {
        user_id: userId,
        team_id: teamId
      }
    });
    
    if (error) {
      console.error('Error getting team access details:', error);
      throw new Error(`Failed to check team access: ${error.message}`);
    }
    
    return {
      isMember: data?.is_member || false,
      hasOrgAccess: data?.has_org_access || false,
      hasCrossOrgAccess: data?.has_cross_org_access || false,
      teamMemberId: data?.team_member_id,
      accessReason: data?.access_reason,
      role: data?.role,
      teamName: data?.team?.name,
      teamOrgId: data?.team?.org_id,
      orgName: data?.org_name
    };
  } catch (error) {
    console.error('Error in getTeamAccessDetails:', error);
    throw error;
  }
}

/**
 * Check if a user has permission to change roles in a team
 */
export async function checkRoleChangePermission(teamId: string): Promise<boolean> {
  try {
    console.log(`Checking role change permission for team ${teamId}`);
    
    // Get the current user's ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to check permissions');
    }
    
    const currentUserId = sessionData.session.user.id;
    
    // Call the check_team_role_permission edge function
    const { data, error } = await supabase.functions.invoke('check_team_role_permission', {
      body: {
        team_id: teamId,
        user_id: currentUserId
      }
    });
    
    if (error) {
      console.error('Error checking role permission:', error);
      return false;
    }
    
    console.log('Role permission check result:', data);
    return data?.hasPermission || false;
  } catch (error) {
    console.error('Error in checkRoleChangePermission:', error);
    return false;
  }
}

/**
 * Repairs team membership by adding the current user as a manager if they are the team creator
 */
export async function repairTeamMembership(teamId: string): Promise<boolean> {
  try {
    console.log(`Repairing team membership for team ${teamId}`);
    
    // Get the current user's ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to repair team membership');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Call the repair_team_membership edge function
    const { data, error } = await supabase.functions.invoke('repair_team_membership', {
      body: {
        team_id: teamId,
        user_id: authUserId
      }
    });
    
    if (error) {
      console.error('Error repairing team membership:', error);
      throw new Error(`Failed to repair team membership: ${error.message}`);
    }
    
    console.log('Team membership repair result:', data);
    
    if (!data?.success) {
      throw new Error(data?.message || 'Failed to repair team membership');
    }
    
    return true;
  } catch (error: any) {
    console.error('Error in repairTeamMembership:', error);
    throw new Error(`Team repair failed: ${error.message}`);
  }
}
