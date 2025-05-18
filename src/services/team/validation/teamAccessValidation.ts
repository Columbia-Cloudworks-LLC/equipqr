
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";
import { TeamAccessResult, TeamAccessDetailedResult } from './types';

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
    try {
      const data = await invokeEdgeFunction('validate_team_access', {
        team_id: teamId,
        user_id: userId
      }, 8000);
      
      return {
        isValid: data?.is_member === true,
        result: data || null
      };
    } catch (error) {
      console.error('Team membership validation error:', error);
      
      // Fallback to simpler function if edge function fails
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
      isValid: false, // Changed to false to properly show access errors
      result: {
        is_member: false,
        access_reason: 'error_validation_failed'
      },
      error: error.message
    };
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
    
    // Try the edge function with proper error handling
    try {
      const data = await invokeEdgeFunction('validate_team_access', {
        team_id: teamId,
        user_id: userId
      }, 8000);
      
      const typedData = data as TeamAccessResult;
      
      return {
        isMember: typedData?.is_member === true,
        hasOrgAccess: typedData?.has_org_access === true,
        hasCrossOrgAccess: typedData?.has_cross_org_access === true,
        teamMemberId: typedData?.team_member_id,
        accessReason: typedData?.access_reason,
        role: typedData?.role,
        team: typedData?.team,
        orgName: typedData?.org_name
      };
    } catch (error) {
      console.error('Error using edge function for team access details:', error);
      
      // Fallback to direct database query
      const { data: fallbackData, error: fallbackError } = await supabase.rpc(
        'check_team_access_detailed',
        { user_id: userId, team_id: teamId }
      );
      
      if (fallbackError) {
        console.error('Error in fallback team access details:', fallbackError);
        throw new Error('Failed to check team access');
      }
      
      // Extract first row from the result array since RPC returns an array
      const resultRow = fallbackData && fallbackData.length > 0 ? fallbackData[0] : null;
      
      if (!resultRow) {
        console.error('No access details returned from fallback');
        throw new Error('No access details returned');
      }
      
      const typedRow = resultRow as TeamAccessDetailedResult;
      
      return {
        isMember: typedRow.has_access === true,
        hasOrgAccess: typedRow.user_org_id === typedRow.team_org_id,
        hasCrossOrgAccess: false,
        teamMemberId: null,
        accessReason: typedRow.access_reason || 'fallback_detailed_check',
        role: typedRow.team_role || null,
        team: null,
        orgName: null
      };
    }
  } catch (error: any) {
    console.error('Error in getTeamAccessDetails:', error);
    // Return default values with proper error flag
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
