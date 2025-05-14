
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

export async function validateOrganizationAccess(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  userId: string
) {
  try {
    // Create Supabase client with service role to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Check user profile
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .maybeSingle();
    
    const hasValidProfile = !!profile?.org_id;
    let orgId = profile?.org_id;
    
    // Check user roles
    const { data: roles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    const hasValidRoles = !!roles && roles.length > 0;
    
    // Check if user is an org owner
    const { data: appUser } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .maybeSingle();
    
    let isOrgOwner = false;
    
    if (appUser?.id) {
      const { data: org } = await adminClient
        .from('organization')
        .select('*')
        .eq('owner_user_id', appUser.id)
        .maybeSingle();
      
      isOrgOwner = !!org;
      
      // If we didn't find org_id in profile but user is owner
      if (!orgId && org?.id) {
        orgId = org.id;
      }
    }
    
    // Compile issues
    const issues = [];
    
    if (!hasValidProfile) {
      issues.push('No valid user profile found or missing organization association');
    }
    
    if (!hasValidRoles && !isOrgOwner) {
      issues.push('User has no roles assigned in the organization');
    }
    
    // Return diagnostic information
    return {
      diagnostics: {
        orgId,
        appUserId: appUser?.id || null,
        hasValidProfile,
        hasValidRoles,
        isOrgOwner,
        issues
      },
      success: hasValidProfile || hasValidRoles || isOrgOwner,
      message: issues.length > 0 
        ? 'Organization access issues detected' 
        : 'Organization access validated successfully'
    };
  } catch (error) {
    console.error('Error in validateOrganizationAccess:', error);
    return {
      diagnostics: {
        issues: [`Internal error: ${error.message || 'Unknown error'}`]
      },
      success: false,
      message: 'Failed to validate organization access'
    };
  }
}
