
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeleteTeamResult {
  success: boolean;
  message: string;
  equipmentUpdated: number;
  membersDeleted?: number;
  invitationsCancelled?: number;
}

export const getTeamEquipmentCount = async (teamId: string): Promise<number> => {
  try {
    if (!teamId) {
      return 0;
    }
    
    const { count, error } = await supabase
      .from('equipment')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .is('deleted_at', null);
      
    if (error) {
      console.error('Error getting equipment count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error in getTeamEquipmentCount:', error);
    return 0;
  }
};

export const deleteTeam = async (teamId: string): Promise<DeleteTeamResult> => {
  try {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    
    // Get current user's ID for the edge function
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    console.log(`Attempting to delete team ${teamId} by user ${userId}`);

    // Call the edge function to handle delete operation
    const { data, error } = await supabase.functions.invoke('delete_team', {
      body: {
        teamId,
        userId
      }
    });

    if (error) {
      console.error('Error from delete_team edge function:', error);
      throw new Error(error.message || 'Failed to delete team');
    }
    
    if (!data || typeof data !== 'object') {
      console.error('Invalid response from delete_team function:', data);
      throw new Error('Invalid response from server');
    }

    console.log('Team deletion successful:', data);
    
    return data as DeleteTeamResult;
  } catch (error: any) {
    console.error('Error in deleteTeam:', error);
    
    // Provide more context for debugging
    const contextMessage = error.message || 'Unknown error';
    const errorWithContext = new Error(`Failed to delete team: ${contextMessage}`);
    
    // Re-throw with additional context
    throw errorWithContext;
  }
};
