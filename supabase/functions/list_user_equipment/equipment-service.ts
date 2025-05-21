
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { processEquipmentData } from './equipment-formatter.ts';

/**
 * Create a Supabase client with admin privileges
 * Uses service role key to bypass RLS policies
 */
function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  });
}

/**
 * Get all equipment for a user, including those from teams they belong to
 * @param userId The authenticated user's ID
 * @param orgId Optional organization ID to filter by
 */
export async function getUserEquipment(userId: string, orgId?: string): Promise<any[]> {
  const adminClient = createAdminClient();
  
  // Get user's organization ID
  const { data: userProfile, error: userProfileError } = await adminClient
    .from('user_profiles')
    .select('org_id')
    .eq('id', userId)
    .single();
    
  if (userProfileError || !userProfile) {
    console.error('Error fetching user profile:', userProfileError);
    throw new Error(`Failed to fetch user profile: ${userProfileError?.message || 'User profile not found'}`);
  }
  
  const userOrgId = userProfile.org_id;
  
  if (!userOrgId) {
    console.log('No organization found for user:', userId);
    return [];
  }
  
  // If org_id is specified, check user's role in that organization
  let userRole = null;
  if (orgId) {
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .maybeSingle();
      
    if (roleError) {
      console.error('Error fetching user role:', roleError);
    } else if (roleData) {
      userRole = roleData.role;
    }
    
    // If user has no role in the requested org, they don't have access
    if (!userRole) {
      console.log('User has no role in the requested organization');
      return [];
    }
  }
  
  // Get app_user record directly using auth_uid
  const { data: appUserData, error: appUserError } = await adminClient
    .from('app_user')
    .select('id')
    .eq('auth_uid', userId)
    .single();
    
  const appUserId = appUserData?.id;
  
  if (!appUserId) {
    console.log('No app_user record found for user:', userId);
    
    // If specific org is requested
    if (orgId) {
      // If user is viewer in requested org, they have limited access
      if (userRole === 'viewer') {
        return []; // Viewers need team access which requires app_user record
      }
      
      // Just get equipment from the requested organization for managers/owners
      const { data: orgEquipment, error: orgEquipError } = await adminClient
        .from('equipment')
        .select(`
          *,
          team:team_id (name, org_id),
          org:org_id (name)
        `)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('name');
        
      if (orgEquipError) {
        console.error('Error fetching organization equipment:', orgEquipError);
        throw new Error(`Failed to fetch equipment: ${orgEquipError.message}`);
      }
      
      return processEquipmentData(orgEquipment || [], [orgId]);
    }
    
    // No specific org requested, just get equipment from user's organization
    const { data: orgEquipment, error: orgEquipError } = await adminClient
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .eq('org_id', userOrgId)
      .is('deleted_at', null)
      .order('name');
      
    if (orgEquipError) {
      console.error('Error fetching organization equipment:', orgEquipError);
      throw new Error(`Failed to fetch equipment: ${orgEquipError.message}`);
    }
    
    return processEquipmentData(orgEquipment || [], [userOrgId]);
  }
  
  // If specific org requested and user is a viewer, apply special rules
  if (orgId && userRole === 'viewer') {
    return await getViewerOrganizationEquipment(adminClient, appUserId, orgId);
  }
  
  // If specific org requested and user is manager/owner, show all equipment in that org
  if (orgId) {
    return await getManagerOrganizationEquipment(adminClient, orgId);
  }
  
  // No specific org requested - get all equipment user has access to
  return await getEquipmentWithTeamAccess(adminClient, appUserId, userOrgId);
}

/**
 * Get equipment for viewers based on team membership in specific organization
 */
