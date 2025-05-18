
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Interface for team access results
 */
export interface TeamAccessResult {
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

/**
 * Class to handle team access validation and role determination
 */
export class TeamAccessValidator {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
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
      return this.handleFallbackAccessCheck(userId, teamId);
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
   * Fallback method for simpler access check
   */
  private async handleFallbackAccessCheck(userId: string, teamId: string): Promise<TeamAccessResult> {
    const { data: canAccess, error: simpleAccessError } = await this.supabase.rpc('check_team_access_nonrecursive', {
      p_user_id: userId,
      p_team_id: teamId
    });
    
    if (simpleAccessError) {
      console.error('Error in fallback team access check:', simpleAccessError);
      throw new Error(simpleAccessError.message);
    }
    
    if (!canAccess) {
      return {
        is_member: false,
        access_reason: 'no_permission'
      };
    }
    
    // If canAccess is true, we need to get more details
    return this.getDetailedAccessInfo(userId, teamId, { is_member: true });
  }

  /**
   * Get detailed access information for a user
   */
  private async getDetailedAccessInfo(
    userId: string, 
    teamId: string, 
    initialAccess: { is_member: boolean; has_org_access?: boolean; }
  ): Promise<TeamAccessResult> {
    // Get team information
    const teamData = await this.getTeamData(teamId);
    if (!teamData) {
      throw new Error("Team not found");
    }
    
    // Get team member role and ID
    const { teamRole, teamMemberId } = await this.getTeamMemberRole(userId, teamId);
    
    // Get org role
    const orgRole = await this.getOrgRole(userId, teamData.org_id);
    
    // Get effective role
    const effectiveRole = this.getHigherRole(teamRole, orgRole);
    
    // Check if user is team creator
    const isCreator = await this.isTeamCreator(userId, teamId);
    
    // Determine final role
    let finalRole = effectiveRole;
    if (isCreator && !finalRole) {
      finalRole = 'manager';
      console.log(`User ${userId} is the team creator, assigning manager role`);
    }
    
    // Get organization information
    const orgName = await this.getOrgName(teamData.org_id);
    
    // Check organization access
    const { hasOrgAccess, hasCrossOrgAccess } = await this.checkOrgAccess(userId, teamData.org_id, teamRole !== null);
    
    // Determine access reason
    const accessReason = this.determineAccessReason(
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

  /**
   * Get team creator information
   */
  private async isTeamCreator(userId: string, teamId: string): Promise<boolean> {
    const { data: teamCreator } = await this.supabase
      .from('team')
      .select('created_by')
      .eq('id', teamId)
      .single();
    
    return teamCreator && teamCreator.created_by === userId;
  }

  /**
   * Get team data
   */
  private async getTeamData(teamId: string): Promise<{ name: string; org_id: string } | null> {
    const { data: teamData } = await this.supabase
      .from('team')
      .select('name, org_id')
      .eq('id', teamId)
      .single();
    
    return teamData;
  }

  /**
   * Get organization name
   */
  private async getOrgName(orgId: string): Promise<string | null> {
    const { data: orgData } = await this.supabase
      .from('organization')
      .select('name')
      .eq('id', orgId)
      .single();
      
    return orgData ? orgData.name : null;
  }

  /**
   * Get team member role and ID
   */
  private async getTeamMemberRole(userId: string, teamId: string): Promise<{ teamRole: string | null; teamMemberId: string | null }> {
    // Get app user ID
    const { data: appUser } = await this.supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .maybeSingle();
    
    let teamRole = null;
    let teamMemberId = null;
    
    if (appUser?.id) {
      console.log(`Found app_user.id: ${appUser.id} for auth_uid: ${userId}`);
      
      // First get team_member_id
      const { data: teamMember } = await this.supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', teamId)
        .maybeSingle();
      
      teamMemberId = teamMember?.id || null;
      
      // Then get role if team_member exists
      if (teamMember?.id) {
        console.log(`Found team_member.id: ${teamMember.id} for user_id: ${appUser.id} and team_id: ${teamId}`);
        
        const { data: roleData } = await this.supabase
          .from('team_roles')
          .select('role')
          .eq('team_member_id', teamMember.id)
          .maybeSingle();
        
        teamRole = roleData?.role || null;
        console.log(`Found team_role: ${teamRole} for team_member_id: ${teamMember.id}`);
      }
    }
    
    return { teamRole, teamMemberId };
  }

  /**
   * Get organization role
   */
  private async getOrgRole(userId: string, orgId: string): Promise<string | null> {
    const { data: orgRoleData } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .maybeSingle();
    
    const orgRole = orgRoleData?.role || null;
    console.log(`Found organization role: ${orgRole} for user_id: ${userId} in org_id: ${orgId}`);
    return orgRole;
  }

  /**
   * Check organization access
   */
  private async checkOrgAccess(
    userId: string, 
    teamOrgId: string, 
    hasTeamRole: boolean
  ): Promise<{ hasOrgAccess: boolean; hasCrossOrgAccess: boolean }> {
    const { data: userProfile } = await this.supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    let hasOrgAccess = false;
    let hasCrossOrgAccess = false;
    
    if (userProfile && userProfile.org_id === teamOrgId) {
      hasOrgAccess = true;
    } else if (hasTeamRole) {
      // If user has a role but isn't in the same org, they have cross-org access
      hasCrossOrgAccess = true;
    }
    
    return { hasOrgAccess, hasCrossOrgAccess };
  }

  /**
   * Determine the higher role based on permission level
   */
  private getHigherRole(role1: string | null, role2: string | null): string | null {
    if (!role1) return role2;
    if (!role2) return role1;
    
    // Define role hierarchy from highest to lowest permission level
    const roleHierarchy = ['owner', 'admin', 'manager', 'creator', 'technician', 'viewer', 'member'];
    
    const role1Index = roleHierarchy.indexOf(role1);
    const role2Index = roleHierarchy.indexOf(role2);
    
    // If role isn't in our hierarchy, default to the other role
    if (role1Index === -1) return role2;
    if (role2Index === -1) return role1;
    
    // Lower index = higher permission
    return role1Index < role2Index ? role1 : role2;
  }

  /**
   * Determine the access reason
   */
  private determineAccessReason(
    initialReason: string | undefined,
    teamRole: string | null,
    orgRole: string | null,
    hasOrgAccess: boolean,
    hasCrossOrgAccess: boolean
  ): string {
    let accessReason = initialReason || 'none';
    
    if (accessReason === 'none') {
      if (teamRole) {
        accessReason = 'team_member';
      } else if (orgRole && hasOrgAccess) {
        accessReason = 'org_role';
      } else if (hasOrgAccess) {
        accessReason = 'same_org';
      } else if (hasCrossOrgAccess) {
        accessReason = 'cross_org_access';
      }
    }
    
    return accessReason;
  }
}
