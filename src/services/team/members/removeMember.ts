
import { supabase } from "@/integrations/supabase/client";

/**
 * Remove a member from a team
 */
export async function removeMember(userId: string, teamId: string) {
  try {
    if (!userId || !teamId) {
      throw new Error('User ID and team ID are required');
    }
    
    console.log(`Removing user ${userId} from team ${teamId}`);
    
    // First check if this is the last manager
    const { data: teamMembers, error: fetchError } = await supabase
      .from('team_member')
      .select('user_id, role')
      .eq('team_id', teamId);
      
    if (fetchError) {
      throw new Error(`Failed to check team members: ${fetchError.message}`);
    }
    
    const managers = (teamMembers || []).filter(member => member.role === 'manager');
    const isLastManager = managers.length === 1 && managers[0].user_id === userId;
    
    if (isLastManager) {
      throw new Error('Cannot remove the last manager from the team');
    }
    
    // Remove the team member
    const { error } = await supabase
      .from('team_member')
      .delete()
      .match({ user_id: userId, team_id: teamId });
      
    if (error) {
      console.error('Error removing team member:', error);
      throw new Error(`Failed to remove team member: ${error.message}`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in removeMember:', error);
    throw error;
  }
}
