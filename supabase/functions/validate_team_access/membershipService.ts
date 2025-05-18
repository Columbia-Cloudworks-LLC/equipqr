
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Service for team membership operations
 */
export class MembershipService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get team member role and ID
   */
  async getTeamMemberRole(userId: string, teamId: string): Promise<{ teamRole: string | null; teamMemberId: string | null }> {
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
  async getOrgRole(userId: string, orgId: string): Promise<string | null> {
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
  async checkOrgAccess(
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
}
