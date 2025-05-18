
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Check if a user has permission to change roles in a team
 * @param teamId The ID of the team to check permissions for
 * @param role The current role of the user
 * @returns Boolean indicating if the user can change roles
 */
export const checkRoleChangePermission = async (
  teamId: string,
  role?: string | null
): Promise<boolean> => {
  // If user has a manager role, they can change roles
  if (role === 'manager' || role === 'owner') {
    return true;
  }
  
  // Check if the user is an organization owner or admin for this team
  try {
    const { data: team } = await supabase
      .from('team')
      .select('org_id')
      .eq('id', teamId)
      .single();
      
    if (!team?.org_id) return false;
    
    // Check if user has an org-level role that allows team management
    const { data: orgRole } = await supabase.rpc('get_org_role', {
      p_auth_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_org_id: team.org_id
    });
    
    return orgRole === 'owner' || orgRole === 'admin';
  } catch (error) {
    console.error('Error checking role change permission:', error);
    return false;
  }
};

/**
 * Upgrade a user to manager role in a team
 * @param teamId The ID of the team to upgrade role in
 * @returns Promise resolving to a boolean indicating success
 */
export const upgradeToManagerRole = async (teamId: string): Promise<boolean> => {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Not authenticated');
    }
    
    const { data, error } = await supabase
      .from('team_member')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', currentUser.user.id)
      .single();
      
    if (error || !data) {
      throw new Error('Not a member of this team');
    }
    
    // Update role to manager in team_roles table
    const { error: roleError } = await supabase
      .from('team_roles')
      .upsert({
        team_member_id: data.id,
        role: 'manager',
        assigned_by: currentUser.user.id
      }, { onConflict: 'team_member_id' });
      
    if (roleError) {
      throw roleError;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error upgrading to manager role:', error);
    throw new Error(error.message || 'Failed to upgrade role');
  }
};

/**
 * Request a role upgrade for a team
 * @param teamId The ID of the team to request role upgrade for
 * @returns Promise with the response from the role upgrade request
 */
export const requestRoleUpgrade = async (teamId: string) => {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Not authenticated');
    }
    
    // Call the edge function to request a role upgrade
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request_role_upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        team_id: teamId,
        user_id: currentUser.user.id
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to request role upgrade');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error requesting role upgrade:', error);
    throw new Error(error.message || 'Failed to request role upgrade');
  }
};

/**
 * Get the effective role by combining team role and org role
 * @param teamRole The user's role in the team
 * @param orgRole The user's role in the organization
 * @returns The effective role based on team and org roles
 */
export const getEffectiveRole = (
  teamRole: string | null | undefined, 
  orgRole: string | null | undefined
): string | null => {
  // If user has no roles, return null
  if (!teamRole && !orgRole) return null;
  
  // Define role hierarchy
  const roleHierarchy = {
    'owner': 4,
    'admin': 3,
    'manager': 2,
    'technician': 1,
    'viewer': 0
  };
  
  // Get role values or -1 if role doesn't exist
  const teamRoleValue = teamRole ? roleHierarchy[teamRole as keyof typeof roleHierarchy] ?? -1 : -1;
  const orgRoleValue = orgRole ? roleHierarchy[orgRole as keyof typeof roleHierarchy] ?? -1 : -1;
  
  // Return the highest role
  if (teamRoleValue >= orgRoleValue) {
    return teamRole;
  } else {
    return orgRole;
  }
};

// Add this function if it doesn't exist in the file
export const hasRolePermission = (
  role: string | null | undefined, 
  requiredRole: string
): boolean => {
  // Simple role hierarchy: manager > technician > viewer
  const roles = ['viewer', 'technician', 'manager'];
  
  // If no role provided, no permissions
  if (!role) return false;
  
  const userRoleIndex = roles.indexOf(role);
  const requiredRoleIndex = roles.indexOf(requiredRole);
  
  // If either role is not in our hierarchy, deny permission
  if (userRoleIndex === -1 || requiredRoleIndex === -1) {
    return false;
  }
  
  // User has permission if their role is equal to or higher than required role
  return userRoleIndex >= requiredRoleIndex;
};
