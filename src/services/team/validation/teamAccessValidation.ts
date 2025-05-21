
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunctionWithRetry } from "@/utils/edgeFunctions/core";
import { retry } from "@/utils/edgeFunctions/retry";
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
    
    console.log(`Validating team membership: userId=${userId}, teamId=${teamId}`);
    
    // Use our improved validate_team_access edge function with retries for reliability
    try {
      const data = await retry(
        () => invokeEdgeFunctionWithRetry<TeamAccessResult>('validate_team_access', {
          team_id: teamId,
          user_id: userId
        }, { maxRetries: 2 }), 
        {
          maxRetries: 2,
          retryDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(`Retry ${attempt} for team membership validation:`, error);
          }
        }
      );
      
      console.log('Team access validation result:', data);
      
      // Type assertion to ensure TypeScript recognizes data as TeamAccessResult
      const typedData = data as TeamAccessResult;
      
      return {
        isValid: typedData?.is_member === true,
        result: typedData || null
      };
    } catch (error) {
      console.error('Team membership validation error:', error);
      
      // Fallback to simpler function if edge function fails
      console.log('Trying fallback validation method...');
      const { data: fallbackResult, error: fallbackError } = await supabase.rpc(
        'check_team_access_nonrecursive',
        { p_user_id: userId, p_team_id: teamId }
      );
      
      if (fallbackError) {
        console.error('Fallback validation error:', fallbackError);
        throw new Error(fallbackError.message);
      }
      
      console.log('Fallback validation result:', fallbackResult);
      
      return {
        isValid: fallbackResult === true,
        result: { 
          is_member: fallbackResult === true,
          access_reason: 'fallback_check'
        } as TeamAccessResult
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
      } as TeamAccessResult,
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
    
    console.log(`Getting team access details: userId=${userId}, teamId=${teamId}`);
    
    // Try the edge function with proper error handling
    try {
      const data = await retry(
        () => invokeEdgeFunctionWithRetry<TeamAccessResult>('validate_team_access', {
          team_id: teamId,
          user_id: userId
        }, { maxRetries: 2 }),
        {
          maxRetries: 2,
          retryDelay: 1000
        }
      );
      
      console.log('Team access details from edge function:', data);
      
      // Explicitly type the data to ensure type safety
      const typedData = data as TeamAccessResult;
      
      return {
        isMember: typedData?.is_member === true,
        hasOrgAccess: typedData?.has_org_access === true,
        hasCrossOrgAccess: typedData?.has_cross_org_access === true,
        teamMemberId: typedData?.team_member_id,
        accessReason: typedData?.access_reason,
        role: typedData?.role,
        // Use optional chaining and provide a null fallback for org_role
        orgRole: typedData?.org_role || null,
        team: typedData?.team,
        orgName: typedData?.org_name,
        error: null
      };
    } catch (error) {
      console.error('Error using edge function for team access details:', error);
      
      // Fallback to direct database query
      console.log('Trying fallback access details method...');
      const { data: fallbackData, error: fallbackError } = await supabase.rpc(
        'check_team_access_detailed',
        { user_id: userId, team_id: teamId }
      );
      
      if (fallbackError) {
        console.error('Error in fallback team access details:', fallbackError);
        throw new Error('Failed to check team access');
      }
      
      console.log('Fallback access details result:', fallbackData);
      
      // Extract first row from the result array since RPC returns an array
      const resultRow = fallbackData && fallbackData.length > 0 ? fallbackData[0] : null;
      
      if (!resultRow) {
        console.error('No access details returned from fallback');
        throw new Error('No access details returned');
      }
      
      const typedRow = resultRow as TeamAccessDetailedResult;
      
      // Get the user's organization role if they belong to the team's organization
      let orgRole = null;
      if (typedRow.user_org_id === typedRow.team_org_id) {
        try {
          const { data: roleData } = await supabase.rpc(
            'get_org_role',
            { p_auth_user_id: userId, p_org_id: typedRow.team_org_id }
          );
          orgRole = roleData;
        } catch (roleError) {
          console.warn('Failed to get org role:', roleError);
        }
      }
      
      return {
        isMember: typedRow.has_access === true,
        hasOrgAccess: typedRow.user_org_id === typedRow.team_org_id,
        hasCrossOrgAccess: false,
        teamMemberId: null,
        accessReason: typedRow.access_reason || 'fallback_detailed_check',
        role: typedRow.team_role || null,
        orgRole: orgRole,
        team: null,
        orgName: null,
        error: null
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
      orgRole: null,
      team: null,
      orgName: null,
      error: error.message
    };
  }
}
