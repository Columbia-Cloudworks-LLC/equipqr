
import { supabase } from '@/integrations/supabase/client';

export async function removeMember(memberId: string, teamId: string): Promise<void> {
  if (!memberId || !teamId) {
    throw new Error('Member ID and team ID are required');
  }
  
  try {
    // Verify the user has permission to remove members from this team
    const { data: checkResult, error: checkError } = await supabase
      .functions.invoke('check_team_role_permission', {
        body: { 
          team_id: teamId,
          action: 'remove_member' 
        }
      });
    
    if (checkError) {
      throw new Error(`Permission check failed: ${checkError.message}`);
    }
    
    if (!checkResult.can_remove_members) {
      throw new Error('You do not have permission to remove members from this team');
    }
    
    // Get the team member's role for validation
    const { data: teamRoles, error: roleError } = await supabase
      .from('team_roles')
      .select('role')
      .eq('team_member_id', memberId)
      .single();
    
    if (roleError) {
      throw new Error(`Failed to get member role: ${roleError.message}`);
    }
    
    // If the member is a manager, check if they're the last one
    if (teamRoles.role === 'manager') {
      const { data: managerCount, error: countError } = await supabase
        .rpc('count_team_managers', { _team_id: teamId });
      
      if (countError) {
        throw new Error(`Failed to count managers: ${countError.message}`);
      }
      
      if (managerCount === 1) {
        throw new Error('Cannot remove the last manager of the team');
      }
    }
    
    // Delete the team_roles entry first (foreign key constraint)
    const { error: deleteRoleError } = await supabase
      .from('team_roles')
      .delete()
      .eq('team_member_id', memberId);
    
    if (deleteRoleError) {
      throw new Error(`Failed to remove member role: ${deleteRoleError.message}`);
    }
    
    // Now delete the team member
    const { error: deleteMemberError } = await supabase
      .from('team_member')
      .delete()
      .eq('id', memberId);
    
    if (deleteMemberError) {
      throw new Error(`Failed to remove member: ${deleteMemberError.message}`);
    }
  } catch (error: any) {
    console.error('Error in removeMember:', error);
    throw error;
  }
}
