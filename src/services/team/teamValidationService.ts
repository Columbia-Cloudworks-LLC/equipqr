
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Validate a user's membership in a team using our improved non-recursive function
 * @param teamId The team ID to validate
 * @param userId Optional user ID (defaults to current user)
 * @returns Object with validation results 
 */
export async function validateTeamMembership(teamId: string, userId?: string) {
  try {
    if (!teamId) {
      throw new Error("Team ID is required");
    }
    
    // Get current user if not provided
    if (!userId) {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
    }
    
    // Use our improved validate_team_access edge function
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: { 
        team_id: teamId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Team membership validation error:', error);
      throw new Error(error.message);
    }
    
    return {
      isValid: data?.is_member === true,
      result: data || null
    };
  } catch (error: any) {
    console.error('Error in validateTeamMembership:', error);
    throw error;
  }
}

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
    
    // Use dedicated edge function to repair team membership
    const { data, error } = await supabase.functions.invoke('repair_team_membership', {
      body: { team_id: teamId }
    });
    
    if (error || (data && data.error)) {
      console.error('Team repair error:', error || data?.error);
      throw new Error(error?.message || data?.error || "Failed to repair team membership");
    }
    
    return data;
  } catch (error: any) {
    console.error('Error in repairTeamMembership:', error);
    throw error;
  }
}

/**
 * Get detailed team access information for a user using our improved non-recursive function
 * @param userId User ID to check
 * @param teamId Team ID to check
 * @returns Detailed access information
 */
export async function getTeamAccessDetails(userId: string, teamId: string) {
  try {
    if (!userId || !teamId) {
      throw new Error("User ID and Team ID are required");
    }
    
    // Use improved validate_team_access edge function
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: { 
        team_id: teamId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error getting team access details:', error);
      throw new Error(error.message);
    }
    
    return {
      isMember: data?.is_member === true,
      hasOrgAccess: data?.has_org_access === true,
      hasCrossOrgAccess: data?.has_cross_org_access === true,
      teamMemberId: data?.team_member_id,
      accessReason: data?.access_reason,
      role: data?.role,
      team: data?.team,
      orgName: data?.org_name
    };
  } catch (error: any) {
    console.error('Error in getTeamAccessDetails:', error);
    // Return default values if there's an error to avoid UI breakage
    return {
      isMember: false,
      hasOrgAccess: false,
      hasCrossOrgAccess: false,
      teamMemberId: null,
      accessReason: 'error',
      role: null,
      team: null,
      orgName: null
    };
  }
}
