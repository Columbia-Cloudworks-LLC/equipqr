
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  createAdminClient,
  corsHeaders,
  createErrorResponse,
  createSuccessResponse
} from '../_shared/permissions.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      return createErrorResponse("Missing required parameter: user_id");
    }

    // Create Supabase client with admin rights to bypass RLS
    const supabase = await createAdminClient();
    
    // Get user's organization ID
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
      
    if (userError) {
      console.error('Error fetching user profile:', userError);
      return createErrorResponse("User profile not found");
    }
    
    // Get app_user ID from auth user ID
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
      
    if (appUserError) {
      console.error('Error fetching app_user:', appUserError);
      return createErrorResponse("App user not found");
    }
    
    const appUserId = appUser.id;
    
    // First get equipment from user's organization
    const { data: orgEquipment, error: orgError } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .eq('org_id', userProfile.org_id)
      .is('deleted_at', null)
      .order('name');
      
    if (orgError) {
      console.error('Error fetching organization equipment:', orgError);
      return createErrorResponse(orgError.message);
    }
    
    // Get user's team memberships (using app_user ID)
    const { data: teamMemberships, error: membershipError } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', appUserId);
    
    if (membershipError) {
      console.error('Error fetching team memberships:', membershipError);
      // Continue with org equipment only - ensure we return an array
      return createSuccessResponse(processEquipmentList(orgEquipment || []));
    }
    
    // If user is not a member of any teams, just return org equipment
    if (!teamMemberships || teamMemberships.length === 0) {
      console.log(`User has no team memberships, returning ${orgEquipment?.length || 0} organization equipment`);
      return createSuccessResponse(processEquipmentList(orgEquipment || []));
    }
    
    // Extract team IDs
    const teamIds = teamMemberships.map(tm => tm.team_id);
    
    // Get equipment for these teams
    const { data: teamEquipment, error: teamError } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .in('team_id', teamIds)
      .is('deleted_at', null)
      .order('name');
    
    if (teamError) {
      console.error('Error fetching team equipment:', teamError);
      // Continue with org equipment only - ensure we return an array
      return createSuccessResponse(processEquipmentList(orgEquipment || []));
    }
    
    // Combine equipment lists with processed data - ensure we return an array
    const combinedEquipment = combineEquipmentLists(orgEquipment || [], teamEquipment || [], userProfile.org_id);
    
    console.log(`Successfully fetched ${combinedEquipment.length} equipment items via edge function`);
    return createSuccessResponse(combinedEquipment);
  } catch (error) {
    console.error('Unexpected error:', error);
    // Return an empty array on error rather than null
    return createSuccessResponse([]);
  }
});

// Process equipment list to add team and org names
function processEquipmentList(equipmentList: any[]): any[] {
  return equipmentList.map(item => ({
    ...item,
    team_name: item.team?.name || null,
    org_name: item.org?.name || 'Unknown Organization',
    is_external_org: false, // Default to false for org equipment
  }));
}

// Combine equipment lists from org and teams, marking external org items
function combineEquipmentLists(orgEquipment: any[], teamEquipment: any[], userOrgId: string): any[] {
  // Create a map to ensure no duplicates
  const equipmentMap = new Map();
  
  // Add organization equipment
  orgEquipment.forEach(item => {
    const processed = {
      ...item,
      team_name: item.team?.name || null,
      org_name: item.org?.name || 'Unknown Organization',
      is_external_org: false,
    };
    equipmentMap.set(item.id, processed);
  });
  
  // Add team equipment (if it's not already in the map)
  teamEquipment.forEach(item => {
    if (!equipmentMap.has(item.id)) {
      // Check if this is from an external organization
      const isExternalOrg = item.team?.org_id && userOrgId && item.team.org_id !== userOrgId;
      
      const processed = {
        ...item,
        team_name: item.team?.name || null,
        org_name: item.org?.name || 'Unknown Organization',
        is_external_org: isExternalOrg,
      };
      equipmentMap.set(item.id, processed);
    }
  });
  
  // Convert map to array
  return Array.from(equipmentMap.values());
}
