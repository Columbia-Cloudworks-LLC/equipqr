
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';

/**
 * Add a user to an organization with a specific role
 */
export async function addUserToOrg(
  userId: string, 
  orgId: string, 
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId || !orgId || !role) {
      throw new Error('User ID, organization ID, and role are required');
    }
    
    // Check if the user already has a role in this org
    const { data: existingRoles, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', orgId);
      
    if (roleCheckError) {
      throw new Error(`Error checking existing roles: ${roleCheckError.message}`);
    }
    
    if (existingRoles && existingRoles.length > 0) {
      return { 
        success: false, 
        error: 'User already has a role in this organization' 
      };
    }
    
    // Get the current user for the assigned_by field
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;
    
    if (!currentUserId) {
      return { 
        success: false, 
        error: 'Authentication required to add users' 
      };
    }
    
    // Make sure role is a valid value for the enum
    let validRole: 'owner' | 'manager' | 'technician' | 'viewer' | 'member';
    
    if (role === 'admin') {
      validRole = 'owner'; // Map admin to owner
    } else if (role === 'owner' || role === 'manager' || role === 'technician' || role === 'viewer' || role === 'member') {
      validRole = role;
    } else {
      validRole = 'member'; // Default role
    }
    
    // Insert the user role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        org_id: orgId,
        role: validRole,
        assigned_by: currentUserId
      });
      
    if (insertError) {
      throw new Error(`Error adding user to organization: ${insertError.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in addUserToOrg:', error);
    return {
      success: false,
      error: error.message || 'Failed to add user to organization'
    };
  }
}
