
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";

/**
 * Check if the user can be upgraded to manager role
 */
export async function checkRoleChangePermission(teamId: string): Promise<boolean> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return false;
    
    const userId = session.session.user.id;
    
    // First check team information
    const { data: team } = await supabase
      .from('team')
      .select('org_id')
      .eq('id', teamId)
      .single();
      
    if (!team) return false;
    
    // Check if user has appropriate role in the organization
    const { data: orgRole } = await supabase.rpc('get_org_role', {
      p_auth_user_id: userId,
      p_org_id: team.org_id
    });
    
    // Only org owners or managers can change roles
    return ['owner', 'manager'].includes(orgRole);
    
  } catch (error) {
    console.error('Error checking role change permission:', error);
    return false;
  }
}

/**
 * Upgrade the current user to manager role
 */
export async function upgradeToManagerRole(teamId: string): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    // Get app_user_id first 
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (!appUser) {
      throw new Error('User account not found');
    }
    
    // Check if team member exists
    const { data: teamMember, error: memberError } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('team_id', teamId)
      .single();
      
    if (memberError || !teamMember) {
      // Use edge function to add user safely
      await invokeEdgeFunction('add_team_member', {
        _team_id: teamId,
        _user_id: userId,
        _role: 'manager',
        _added_by: userId
      });
    } else {
      // Update existing role
      const { error: roleError } = await supabase
        .from('team_roles')
        .update({ role: 'manager' })
        .eq('team_member_id', teamMember.id);
        
      if (roleError) {
        throw new Error('Failed to update role: ' + roleError.message);
      }
    }
  } catch (error: any) {
    console.error('Error upgrading to manager role:', error);
    throw new Error(error.message || 'Failed to upgrade role');
  }
}

/**
 * Request role upgrade (sends notification to team managers)
 */
export async function requestRoleUpgrade(teamId: string): Promise<{ message: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('User not authenticated');
    }
    
    // In a real application, this would send a notification to team managers
    // or create an approval request in the database
    
    // For now, simulate the request
    return {
      message: "Request sent to team managers"
    };
  } catch (error: any) {
    console.error('Error requesting role upgrade:', error);
    throw new Error(error.message || 'Failed to request role upgrade');
  }
}

/**
 * Get the effective role by combining team and org roles
 */
export function getEffectiveRole(teamRole: string | null | undefined, orgRole: string | null | undefined): string | null {
  if (!teamRole && !orgRole) return null;
  if (!teamRole) return orgRole || null;
  if (!orgRole) return teamRole;
  
  const rolePriority: Record<string, number> = {
    'owner': 1,
    'manager': 2,
    'admin': 3,
    'creator': 4,
    'technician': 5,
    'viewer': 6
  };
  
  const teamRolePriority = rolePriority[teamRole] || 99;
  const orgRolePriority = rolePriority[orgRole] || 99;
  
  // Return the role with higher priority (lower number)
  return teamRolePriority <= orgRolePriority ? teamRole : orgRole;
}

/**
 * Check if the current role has specific permissions
 */
export function hasRolePermission(role: string | null | undefined, requiredRole: string): boolean {
  if (!role) return false;
  
  const rolePriority: Record<string, number> = {
    'owner': 1,
    'manager': 2,
    'admin': 3,
    'creator': 4,
    'technician': 5,
    'viewer': 6
  };
  
  const userRolePriority = rolePriority[role] || 99;
  const requiredRolePriority = rolePriority[requiredRole] || 99;
  
  // Lower priority number means higher permissions
  return userRolePriority <= requiredRolePriority;
}
