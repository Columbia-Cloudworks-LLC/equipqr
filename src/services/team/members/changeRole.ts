
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';

export async function changeRole(memberId: string, role: UserRole, teamId: string): Promise<void> {
  try {
    if (!memberId || !role || !teamId) {
      throw new Error('Member ID, role, and team ID are required');
    }
    
    // Get user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('Authentication required');
    }
    
    const currentUserId = sessionData.session.user.id;
    
    // Check if current user can assign the role
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: teamId, 
        user_id: currentUserId,
        role: role
      }
    });
    
    if (!permissionData?.can_assign) {
      throw new Error('You do not have permission to assign this role');
    }
    
    // For safety, check if this is the last manager
    if (role !== 'manager') {
      const { data: managerCount } = await supabase.from('team_roles')
        .select('count', { count: 'exact', head: true })
        .eq('role', 'manager')
        .eq('team_member_id', function(builder) {
          return builder.from('team_member').select('id').eq('team_id', teamId);
        });
      
      if (managerCount && managerCount.count === 1) {
        throw new Error("Cannot downgrade the only manager of the team");
      }
    }
    
    // Find the team_roles record for this member
    const { data: roleData, error: roleQueryError } = await supabase
      .from('team_roles')
      .select('id')
      .eq('team_member_id', memberId)
      .single();
    
    if (roleQueryError && roleQueryError.code !== 'PGRST116') {
      throw new Error(`Failed to query role: ${roleQueryError.message}`);
    }
    
    if (roleData) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('team_roles')
        .update({ role })
        .eq('id', roleData.id);
        
      if (updateError) {
        throw new Error(`Failed to update role: ${updateError.message}`);
      }
    } else {
      // Create new role
      const { error: insertError } = await supabase
        .from('team_roles')
        .insert({
          team_member_id: memberId,
          role,
          assigned_by: currentUserId
        });
        
      if (insertError) {
        throw new Error(`Failed to create role: ${insertError.message}`);
      }
    }
  } catch (error: any) {
    console.error('Error changing role:', error);
    throw error;
  }
}
