
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/types";

/**
 * Get team members with their roles
 * @param teamId The ID of the team
 * @returns Array of team members with their roles and details
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    if (!teamId) {
      throw new Error("Team ID is required");
    }
    
    // Fetch team members using the edge function to avoid RLS issues
    const { data, error } = await supabase.functions.invoke('get_team_members', {
      body: { team_id: teamId }
    });
    
    if (error) {
      console.error('Error in getTeamMembers:', error);
      throw new Error(error.message);
    }
    
    console.log("Team members fetched:", data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.error('Error in getTeamMembers:', error);
    throw error;
  }
}
