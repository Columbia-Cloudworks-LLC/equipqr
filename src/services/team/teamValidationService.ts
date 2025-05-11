
import { supabase } from "@/integrations/supabase/client";

/**
 * Validates if a user is a member of a team
 */
export async function validateTeamMembership(userId: string, teamId: string) {
  try {
    if (!userId || !teamId) {
      console.error('Missing userId or teamId in validateTeamMembership');
      throw new Error('User ID and Team ID are required to validate membership');
    }
    
    console.log(`Validating team membership for user ${userId} in team ${teamId}`);
    
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: {
        team_id: teamId, 
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error validating team membership:', error);
      throw new Error(`Failed to validate team membership: ${error.message}`);
    }

    console.log('Team membership validation result:', data);
    
    if (!data) {
      console.warn('No data returned from validate_team_access function');
      return false;
    }
    
    return data.is_member === true;
  } catch (error: any) {
    console.error('Error in validateTeamMembership:', error);
    throw new Error(`Validation failed: ${error.message}`);
  }
}

/**
 * Repairs team membership for a user
 */
export async function repairTeamMembership(teamId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to repair team membership');
    }
    
    const userId = sessionData.session.user.id;
    console.log(`Attempting to repair team membership for user ${userId} in team ${teamId}`);
    
    // Call the repair_team_membership edge function directly
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
      const errorMessage = data?.error || 'Unknown error during team repair';
      console.error('Team repair failed:', errorMessage);
      throw new Error(`Repair failed: ${errorMessage}`);
    }
    
    console.log('Team membership repair successful:', data);
    return { success: true, details: data };
  } catch (error: any) {
    console.error('Error in repairTeamMembership:', error);
    throw new Error(`Repair failed: ${error.message}`);
  }
}
