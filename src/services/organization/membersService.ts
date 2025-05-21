
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import { OrganizationMember } from './types';

// Fetch organization members
export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    const { data: members, error } = await supabase
      .rpc('get_organization_members', { org_id: orgId });

    if (error) {
      throw new Error(`Failed to fetch organization members: ${error.message}`);
    }

    return members || [];
  } catch (error: any) {
    console.error('Error in getOrganizationMembers:', error);
    throw error;
  }
}

// Update member role
export async function updateMemberRole(
  memberId: string, 
  role: UserRole, 
  orgId: string
): Promise<void> {
  try {
    if (!memberId || !role || !orgId) {
      throw new Error('Member ID, role, and organization ID are required');
    }

    // Check if current user is owner of the org
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) {
      throw new Error('Authentication required');
    }

    const currentUserId = sessionData.session.user.id;
    const { data: permissionData } = await supabase.rpc('can_manage_org_members', {
      p_user_id: currentUserId,
      p_org_id: orgId
    });

    if (!permissionData) {
      throw new Error('You do not have permission to update roles');
    }

    // Update the role
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      throw new Error(`Failed to update role: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error in updateMemberRole:', error);
    throw error;
  }
}
