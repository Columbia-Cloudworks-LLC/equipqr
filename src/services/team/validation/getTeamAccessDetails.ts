
import { TeamAccessResult } from './teamValidationTypes';
import { validateTeamMembership } from './validateTeamMembership';

/**
 * Enhanced function to get detailed team access information from the edge function
 * This is an improved version that handles cross-organization permissions correctly
 */
export async function getTeamAccessDetails(teamId: string, userId?: string) {
  try {
    // Use the validateTeamMembership function that calls our updated edge function
    const validationResult = await validateTeamMembership(teamId, userId);
    
    const result = validationResult.result || {} as TeamAccessResult;
    
    // Extract all relevant properties from the validation result
    return {
      hasAccess: result.has_access || false,
      isMember: result.is_member || false,
      accessReason: result.access_reason || 'unknown',
      role: result.role || null,
      orgRole: result.org_role || result.role || null,  // Use org_role if available, fallback to role
      orgName: result.org_name || null,
      teamName: result.team_name || null,
      team: result.team || null,
      hasCrossOrgAccess: result.has_cross_org_access || false,
      hasOrgAccess: result.has_org_access || false,
      userOrgId: result.user_org_id || null,
      teamOrgId: result.team_org_id || null,
      error: validationResult.error
    };
  } catch (error: any) {
    console.error('Error getting team access details:', error);
    return {
      hasAccess: false,
      isMember: false,
      accessReason: 'error',
      role: null,
      orgRole: null,
      orgName: null,
      teamName: null,
      team: null,
      hasCrossOrgAccess: false,
      hasOrgAccess: false,
      error: error.message
    };
  }
}
