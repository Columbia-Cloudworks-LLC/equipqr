
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/supabase-enums";

export async function changeRole(userId: string, role: UserRole, teamId: string) {
  // Get the current user's ID
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('User must be logged in to change roles');
  }
  
  const currentUserId = sessionData.session.user.id;
  
  try {
    // First get the team_member id
    const { data: teamMember, error: memberError } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .single();
      
    if (memberError) {
      console.error('Error fetching team member:', memberError);
      throw memberError;
    }
    
    // Update the role using RPC function instead of direct table access
    const { error: roleError } = await supabase.rpc('add_team_member', {
      _team_id: teamId,
      _user_id: userId,
      _role: role,
      _added_by: currentUserId
    });
      
    if (roleError) {
      console.error('Error updating role:', roleError);
      throw roleError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error changing role:', error);
    throw error;
  }
}

export async function removeMember(userId: string, teamId: string) {
  try {
    // Delete the team_member record
    const { error } = await supabase
      .from('team_member')
      .delete()
      .eq('user_id', userId)
      .eq('team_id', teamId);
      
    if (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
}
