
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "@/types";
import { UserRole } from "@/types/supabase-enums";
import { toast } from "sonner";
import { canAssignTeamRole } from "./teamValidationService";

/**
 * Get team members with their roles
 * @param teamId The ID of the team
 * @returns Array of team members with their roles and details
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    if (!teamId) {
      throw new Error("Team ID is required");
    }
    
    // Fetch team members using the edge function to avoid RLS issues
    const { data, error } = await supabase.functions.invoke('get_team_members', {
      body: { team_id: teamId }
    });
    
    if (error) {
      console.error('Error in getTeamMembers:', error);
      throw new Error(error.message);
    }
    
    console.log("Team members fetched:", data?.members?.length || 0);
    return data?.members || [];
  } catch (error: any) {
    console.error('Error in getTeamMembers:', error);
    throw error;
  }
}

/**
 * Change the role of a team member
 * @param memberId The ID of the team member
 * @param role The new role to assign
 * @param teamId The ID of the team (for permission check)
 * @returns True if successful, throws error otherwise
 */
export async function changeRole(memberId: string, role: UserRole, teamId: string): Promise<boolean> {
  try {
    if (!memberId || !role || !teamId) {
      throw new Error("Member ID, role, and team ID are required");
    }
    
    // Check if user has permission to change roles in this team
    const hasPermission = await canAssignTeamRole(teamId, role);
    if (!hasPermission) {
      throw new Error("You don't have permission to change roles in this team");
    }
    
    // Get team roles ID for this member
    const { data: teamRolesData, error: teamRolesError } = await supabase
      .from('team_roles')
      .select('id')
      .eq('team_member_id', memberId)
      .single();
    
    if (teamRolesError) {
      throw new Error(`Failed to find role for member: ${teamRolesError.message}`);
    }
    
    // Update the role
    const { error: updateError } = await supabase
      .from('team_roles')
      .update({ role })
      .eq('id', teamRolesData.id);
    
    if (updateError) {
      throw new Error(`Failed to update role: ${updateError.message}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error in changeRole:', error);
    throw error;
  }
}

/**
 * Remove a member from a team
 * @param memberId The ID of the team member to remove
 * @param teamId The ID of the team (for permission check)
 * @returns True if successful, throws error otherwise
 */
export async function removeMember(memberId: string, teamId: string): Promise<boolean> {
  try {
    if (!memberId || !teamId) {
      throw new Error("Member ID and team ID are required");
    }
    
    // Fetch the member's current role to see if we can remove them
    const { data: rolesData, error: rolesError } = await supabase
      .from('team_roles')
      .select('role, team_member_id')
      .eq('team_member_id', memberId)
      .single();
    
    if (rolesError && rolesError.code !== 'PGRST116') {
      throw new Error(`Failed to check member role: ${rolesError.message}`);
    }
    
    // For safety, check if this is the last manager in the team
    if (rolesData?.role === 'manager') {
      const { data: managers, error: managersError } = await supabase
        .from('team_roles')
        .select('id')
        .eq('role', 'manager')
        .in('team_member_id', supabase
          .from('team_member')
          .select('id')
          .eq('team_id', teamId)
        );
      
      if (managersError) {
        throw new Error(`Failed to check team managers: ${managersError.message}`);
      }
      
      if (managers && managers.length <= 1) {
        throw new Error("Cannot remove the last manager from a team");
      }
    }
    
    // Check if current user is trying to remove themselves
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData.session?.user?.id;
    
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    
    // Check if user has permission to remove this member
    const { data: authUserApp } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', currentUserId)
      .single();
    
    const { data: memberToRemove } = await supabase
      .from('team_member')
      .select('user_id')
      .eq('id', memberId)
      .single();
    
    // If user is removing themselves, or has permission to change roles, allow the removal
    const hasPermission = 
      (authUserApp?.id === memberToRemove?.user_id) || 
      (await canAssignTeamRole(teamId, 'viewer'));
    
    if (!hasPermission) {
      throw new Error("You don't have permission to remove this team member");
    }
    
    // Delete the team_roles first (foreign key constraint)
    const { error: deleteRoleError } = await supabase
      .from('team_roles')
      .delete()
      .eq('team_member_id', memberId);
    
    if (deleteRoleError) {
      throw new Error(`Failed to delete team role: ${deleteRoleError.message}`);
    }
    
    // Then delete the team_member
    const { error: deleteMemberError } = await supabase
      .from('team_member')
      .delete()
      .eq('id', memberId);
    
    if (deleteMemberError) {
      throw new Error(`Failed to delete team member: ${deleteMemberError.message}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error in removeMember:', error);
    throw error;
  }
}
