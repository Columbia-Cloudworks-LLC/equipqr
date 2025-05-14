
import { supabase } from '@/integrations/supabase/client';
import { getAppUserId } from '@/utils/authUtils';

/**
 * Diagnoses and logs potential issues with a user's organization access
 * Useful for troubleshooting organization-related errors
 */
export async function diagnoseOrganizationAccess(authUserId: string): Promise<{
  issues: string[],
  orgId?: string,
  appUserId?: string,
  hasValidProfile: boolean,
  hasValidRoles: boolean
}> {
  const issues: string[] = [];
  let orgId: string | undefined;
  let appUserId: string | undefined;
  let hasValidProfile = false;
  let hasValidRoles = false;
  
  console.log('Diagnosing organization access for auth user:', authUserId);
  
  try {
    // 1. Check if user profile exists and has organization
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id, display_name')
      .eq('id', authUserId)
      .maybeSingle();
    
    if (profileError) {
      issues.push(`Error fetching user profile: ${profileError.message}`);
    }
    else if (!profile) {
      issues.push('No user profile found in user_profiles table');
    } 
    else {
      hasValidProfile = true;
      
      if (!profile.org_id) {
        issues.push('User profile exists but has no organization ID');
      } else {
        orgId = profile.org_id;
        console.log(`Found organization ID ${orgId} in user profile`);
        
        // Check if organization actually exists
        const { data: org, error: orgError } = await supabase
          .from('organization')
          .select('id, name')
          .eq('id', profile.org_id)
          .maybeSingle();
        
        if (orgError) {
          issues.push(`Error verifying organization: ${orgError.message}`);
        }
        else if (!org) {
          issues.push(`Organization with ID ${profile.org_id} does not exist`);
        } else {
          console.log(`Verified organization exists: "${org.name}"`);
        }
      }
    }
    
    // 2. Check if app_user record exists
    try {
      appUserId = await getAppUserId(authUserId);
      console.log(`Found app_user ID: ${appUserId}`);
    } catch (error: any) {
      issues.push(`Error getting app_user ID: ${error.message}`);
    }
    
    // 3. Check user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('id, role, org_id')
      .eq('user_id', authUserId);
    
    if (rolesError) {
      issues.push(`Error fetching user roles: ${rolesError.message}`);
    }
    else if (!userRoles || userRoles.length === 0) {
      issues.push('User has no roles in the user_roles table');
    } else {
      hasValidRoles = true;
      console.log(`Found ${userRoles.length} role(s) for user`);
      
      // Check if any roles have different org_id than profile
      if (orgId) {
        const mismatchedRoles = userRoles.filter(r => r.org_id !== orgId);
        if (mismatchedRoles.length > 0) {
          issues.push(`User has roles for different organizations than their profile`);
          console.log('Mismatched roles:', mismatchedRoles);
        }
      }
    }
  } catch (error: any) {
    issues.push(`Unexpected error during diagnosis: ${error.message}`);
  }
  
  return {
    issues,
    orgId,
    appUserId,
    hasValidProfile,
    hasValidRoles
  };
}
