
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200 
    }
  );
}

function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }, 
      status 
    }
  );
}

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

    // Create Supabase client using the service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Get user's organization for determining external equipment
    let userOrgIds: string[] = [];
    try {
      // First get the user's primary organization
      const { data: userProfile, error: profileError } = await adminClient
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .single();
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (userProfile) {
        userOrgIds.push(userProfile.org_id);
      }
      
      // Then get all organizations where user has a role
      const { data: userRoles, error: rolesError } = await adminClient
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user_id);
        
      if (!rolesError && userRoles && userRoles.length > 0) {
        // Add all org IDs where the user has roles (avoiding duplicates)
        userRoles.forEach(role => {
          if (!userOrgIds.includes(role.org_id)) {
            userOrgIds.push(role.org_id);
          }
        });
      }
    } catch (profileError) {
      console.error('Unexpected error fetching user organizations:', profileError);
    }
    
    // If we can't determine user's orgs, we can't show any equipment
    if (userOrgIds.length === 0) {
      console.log('No organizations found for user:', user_id);
      return createSuccessResponse([]);
    }

    console.log(`User ${user_id} belongs to organizations: ${userOrgIds.join(', ')}`);
    
    // Get list of teams the user belongs to
    const appUserResult = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
      
    const appUserId = appUserResult.data?.id;
    
    // We'll build a list of team IDs the user can access
    const accessibleTeamIds: string[] = [];
    
    if (appUserId) {
      // Get teams where user is a member
      const { data: teamMemberships, error: teamError } = await adminClient
        .from('team_member')
        .select('team_id')
        .eq('user_id', appUserId);
        
      if (!teamError && teamMemberships) {
        accessibleTeamIds.push(...teamMemberships.map(tm => tm.team_id));
        console.log(`User is a member of teams: ${accessibleTeamIds.join(', ')}`);
      }
    }
    
    // Query equipment from all user's organizations + user's teams
    let query = adminClient
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .is('deleted_at', null);
    
    // Build a better filter clause that includes:
    // 1. Equipment from user's organizations
    // 2. Equipment from teams user is a member of
    let filterConditions: string[] = [];
    
    // Equipment from user's organizations
    if (userOrgIds.length > 0) {
      const orgIdList = userOrgIds.join(',');
      filterConditions.push(`org_id.in.(${orgIdList})`);
    }
    
    // Equipment from user's teams
    if (accessibleTeamIds.length > 0) {
      const teamIdList = accessibleTeamIds.join(',');
      filterConditions.push(`team_id.in.(${teamIdList})`);
    }
    
    // Apply the filters using OR logic
    if (filterConditions.length > 0) {
      query = query.or(filterConditions.join(','));
    }
    
    const { data: equipment, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching equipment:', error);
      return createErrorResponse(`Failed to fetch equipment: ${error.message}`);
    }
    
    // Process the equipment data to add required fields
    const processedEquipment = equipment?.map(item => {
      const isExternalOrg = !userOrgIds.includes(item.org_id);
      const hasNoTeam = item.team_id === null;
      
      return {
        ...item,
        team_name: item.team?.name || null,
        org_name: item.org?.name || 'Unknown Organization',
        is_external_org: isExternalOrg,
        can_edit: !isExternalOrg || (item.team?.org_id && userOrgIds.includes(item.team.org_id)),
        has_no_team: hasNoTeam // Explicitly set has_no_team based on team_id being null
      };
    }) || [];
    
    console.log(`Successfully fetched ${processedEquipment.length} equipment items`);
    return createSuccessResponse(processedEquipment);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
