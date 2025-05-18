
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/supabase-enums";
import { toast } from "sonner";

/**
 * Check if the current user has permission to change roles in a team
 * using our improved permission check function
 * @param teamId The ID of the team
 * @returns A boolean indicating whether the user has permission
 */
export async function checkRoleChangePermission(teamId: string): Promise<boolean> {
  try {
    if (!teamId) {
      return false;
    }
    
    // Get current authenticated user
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.error('No authenticated user found');
      return false;
    }
    
    const userId = sessionData.session.user.id;
    
    // Use our improved database function through edge function
    const { data, error } = await supabase.functions.invoke('check_team_role_permission', {
      body: { team_id: teamId, user_id: userId }
    });
    
    if (error) {
      console.error('Error checking role permission:', error);
      return false;
    }
    
    return data?.hasPermission || false;
  } catch (error) {
    console.error('Error in checkRoleChangePermission:', error);
    return false;
  }
}

/**
 * Get the highest role between team and organization roles
 * @param teamRole Team role if any
 * @param orgRole Organization role if any
 * @returns The highest priority role
 */
export function getEffectiveRole(teamRole?: string | null, orgRole?: string | null): string | null {
  if (!teamRole && !orgRole) return null;
  if (!teamRole) return orgRole;
  if (!orgRole) return teamRole;
  
  // Define role hierarchy from highest to lowest permission level
  const roleHierarchy = ['owner', 'manager', 'creator', 'technician', 'viewer', 'member'];
  
  const teamRoleIndex = roleHierarchy.indexOf(teamRole);
  const orgRoleIndex = roleHierarchy.indexOf(orgRole);
  
  // Lower index = higher permission
  // If role isn't in our hierarchy, default to the other role
  if (teamRoleIndex === -1) return orgRole;
  if (orgRoleIndex === -1) return teamRole;
  
  return teamRoleIndex < orgRoleIndex ? teamRole : orgRole;
}

/**
 * Upgrades the current user to a manager role
 * @param teamId The ID of the team
 * @returns A promise that resolves when the role has been upgraded
 */
export async function upgradeToManagerRole(teamId: string): Promise<void> {
  try {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to upgrade your role');
    }
    
    const userId = sessionData.session.user.id;
    
    // Use repair_team_membership edge function which adds the user as a manager
    const { data, error } = await supabase.functions.invoke('repair_team_membership', {
      body: { 
        team_id: teamId, 
        user_id: userId 
      }
    });
    
    if (error || !data?.success) {
      throw new Error(error?.message || data?.error || 'Failed to upgrade role');
    }
    
    console.log('Role upgraded successfully:', data);
  } catch (error: any) {
    console.error('Error upgrading to manager role:', error);
    throw error;
  }
}

/**
 * Request a role upgrade to manager
 * @param teamId The ID of the team
 * @returns Response data from the request
 */
export async function requestRoleUpgrade(teamId: string) {
  try {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to request a role upgrade');
    }
    
    const userId = sessionData.session.user.id;
    
    // Send role upgrade request via edge function
    const { data, error } = await supabase.functions.invoke('request_role_upgrade', {
      body: { team_id: teamId, user_id: userId }
    });
    
    if (error) {
      throw new Error(error.message || 'Failed to request role upgrade');
    }
    
    return data || { message: 'Role upgrade request submitted' };
  } catch (error: any) {
    console.error('Error requesting role upgrade:', error);
    throw error;
  }
}

/**
 * Check if a user has permission to perform an action based on their role
 * @param role The user's role
 * @param requiredRole The minimum required role for the action
 * @returns Boolean indicating if the user has permission
 */
export function hasRolePermission(role: string | null, requiredRole: UserRole): boolean {
  if (!role) return false;
  
  const roleHierarchy: Record<string, number> = {
    'owner': 100,
    'manager': 80,
    'creator': 60,
    'technician': 40,
    'viewer': 20,
    'member': 10
  };
  
  const userRoleWeight = roleHierarchy[role] || 0;
  const requiredRoleWeight = roleHierarchy[requiredRole] || 0;
  
  return userRoleWeight >= requiredRoleWeight;
}
