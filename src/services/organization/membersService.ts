import { supabase } from '@/integrations/supabase/client';
import { OrganizationMember } from './types';
import { UserRole } from '@/types/supabase-enums';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/utils/edgeFunctionUtils';
import { removeOrganizationMember } from './removeOrgMember';

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
    // Cast the newRole to match the expected type in the database
    const role = newRole as "owner" | "manager" | "viewer" | "member";
    
    // Update the user's role in the database - removed updated_at which doesn't exist
    const { error } = await supabase
      .from('user_roles')
      .update({ 
        role: role
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

/**
 * Removes a member from the organization and all associated teams
 */
export async function removeMember(
  organizationId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await removeOrganizationMember(organizationId, userId);
    
    if (result.success) {
      if (result.teamsRemoved && result.teamsRemoved > 0) {
        toast.success("Member removed", {
          description: `Removed from organization and ${result.teamsRemoved} team(s)`
        });
      } else {
        toast.success("Member removed", {
          description: "Member removed from organization"
        });
      }
      return true;
    } else {
      toast.error("Failed to remove member", {
        description: result.error || "Unknown error occurred"
      });
      return false;
    }
  } catch (error) {
    console.error('Error removing organization member:', error);
    toast.error("Error", {
      description: error instanceof Error ? error.message : "Failed to remove member"
    });
    return false;
  }
}
