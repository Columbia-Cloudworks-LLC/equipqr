
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

export class MembershipService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get detailed team membership information
   */
  async getTeamMembershipDetails(
    userId: string, 
    teamId: string
  ): Promise<{ teamMemberId: string | null; hasCrossOrgAccess: boolean }> {
    try {
      // First get app_user.id with proper UUID casting
      const { data: appUserData } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();
      
      if (!appUserData) {
        return { teamMemberId: null, hasCrossOrgAccess: false };
      }
      
      // Get team_member record with proper UUID comparison
      const { data: memberData } = await this.supabase
        .from('team_member')
        .select(`
          id,
          user_id,
          team:team_id (
            org_id
          ),
          user:user_id (
            auth_uid,
            user_profiles:auth_uid (
              org_id
            )
          )
        `)
        .eq('user_id', appUserData.id)
        .eq('team_id', teamId)
        .single();
      
      if (!memberData) {
        return { teamMemberId: null, hasCrossOrgAccess: false };
      }
      
      const teamOrgId = memberData.team?.org_id;
      const userOrgId = memberData.user?.user_profiles?.org_id;
      
      return {
        teamMemberId: memberData.id,
        hasCrossOrgAccess: teamOrgId && userOrgId && teamOrgId !== userOrgId
      };
    } catch (error) {
      console.error('Error getting team membership details:', error);
      return { teamMemberId: null, hasCrossOrgAccess: false };
    }
  }

  /**
   * Get team member role and ID with proper UUID handling
   */
  async getTeamMemberRole(userId: string, teamId: string): Promise<{ teamRole: string | null; teamMemberId: string | null }> {
    try {
      // Get app user ID with explicit UUID casting for auth_uid
      const { data: appUser } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .maybeSingle();
      
      let teamRole = null;
      let teamMemberId = null;
      
      if (appUser?.id) {
        console.log(`Found app_user.id: ${appUser.id} for auth_uid: ${userId}`);
        
        // First get team_member_id with properly typed UUID comparisons
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
    } catch (error) {
      console.error('Error in getTeamMemberRole:', error);
      return { teamRole: null, teamMemberId: null };
    }
  }

  /**
   * Get organization role with proper UUID handling
   */
  async getOrgRole(userId: string, orgId: string): Promise<string | null> {
    try {
      const { data: orgRoleData } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .maybeSingle();
      
      const orgRole = orgRoleData?.role || null;
      console.log(`Found organization role: ${orgRole} for user_id: ${userId} in org_id: ${orgId}`);
      return orgRole;
    } catch (error) {
      console.error('Error in getOrgRole:', error);
      return null;
    }
  }

  /**
   * Check organization access with proper UUID handling
   */
  async checkOrgAccess(
    userId: string, 
    teamOrgId: string, 
    hasTeamRole: boolean
  ): Promise<{ hasOrgAccess: boolean; hasCrossOrgAccess: boolean }> {
    try {
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
    } catch (error) {
      console.error('Error in checkOrgAccess:', error);
      return { hasOrgAccess: false, hasCrossOrgAccess: false };
    }
  }
}
