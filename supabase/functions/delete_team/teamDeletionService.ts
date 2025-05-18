
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
   */
  async updateEquipmentRecords(teamId: string): Promise<boolean> {
    try {
      console.log(`Updating equipment records for team ${teamId}`);
      
      const { error, count } = await this.supabase
        .from('equipment')
        .update({ team_id: null })
        .eq('team_id', teamId)
        .is('deleted_at', null);
        
      if (error) {
        console.error('Error updating equipment records:', error);
        return false;
      }
      
      console.log(`${count} equipment records updated successfully`);
      return true;
    } catch (error) {
      console.error('Error in updateEquipmentRecords:', error);
      return false;
    }
  }

  /**
   * Delete all team members
   */
  async deleteTeamMembers(teamId: string): Promise<boolean> {
    try {
      console.log(`Deleting team members for team ${teamId}`);
      
      // First get team members for logging
      const { data: members, error: fetchError } = await this.supabase
        .from('team_member')
        .select('id')
        .eq('team_id', teamId);
        
      if (fetchError) {
        console.error('Error fetching team members:', fetchError);
      } else {
        console.log(`Found ${members?.length || 0} team members to delete`);
      }
      
      // Then delete them
      const { error, count } = await this.supabase
        .from('team_member')
        .delete()
        .eq('team_id', teamId);
        
      if (error) {
        console.error('Error removing team members:', error);
        return false;
      }
      
      console.log(`${count} team members removed successfully`);
      return true;
    } catch (error) {
      console.error('Error in deleteTeamMembers:', error);
      return false;
    }
  }

  /**
   * Delete team roles
   */
  async deleteTeamRoles(teamId: string): Promise<boolean> {
    try {
      console.log(`Cleaning up team roles associated with team ${teamId}`);
      
      // Get the roles via team_members for this team
      const { data: members } = await this.supabase
        .from('team_member')
        .select('id')
        .eq('team_id', teamId);
        
      if (!members || members.length === 0) {
        console.log('No team members found, no roles to delete');
        return true;
      }
      
      // Get the member IDs
      const memberIds = members.map(m => m.id);
      
      // Delete the roles
      const { error, count } = await this.supabase
        .from('team_roles')
        .delete()
        .in('team_member_id', memberIds);
        
      if (error) {
        console.error('Error removing team roles:', error);
        return false;
      }
      
      console.log(`${count} team roles removed successfully`);
      return true;
    } catch (error) {
      console.error('Error in deleteTeamRoles:', error);
      return false;
    }
  }

  /**
   * Cancel pending invitations
   */
  async cancelTeamInvitations(teamId: string): Promise<boolean> {
    try {
      console.log(`Cancelling pending invitations for team ${teamId}`);
      
      const { error, count } = await this.supabase
        .from('team_invitations')
        .update({ status: 'cancelled' })
        .eq('team_id', teamId)
        .eq('status', 'pending');
        
      if (error) {
        console.error('Error cancelling team invitations:', error);
        return false;
      }
      
      console.log(`${count} team invitations cancelled successfully`);
      return true;
    } catch (error) {
      console.error('Error in cancelTeamInvitations:', error);
      return false;
    }
  }

  /**
   * Soft delete the team record
   */
  async deleteTeam(teamId: string): Promise<boolean> {
    try {
      console.log(`Soft deleting team record ${teamId}`);
      
      const { error } = await this.supabase
        .from('team')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', teamId);
        
      if (error) {
        console.error('Error deleting team:', error);
        return false;
      }
      
      console.log('Team deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteTeam:', error);
      return false;
    }
  }
}
