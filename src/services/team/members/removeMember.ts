
import { supabase } from '@/integrations/supabase/client';

export async function removeMember(memberId: string, teamId: string): Promise<void> {
  try {
    if (!memberId || !teamId) {
      throw new Error('Member ID and team ID are required');
    }
    
    // Get user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required');
    }
    
    const currentUserId = sessionData.session.user.id;
    
    // Check if current user can remove members
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: teamId, 
        user_id: currentUserId
      }
    });
    
    if (!permissionData?.can_modify_members) {
      throw new Error('You do not have permission to remove team members');
    }
    
    // Check if the member is a manager and if they're the last manager
    const { data: memberRole } = await supabase
      .from('team_roles')
      .select('role')
      .eq('team_member_id', memberId)
      .single();
    
    if (memberRole && memberRole.role === 'manager') {
      const { count } = await supabase
        .from('team_roles')
        .select('count', { count: 'exact', head: true })
        .eq('role', 'manager')
        .eq('team_member_id', function(builder) {
          return builder.from('team_member').select('id').eq('team_id', teamId);
        });
        
      if (count === 1) {
        throw new Error('Cannot remove the last manager of the team');
      }
    }
    
    // First delete the role
    const { error: roleDeleteError } = await supabase
      .from('team_roles')
      .delete()
      .eq('team_member_id', memberId);
      
    if (roleDeleteError) {
      throw new Error(`Failed to remove role: ${roleDeleteError.message}`);
    }
    
    // Then delete the membership
    const { error: memberDeleteError } = await supabase
      .from('team_member')
      .delete()
      .eq('id', memberId);
      
    if (memberDeleteError) {
      throw new Error(`Failed to remove member: ${memberDeleteError.message}`);
    }
  } catch (error: any) {
    console.error('Error removing team member:', error);
    throw error;
  }
}
