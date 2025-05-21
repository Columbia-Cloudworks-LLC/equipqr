
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/types";

/**
 * Get team members for a specific team
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    
    console.log(`Fetching team members for team ${teamId}`);
    
    const { data, error } = await supabase
      .rpc('get_team_members_with_details', {
        _team_id: teamId
      });
      
    if (error) {
      console.error('Error fetching team members:', error);
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error in getTeamMembers:', error);
    throw error;
  }
}
