
import { supabase } from '@/integrations/supabase/client';
import { Organization } from './types';
import { handleOrganizationError } from './errors';

export interface UserOrganization extends Organization {
  role?: string;
  is_primary?: boolean;
  hasTeams?: boolean; // Property to track if user has teams in an organization
}

/**
 * Fetch all organizations the current user has access to
 * Includes organizations they are a member of or have a role in
 */
export async function getAllUserOrganizations(forceRefresh: boolean = false): Promise<UserOrganization[]> {
  try {
    // Get current user
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session.session) {
      throw new Error('User must be logged in to fetch organizations');
    }
    const userId = session.session.user.id;
    
    // Get user's primary organization from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }
    
    const primaryOrgId = profile?.org_id;
    
    // Fetch all organizations user has roles in
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role,
        organization:org_id (
          id,
          name,
          created_at,
          updated_at,
          owner_user_id
        )
      `)
      .eq('user_id', userId);
    
    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw rolesError;
    }
    
    // Get app_user record
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .maybeSingle();
    
    if (appUserError) {
      console.error('Error fetching app_user record:', appUserError);
    }

    let teamMemberships: any[] = [];
    if (appUser?.id) {
      // Get team memberships to determine which orgs the user has teams in
      const { data: teams, error: teamsError } = await supabase
        .from('team_member')
        .select(`
          team:team_id (
            org_id,
            deleted_at
          )
        `)
        .eq('user_id', appUser.id);
      
      if (!teamsError && teams) {
        teamMemberships = teams.filter(tm => tm.team && !tm.team.deleted_at);
      }
    }
    
    // Process and deduplicate organizations
    const orgMap = new Map<string, UserOrganization>();
    
    // Process organizations from roles
    userRoles?.forEach(item => {
      if (item.organization) {
        const org = item.organization as Organization;
        const existingOrg = orgMap.get(org.id);
        
        // Calculate if user has teams in this org
        const hasTeamsInOrg = teamMemberships.some(tm => tm.team?.org_id === org.id);
        
        // Take the highest role if the org is already in the map
        if (existingOrg) {
          // Basic role hierarchy check
          const roleHierarchy = { 'owner': 3, 'manager': 2, 'viewer': 1 };
          const existingRoleValue = roleHierarchy[existingOrg.role as keyof typeof roleHierarchy] || 0;
          const newRoleValue = roleHierarchy[item.role as keyof typeof roleHierarchy] || 0;
          
          if (newRoleValue > existingRoleValue) {
            existingOrg.role = item.role;
          }
          
          // Update hasTeams property if needed
          if (hasTeamsInOrg) {
            existingOrg.hasTeams = true;
          }
        } else {
          // Add new org to map
          orgMap.set(org.id, {
            ...org,
            role: item.role,
            is_primary: org.id === primaryOrgId,
            hasTeams: hasTeamsInOrg
          });
        }
      }
    });
    
    // Convert map to array
    const organizations = Array.from(orgMap.values());
    
    // Sort by primary first, then by name
    organizations.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return organizations;
  } catch (error) {
    handleOrganizationError(error);
    return [];
  }
}

/**
 * Check if the user is a manager or owner of the given organization
 */
export async function canManageOrganization(orgId: string): Promise<boolean> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) return false;

    const userId = session.session.user.id;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .in('role', ['owner', 'manager'])
      .maybeSingle();
      
    if (error) {
      console.error('Error checking organization permissions:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in canManageOrganization:', error);
    return false;
  }
}
