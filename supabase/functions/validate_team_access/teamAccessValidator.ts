
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { TeamAccessResult } from './interfaces.ts';
import { MembershipService } from './membershipService.ts';
import { TeamDataService } from './teamDataService.ts';
import { FallbackValidator } from './fallbackValidator.ts';
import { getHigherRole, determineAccessReason } from './roleUtils.ts';

export class TeamAccessValidator {
  private supabase: SupabaseClient;
  private membershipService: MembershipService;
  private teamDataService: TeamDataService;
  private fallbackValidator: FallbackValidator;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    this.membershipService = new MembershipService(supabaseClient);
    this.teamDataService = new TeamDataService(supabaseClient);
    this.fallbackValidator = new FallbackValidator(supabaseClient);
  }
  
  async validateAccess(userId: string, teamId: string): Promise<TeamAccessResult> {
    try {
      // First try RPC function call - handle UUID conversion explicitly
      const { data: initialResult, error: initialError } = await this.supabase.rpc(
        'validate_team_access_with_org',
        { 
          p_user_id: userId,
          p_team_id: teamId
        }
      );
      
      if (initialError) {
        console.error('Error in validate_team_access_with_org:', initialError);
        
        // Use fallback approach with direct queries
        return await this.fallbackValidator.handleFallbackAccessCheck(userId, teamId);
      }
      
      // Get additional data based on the initial result
      return await this.processInitialResult(initialResult, userId, teamId);
    } catch (error) {
      console.error('Unexpected error in validateAccess:', error);
      return {
        is_member: false,
        access_reason: 'error'
      };
    }
  }
  
  private async processInitialResult(initialResult: any, userId: string, teamId: string): Promise<TeamAccessResult> {
    const firstResult = Array.isArray(initialResult) && initialResult.length > 0 
      ? initialResult[0] 
      : null;
    
    if (!firstResult) {
      console.warn('No initial access result returned');
      return {
        is_member: false,
        access_reason: 'no_result'
      };
    }
    
    // Get team data if needed
    let teamData = null;
    let orgName = null;
    
    if (firstResult.is_member || firstResult.has_org_access) {
      const teamDetails = await this.teamDataService.getTeamDetails(teamId);
      teamData = teamDetails?.teamData || null;
      orgName = teamDetails?.orgName || null;
    }
    
    // Handle cross-org access if needed
    let hasCrossOrgAccess = false;
    let teamMemberId = null;
    
    if (firstResult.is_member) {
      const memberDetails = await this.membershipService.getTeamMembershipDetails(userId, teamId);
      teamMemberId = memberDetails?.teamMemberId || null;
      hasCrossOrgAccess = memberDetails?.hasCrossOrgAccess || false;
    }
    
    // Get org role to combine with team role if necessary
    const orgRole = firstResult.team_org_id ? 
      await this.membershipService.getOrgRole(userId, firstResult.team_org_id) : null;
    
    // Get combined role
    const role = getHigherRole(firstResult.role, orgRole);
    
    // Determine final access reason
    const accessReason = determineAccessReason(
      firstResult.access_reason,
      firstResult.role,
      orgRole,
      !!firstResult.has_org_access,
      hasCrossOrgAccess
    );
    
    return {
      is_member: firstResult.is_member === true,
      has_org_access: firstResult.has_org_access === true,
      has_cross_org_access: hasCrossOrgAccess,
      team_member_id: teamMemberId,
      role,
      access_reason: accessReason,
      team: teamData,
      org_name: orgName
    };
  }
}
