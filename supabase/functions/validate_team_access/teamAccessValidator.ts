
export class TeamAccessValidator {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async validateAccess(userId: string, teamId: string) {
    try {
      // Get user's organization
      const { data: userProfile, error: userError } = await this.supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .maybeSingle();

      if (userError) throw new Error(`Error fetching user profile: ${userError.message}`);
      
      if (!userProfile) {
        return {
          has_access: false,
          is_member: false,
          access_reason: 'user_not_found',
          role: null,
          user_org_id: null,
          team_org_id: null
        };
      }
      
      // Get team details
      const { data: team, error: teamError } = await this.supabase
        .from('team')
        .select('org_id, name')
        .eq('id', teamId)
        .is('deleted_at', null)
        .maybeSingle();
        
      if (teamError) throw new Error(`Error fetching team: ${teamError.message}`);
      
      if (!team) {
        return {
          has_access: false,
          is_member: false,
          access_reason: 'team_not_found',
          role: null,
          user_org_id: userProfile.org_id,
          team_org_id: null
        };
      }
      
      // Get app_user ID for this auth user
      const { data: appUser, error: appUserError } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .maybeSingle();
        
      if (appUserError) throw new Error(`Error fetching app_user: ${appUserError.message}`);
      
      if (!appUser) {
        return {
          has_access: false,
          is_member: false,
          access_reason: 'app_user_not_found',
          role: null,
          user_org_id: userProfile.org_id,
          team_org_id: team.org_id
        };
      }
      
      // Check if user is a direct team member
      const { data: teamMember, error: memberError } = await this.supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', teamId)
        .maybeSingle();
        
      if (memberError) throw new Error(`Error checking team membership: ${memberError.message}`);
      
      // If user is a direct team member, get their role
      let role = null;
      let isMember = false;
      
      if (teamMember) {
        isMember = true;
        const { data: teamRole, error: roleError } = await this.supabase
          .from('team_roles')
          .select('role')
          .eq('team_member_id', teamMember.id)
          .maybeSingle();
          
        if (roleError) throw new Error(`Error fetching team role: ${roleError.message}`);
        
        if (teamRole) {
          role = teamRole.role;
        }
      }
      
      // CRITICAL FIX: Check user's role in the TEAM's organization, even if it's not their primary org
      // This allows users with roles in multiple organizations to access teams in those orgs
      const { data: userRoleInTeamOrg, error: teamOrgRoleError } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', team.org_id)
        .maybeSingle();
      
      if (teamOrgRoleError) {
        console.error('Error fetching user organization role in team org:', teamOrgRoleError);
      }
      
      let orgRole = userRoleInTeamOrg?.role || null;
      
      // Log detailed diagnostic information
      console.log('Access check details:', {
        userId,
        teamId,
        userOrgId: userProfile.org_id,
        teamOrgId: team.org_id,
        hasCrossOrgRole: userProfile.org_id !== team.org_id && orgRole !== null,
        isMember,
        teamRole: role,
        orgRole
      });
      
      // Determine if user has access through organization role
      // Important: Check if they have permission in the TEAM's organization
      const hasOrgRoleAccess = orgRole && ['owner', 'manager'].includes(orgRole);
      
      // Determine access: either team member or has appropriate org role in team's org
      const hasAccess = isMember || hasOrgRoleAccess;
      
      // Define access reason
      let accessReason;
      if (isMember) {
        accessReason = 'team_member';
      } else if (hasOrgRoleAccess) {
        accessReason = 'org_role_in_teams_org';
      } else if (userProfile.org_id === team.org_id) {
        accessReason = 'same_org_no_access';
      } else {
        accessReason = 'no_access';
      }
      
      // Get team organization name for UI context
      let orgName = null;
      if (team.org_id) {
        const { data: orgData } = await this.supabase
          .from('organization')
          .select('name')
          .eq('id', team.org_id)
          .maybeSingle();
          
        if (orgData) {
          orgName = orgData.name;
        }
      }
      
      // Define whether user has cross-organization access
      const hasCrossOrgAccess = userProfile.org_id !== team.org_id && hasAccess;
      
      return {
        has_access: hasAccess,
        is_member: isMember,
        access_reason: accessReason,
        role: role || orgRole,  // Use direct role or org role
        user_org_id: userProfile.org_id,
        team_org_id: team.org_id,
        org_name: orgName,
        team_name: team.name,
        has_cross_org_access: hasCrossOrgAccess
      };
      
    } catch (error) {
      console.error('Error in validateAccess:', error);
      return {
        has_access: false,
        is_member: false,
        access_reason: `error: ${error.message}`,
        role: null,
        error: error.message
      };
    }
  }
}
