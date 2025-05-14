
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserRole } from '@/types/supabase-enums';
import { getAppUserId } from '@/utils/authUtils';

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
    // Get the current authenticated user
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      return null;
    }
    
    if (!user.user) {
      console.log('No authenticated user found');
      return null;
    }
    
    // First approach: try to get org_id from user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user.user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      
      // Fallback approach: try to get app_user and resolve org through relationships
      try {
        const appUserId = await getAppUserId(user.user.id);
        console.log('Successfully retrieved app_user ID:', appUserId);
        
        // Try to find any user_roles entries for this user
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('org_id')
          .eq('user_id', user.user.id)
          .maybeSingle();
          
        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
        } else if (userRoles && userRoles.org_id) {
          // We found an organization through user_roles
          const orgId = userRoles.org_id;
          console.log('Found organization ID through user_roles:', orgId);
          
          const { data: organization, error: orgError } = await supabase
            .from('organization')
            .select('*')
            .eq('id', orgId)
            .maybeSingle();
            
          if (orgError) {
            console.error('Error fetching organization from user_roles path:', orgError);
          } else if (organization) {
            return organization;
          }
        }
      } catch (fallbackError) {
        console.error('Error in fallback organization lookup:', fallbackError);
      }
      
      // If we've reached here, we couldn't find the organization
      return null;
    }

    // No profile found or no org_id associated
    if (!profile?.org_id) {
      console.error('User has no associated organization ID');
      return null;
    }

    // Fetch the organization details
    const { data: organization, error: orgError } = await supabase
      .from('organization')
      .select('*')
      .eq('id', profile.org_id)
      .maybeSingle();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return null;
    }

    if (!organization) {
      console.error('Organization not found for ID:', profile.org_id);
      return null;
    }

    return organization;
  } catch (error) {
    console.error('Unexpected error in getCurrentOrganization:', error);
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
        title: "Update Failed",
        description: `Failed to update organization: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Success",
      description: "Organization details have been updated successfully",
    });
    return true;
  } catch (error) {
    console.error('Error in updateOrganization:', error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later",
      variant: "destructive",
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
export async function updateMemberRole(memberId: string, role: UserRole): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Update Failed",
        description: `Failed to update role: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Success",
      description: "The member's role has been updated successfully",
    });
    return true;
  } catch (error) {
    console.error('Error in updateMemberRole:', error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later",
      variant: "destructive",
    });
    return false;
  }
}
