
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
    const { team_id } = await req.json();
    
    if (!team_id) {
      console.error('Missing team_id parameter');
      return new Response(
        JSON.stringify({ error: "Team ID is required" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(team_id)) {
      console.error(`Invalid UUID format for team_id: ${team_id}`);
      return new Response(
        JSON.stringify({ error: "Invalid team ID format" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Fetching team members for team: ${team_id}`);
    
    // Create Supabase admin client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // First, check if the team exists and is not deleted
    const { data: team, error: teamError } = await supabaseClient
      .from('team')
      .select('id')
      .eq('id', team_id)
      .is('deleted_at', null)
      .single();
    
    if (teamError) {
      console.error('Error fetching team:', teamError);
      
      // Check if it's a "not found" error specifically
      if (teamError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ 
            error: "Team not found or has been deleted", 
            code: "TEAM_NOT_FOUND",
            details: teamError.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to verify team status", 
          details: teamError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    try {
      // Direct query approach - more reliable than the function
      const { data: directData, error: directError } = await supabaseClient
        .from('team_member')
        .select(`
          id,
          team_id,
          user_id,
          joined_at,
          app_user:user_id (
            id,
            display_name,
            email,
            auth_uid
          ),
          team_roles (
            role
          )
        `)
        .eq('team_id', team_id);
          
      if (directError || !directData) {
        console.error('Direct query failed:', directError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to retrieve team members",
            details: directError?.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Transform the data to match the expected format
      const transformedData = directData.map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        joined_at: member.joined_at,
        name: member.app_user?.display_name || 'Unknown',
        email: member.app_user?.email || 'unknown@email.com',
        role: member.team_roles && member.team_roles.length > 0 ? 
          member.team_roles[0].role : 'viewer',
        status: 'Active',
        auth_uid: member.app_user?.auth_uid
      }));
      
      console.log(`Found ${transformedData.length} team members using direct query`);
      return new Response(
        JSON.stringify(transformedData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (queryError) {
      console.error('Error with direct team members query:', queryError);
      return new Response(
        JSON.stringify({ 
          error: "Database query error",
          details: queryError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in get_team_members function:', error);
    return new Response(
      JSON.stringify({ 
        error: "Server error",
        details: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
