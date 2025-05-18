
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";
import { toast } from 'sonner';

interface TeamAccessResult {
  is_member: boolean;
  has_org_access?: boolean;
  has_cross_org_access?: boolean;
  team_member_id?: string | null;
  access_reason?: string;
  role?: string | null;
  team?: {
    name: string;
    org_id: string;
  } | null;
  org_name?: string | null;
}

interface RepairResult {
  success: boolean;
  team_member_id?: string;
  error?: string;
}

/**
 * Validate a user's membership in a team using our improved edge function
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
    
    console.log(`Validating team membership for user ${userId} in team ${teamId}`);
    
    // Use validate_team_access edge function with timeout
    try {
      const data = await invokeEdgeFunction<TeamAccessResult>('validate_team_access', {
        team_id: teamId,
        user_id: userId
      }, 10000); // 10 second timeout
      
      console.log('Team membership validation result:', data);
      
      return {
        isValid: data?.is_member === true,
        result: data || null
      };
    } catch (error) {
      console.error('Team membership validation error:', error);
      
      // Fallback to direct query if edge function fails
      console.log('Using fallback validation method...');
      const { data: fallbackResult, error: fallbackError } = await supabase.rpc(
        'check_team_access_nonrecursive',
        { p_user_id: userId, p_team_id: teamId }
      );
      
      if (fallbackError) {
        console.error('Fallback validation error:', fallbackError);
        throw new Error(fallbackError.message);
      }
      
      return {
        isValid: fallbackResult === true,
        result: { 
          is_member: fallbackResult === true,
          access_reason: 'fallback_check'
        }
      };
    }
  } catch (error: any) {
    console.error('Error in validateTeamMembership:', error);
    // Return a safe default to prevent breaking the UI
    return {
      isValid: false,
      result: {
        is_member: false,
        access_reason: 'error_validation_failed'
      },
      error: error.message
    };
  }
}

/**
 * Repair team membership for the current user
 * @param teamId The team ID to repair
 * @returns Result of repair attempt
 */
export async function repairTeamMembership(teamId: string): Promise<RepairResult> {
  try {
    if (!teamId) {
      throw new Error("Team ID is required");
    }
    
    // Get current user
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    console.log(`Attempting to repair team membership for user ${userId} in team ${teamId}`);
    
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
    const result = await invokeEdgeFunction<{
      success: boolean;
      team_member_id?: string;
      error?: string;
    }>('add_team_member', {
      _team_id: teamId,
      _user_id: userId,
      _role: 'manager', // Default to manager for repairs
      _added_by: userId
    }, 8000);
    
    if (!result || !result.success) {
      throw new Error(result?.error || "Failed to repair team membership");
    }
    
    console.log('Team membership repaired successfully:', result);
    
    return {
      success: true,
      team_member_id: result.team_member_id
    };
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

/**
 * Get detailed team access information for a user
 * @param userId User ID to check
 * @param teamId Team ID to check
 * @returns Detailed access information
 */
export async function getTeamAccessDetails(userId: string, teamId: string) {
  try {
    if (!userId || !teamId) {
      throw new Error("User ID and Team ID are required");
    }
    
    console.log(`Getting detailed team access for user ${userId} on team ${teamId}`);
    
    try {
      const data = await invokeEdgeFunction<TeamAccessResult>('validate_team_access', {
        team_id: teamId,
        user_id: userId
      }, 10000); // 10 second timeout
      
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
    } catch (error) {
      console.error('Error using edge function for team access details:', error);
      
      // Fallback to direct RPC call
      const { data: fallbackData, error: fallbackError } = await supabase.rpc(
        'check_team_access_detailed',
        { user_id: userId, team_id: teamId }
      );
      
      if (fallbackError) {
        console.error('Error in fallback team access details:', fallbackError);
        throw new Error('Failed to check team access');
      }
      
      // Extract first row from result array
      const resultRow = fallbackData && fallbackData.length > 0 ? fallbackData[0] : null;
      
      if (!resultRow) {
        console.error('No access details returned from fallback');
        throw new Error('No access details returned');
      }
      
      return {
        isMember: resultRow.has_access === true,
        hasOrgAccess: resultRow.user_org_id === resultRow.team_org_id,
        hasCrossOrgAccess: false,
        teamMemberId: null,
        accessReason: resultRow.access_reason || 'fallback_detailed_check',
        role: resultRow.team_role || null,
        team: null,
        orgName: null
      };
    }
  } catch (error: any) {
    console.error('Error in getTeamAccessDetails:', error);
    // Return safe defaults
    return {
      isMember: false,
      hasOrgAccess: false,
      hasCrossOrgAccess: false,
      teamMemberId: null,
      accessReason: 'error',
      role: null,
      team: null,
      orgName: null,
      error: error.message
    };
  }
}
