
import { supabase } from '@/integrations/supabase/client';
import { OrganizationMember } from './types';
import { UserRole } from '@/types/supabase-enums';
import { toast } from 'sonner';

/**
 * Fetches all members of the specified organization
 */
export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  if (!orgId) {
    throw new Error('Organization ID is required');
  }
  
  try {
    // Call RPC function to get organization members
    const { data, error } = await supabase.rpc('get_organization_members', {
      org_id: orgId
    });
    
    if (error) {
      throw new Error(`Failed to fetch organization members: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getOrganizationMembers:', error);
    throw error;
  }
}

/**
 * Updates the role of an organization member
 */
export async function updateMemberRole(
  memberId: string, 
  newRole: UserRole
): Promise<boolean> {
  if (!memberId) {
    throw new Error('Member ID is required');
  }
  
  try {
    // Update the user's role in the database
    const { error } = await supabase
      .from('user_roles')
      .update({ 
        role: newRole, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', memberId);
    
    if (error) {
      console.error('Error updating member role:', error);
      toast.error("Error", {
        description: `Failed to update role: ${error.message}`
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateMemberRole:', error);
    throw error;
  }
}
