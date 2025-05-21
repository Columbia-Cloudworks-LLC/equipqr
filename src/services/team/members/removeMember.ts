
import { supabase } from '@/integrations/supabase/client';

/**
 * Remove a user from a team
 */
export async function removeMember(teamId: string, userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!teamId || !userId) {
      return { success: false, error: 'Team ID and user ID are required' };
    }

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has permission to manage team members
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: teamId,
        user_id: sessionData.session.user.id
      }
    });

    if (!permissionData?.hasPermission) {
      return { success: false, error: 'You do not have permission to manage team members' };
    }

    // First get the team member record
    const { data: teamMember } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .single();

    if (!teamMember) {
      return { success: false, error: 'User is not a member of this team' };
    }

    // Check if removal would remove the last manager
    const { data: roleData } = await supabase
      .from('team_roles')
      .select('role')
      .eq('team_member_id', teamMember.id)
      .single();

    if (roleData && roleData.role === 'manager') {
      // Count managers in the team using proper syntax
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

      // Ensure at least one manager remains
      if (count <= 1) {
        return { 
          success: false, 
          error: 'Cannot remove the last manager from a team' 
        };
      }
    }

    // Remove team role first
    const { error: roleError } = await supabase
      .from('team_roles')
      .delete()
      .eq('team_member_id', teamMember.id);

    if (roleError) {
      return { success: false, error: `Failed to remove team role: ${roleError.message}` };
    }

    // Then remove team membership
    const { error: memberError } = await supabase
      .from('team_member')
      .delete()
      .eq('id', teamMember.id);

    if (memberError) {
      return { success: false, error: `Failed to remove team member: ${memberError.message}` };
    }

    return { 
      success: true, 
      message: 'Team member removed successfully' 
    };
  } catch (error: any) {
    console.error('Error removing team member:', error);
    return {
      success: false,
      error: error.message || 'Failed to remove team member'
    };
  }
}
