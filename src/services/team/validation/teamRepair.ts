
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/utils/edgeFunctions/core";
import { retry } from "@/utils/edgeFunctions/retry";
import { toast } from 'sonner';

interface RepairResult {
  success: boolean;
  team_member_id?: string;
  error?: string;
}

/**
 * Repair team membership by adding the current user as a manager
 * @param teamId The team ID to repair
 * @returns Result of the repair operation
 */
export async function repairTeamMembership(teamId: string): Promise<RepairResult> {
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
    
    // Check if the team exists and get its organization
    const { data: teamData, error: teamError } = await supabase
      .from('team')
      .select('id, org_id')
      .eq('id', teamId)
      .is('deleted_at', null)
      .single();
      
    if (teamError || !teamData) {
      console.error('Error finding team:', teamError);
      throw new Error(teamError?.message || "Team not found");
    }
    
    // Use edge function with admin rights to add user to team
    try {
      const result = await retry(
        () => invokeEdgeFunction('add_team_member', {
          _team_id: teamId,
          _user_id: userId,
          _role: 'manager', // Default to manager for repairs
          _added_by: userId
        }),
        {
          maxRetries: 2,
          retryDelay: 1000
        }
      );
      
      if (!result || !result.success) {
        throw new Error(result?.error || "Failed to repair team membership");
      }
      
      console.log('Team membership repaired successfully:', result);
      
      return {
        success: true,
        team_member_id: result.team_member_id
      };
    } catch (error: any) {
      console.error('Error repairing team membership:', error);
      throw new Error(error.message || "Failed to repair team membership");
    }
  } catch (error: any) {
    console.error('Error in repairTeamMembership:', error);
    
    // Show toast for user feedback
    toast.error("Failed to repair team membership", {
      description: error.message || "Unknown error occurred"
    });
    
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}
