
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Validates if a user has permission to delete a team
 */
export class TeamDeletionValidator {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Check if user has permission to delete a team
   * User must be a team manager or the organization owner
   */
  async validatePermission(userId: string, teamId: string): Promise<{
    hasPermission: boolean;
    isOrgOwner: boolean;
    isTeamManager: boolean;
    accessData: any;
    message?: string;
  }> {
    try {
      console.log(`Validating delete permission: userId=${userId}, teamId=${teamId}`);
      
      // Get the team's organization first for fallback validation
      const { data: teamData, error: teamError } = await this.supabase
        .from('team')
        .select('org_id')
        .eq('id', teamId)
        .single();
        
      if (teamError) {
        console.error('Error getting team details:', teamError);
        return {
          hasPermission: false,
          isOrgOwner: false,
          isTeamManager: false,
          accessData: null,
          message: `Team not found: ${teamError.message}`
        };
      }
      
      const teamOrgId = teamData?.org_id;
      
      // Check user's org role directly
      const { data: userRole, error: roleError } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', teamOrgId)
        .single();
        
      const isOrgOwner = !roleError && userRole?.role === 'owner';
      
      // Check if user is a team manager using direct queries instead of check_team_access_detailed
      // This avoids the type mismatch issues
      
      // First get the app_user ID for this auth user
      const { data: appUser, error: appUserError } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();
        
      if (appUserError) {
        console.log('App user not found:', appUserError);
      }
      
      const appUserId = appUser?.id;
      let isTeamManager = false;
      let accessData: any = null;
      
      if (appUserId) {
        // Check if user is a team member with manager role
        const { data: teamRole, error: teamRoleError } = await this.supabase
          .from('team_member')
          .select(`
            id,
            team_roles (
              role
            )
          `)
          .eq('user_id', appUserId)
          .eq('team_id', teamId)
          .single();
          
        if (!teamRoleError && teamRole) {
          const role = teamRole.team_roles?.role;
          isTeamManager = role === 'manager';
          accessData = {
            team_role: role,
            is_team_member: true
          };
        }
      }
      
      const hasPermission = isOrgOwner || isTeamManager;
      
      // Log the results for debugging
      console.log('Access check result:', { 
        hasPermission, 
        isOrgOwner, 
        isTeamManager, 
        appUserId,
        teamOrgId 
      });
      
      if (!hasPermission) {
        return {
          hasPermission: false,
          isOrgOwner,
          isTeamManager,
          accessData,
          message: isOrgOwner === null && isTeamManager === null
            ? 'Error checking permissions'
            : 'You do not have permission to delete this team'
        };
      }
      
      return {
        hasPermission: true,
        isOrgOwner,
        isTeamManager,
        accessData
      };
      
    } catch (error) {
      console.error('Error validating team delete permission:', error);
      return {
        hasPermission: false,
        isOrgOwner: false,
        isTeamManager: false,
        accessData: null,
        message: `Unexpected error: ${error.message}`
      };
    }
  }
}
