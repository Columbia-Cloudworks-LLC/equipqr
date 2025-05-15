
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

    // Create admin client that bypasses RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // Get user's organization
    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return createErrorResponse(`Failed to fetch user profile: ${profileError.message}`);
    }
    
    // Get user's app_user id (needed for team member queries)
    const { data: appUser, error: appUserError } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
    
    if (appUserError) {
      console.error('Error fetching app_user:', appUserError);
      return createErrorResponse(`Failed to fetch user: ${appUserError.message}`);
    }
    
    const userOrgId = userProfile?.org_id;
    const appUserId = appUser?.id;
    
    if (!userOrgId || !appUserId) {
      return createErrorResponse('User profile or app_user not found');
    }
    
    // Get teams where user is a member directly with their roles
    const { data: userTeams, error: teamError } = await adminClient
      .from('team_member')
      .select(`
        team:team_id (
          id,
          name,
          org_id,
          org:org_id (name)
        ),
        team_roles (role)
      `)
      .eq('user_id', appUserId);
    
    if (teamError) {
      console.error('Error fetching user teams:', teamError);
      return createErrorResponse(`Failed to fetch user teams: ${teamError.message}`);
    }
    
    // Get teams from user's organization
    const { data: orgTeams, error: orgTeamError } = await adminClient
      .from('team')
      .select(`
        id,
        name,
        org_id, 
        org:org_id (name)
      `)
      .eq('org_id', userOrgId)
      .is('deleted_at', null);
    
    if (orgTeamError) {
      console.error('Error fetching org teams:', orgTeamError);
      return createErrorResponse(`Failed to fetch organization teams: ${orgTeamError.message}`);
    }
    
    // Process direct teams with roles
    const processedUserTeams = userTeams?.map(tm => {
      const team = tm.team;
      const role = tm.team_roles?.[0]?.role || 'viewer';
      
      return {
        id: team.id,
        name: team.name,
        org_id: team.org_id,
        org_name: team.org?.name,
        role: role,
        is_external: team.org_id !== userOrgId
      };
    }) || [];
    
    // Process org teams (if not already in user teams)
    const userTeamIds = new Set(processedUserTeams.map(t => t.id));
    const processedOrgTeams = orgTeams
      ?.filter(team => !userTeamIds.has(team.id))
      ?.map(team => ({
        id: team.id,
        name: team.name,
        org_id: team.org_id,
        org_name: team.org?.name,
        role: null,
        is_external: false  // Org teams are never external
      })) || [];
    
    // Combine both team lists
    const allTeams = [...processedUserTeams, ...processedOrgTeams];
    
    return createSuccessResponse({
      teams: allTeams
    });
  } catch (error) {
    console.error('Error in get_user_teams:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
