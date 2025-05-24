
import { supabase } from '@/integrations/supabase/client';
import { TeamAccessResult } from './teamValidationTypes';

/**
 * Validate a user's membership in a team using the enhanced unified permissions function
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
    
    // Use the enhanced unified permissions function
    const { data, error } = await supabase.functions.invoke('permissions', {
      body: {
        userId,
        resource: 'team',
        action: 'read',
        resourceId: teamId
      }
    });
    
    if (error) {
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
          has_access: fallbackResult === true,
          access_reason: 'fallback_check'
        } as TeamAccessResult
      };
    }
    
    console.log('Team membership validation result:', data);
    
    // Enhanced result processing with organization role support
    const result: TeamAccessResult = {
      is_member: data?.details?.is_member || false,
      has_access: data?.has_permission || false,
      access_reason: data?.reason || 'unknown',
      user_org_id: data?.details?.user_org_id,
      team_org_id: data?.details?.team_org_id,
      role: data?.role,
      has_cross_org_access: data?.details?.has_cross_org_access || false,
      has_org_access: data?.details?.has_org_access || false,
      org_role: data?.details?.org_role || data?.role
    };
    
    // Enhanced diagnostics for organization owners
    const diagnostics = {
      isMember: result.is_member,
      accessReason: result.access_reason,
      userOrgId: result.user_org_id,
      teamOrgId: result.team_org_id,
      role: result.role,
      orgRole: result.org_role,
      hasCrossOrgAccess: result.has_cross_org_access,
      hasOrgAccess: result.has_org_access,
      sameOrg: result.user_org_id === result.team_org_id
    };
    
    console.log('Enhanced team access diagnostics:', diagnostics);
    
    return {
      isValid: data?.has_permission === true,
      result,
      diagnostics
    };
  } catch (error: any) {
    console.error('Error in validateTeamMembership:', error);
    return {
      isValid: false,
      result: {
        is_member: false,
        has_access: false,
        access_reason: 'error_validation_failed'
      } as TeamAccessResult,
      error: error.message
    };
  }
}
