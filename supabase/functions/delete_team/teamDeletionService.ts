
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Service handling the deletion of a team and related operations
 */
export class TeamDeletionService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get count of equipment associated with this team
   */
  async getEquipmentCount(teamId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .is('deleted_at', null);
        
      if (error) {
        console.error('Error getting equipment count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getEquipmentCount:', error);
      return 0;
    }
  }

  /**
   * Update equipment records to unassign them from the team
   * @returns {Promise<number>} Number of equipment records updated
   */
  async updateEquipmentRecords(teamId: string): Promise<number> {
    try {
      console.log(`Updating equipment records for team ${teamId}`);
      
      const { error, count } = await this.supabase
        .from('equipment')
        .update({ team_id: null })
        .eq('team_id', teamId)
        .is('deleted_at', null);
        
      if (error) {
        console.error('Error updating equipment records:', error);
        return 0;
      }
      
      console.log(`${count} equipment records updated successfully`);
      return count || 0;
    } catch (error) {
      console.error('Error in updateEquipmentRecords:', error);
      return 0;
    }
  }

  /**
   * Delete all team members and their roles
   * @returns {Promise<number>} Number of team members deleted
   */
  async deleteTeamMembers(teamId: string): Promise<number> {
    try {
      console.log(`Deleting team members for team ${teamId}`);
      
      // First get team members for logging
      const { data: members, error: fetchError } = await this.supabase
        .from('team_member')
        .select('id, user_id')
        .eq('team_id', teamId);
        
      if (fetchError) {
        console.error('Error fetching team members:', fetchError);
        return 0;
      }
      
      if (!members || members.length === 0) {
        console.log('No team members found to delete');
        return 0;
      }
      
      console.log(`Found ${members.length} team members to delete`);
      
      // Delete team roles first (foreign key constraint)
      const memberIds = members.map(m => m.id);
      
      const { error: rolesError, count: rolesCount } = await this.supabase
        .from('team_roles')
        .delete()
        .in('team_member_id', memberIds);
        
      if (rolesError) {
        console.error('Error deleting team roles:', rolesError);
      } else {
        console.log(`${rolesCount} team roles deleted`);
      }
      
      // Then delete the team members
      const { error, count } = await this.supabase
        .from('team_member')
        .delete()
        .eq('team_id', teamId);
        
      if (error) {
        console.error('Error removing team members:', error);
        return 0;
      }
      
      console.log(`${count} team members removed successfully`);
      return count || 0;
    } catch (error) {
      console.error('Error in deleteTeamMembers:', error);
      return 0;
    }
  }

  /**
   * Cancel pending invitations for the team
   * @returns {Promise<number>} Number of invitations cancelled
   */
  async cancelTeamInvitations(teamId: string): Promise<number> {
    try {
      console.log(`Cancelling pending invitations for team ${teamId}`);
      
      const { error, count } = await this.supabase
        .from('team_invitations')
        .update({ status: 'cancelled' })
        .eq('team_id', teamId)
        .eq('status', 'pending');
        
      if (error) {
        console.error('Error cancelling team invitations:', error);
        return 0;
      }
      
      console.log(`${count} team invitations cancelled successfully`);
      return count || 0;
    } catch (error) {
      console.error('Error in cancelTeamInvitations:', error);
      return 0;
    }
  }

  /**
   * Perform complete team deletion including all related records
   * @returns Object with results of the deletion operation
   */
  async deleteTeam(teamId: string): Promise<{
    success: boolean;
    equipmentUpdated: number;
    membersDeleted: number;
    invitationsCancelled: number;
  }> {
    try {
      console.log(`Starting complete deletion process for team ${teamId}`);
      
      // Step 1: Update equipment records (unassign from team)
      const equipmentUpdated = await this.updateEquipmentRecords(teamId);
      
      // Step 2: Delete team members and their roles BEFORE marking team as deleted
      // This ensures memberships are properly cleaned up
      const membersDeleted = await this.deleteTeamMembers(teamId);
      
      // Step 3: Cancel pending invitations
      const invitationsCancelled = await this.cancelTeamInvitations(teamId);
      
      // Step 4: Soft delete the team record (this must come AFTER cleaning up memberships)
      const { error } = await this.supabase
        .from('team')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', teamId);
        
      if (error) {
        console.error('Error soft-deleting team:', error);
        throw error;
      }
      
      console.log('Team deletion completed successfully');
      
      return {
        success: true,
        equipmentUpdated,
        membersDeleted,
        invitationsCancelled
      };
    } catch (error) {
      console.error('Error in complete team deletion process:', error);
      throw error;
    }
  }
}
