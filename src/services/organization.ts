
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface OrganizationMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined_at: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the current user's organization
 */
export async function getCurrentOrganization(): Promise<Organization | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user.user.id)
      .single();

    if (!profile?.org_id) return null;

    const { data: organization, error } = await supabase
      .from('organization')
      .select('*')
      .eq('id', profile.org_id)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return null;
    }

    return organization;
  } catch (error) {
    console.error('Error in getCurrentOrganization:', error);
    return null;
  }
}

/**
 * Update organization details
 */
export async function updateOrganization(id: string, data: Partial<Organization>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('organization')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error('Error updating organization:', error);
      toast({
        variant: "destructive",
        title: "Failed to update organization",
        description: error.message
      });
      return false;
    }

    toast({
      title: "Organization updated",
      description: "Organization details have been updated successfully"
    });
    return true;
  } catch (error) {
    console.error('Error in updateOrganization:', error);
    toast({
      variant: "destructive",
      title: "An unexpected error occurred",
      description: "Please try again later"
    });
    return false;
  }
}

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
export async function updateMemberRole(memberId: string, role: "owner" | "manager" | "technician" | "viewer"): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member role:', error);
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message
      });
      return false;
    }

    toast({
      title: "Member role updated",
      description: "The member's role has been updated successfully"
    });
    return true;
  } catch (error) {
    console.error('Error in updateMemberRole:', error);
    toast({
      variant: "destructive",
      title: "An unexpected error occurred",
      description: "Please try again later"
    });
    return false;
  }
}
