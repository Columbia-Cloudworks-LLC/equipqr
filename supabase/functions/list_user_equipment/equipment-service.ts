
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
 */
export async function getUserEquipment(userId: string): Promise<any[]> {
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
  
  // Get app_user record directly using auth_uid
  const { data: appUserData, error: appUserError } = await adminClient
    .from('app_user')
    .select('id')
    .eq('auth_uid', userId)
    .single();
    
  const appUserId = appUserData?.id;
  
  if (!appUserId) {
    console.log('No app_user record found for user:', userId);
    
    // Just get equipment from user's organization
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
  
  return await getEquipmentWithTeamAccess(adminClient, appUserId, userOrgId);
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
