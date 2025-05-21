import { supabase } from "@/integrations/supabase/client";
import { retry } from "@/utils/edgeFunctions/retry";
import { toast } from "sonner";

/**
 * Repairs team membership if there's an issue with the user's access
 */
export async function repairTeamMembership(teamId: string): Promise<boolean> {
  if (!teamId) {
    console.log("No team ID provided for repair");
    return false;
  }

  try {
    console.log(`Attempting to repair team membership for team: ${teamId}`);
    
    // First, get session to ensure user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      console.log('No authenticated user for team repair');
      return false;
    }
    
    // Attempt repair through edge function
    const { data, error } = await retry(() => 
      supabase.functions.invoke('repair_team_membership', {
        body: { team_id: teamId }
      }), 3, 200);
    
    if (error) {
      console.error('Team repair error:', error);
      toast.error("Repair failed", {
        description: "Could not repair team access."
      });
      return false;
    }
    
    if (data?.repaired === true) {
      console.log('Team membership successfully repaired');
      toast.success("Access restored", {
        description: "Your team access has been repaired."
      });
      return true;
    } else {
      console.log('Team repair was not needed or not possible');
      return false;
    }
  } catch (error) {
    console.error('Team repair attempt failed:', error);
    toast.error("Repair failed", {
      description: "An error occurred while trying to repair team access."
    });
    return false;
  }
}
