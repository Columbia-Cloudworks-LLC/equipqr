
import { supabase } from '@/integrations/supabase/client';

/**
 * Update team details
 * @param teamId The ID of the team to update
 * @param name The new name for the team
 * @returns The updated team data
 */
export const updateTeam = async (teamId: string, name: string) => {
  try {
    if (!teamId || !name.trim()) {
      throw new Error('Team ID and name are required');
    }

    const { data, error } = await supabase
      .from('team')
      .update({ name })
      .eq('id', teamId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating team:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error: any) {
    console.error('Error in updateTeam:', error);
    throw new Error(error.message || 'Failed to update team');
  }
};
