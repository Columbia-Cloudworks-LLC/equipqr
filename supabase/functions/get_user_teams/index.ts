
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

// Inlined from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      console.error('Missing user_id parameter');
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      console.error(`Invalid UUID format for user_id: ${user_id}`);
      return new Response(
        JSON.stringify({ error: "Invalid user ID format" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Fetching teams for user: ${user_id}`);
    
    // Create Supabase admin client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get app_user.id from auth.user.id
    const { data: appUserData, error: appUserError } = await supabaseClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', user_id)
      .single();
      
    if (appUserError || !appUserData) {
      console.error('Error getting app_user:', appUserError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to retrieve user information",
          details: appUserError?.message || "User not found" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const appUserId = appUserData.id;
    console.log(`Found app_user.id: ${appUserId}`);
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
      
    if (profileError) {
      console.error('Error getting user profile:', profileError);
      // Continue anyway, user might not have a profile but still have team access
    }
    
    const userOrgId = userProfile?.org_id;
    
    // Array to store all teams the user has access to
    let allTeams = [];
    
    // 1. Get teams user is directly a member of through team_member
    const { data: memberTeams, error: memberError } = await supabaseClient
      .from('team_member')
      .select(`
        team:team_id (
          id,
          name,
          org_id,
          organization:org_id (
            name
          ),
          created_at,
          created_by
        )
      `)
      .eq('user_id', appUserId)
      .is('team.deleted_at', null);
      
    if (memberError) {
      console.error('Error fetching member teams:', memberError);
    } else if (memberTeams) {
      // Transform the data to match expected format
      const teams = memberTeams
        .filter(item => item.team !== null)
        .map(item => ({
          id: item.team.id,
          name: item.team.name,
          org_id: item.team.org_id,
          org_name: item.team.organization?.name,
          is_external_org: userOrgId && item.team.org_id !== userOrgId
        }));
        
      allTeams = [...allTeams, ...teams];
      console.log(`Found ${teams.length} teams through direct membership`);
    }
    
    // 2. Get teams in user's organization (if user has an org)
    if (userOrgId) {
      const { data: orgTeams, error: orgError } = await supabaseClient
        .from('team')
        .select(`
          id,
          name,
          org_id,
          organization:org_id (
            name
          ),
          created_at,
          created_by
        `)
        .eq('org_id', userOrgId)
        .is('deleted_at', null);
        
      if (orgError) {
        console.error('Error fetching organization teams:', orgError);
      } else if (orgTeams) {
        // Add any teams not already in the list
        const newTeams = orgTeams
          .filter(team => !allTeams.some(t => t.id === team.id))
          .map(team => ({
            id: team.id,
            name: team.name,
            org_id: team.org_id,
            org_name: team.organization?.name,
            is_external_org: false
          }));
          
        allTeams = [...allTeams, ...newTeams];
        console.log(`Found ${newTeams.length} additional teams through organization`);
      }
    }
    
    // Remove duplicates (if any)
    const uniqueTeams = Array.from(
      new Map(allTeams.map(team => [team.id, team])).values()
    );
    
    console.log(`Returning ${uniqueTeams.length} total unique teams`);
    
    return new Response(
      JSON.stringify({ teams: uniqueTeams }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in get_user_teams function:', error);
    return new Response(
      JSON.stringify({ 
        error: "Server error",
        details: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
