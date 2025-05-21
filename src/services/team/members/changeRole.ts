
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';

export async function changeRole(memberId: string, role: UserRole, teamId: string): Promise<void> {
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
    
    // Only managers can change roles
    if (validationData.team_role !== 'manager' && !validationData.is_org_owner) {
      throw new Error('Only team managers or organization owners can change roles');
    }

    // Get team member record to update
    const { data: memberData, error: memberError } = await supabase
      .from('team_member')
      .select('id')
      .eq('id', memberId)
      .maybeSingle();

    if (memberError || !memberData) {
      throw new Error('Team member not found');
    }
    
    // If changing to a non-manager role, check if this would leave the team with no managers
    if (role !== 'manager') {
      const { count, error: countError } = await supabase
        .from('team_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager')
        .neq('team_member_id', memberId);

      if (countError) {
        throw new Error('Failed to verify team manager count');
      }
      
      if (count === 0) {
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
