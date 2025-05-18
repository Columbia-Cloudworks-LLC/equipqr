
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
      // Check team access using the detailed function
      const { data: accessData, error: accessError } = await this.supabase.rpc('check_team_access_detailed', {
        user_id: userId,
        team_id: teamId
      });
      
      console.log('Access data:', accessData);
      
      if (accessError) {
        console.error('Error checking team access:', accessError);
        return {
          hasPermission: false,
          isOrgOwner: false,
          isTeamManager: false,
          accessData: null,
          message: `Error checking team access: ${accessError.message}`
        };
      }
      
      if (!accessData?.has_access) {
        console.log('User has no access to this team');
        return {
          hasPermission: false,
          isOrgOwner: false,
          isTeamManager: false,
          accessData,
          message: 'You do not have permission to delete this team'
        };
      }
      
      const isOrgOwner = accessData.is_org_owner;
      const isTeamManager = accessData.team_role === 'manager';
      
      // Allow both org owners and team managers to delete the team
      if (!isOrgOwner && !isTeamManager) {
        console.log(`User role is not sufficient: team_role=${accessData.team_role}, is_org_owner=${accessData.is_org_owner}`);
        return {
          hasPermission: false,
          isOrgOwner,
          isTeamManager,
          accessData,
          message: 'Only team managers and organization owners can delete teams'
        };
      }
      
      console.log('User has permission to delete the team');
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
