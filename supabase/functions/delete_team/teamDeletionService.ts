
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
      const { error } = await this.supabase
        .from('equipment')
        .update({ team_id: null })
        .eq('team_id', teamId)
        .is('deleted_at', null);
        
      if (error) {
        console.error('Error updating equipment records:', error);
        return false;
      }
      
      console.log('Equipment records updated successfully');
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
      const { error } = await this.supabase
        .from('team_member')
        .delete()
        .eq('team_id', teamId);
        
      if (error) {
        console.error('Error removing team members:', error);
        return false;
      }
      
      console.log('Team members removed successfully');
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
      const { error } = await this.supabase
        .from('team_roles')
        .delete()
        .eq('team_id', teamId);
        
      if (error) {
        console.error('Error removing team roles:', error);
        return false;
      }
      
      console.log('Team roles removed successfully');
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
      const { error } = await this.supabase
        .from('team_invitations')
        .update({ status: 'cancelled' })
        .eq('team_id', teamId)
        .eq('status', 'pending');
        
      if (error) {
        console.error('Error cancelling team invitations:', error);
        return false;
      }
      
      console.log('Team invitations cancelled successfully');
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
