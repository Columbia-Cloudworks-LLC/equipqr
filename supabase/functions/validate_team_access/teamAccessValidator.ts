
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { TeamAccessResult, MembershipDetails, TeamData, TeamDetails } from './interfaces.ts';
import { getHigherRole, determineAccessReason } from './roleUtils.ts';

/**
 * Class responsible for validating team access with intelligent fallbacks
 * and detailed access information.
 */
export class TeamAccessValidator {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Validate if a user has access to a team and get detailed access information
   */
  async validateAccess(userId: string, teamId: string): Promise<TeamAccessResult> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId) || !uuidRegex.test(teamId)) {
        console.error('Invalid UUID format:', { userId, teamId });
        return {
          is_member: false,
          access_reason: 'error_invalid_uuid'
        };
      }
      
      // Step 1: Get user's organization ID
      const { data: userData, error: userError } = await this.supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user org:', userError);
        return {
          is_member: false,
          access_reason: 'error_fetching_user'
        };
      }

      const userOrgId = userData?.org_id;

      // Step 2: Get team's organization ID and name
      const { data: teamData, error: teamError } = await this.supabase
        .from('team')
        .select('org_id, name')
        .eq('id', teamId)
        .is('deleted_at', null)
        .single();

      if (teamError) {
        console.error('Error fetching team:', teamError);
        return {
          is_member: false,
          access_reason: 'error_team_not_found'
        };
      }

      const teamOrgId = teamData?.org_id;
      
      // Step 3: Check if user is a member of the team through app_user
      const { membershipDetails, error: membershipError } = 
        await this.checkTeamMembership(userId, teamId);
      
      if (membershipError) {
        console.warn('Error checking team membership:', membershipError);
        // Continue with evaluation, don't fail completely
      }
      
      // Step 4: Get org role if user is in same org as team
      let orgRole: string | null = null;
      const hasSameOrg = userOrgId === teamOrgId;
      
      if (hasSameOrg) {
        const { data: orgRoleData, error: orgRoleError } = await this.supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('org_id', teamOrgId)
          .single();
        
        if (!orgRoleError) {
          orgRole = orgRoleData?.role || null;
        }
      }
      
      // Step 5: Get team details
      const { teamData: teamDetails, orgName } = 
        await this.getTeamDetails(teamId, teamOrgId);
      
      // Step 6: Determine team role
      let teamRole: string | null = null;
      
      if (membershipDetails.teamMemberId) {
        const { data: roleData, error: roleError } = await this.supabase
          .from('team_roles')
          .select('role')
          .eq('team_member_id', membershipDetails.teamMemberId)
          .single();
        
        if (!roleError) {
          teamRole = roleData?.role || null;
        }
      }
      
      // Step 7: Determine final role and reason
      const finalRole = getHigherRole(teamRole, orgRole);
      const hasCrossOrg = membershipDetails.hasCrossOrgAccess;
      const accessReason = determineAccessReason(
        membershipDetails.teamMemberId ? 'team_member' : undefined,
        teamRole,
        orgRole,
        hasSameOrg,
        hasCrossOrg
      );
      
      // FIXED: Organization managers should always have access
      // If user has org-level manager or owner role, they should have access to all teams in their org
      let isMember = !!membershipDetails.teamMemberId;
      
      // If user is in same org and has manager/owner role at org level
      // consider them as having team access
      if (hasSameOrg && (orgRole === 'manager' || orgRole === 'owner')) {
        isMember = true;
      }
      
      // Step 8: Build and return the result
      return {
        is_member: isMember,
        has_org_access: hasSameOrg,
        has_cross_org_access: hasCrossOrg,
        team_member_id: membershipDetails.teamMemberId,
        access_reason: accessReason,
        role: finalRole,
        team: teamDetails,
        org_name: orgName
      };
    } catch (error) {
      console.error('Unexpected error validating team access:', error);
      return {
        is_member: false,
        access_reason: 'error_unexpected'
      };
    }
  }

  /**
   * Check if a user is a member of a team
   */
  private async checkTeamMembership(userId: string, teamId: string): Promise<{ 
    membershipDetails: MembershipDetails;
    error?: Error;
  }> {
    try {
      // First get the app_user.id for this auth.users.id
      const { data: appUser, error: appUserError } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();
      
      if (appUserError) {
        throw new Error(`Could not find app_user: ${appUserError.message}`);
      }
      
      const appUserId = appUser?.id;
      
      if (!appUserId) {
        return { 
          membershipDetails: { teamMemberId: null, hasCrossOrgAccess: false },
          error: new Error('App user ID not found') 
        };
      }
      
      // Check team membership using app_user.id
      const { data: teamMember, error: teamMemberError } = await this.supabase
        .from('team_member')
        .select('id, team:team_id(org_id)')
        .eq('user_id', appUserId)
        .eq('team_id', teamId)
        .single();
        
      if (teamMemberError && teamMemberError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - not an actual error for our purposes
        console.warn(`Team member check failed: ${teamMemberError.message}`);
        return { 
          membershipDetails: { teamMemberId: null, hasCrossOrgAccess: false },
          error: teamMemberError 
        };
      }
      
      // Check if this is cross-org access
      const hasCrossOrgAccess = teamMember?.team?.org_id ? 
        await this.isCrossOrgAccess(userId, teamMember.team.org_id) : 
        false;
      
      return { 
        membershipDetails: { 
          teamMemberId: teamMember?.id || null,
          hasCrossOrgAccess
        } 
      };
    } catch (error) {
      console.error('Error in checkTeamMembership:', error);
      return { 
        membershipDetails: { teamMemberId: null, hasCrossOrgAccess: false },
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Check if access is cross-organizational
   */
  private async isCrossOrgAccess(userId: string, teamOrgId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.warn('Error checking org access:', error);
      return false;
    }
    
    return data?.org_id !== teamOrgId;
  }
  
  /**
   * Get team details and org name
   */
  private async getTeamDetails(teamId: string, teamOrgId?: string): Promise<TeamDetails> {
    // Init with defaults
    let teamData: TeamData | null = null;
    let orgName: string | null = null;
    
    try {
      // Get team data if not provided
      if (!teamOrgId) {
        const { data, error } = await this.supabase
          .from('team')
          .select('name, org_id')
          .eq('id', teamId)
          .single();
        
        if (!error) {
          teamData = data as TeamData;
          teamOrgId = data?.org_id;
        }
      } else if (teamOrgId) {
        // We only have the org_id but need to get team name
        const { data, error } = await this.supabase
          .from('team')
          .select('name')
          .eq('id', teamId)
          .single();
          
        if (!error && data) {
          teamData = {
            name: data.name,
            org_id: teamOrgId
          };
        }
      }
      
      // Get org name if we have org_id
      if (teamOrgId) {
        const { data, error } = await this.supabase
          .from('organization')
          .select('name')
          .eq('id', teamOrgId)
          .single();
          
        if (!error) {
          orgName = data?.name || null;
        }
      }
    } catch (error) {
      console.warn('Error fetching team details:', error);
    }
    
    return { teamData, orgName };
  }
}
