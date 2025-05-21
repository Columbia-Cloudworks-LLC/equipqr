
import { supabase } from "@/integrations/supabase/client";
import { retry } from "@/utils/edgeFunctions/retry";
import { toast } from "sonner";

/**
 * Repairs team membership if there's an issue with the user's access
 */
export async function repairTeamMembership(teamId: string): Promise<{success: boolean, error?: string}> {
  if (!teamId) {
    console.log("No team ID provided for repair");
    return {success: false, error: "No team ID provided"};
  }

  try {
    console.log(`Attempting to repair team membership for team: ${teamId}`);
    
    // First, get session to ensure user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      console.log('No authenticated user for team repair');
      return {success: false, error: "Not authenticated"};
    }
    
    // Attempt repair through edge function
    const response = await retry(() => 
      supabase.functions.invoke('repair_team_membership', {
        body: { team_id: teamId }
      }), 3, 200);
      
    const { data, error } = response || { data: null, error: null };
    
    if (error) {
      console.error('Team repair error:', error);
      toast.error("Repair failed", {
        description: "Could not repair team access."
      });
      return {success: false, error: error.message || "Unknown error"};
    }
    
    if (data?.repaired === true) {
      console.log('Team membership successfully repaired');
      toast.success("Access restored", {
        description: "Your team access has been repaired."
      });
      return {success: true};
    } else {
      console.log('Team repair was not needed or not possible');
      return {success: false, error: "Repair not needed or not possible"};
    }
  } catch (error: any) {
    console.error('Team repair attempt failed:', error);
    toast.error("Repair failed", {
      description: "An error occurred while trying to repair team access."
    });
    return {success: false, error: error.message || "Unknown error"};
  }
}
