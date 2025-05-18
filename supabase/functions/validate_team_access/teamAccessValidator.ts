
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { TeamAccessResult, InitialAccessResult } from './interfaces.ts';
import { getHigherRole, determineAccessReason } from './roleUtils.ts';

export class TeamAccessValidator {
  private supabase: SupabaseClient;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
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
        return await this.fallbackValidation(userId, teamId);
      }
      
      // Get additional data based on the initial result
      const firstResult = Array.isArray(initialResult) && initialResult.length > 0 
        ? initialResult[0] as InitialAccessResult 
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
        const teamDetails = await this.getTeamData(teamId);
        teamData = teamDetails?.teamData || null;
        orgName = teamDetails?.orgName || null;
      }
      
      // Handle cross-org access if needed
      let hasCrossOrgAccess = false;
      let teamMemberId = null;
      
      if (firstResult.is_member) {
        const memberDetails = await this.getTeamMembership(userId, teamId);
        teamMemberId = memberDetails?.teamMemberId || null;
        hasCrossOrgAccess = memberDetails?.hasCrossOrgAccess || false;
      }
      
      // Get org role to combine with team role if necessary
      const orgRole = firstResult.team_org_id ? 
        await this.getUserOrgRole(userId, firstResult.team_org_id) : null;
      
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
    } catch (error) {
      console.error('Unexpected error in validateAccess:', error);
      return {
        is_member: false,
        access_reason: 'error'
      };
    }
  }
  
  private async fallbackValidation(userId: string, teamId: string): Promise<TeamAccessResult> {
    console.log(`Using fallback access check for userId: ${userId}, teamId: ${teamId}`);
    
    try {
      // First check direct team membership through app_user
      const { data: appUserData } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();
      
      const appUserId = appUserData?.id;
      if (!appUserId) {
        console.error('No app_user record found for this auth user');
        return { 
          is_member: false,
          access_reason: 'no_app_user' 
        };
      }
      
      // Check team membership
      const { data: memberData } = await this.supabase
        .from('team_member')
        .select(`
          id,
          team_id,
          team_roles (
            role
          )
        `)
        .eq('user_id', appUserId)
        .eq('team_id', teamId);
      
      const isMember = memberData && memberData.length > 0;
      let role = null;
      let teamMemberId = null;
      
      if (isMember && memberData![0].team_roles && memberData![0].team_roles.length > 0) {
        role = memberData![0].team_roles[0].role;
        teamMemberId = memberData![0].id;
      }
      
      // Get user org and team org
      const { data: userProfileData } = await this.supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .single();
      
      const userOrgId = userProfileData?.org_id;
      
      const { data: teamData } = await this.supabase
        .from('team')
        .select('org_id, name')
        .eq('id', teamId)
        .single();
      
      const teamOrgId = teamData?.org_id;
      const hasOrgAccess = userOrgId && teamOrgId && userOrgId === teamOrgId;
      
      let accessReason = 'none';
      if (isMember) {
        accessReason = 'team_member';
      } else if (hasOrgAccess) {
        accessReason = 'same_org';
      }
      
      // Get org name if needed
      let orgName = null;
      if (teamOrgId) {
        const { data: orgData } = await this.supabase
          .from('organization')
          .select('name')
          .eq('id', teamOrgId)
          .single();
        
        orgName = orgData?.name || null;
      }
      
      return {
        is_member: isMember,
        has_org_access: hasOrgAccess,
        has_cross_org_access: isMember && hasOrgAccess === false,
        team_member_id: teamMemberId,
        role,
        access_reason: accessReason,
        team: teamData ? { name: teamData.name, org_id: teamData.org_id } : null,
        org_name: orgName
      };
    } catch (error) {
      console.error('Error in fallback validation:', error);
      return {
        is_member: false,
        access_reason: 'fallback_error'
      };
    }
  }
  
  private async getTeamData(teamId: string) {
    try {
      // Get team details
      const { data: teamData } = await this.supabase
        .from('team')
        .select('name, org_id')
        .eq('id', teamId)
        .single();
      
      if (!teamData) {
        return { teamData: null, orgName: null };
      }
      
      // Get org name
      const { data: orgData } = await this.supabase
        .from('organization')
        .select('name')
        .eq('id', teamData.org_id)
        .single();
      
      return {
        teamData: { name: teamData.name, org_id: teamData.org_id },
        orgName: orgData?.name || null
      };
    } catch (error) {
      console.error('Error getting team data:', error);
      return { teamData: null, orgName: null };
    }
  }
  
  private async getTeamMembership(userId: string, teamId: string) {
    try {
      // First get app_user.id
      const { data: appUserData } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();
      
      if (!appUserData) {
        return { teamMemberId: null, hasCrossOrgAccess: false };
      }
      
      // Get team_member record
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
      console.error('Error getting team membership:', error);
      return { teamMemberId: null, hasCrossOrgAccess: false };
    }
  }
  
  private async getUserOrgRole(userId: string, orgId: string) {
    try {
      const { data } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .single();
      
      return data?.role || null;
    } catch (error) {
      console.error('Error getting user org role:', error);
      return null;
    }
  }
}
