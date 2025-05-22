// Helper class to validate team access with proper organization role checking
export class TeamAccessValidator {
  private supabase;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async validateAccess(userId: string, teamId: string) {
    try {
      // Get app_user ID for team membership checks
      const { data: appUserData, error: appUserError } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();

      if (appUserError) {
        console.error('Error getting app_user ID:', appUserError);
        return { 
          is_member: false, 
          has_access: false,
          access_reason: 'error_app_user_not_found'
        };
      }

      const appUserId = appUserData.id;

      // Get user's organization ID
      const { data: userProfile, error: userProfileError } = await this.supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .single();

      if (userProfileError) {
        console.error('Error getting user profile:', userProfileError);
        return { 
          is_member: false, 
          has_access: false,
          access_reason: 'error_user_profile_not_found'
        };
      }

      const userOrgId = userProfile.org_id;

      // Get team details
      const { data: teamData, error: teamError } = await this.supabase
        .from('team')
        .select('*, org:org_id(id, name)')
        .eq('id', teamId)
        .single();

      if (teamError) {
        console.error('Error getting team details:', teamError);
        return { 
          is_member: false, 
          has_access: false,
          access_reason: 'error_team_not_found'
        };
      }

      const teamOrgId = teamData.org_id;
      const teamOrgName = teamData.org?.name;
      
      // Check if user is a direct team member
      const { data: teamMembership, error: teamMembershipError } = await this.supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUserId)
        .eq('team_id', teamId)
        .maybeSingle();

      const isTeamMember = teamMembership !== null;
      let teamMemberId = teamMembership?.id || null;
      let teamRole = null;

      // If direct team member, get role
      if (isTeamMember && teamMemberId) {
        const { data: roleData, error: roleError } = await this.supabase
          .from('team_roles')
          .select('role')
          .eq('team_member_id', teamMemberId)
          .maybeSingle();

        if (!roleError && roleData) {
          teamRole = roleData.role;
        }
      }

      // Check user's organization role
      const { data: orgRoleData, error: orgRoleError } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', teamOrgId)
        .maybeSingle();

      if (orgRoleError) {
        console.error('Error getting org role:', orgRoleError);
      }

      const orgRole = orgRoleData?.role || null;
      
      // Is this a cross-org access situation?
      const hasCrossOrgAccess = userOrgId !== teamOrgId && isTeamMember;
      
      // Check for same organization - critical fix here
      const hasSameOrg = userOrgId === teamOrgId;
      
      // Check for organization manager/owner access - this is the critical fix
      // If user is in the same org, and has manager or owner role, they should have access
      const hasOrgManagerAccess = hasSameOrg && 
        (orgRole === 'owner' || orgRole === 'manager');
      
      // Determine if user has access by either being a team member or having org manager rights
      const hasAccess = isTeamMember || hasOrgManagerAccess;
      
      // Determine the higher priority role (team role or org role)
      const highestRole = this.getHigherRole(teamRole, orgRole);
      
      // Determine access reason for debugging
      const accessReason = this.determineAccessReason(
        isTeamMember ? 'team_member' : null, 
        teamRole, 
        orgRole,
        hasSameOrg,
        hasCrossOrgAccess
      );
      
      // Return comprehensive team access information
      return {
        is_member: isTeamMember,
        has_access: hasAccess,
        team_member_id: teamMemberId,
        role: highestRole,
        org_role: orgRole,
        team_role: teamRole,
        has_org_access: hasSameOrg,
        has_cross_org_access: hasCrossOrgAccess,
        access_reason: accessReason,
        team_details: teamData,
        org_name: teamOrgName,
        user_org_id: userOrgId,
        team_org_id: teamOrgId
      };
      
    } catch (error) {
      console.error('Unexpected error in validateAccess:', error);
      return { 
        is_member: false, 
        has_access: false,
        access_reason: 'error_unexpected'
      };
    }
  }
  
  // Helper to get higher priority role between team and org roles
  private getHigherRole(teamRole: string | null, orgRole: string | null): string | null {
    // Role priority from highest to lowest
    const rolePriority = ['owner', 'manager', 'admin', 'creator', 'technician', 'viewer'];
    
    // If only one role exists, return it
    if (!teamRole) return orgRole;
    if (!orgRole) return teamRole;
    
    // Find the priority index for each role
    const teamPriority = rolePriority.indexOf(teamRole);
    const orgPriority = rolePriority.indexOf(orgRole);
    
    // Lower index means higher priority
    // If org role is owner or manager, it should take precedence
    if (orgRole === 'owner' || orgRole === 'manager') {
      return orgRole;
    }
    
    // Otherwise, return the higher priority role (lower index)
    return teamPriority < orgPriority ? teamRole : orgRole;
  }
  
  // Helper to determine access reason
  private determineAccessReason(
    membershipType: string | null, 
    teamRole: string | null, 
    orgRole: string | null,
    hasSameOrg: boolean,
    hasCrossOrg: boolean
  ): string {
    // Direct team membership takes precedence
    if (membershipType === 'team_member') {
      return 'team_member';
    }
    
    // If they're in the same org and user has manager/owner role
    if (hasSameOrg && orgRole && (orgRole === 'owner' || orgRole === 'manager')) {
      return 'org_manager_access';
    }
    
    // Same org but no direct team membership
    if (hasSameOrg) {
      return 'same_org';
    }
    
    // Cross-org access via team
    if (hasCrossOrg) {
      return 'cross_org_team';
    }
    
    // Default - no clear reason for access
    return 'none';
  }
}
