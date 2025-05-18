
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
    // Set a reasonable timeout for the function execution
    const timeout = setTimeout(() => {
      throw new Error('Function execution timed out');
    }, 8000); // 8 seconds max execution time

    let responseData;
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
      
      // OPTIMIZATION: Use a more direct approach with fewer queries
      // Get user's organization and app_user ID in a single query
      const { data: userData, error: userError } = await supabaseClient
        .from('user_profiles')
        .select(`
          id,
          org_id,
          app_user:id (
            id
          )
        `)
        .eq('id', user_id)
        .single();

      if (userError || !userData) {
        console.error('Error getting user data:', userError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to retrieve user information", 
            details: userError ? userError.message : "User not found" 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const userOrgId = userData?.org_id;
      const appUserId = userData?.app_user?.id;
      
      // Array to store all teams the user has access to
      const allTeams = [];
      
      // OPTIMIZATION: Get teams from user's org and user's memberships in one query
      // First query: Get teams from user's organization
      if (userOrgId) {
        const { data: orgTeams, error: orgTeamsError } = await supabaseClient
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
          
        if (orgTeamsError) {
          console.error('Error fetching organization teams:', orgTeamsError);
        } else if (orgTeams) {
          const processedTeams = orgTeams.map(team => ({
            id: team.id,
            name: team.name,
            org_id: team.org_id,
            org_name: team.organization?.name,
            is_external_org: false
          }));
          
          allTeams.push(...processedTeams);
          console.log(`Found ${processedTeams.length} teams through organization`);
        }
      }
      
      // Second query: Get teams user is a member of (if we have app_user_id)
      if (appUserId) {
        const { data: memberTeams, error: memberTeamsError } = await supabaseClient
          .from('team_member')
          .select(`
            team:team_id (
              id,
              name,
              org_id,
              organization:org_id (
                name
              )
            )
          `)
          .eq('user_id', appUserId);
          
        if (memberTeamsError) {
          console.error('Error fetching member teams:', memberTeamsError);
        } else if (memberTeams) {
          const externalTeams = memberTeams
            .filter(item => item.team !== null && item.team.org_id !== userOrgId)
            .map(item => ({
              id: item.team.id,
              name: item.team.name,
              org_id: item.team.org_id,
              org_name: item.team.organization?.name,
              is_external_org: true
            }));
            
          if (externalTeams.length > 0) {
            // Only add external teams that aren't already in the list
            externalTeams.forEach(extTeam => {
              if (!allTeams.some(team => team.id === extTeam.id)) {
                allTeams.push(extTeam);
              }
            });
            
            console.log(`Found ${externalTeams.length} teams through team membership`);
          }
        }
      }
      
      responseData = { teams: allTeams };
      console.log(`Returning ${allTeams.length} total teams`);

    } finally {
      clearTimeout(timeout);
    }
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in get_user_teams function:', error);
    return new Response(
      JSON.stringify({ 
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
