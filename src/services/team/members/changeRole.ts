
import { supabase } from '@/integrations/supabase/client';

/**
 * Change a user's role in a team
 */
export async function changeRole(teamId: string, authUserId: string, role: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log('changeRole called with:', { teamId, authUserId, role });
    
    if (!teamId || !authUserId || !role) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Validate role is one of the allowed values
    const allowedRoles = ['owner', 'manager', 'technician', 'requestor', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return { success: false, error: `Invalid role: ${role}. Allowed roles: ${allowedRoles.join(', ')}` };
    }

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    // Convert auth_uid to app_user.id for database lookups
    const { data: targetAppUser, error: targetAppUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUserId)
      .single();

    if (targetAppUserError || !targetAppUser) {
      console.error('Error finding target app user:', targetAppUserError);
      return { success: false, error: 'Target user not found in system' };
    }

    console.log('Found target app user:', targetAppUser);

    // Check if user has permission to change roles in this team
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        auth_user_id: sessionData.session.user.id,
        team_id: teamId,
        target_user_id: authUserId,
        role: role
      }
    });

    if (!permissionData?.can_change) {
      return { success: false, error: permissionData?.reason || 'You do not have permission to manage team members' };
    }

    // Check if target user is a team member or organization manager
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', targetAppUser.id)
      .eq('team_id', teamId)
      .maybeSingle();

    // If not a direct team member, check if they're an organization manager
    if (!teamMember) {
      // Get team organization
      const { data: team, error: teamError } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', teamId)
        .single();

      if (teamError || !team) {
        return { success: false, error: 'Team not found' };
      }

      // Check if target user is an organization manager
      const { data: orgRole, error: orgRoleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUserId)
        .eq('org_id', team.org_id)
        .maybeSingle();

      if (orgRole && ['owner', 'manager'].includes(orgRole.role)) {
        return { 
          success: false, 
          error: 'Cannot change organization manager roles directly - they manage teams through organization permissions' 
        };
      }

      return { success: false, error: 'User is not a member of this team' };
    }

    console.log('Found team member:', teamMember);

    // Check if there would be at least one manager left (only applies when changing FROM manager role)
    if (role !== 'manager') {
      // Get count of existing managers in this team
      const { data: teamMembers } = await supabase
        .from('team_member')
        .select('id')
        .eq('team_id', teamId);
      
      // Extract team member IDs
      const teamMemberIds = teamMembers ? teamMembers.map(member => member.id) : [];
      
      // Get the count of managers
      const { count, error: countError } = await supabase
        .from('team_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager')
        .in('team_member_id', teamMemberIds);
      
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

    // FIXED: Replace upsert with delete-then-insert to handle unique constraint
    // First, delete any existing role for this team member
    const { error: deleteError } = await supabase
      .from('team_roles')
      .delete()
      .eq('team_member_id', teamMember.id);

    if (deleteError) {
      console.error('Error deleting existing role:', deleteError);
      return { success: false, error: `Failed to remove existing role: ${deleteError.message}` };
    }

    // Then insert the new role
    const { data: roleData, error: roleError } = await supabase
      .from('team_roles')
      .insert({ 
        team_member_id: teamMember.id,
        role: role,
        assigned_by: sessionData.session.user.id
      })
      .select()
      .single();

    if (roleError) {
      console.error('Error inserting new role:', roleError);
      return { success: false, error: `Failed to assign new role: ${roleError.message}` };
    }

    console.log('Role updated successfully:', roleData);

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
