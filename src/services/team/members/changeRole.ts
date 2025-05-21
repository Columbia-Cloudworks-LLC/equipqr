
import { supabase } from '@/integrations/supabase/client';

/**
 * Change a user's role in a team
 */
export async function changeRole(teamId: string, userId: string, role: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!teamId || !userId || !role) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has permission to change roles in this team
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: teamId,
        user_id: sessionData.session.user.id
      }
    });

    if (!permissionData?.hasPermission) {
      return { success: false, error: 'You do not have permission to manage team members' };
    }

    // First get the team member record to get the team_member_id
    const { data: teamMember } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .single();

    if (!teamMember) {
      return { success: false, error: 'User is not a member of this team' };
    }

    // Check if there would be at least one manager left
    if (role !== 'manager') {
      // Get count of existing managers in this team using proper parameter syntax
      const { count, error: countError } = await supabase
        .from('team_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager')
        .in('team_member_id', 
          supabase
            .from('team_member')
            .select('id')
            .eq('team_id', teamId)
        );
      
      if (countError) {
        return { success: false, error: `Error checking managers count: ${countError.message}` };
      }

      // Check if user being changed is currently a manager
      const { data: currentRoleData } = await supabase
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMember.id)
        .single();

      // If there's only one manager and we're changing this manager to another role, block the change
      if (count === 1 && currentRoleData && currentRoleData.role === 'manager') {
        return { 
          success: false, 
          error: 'Cannot change role: team must have at least one manager' 
        };
      }
    }

    // Update the user's role
    const { data: roleData, error: roleError } = await supabase
      .from('team_roles')
      .upsert({ 
        team_member_id: teamMember.id,
        role: role,
        assigned_by: sessionData.session.user.id
      })
      .select()
      .single();

    if (roleError) {
      return { success: false, error: `Failed to update role: ${roleError.message}` };
    }

    return { 
      success: true, 
      message: 'Role updated successfully' 
    };
  } catch (error: any) {
    console.error('Error changing role:', error);
    return {
      success: false,
      error: error.message || 'Failed to update role'
    };
  }
}
