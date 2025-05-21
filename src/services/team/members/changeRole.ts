
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/supabase-enums";

/**
 * Change the role of a team member
 */
export async function changeRole(userId: string, role: UserRole, teamId: string) {
  try {
    if (!userId || !role || !teamId) {
      throw new Error('User ID, role and team ID are required');
    }
    
    console.log(`Changing role for user ${userId} to ${role} in team ${teamId}`);
    
    const { data, error } = await supabase
      .from('team_member')
      .update({ role })
      .match({ user_id: userId, team_id: teamId })
      .select()
      .single();
      
    if (error) {
      console.error('Error changing role:', error);
      throw new Error(`Failed to change role: ${error.message}`);
    }
    
    return data;
  } catch (error: any) {
    console.error('Error in changeRole:', error);
    throw error;
  }
}
