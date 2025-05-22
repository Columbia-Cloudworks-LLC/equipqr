
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
        .select('org_id')
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
      
      // For non-team members, check if they're in the same org
      let orgRole = null;
      if (!isMember && userProfile.org_id === team.org_id) {
        // Get user's organization role
        const { data: userRole, error: roleError } = await this.supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('org_id', team.org_id)
          .maybeSingle();
          
        if (roleError) throw new Error(`Error fetching user organization role: ${roleError.message}`);
        
        if (userRole) {
          orgRole = userRole.role;
          
          // Only owners and managers in the org get access without team membership
          // Viewers need explicit team membership
          if (['owner', 'manager'].includes(orgRole)) {
            role = orgRole;
          } else {
            // Stricter enforcement: org viewers need team membership
            return {
              has_access: false,
              is_member: false,
              access_reason: 'needs_team_membership',
              role: orgRole,
              user_org_id: userProfile.org_id,
              team_org_id: team.org_id
            };
          }
        }
      }
      
      // Determine access
      let hasAccess = isMember || (userProfile.org_id === team.org_id && ['owner', 'manager'].includes(orgRole));
      let reason = isMember ? 'team_member' : (hasAccess ? 'org_role' : 'no_access');
      
      return {
        has_access: hasAccess,
        is_member: isMember,
        access_reason: reason,
        role: role,
        user_org_id: userProfile.org_id,
        team_org_id: team.org_id
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
