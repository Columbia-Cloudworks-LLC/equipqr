import { supabase } from "@/integrations/supabase/client";
import { retry } from "@/utils/edgeFunctions/retry";
import { toast } from "sonner";
import { Team } from "@/services/team";

export interface TeamAccessDetails {
  hasAccess: boolean;
  role: string | null;
  isOwner: boolean;
  teamData: Team | null;
}

/**
 * Validates if a user has access to a team by checking team membership
 */
export async function validateTeamMembership(teamId: string): Promise<boolean> {
  if (!teamId) {
    console.log("No team ID provided for validation");
    return false;
  }

  try {
    console.log(`Validating membership for team: ${teamId}`);
    
    // First attempt: Try edge function
    try {
      const { data, error } = await retry(() => 
        supabase.functions.invoke('validate_team_access', {
          body: { team_id: teamId }
        }), 3, 200);
      
      if (error) {
        console.error('Error from validate_team_access function:', error);
        throw error;
      }
      
      console.log('Team access validation result:', data);
      return data?.has_access === true;
    } catch (edgeFnError) {
      console.error('Edge function validation failed, falling back to direct query:', edgeFnError);
      
      // Fallback: Try direct query
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        console.log('No authenticated user for team access check');
        return false;
      }
      
      const userId = session.session.user.id;
      
      // Check for team membership
      const { data: membership, error: membershipError } = await retry(() => 
        supabase
          .from('team_member')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .single(), 3, 200);
      
      if (membershipError) {
        console.error('Membership check failed:', membershipError);
        return false;
      }
      
      return Boolean(membership?.id);
    }
  } catch (error) {
    console.error('Team membership validation failed:', error);
    return false;
  }
}

/**
 * Checks if a user can assign a specific role within a team
 */
export async function canAssignTeamRole(teamId: string, role: string): Promise<boolean> {
  try {
    const accessDetails = await getTeamAccessDetails(teamId);
    
    if (!accessDetails.hasAccess) {
      console.log('User does not have access to the team');
      return false;
    }
    
    // Only managers and owners can assign roles
    if (accessDetails.role !== 'manager' && accessDetails.role !== 'owner') {
      console.log('User does not have permission to assign roles');
      return false;
    }
    
    // Owners can assign any role, managers can only assign viewer roles
    if (accessDetails.role === 'manager' && role !== 'viewer') {
      console.log('Manager can only assign viewer roles');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking role assignment permission:', error);
    return false;
  }
}

/**
 * Gets detailed information about a user's access to a team
 */
export async function getTeamAccessDetails(teamId: string): Promise<TeamAccessDetails> {
  if (!teamId) {
    console.log("No team ID provided for access details");
    return { hasAccess: false, role: null, isOwner: false, teamData: null };
  }

  try {
    console.log(`Getting access details for team: ${teamId}`);
    
    const { data, error } = await retry(() => 
      supabase.functions.invoke('validate_team_access', {
        body: { team_id: teamId }
      }), 3, 200);
    
    if (error) {
      console.error('Error from validate_team_access function:', error);
      throw error;
    }
    
    console.log('Team access details:', data);
    return {
      hasAccess: data?.has_access === true,
      role: data?.role || null,
      isOwner: data?.is_owner === true,
      teamData: data?.team_data as Team | null
    };
  } catch (error) {
    console.error('Failed to get team access details:', error);
    return { hasAccess: false, role: null, isOwner: false, teamData: null };
  }
}
