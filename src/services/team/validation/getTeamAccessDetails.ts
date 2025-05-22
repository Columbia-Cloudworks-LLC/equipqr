
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";
import { TeamAccessResult, TeamAccessDetails } from './teamValidationTypes';

/**
 * Get detailed team access information for a user
 * @param teamId Team ID to check
 * @param userId Optional user ID (defaults to current user)
 * @returns Detailed access information as TeamAccessDetails
 */
export async function getTeamAccessDetails(teamId: string, userId?: string): Promise<TeamAccessDetails> {
  try {
    // Get current user if not provided
    if (!userId) {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
    }

    if (!teamId) {
      throw new Error("Team ID is required");
    }
    
    console.log(`Getting detailed team access for user ${userId} on team ${teamId}`);
    
    try {
      const data = await invokeEdgeFunction('validate_team_access', {
        team_id: teamId,
        user_id: userId
      }, 10000) as TeamAccessResult; // 10 second timeout
      
      return {
        hasAccess: data?.is_member === true || data?.has_org_access === true,
        isMember: data?.is_member === true,
        hasOrgAccess: data?.has_org_access === true,
        hasCrossOrgAccess: data?.has_cross_org_access === true,
        accessReason: data?.access_reason || null,
        role: data?.role || null,
        orgRole: null, // We don't have this info from edge function yet
        team: data?.team || null,
        orgName: data?.org_name || null,
        teamMemberId: data?.team_member_id || null
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
        hasAccess: resultRow.has_access === true,
        isMember: resultRow.is_team_member === true,
        hasOrgAccess: resultRow.user_org_id === resultRow.team_org_id,
        hasCrossOrgAccess: false,
        accessReason: resultRow.access_reason || 'fallback_detailed_check',
        role: resultRow.team_role || null,
        orgRole: resultRow.is_org_owner ? 'owner' : null,
        team: null,
        orgName: null,
        teamMemberId: null
      };
    }
  } catch (error: any) {
    console.error('Error in getTeamAccessDetails:', error);
    // Return safe defaults
    return {
      hasAccess: false,
      isMember: false,
      hasOrgAccess: false,
      hasCrossOrgAccess: false,
      accessReason: 'error',
      role: null,
      orgRole: null,
      team: null,
      orgName: null,
      error: error.message
    };
  }
}
