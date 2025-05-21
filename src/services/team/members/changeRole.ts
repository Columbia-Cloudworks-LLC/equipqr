
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';

export async function changeRole(memberId: string, role: UserRole, teamId: string): Promise<void> {
  if (!memberId || !role || !teamId) {
    throw new Error('Member ID, role, and team ID are required');
  }
  
  try {
    // Verify the user has permission to change roles in this team
    const { data: checkResult, error: checkError } = await supabase
      .functions.invoke('check_team_role_permission', {
        body: { 
          team_id: teamId,
          action: 'change_role' 
        }
      });
    
    if (checkError) {
      throw new Error(`Permission check failed: ${checkError.message}`);
    }
    
    if (!checkResult.can_change_role) {
      throw new Error('You do not have permission to change member roles in this team');
    }
    
    // Get the team member's existing role for validation
    const { data: teamMember, error: memberError } = await supabase
      .from('team_roles')
      .select('role')
      .eq('team_member_id', memberId)
      .single();
    
    if (memberError) {
      throw new Error(`Failed to get current role: ${memberError.message}`);
    }
    
    // If the member is the last manager, prevent role change
    if (teamMember.role === 'manager') {
      // Use a direct query instead of an RPC function
      const { data: managers, error: countError } = await supabase
        .from('team_roles')
        .select('id')
        .eq('role', 'manager')
        .in('team_member_id', (subquery) => 
          subquery.from('team_member').select('id').eq('team_id', teamId)
        );
      
      if (countError) {
        throw new Error(`Failed to count managers: ${countError.message}`);
      }
      
      if (managers.length === 1 && role !== 'manager') {
        throw new Error('Cannot change role: This is the last manager of the team');
      }
    }
    
    // Update the role
    const { error: updateError } = await supabase
      .from('team_roles')
      .update({ role })
      .eq('team_member_id', memberId);
    
    if (updateError) {
      throw new Error(`Failed to update role: ${updateError.message}`);
    }
  } catch (error: any) {
    console.error('Error in changeRole:', error);
    throw error;
  }
}
