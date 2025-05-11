
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/supabase-enums";

export async function changeRole(userId: string, role: UserRole, teamId: string) {
  // Get the current user's ID
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('User must be logged in to change roles');
  }
  
  const currentUserId = sessionData.session.user.id;
  
  try {
    // First get the team_member id
    const { data: teamMember, error: memberError } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .single();
      
    if (memberError) {
      console.error('Error fetching team member:', memberError);
      throw memberError;
    }
    
    // Update the role using the edge function
    const { error: roleError } = await supabase.functions.invoke('add_team_member', {
      body: {
        _team_id: teamId,
        _user_id: userId,
        _role: role,
        _added_by: currentUserId
      }
    });
      
    if (roleError) {
      console.error('Error updating role:', roleError);
      throw roleError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error changing role:', error);
    throw error;
  }
}

export async function removeMember(userId: string, teamId: string) {
  try {
    // Delete the team_member record - this will automatically delete associated team_roles
    // due to the CASCADE constraint we set up
    const { error } = await supabase
      .from('team_member')
      .delete()
      .eq('user_id', userId)
      .eq('team_id', teamId);
      
    if (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
}

/**
 * Checks if the current user has permission to change roles in a team
 */
export async function checkRoleChangePermission(teamId: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return false;
    }
    
    const userId = sessionData.session.user.id;
    
    // Call the role authorization edge function
    const { data, error } = await supabase.functions.invoke('check_team_role_permission', {
      body: {
        team_id: teamId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error checking role permission:', error);
      return false;
    }
    
    return data?.hasPermission === true;
  } catch (error: any) {
    console.error('Error in checkRoleChangePermission:', error);
    return false;
  }
}

/**
 * Request a role upgrade instead of directly granting it
 */
export async function requestRoleUpgrade(teamId: string): Promise<{ success: boolean, message: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to request a role upgrade');
    }
    
    const userId = sessionData.session.user.id;
    
    // For now, we'll implement a simplified version that adds a "role_upgrade_request" attribute
    // In a full implementation, this would create an entry in a dedicated role_requests table
    const { data, error } = await supabase.functions.invoke('request_role_upgrade', {
      body: {
        team_id: teamId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error requesting role upgrade:', error);
      throw new Error(`Failed to request role upgrade: ${error.message}`);
    }
    
    return { 
      success: true, 
      message: 'Role upgrade request submitted. A team manager will review your request.'
    };
  } catch (error: any) {
    console.error('Error in requestRoleUpgrade:', error);
    throw new Error(`Role upgrade request failed: ${error.message}`);
  }
}

/**
 * Directly upgrade a user to manager role (with authorization check)
 */
export async function upgradeToManagerRole(teamId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to upgrade role');
    }
    
    const userId = sessionData.session.user.id;
    
    // First, check if the user has permission to change roles
    const hasPermission = await checkRoleChangePermission(teamId);
    
    if (!hasPermission) {
      throw new Error('You do not have permission to upgrade roles directly. Please request a role upgrade instead.');
    }
    
    console.log(`Upgrading user ${userId} to manager role in team ${teamId}`);
    
    // Use add_team_member to update the role (it handles both add and update)
    const { data, error } = await supabase.functions.invoke('add_team_member', {
      body: {
        _team_id: teamId,
        _user_id: userId, 
        _role: 'manager',
        _added_by: userId
      }
    });
    
    if (error) {
      console.error('Error upgrading to manager role:', error);
      throw new Error(`Failed to upgrade role: ${error.message}`);
    }
    
    console.log('Role upgrade successful:', data);
    return { success: true, details: data };
  } catch (error: any) {
    console.error('Error in upgradeToManagerRole:', error);
    throw new Error(`Role upgrade failed: ${error.message}`);
  }
}

/**
 * Approve a role upgrade request (for team managers/owners)
 */
export async function approveRoleUpgrade(teamId: string, userId: string): Promise<{ success: boolean }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('You must be logged in to approve role upgrades');
    }
    
    const approverUserId = sessionData.session.user.id;
    
    // First check if the current user has the authority to approve roles
    const hasPermission = await checkRoleChangePermission(teamId);
    
    if (!hasPermission) {
      throw new Error('You do not have permission to approve role upgrades');
    }
    
    console.log(`User ${approverUserId} is approving role upgrade for user ${userId} in team ${teamId}`);
    
    // Use add_team_member to update the role
    const { data, error } = await supabase.functions.invoke('add_team_member', {
      body: {
        _team_id: teamId,
        _user_id: userId, 
        _role: 'manager',
        _added_by: approverUserId
      }
    });
    
    if (error) {
      console.error('Error approving role upgrade:', error);
      throw new Error(`Failed to approve role upgrade: ${error.message}`);
    }
    
    console.log('Role upgrade approval successful:', data);
    return { success: true };
  } catch (error: any) {
    console.error('Error in approveRoleUpgrade:', error);
    throw new Error(`Role approval failed: ${error.message}`);
  }
}
