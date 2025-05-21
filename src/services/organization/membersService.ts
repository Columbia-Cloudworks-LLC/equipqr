
import { supabase } from '@/integrations/supabase/client';
import { OrganizationMember } from './types';
import { UserRole } from '@/types/supabase-enums';

/**
 * Fetch members of an organization
 */
export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // Use the database function to get members
    const { data, error } = await supabase
      .rpc('get_organization_members', { org_id: orgId });

    if (error) {
      console.error('Error fetching organization members:', error);
      throw new Error('Failed to fetch organization members');
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getOrganizationMembers:', error);
    throw error;
  }
}

/**
 * Update a member's role in the organization
 */
export async function updateMemberRole(memberId: string, role: UserRole, orgId: string): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const currentUserId = sessionData.session.user.id;

    // Check if the current user is an owner
    const { data: isOwner, error: ownerCheckError } = await supabase
      .rpc('has_role', { 
        _user_id: currentUserId, 
        _org_id: orgId, 
        _role: 'owner' as UserRole 
      });

    if (ownerCheckError) {
      throw new Error(`Failed to check permissions: ${ownerCheckError.message}`);
    }

    if (!isOwner) {
      throw new Error('Only organization owners can update member roles');
    }

    // Make sure we aren't changing our own role
    if (memberId === currentUserId) {
      throw new Error('You cannot change your own role');
    }

    // Get the current role count if changing from owner
    if (role !== 'owner') {
      const { data: currentRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', memberId)
        .eq('org_id', orgId)
        .single();

      if (currentRole?.role === 'owner') {
        // Count owners
        const { count, error: countError } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('role', 'owner');

        if (countError) {
          throw new Error('Failed to count organization owners');
        }

        if (count <= 1) {
          throw new Error('Cannot change role: Organization must have at least one owner');
        }
      }
    }

    // Update the role
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ 
        role: role,
        assigned_by: currentUserId,
        assigned_at: new Date().toISOString()
      })
      .eq('user_id', memberId)
      .eq('org_id', orgId);

    if (updateError) {
      throw new Error(`Failed to update role: ${updateError.message}`);
    }
  } catch (error: any) {
    console.error('Error in updateMemberRole:', error);
    throw error;
  }
}

// Export the functions
export { getOrganizationMembers, updateMemberRole };
