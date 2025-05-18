
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { TeamAccessResult, InitialAccessResult } from './interfaces.ts';
import { TeamDataService } from './teamDataService.ts';
import { MembershipService } from './membershipService.ts';
import { FallbackValidator } from './fallbackValidator.ts';
import { getHigherRole, determineAccessReason } from './roleUtils.ts';

/**
 * Class to handle team access validation and role determination
 */
export class TeamAccessValidator {
  private supabase: SupabaseClient;
  private teamDataService: TeamDataService;
  private membershipService: MembershipService;
  private fallbackValidator: FallbackValidator;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    this.teamDataService = new TeamDataService(supabaseClient);
    this.membershipService = new MembershipService(supabaseClient);
    this.fallbackValidator = new FallbackValidator(supabaseClient);
  }

  /**
   * Main method to validate user's access to a team
   */
  async validateAccess(userId: string, teamId: string): Promise<TeamAccessResult> {
    // Use our improved non-recursive function to check team access that accounts for organization roles
    const { data: accessResult, error: accessError } = await this.supabase.rpc('validate_team_access_with_org', {
      p_user_id: userId,
      p_team_id: teamId
    });
    
    if (accessError) {
      console.error('Error checking team access:', accessError);
      throw new Error(accessError.message);
    }
    
    // If no access information returned, fall back to check_team_access_nonrecursive
    if (!accessResult) {
      return this.fallbackValidator.handleFallbackAccessCheck(userId, teamId);
    } 
    
    if (!accessResult.is_member && !accessResult.has_org_access) {
      return {
        is_member: false,
        access_reason: 'no_permission'
      };
    }
    
    // User has access, get additional details
    return this.getDetailedAccessInfo(userId, teamId, accessResult);
  }

  /**
   * Get detailed access information for a user
   */
  private async getDetailedAccessInfo(
    userId: string, 
    teamId: string, 
    initialAccess: InitialAccessResult
  ): Promise<TeamAccessResult> {
    // Get team information
    const teamData = await this.teamDataService.getTeamData(teamId);
    if (!teamData) {
      throw new Error("Team not found");
    }
    
    // Get team member role and ID
    const { teamRole, teamMemberId } = await this.membershipService.getTeamMemberRole(userId, teamId);
    
    // Get org role
    const orgRole = await this.membershipService.getOrgRole(userId, teamData.org_id);
    
    // Get effective role
    const effectiveRole = getHigherRole(teamRole, orgRole);
    
    // Check if user is team creator
    const isCreator = await this.teamDataService.isTeamCreator(userId, teamId);
    
    // Determine final role
    let finalRole = effectiveRole;
    if (isCreator && !finalRole) {
      finalRole = 'manager';
      console.log(`User ${userId} is the team creator, assigning manager role`);
    }
    
    // Get organization information
    const orgName = await this.teamDataService.getOrgName(teamData.org_id);
    
    // Check organization access
    const { hasOrgAccess, hasCrossOrgAccess } = await this.membershipService.checkOrgAccess(
      userId, 
      teamData.org_id, 
      teamRole !== null
    );
    
    // Determine access reason
    const accessReason = determineAccessReason(
      initialAccess.access_reason,
      teamRole,
      orgRole,
      hasOrgAccess,
      hasCrossOrgAccess
    );
    
    return {
      is_member: true,
      has_org_access: hasOrgAccess,
      has_cross_org_access: hasCrossOrgAccess,
      team_member_id: teamMemberId,
      access_reason: accessReason,
      role: finalRole || null,
      team: {
        name: teamData.name,
        org_id: teamData.org_id
      },
      org_name: orgName
    };
  }
}
