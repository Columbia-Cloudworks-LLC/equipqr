
import { supabase } from '@/integrations/supabase/client';

export async function removeMember(memberId: string, teamId: string): Promise<void> {
  try {
    // Get the session user
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required');
    }

    // Check permissions
    const { data: validationData, error: validationError } = await supabase
      .rpc('check_team_access_detailed', { 
        user_id: sessionData.session.user.id, 
        team_id: teamId 
      });

    if (validationError) {
      throw new Error(`Permission check failed: ${validationError.message}`);
    }

    if (!validationData || !validationData.has_access) {
      throw new Error('You do not have access to this team');
    }
    
    // Only managers can remove members
    if (validationData.team_role !== 'manager' && !validationData.is_org_owner) {
      throw new Error('Only team managers or organization owners can remove members');
    }

    // Get team member role before removing
    const { data: roleData, error: roleError } = await supabase
      .from('team_roles')
      .select('role')
      .eq('team_member_id', memberId)
      .maybeSingle();

    if (roleError) {
      throw new Error(`Failed to check member role: ${roleError.message}`);
    }

    // If removing a manager, check that it's not the last one
    if (roleData?.role === 'manager') {
      const { count, error: countError } = await supabase
        .from('team_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager')
        .neq('team_member_id', memberId);

      if (countError) {
        throw new Error('Failed to verify team manager count');
      }
      
      if (count === 0) {
        throw new Error('Cannot remove: This is the last manager of the team');
      }
    }

    // Delete team roles first, then team member
    const { error: deleteRoleError } = await supabase
      .from('team_roles')
      .delete()
      .eq('team_member_id', memberId);

    if (deleteRoleError) {
      throw new Error(`Failed to delete team role: ${deleteRoleError.message}`);
    }

    const { error: deleteMemberError } = await supabase
      .from('team_member')
      .delete()
      .eq('id', memberId);

    if (deleteMemberError) {
      throw new Error(`Failed to delete team member: ${deleteMemberError.message}`);
    }
  } catch (error: any) {
    console.error('Error in removeMember:', error);
    throw error;
  }
}
