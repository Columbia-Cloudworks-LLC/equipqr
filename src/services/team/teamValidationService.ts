
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
