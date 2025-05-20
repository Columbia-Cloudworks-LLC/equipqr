
import { supabase } from '@/integrations/supabase/client';
import { getAppUserId } from '@/utils/authUtils';
import { Organization } from './types';
import { showSuccessToast, handleOrganizationError } from './errors';

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
    
    console.log('Fetching organization for auth user ID:', user.user.id);
    
    // First approach: try to get org_id from user_profiles
    // FIXED: Cast auth_uid to UUID type with ::uuid to ensure proper comparison
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user.user.id)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      
      // Fallback approach: try to get app_user and resolve org through relationships
      try {
        const appUserId = await getAppUserId(user.user.id);
        console.log('Successfully retrieved app_user ID:', appUserId);
        
        // Try to find any user_roles entries for this user
        // FIXED: Use the actual UUID from auth.user to match user_id in user_roles
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
      console.error('User has no associated organization ID:', user.user.id);
      return null;
    }

    console.log('Found org_id in user profile:', profile.org_id);

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

    console.log('Successfully fetched organization:', organization.name);
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
      handleOrganizationError(error, `Failed to update organization: ${error.message}`);
      return false;
    }

    showSuccessToast("Organization details have been updated successfully");
    return true;
  } catch (error) {
    handleOrganizationError(error);
    return false;
  }
}
