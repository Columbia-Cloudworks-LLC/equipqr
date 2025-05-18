
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/supabase-enums";
import { canAssignTeamRole } from "../teamValidationService";

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
