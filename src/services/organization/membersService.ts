
import { supabase } from '@/integrations/supabase/client';
import { OrganizationMember } from './types';
import { UserRole } from '@/types/supabase-enums';
import { showSuccessToast, handleOrganizationError } from './errors';

/**
 * Get members of an organization
 */
export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_organization_members', { org_id: orgId });

    if (error) {
      console.error('Error fetching organization members:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getOrganizationMembers:', error);
    return [];
  }
}

/**
 * Update a member's role in the organization
 */
export async function updateMemberRole(memberId: string, role: UserRole): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      handleOrganizationError(error, `Failed to update role: ${error.message}`);
      return false;
    }

    showSuccessToast("The member's role has been updated successfully");
    return true;
  } catch (error) {
    handleOrganizationError(error);
    return false;
  }
}
