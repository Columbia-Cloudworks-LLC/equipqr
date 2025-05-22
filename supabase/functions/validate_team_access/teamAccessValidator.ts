
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

interface TeamAccessResult {
  is_member: boolean;
  has_access: boolean;
  role: string | null;
  org_role: string | null;
  team_role: string | null;
  has_org_access: boolean;
  has_org_manager_access: boolean;
  has_cross_org_access: boolean;
  access_reason: string;
  user_org_id: string | null;
  team_org_id: string | null;
}

export class TeamAccessValidator {
  constructor(private readonly supabase: SupabaseClient) {}

  async validateAccess(userId: string, teamId: string): Promise<TeamAccessResult> {
    // Initialize the result object with defaults
    const result: TeamAccessResult = {
      is_member: false,
      has_access: false,
      role: null, 
      org_role: null,
      team_role: null,
      has_org_access: false,
      has_org_manager_access: false,
      has_cross_org_access: false,
      access_reason: 'none',
      user_org_id: null,
      team_org_id: null
    };

    try {
      // Get user's organization ID
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .single();
        
      result.user_org_id = userProfile?.org_id || null;

      // Get team's organization ID
      const { data: teamData } = await this.supabase
        .from('team')
        .select('org_id')
        .eq('id', teamId)
        .single();
        
      result.team_org_id = teamData?.org_id || null;

      // If either the user or team doesn't exist, return early
      if (!result.user_org_id || !result.team_org_id) {
        return result;
      }

      // Check if user is in the same organization as the team
      result.has_org_access = result.user_org_id === result.team_org_id;
      
      // Get user's organization role
      const { data: userRoleData } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', result.team_org_id)
        .single();
        
      result.org_role = userRoleData?.role || null;
      
      // Check if user has manager access in the organization
      result.has_org_manager_access = result.org_role === 'owner' || result.org_role === 'manager';

      // Get app_user ID for this auth user
      const { data: appUserData } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();
        
      if (appUserData?.id) {
        // Check if user is a team member
        const { data: teamMember } = await this.supabase
          .from('team_member')
          .select('id')
          .eq('user_id', appUserData.id)
          .eq('team_id', teamId)
          .single();
          
        result.is_member = !!teamMember?.id;
        
        if (result.is_member) {
          // Get team role
          const { data: roleData } = await this.supabase
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id)
            .single();
            
          result.team_role = roleData?.role || null;
          
          result.access_reason = 'team_member';
        }
      }
      
      // Determine if user has cross-organization access
      result.has_cross_org_access = result.is_member && !result.has_org_access;
      
      // Determine overall access and effective role
      result.has_access = result.is_member || result.has_org_access;
      result.role = result.team_role || result.org_role;
      
      // Set access reason if not already set
      if (result.access_reason === 'none' && result.has_org_access) {
        result.access_reason = 'same_org';
      }

      return result;
      
    } catch (error) {
      console.error('Error validating team access:', error);
      return result;
    }
  }
}