async function getViewerOrganizationEquipment(
  adminClient: any,
  appUserId: string,
  orgId: string
): Promise<any[]> {
  // Get teams in the specified organization
  const { data: orgTeams, error: orgTeamsError } = await adminClient
    .from('team')
    .select('id')
    .eq('org_id', orgId)
    .is('deleted_at', null);
    
  if (orgTeamsError) {
    console.error('Error fetching organization teams:', orgTeamsError);
    return [];
  }
  
  if (!orgTeams || orgTeams.length === 0) {
    return []; // No teams in this org, no equipment to view
  }
  
  const orgTeamIds = orgTeams.map(team => team.id);
  
  // Find which teams the user is a member of
  const { data: userTeams, error: userTeamsError } = await adminClient
    .from('team_member')
    .select('team_id')
    .eq('user_id', appUserId)
    .in('team_id', orgTeamIds);
    
  if (userTeamsError) {
    console.error('Error fetching user team memberships:', userTeamsError);
    return [];
  }
  
  if (!userTeams || userTeams.length === 0) {
    return []; // User is not a member of any teams in this org
  }
  
  const userTeamIds = userTeams.map(tm => tm.team_id);
  
  // Get equipment assigned to those teams
  const { data: equipment, error: equipmentError } = await adminClient
    .from('equipment')
    .select(`
      *,
      team:team_id (name, org_id),
      org:org_id (name)
    `)
    .in('team_id', userTeamIds)
    .is('deleted_at', null)
    .order('name');
    
  if (equipmentError) {
    console.error('Error fetching team equipment:', equipmentError);
    return [];
  }
  
  return processEquipmentData(equipment || [], [orgId]);
}

/**
 * Get all equipment in an organization for managers/owners
 */
async function getManagerOrganizationEquipment(
  adminClient: any,
  orgId: string
): Promise<any[]> {
  const { data: equipment, error } = await adminClient
    .from('equipment')
    .select(`
      *,
      team:team_id (name, org_id),
      org:org_id (name)
    `)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('name');
    
  if (error) {
    console.error('Error fetching organization equipment:', error);
    throw new Error(`Failed to fetch equipment: ${error.message}`);
  }
  
  return processEquipmentData(equipment || [], [orgId]);
}

/**
 * Get equipment based on user's team memberships and their organization
 */
async function getEquipmentWithTeamAccess(
  adminClient: any, 
  appUserId: string, 
  userOrgId: string
): Promise<any[]> {
  // Get teams the user is a member of
  const { data: teamMemberships, error: teamError } = await adminClient
    .from('team_member')
    .select('team_id, team:team_id (org_id)')
    .eq('user_id', appUserId);
    
  let teamIds: string[] = [];
  let teamOrgIds: string[] = [];
  
  if (!teamError && teamMemberships && teamMemberships.length > 0) {
    teamIds = teamMemberships.map((tm: any) => tm.team_id);
    
    // Collect unique org IDs from teams
    teamMemberships.forEach((tm: any) => {
      if (tm.team?.org_id && !teamOrgIds.includes(tm.team.org_id)) {
        teamOrgIds.push(tm.team.org_id);
      }
    });
  }
  
  // OPTIMIZATION: Use a single query with OR condition for both org and team-based access
  let query = adminClient
    .from('equipment')
    .select(`
      *,
      team:team_id (name, org_id),
      org:org_id (name)
    `)
    .is('deleted_at', null)
    .order('name');
    
  // Build filter conditions based on what we found
  const filterParts = [];
  
  // Add user's org condition
  filterParts.push(`org_id.eq.${userOrgId}`);
  
  // Add team condition if we have team IDs
  if (teamIds.length > 0) {
    filterParts.push(`team_id.in.(${teamIds.join(',')})`);
  }
  
  // Apply combined filter conditions
  if (filterParts.length > 0) {
    query = query.or(filterParts.join(','));
  }
  
  // Execute final query
  const { data: equipment, error } = await query;
  
  if (error) {
    console.error('Error fetching equipment:', error);
    throw new Error(`Failed to fetch equipment: ${error.message}`);
  }
  
  // Process equipment data based on the user's organizations
  const allUserOrgIds = [userOrgId, ...teamOrgIds];
  const processedData = processEquipmentData(equipment || [], allUserOrgIds);
  
  console.log(`Successfully fetched ${processedData.length} equipment items`);
  return processedData;
}
