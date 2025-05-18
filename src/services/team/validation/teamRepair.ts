
import { supabase } from "@/integrations/supabase/client";

/**
 * Repair team membership by adding the current user as a manager
 * @param teamId The team ID to repair
 * @returns Result of the repair operation
 */
export async function repairTeamMembership(teamId: string) {
  try {
    if (!teamId) {
      throw new Error("Team ID is required");
    }
    
    // Get current user ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    console.log(`Attempting to repair team membership for user ${userId} on team ${teamId}`);
    
    // Use dedicated edge function to repair team membership
    const { data, error } = await supabase.functions.invoke('repair_team_membership', {
      body: { 
        team_id: teamId,
        user_id: userId
      }
    });
    
    if (error || (data && data.error)) {
      console.error('Team repair error:', error || data?.error);
      throw new Error(error?.message || data?.error || "Failed to repair team membership");
    }
    
    console.log('Team repair successful:', data);
    return data;
  } catch (error: any) {
    console.error('Error in repairTeamMembership:', error);
    throw error;
  }
}
