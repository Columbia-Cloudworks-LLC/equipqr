
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
    // Set a reasonable timeout for the function execution
    const timeout = setTimeout(() => {
      throw new Error('Function execution timed out');
    }, 8000); // 8 seconds max execution time
    
    let responseData;
    try {
      const { user_id } = await req.json();
      
      if (!user_id) {
        return createErrorResponse("Missing required parameter: user_id");
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user_id)) {
        console.error(`Invalid UUID format for user_id: ${user_id}`);
        return createErrorResponse("Invalid user ID format");
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
      
      // OPTIMIZATION: Get user and organization info in a single query
      const { data: userData, error: userDataError } = await adminClient
        .from('user_profiles')
        .select(`
          org_id,
          app_user:id (
            id
          )
        `)
        .eq('id', user_id)
        .single();
        
      if (userDataError || !userData) {
        console.error('Error fetching user data:', userDataError);
        return createErrorResponse(`Failed to fetch user data: ${userDataError?.message || 'User not found'}`);
      }
      
      const userOrgId = userData.org_id;
      const appUserId = userData.app_user?.id;
      
      if (!userOrgId) {
        console.log('No organization found for user:', user_id);
        return createSuccessResponse([]);
      }
      
      if (!appUserId) {
        console.log('No app_user record found for user:', user_id);
        
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
          return createErrorResponse(`Failed to fetch equipment: ${orgEquipError.message}`);
        }
        
        return createSuccessResponse(processEquipmentData(orgEquipment || [], [userOrgId]));
      }
      
      // Get teams the user is a member of
      const { data: teamMemberships, error: teamError } = await adminClient
        .from('team_member')
        .select('team_id, team:team_id (org_id)')
        .eq('user_id', appUserId);
        
      let teamIds: string[] = [];
      let teamOrgIds: string[] = [];
      
      if (!teamError && teamMemberships && teamMemberships.length > 0) {
        teamIds = teamMemberships.map(tm => tm.team_id);
        
        // Collect unique org IDs from teams
        teamMemberships.forEach(tm => {
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
        return createErrorResponse(`Failed to fetch equipment: ${error.message}`);
      }
      
      // Process equipment data based on the user's organizations
      const allUserOrgIds = [userOrgId, ...teamOrgIds];
      responseData = processEquipmentData(equipment || [], allUserOrgIds);
      
      console.log(`Successfully fetched ${responseData.length} equipment items`);
      
    } finally {
      clearTimeout(timeout);
    }
    
    return createSuccessResponse(responseData);
  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : error);
    return createErrorResponse(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Process equipment data to add required fields
 */
function processEquipmentData(equipment: any[], userOrgIds: string[]) {
  return equipment.map(item => {
    const isExternalOrg = !userOrgIds.includes(item.org_id);
    const hasNoTeam = item.team_id === null;
    
    return {
      ...item,
      team_name: item.team?.name || null,
      org_name: item.org?.name || 'Unknown Organization',
      is_external_org: isExternalOrg,
      can_edit: !isExternalOrg || (item.team?.org_id && userOrgIds.includes(item.team.org_id)),
      has_no_team: hasNoTeam
    };
  });
}
