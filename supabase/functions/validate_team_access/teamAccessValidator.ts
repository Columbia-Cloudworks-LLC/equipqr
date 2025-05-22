
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
          access_reason: 'error_app_user_not_found',
          error: appUserError.message
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
          access_reason: 'error_user_profile_not_found',
          error: userProfileError.message
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
          access_reason: 'error_team_not_found',
          error: teamError.message
        };
      }

      if (teamData.deleted_at) {
        console.log('Team is deleted:', teamId);
        return {
          is_member: false,
          has_access: false,
          access_reason: 'team_deleted',
          error: 'Team has been deleted'
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

      if (teamMembershipError) {
        console.error('Error checking team membership:', teamMembershipError);
      }

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

        if (roleError) {
          console.error('Error getting team role:', roleError);
        }

        if (roleData) {
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
      
      // Check for organization manager/owner/admin access - these roles bypass team membership
      const hasOrgManagerAccess = hasSameOrg && orgRole && 
        (orgRole === 'owner' || orgRole === 'manager' || orgRole === 'admin');
      
      // Determine if user has access by either being a team member or having org manager rights
      const hasAccess = isTeamMember || hasOrgManagerAccess;
      
      // Determine the higher priority role (team role or org role)
      const highestRole = this.getHigherRole(teamRole, orgRole);
      
      // Determine access reason for debugging
      const accessReason = this.determineAccessReason(
        isTeamMember, 
        teamRole, 
        orgRole,
        hasSameOrg,
        hasCrossOrgAccess,
        hasOrgManagerAccess
      );
      
      console.log('Team access validation result:', {
        is_member: isTeamMember,
        has_access: hasAccess,
        role: highestRole,
        org_role: orgRole,
        team_role: teamRole,
        has_org_access: hasSameOrg,
        has_org_manager_access: hasOrgManagerAccess,
        has_cross_org_access: hasCrossOrgAccess,
        access_reason: accessReason,
        user_org_id: userOrgId,
        team_org_id: teamOrgId
      });
      
      // Return comprehensive team access information
      return {
        is_member: isTeamMember,
        has_access: hasAccess,
        team_member_id: teamMemberId,
        role: highestRole,
        org_role: orgRole,
        team_role: teamRole,
        has_org_access: hasSameOrg,
        has_org_manager_access: hasOrgManagerAccess,
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
        access_reason: 'error_unexpected',
        error: error instanceof Error ? error.message : 'Unknown error'
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
    
    // If either role is not recognized, return the other one
    if (teamPriority === -1) return orgRole;
    if (orgPriority === -1) return teamRole;
    
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
    isTeamMember: boolean, 
    teamRole: string | null, 
    orgRole: string | null,
    hasSameOrg: boolean,
    hasCrossOrg: boolean,
    hasOrgManagerAccess: boolean
  ): string {
    // Direct team membership takes precedence
    if (isTeamMember) {
      return 'team_member';
    }
    
    // If they're in the same org and user has manager/owner role
    if (hasOrgManagerAccess) {
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
