
import { supabase } from '@/integrations/supabase/client';

/**
 * Add an existing organization member directly to a team
 * @param userId The ID of the organization member to add
 * @param teamId The ID of the team to add them to
 * @param role The team role to assign
 * @returns Result of the operation
 */
export async function addOrgMemberToTeam(
  userId: string,
  teamId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Adding org member ${userId} to team ${teamId} with role ${role}`);
    
    if (!userId || !teamId || !role) {
      throw new Error('User ID, team ID, and role are required');
    }
    
    // Get current user session for permission check
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to add team members');
    }
    
    // Check if the user has manager permissions for the team
    const { data: permissionData } = await supabase.functions.invoke('check_team_role_permission', {
      body: { 
        team_id: teamId, 
        user_id: sessionData.session.user.id 
      }
    });
    
    if (!permissionData?.hasPermission) {
      throw new Error('You do not have permission to add users to this team');
    }
    
    // Get the app_user ID for the organization member
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
    
    if (appUserError || !appUser) {
      throw new Error('Organization member not found');
    }
    
    // Check if they're already a team member
    const { data: existingMember } = await supabase
      .from('team_member')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', appUser.id)
      .single();
      
    if (existingMember) {
      throw new Error('This user is already a member of the team');
    }
    
    // Verify they're a viewer in the organization (only viewers can be added to teams)
    const { data: teamData } = await supabase
      .from('team')
      .select('org_id')
      .eq('id', teamId)
      .single();
    
    if (!teamData) {
      throw new Error('Team not found');
    }
    
    const { data: orgRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', teamData.org_id)
      .single();
    
    if (!orgRole || orgRole.role !== 'viewer') {
      throw new Error('Only organization viewers can be added to teams');
    }
    
    // Add the member to the team
    const { data: teamMember, error: memberError } = await supabase
      .from('team_member')
      .insert({
        team_id: teamId,
        user_id: appUser.id
      })
      .select()
      .single();
    
    if (memberError) {
      console.error('Error adding team member:', memberError);
      throw new Error(`Failed to add team member: ${memberError.message}`);
    }
    
    // Assign the team role
    const { error: roleError } = await supabase
      .from('team_roles')
      .insert({
        team_member_id: teamMember.id,
        role: role,
        assigned_by: sessionData.session.user.id
      });
    
    if (roleError) {
      console.error('Error assigning team role:', roleError);
      // Try to clean up the team member record
      await supabase
        .from('team_member')
        .delete()
        .eq('id', teamMember.id);
      
      throw new Error(`Failed to assign team role: ${roleError.message}`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in addOrgMemberToTeam:', error);
    return {
      success: false,
      error: error.message || 'Failed to add organization member to team'
    };
  }
}
